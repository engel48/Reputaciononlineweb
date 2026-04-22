import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai-service';
import { buildUserContext } from '@/lib/user-context';
import { deductCreditsForAction, extractUserIdFromToken, checkBalance } from '@/lib/credit-guard';
import { CREDIT_COSTS, CreditAction } from '@/lib/credit-costs';

// Runtime Node.js (necesario para groq-sdk + supabase-server)
// maxDuration extendido porque la llamada a Groq + buildUserContext + deduct
// puede tardar entre 3-10s en contexto grande.
export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/**
 * POST /api/julia — Asistente Julia (Groq llama-3.3-70b-versatile + fallback DeepSeek).
 * Inyecta contexto real del usuario en cada acción.
 *
 * Body:
 *   - action: 'chat' | 'analyze' | 'summarize' | 'crisis-response' | 'reputation' | 'recommendations'
 *   - message: texto principal del usuario
 *   - context: contexto opcional (JSON stringified para acciones que lo necesitan)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { message, context, action } = body as {
      message?: string;
      context?: string;
      action?: string;
    };

    if (!message && !action) {
      return NextResponse.json(
        { success: false, error: 'Mensaje o acción requeridos' },
        { status: 400 }
      );
    }

    const actionType: CreditAction =
      action === 'analyze'
        ? 'julia_sentiment'
        : action === 'summarize'
        ? 'julia_summarize'
        : action === 'crisis-response'
        ? 'julia_crisis_response'
        : action === 'reputation'
        ? 'julia_reputation'
        : 'julia_chat';

    // Autenticación + contexto del usuario
    const authToken = request.cookies.get('auth-token')?.value;
    const userId = authToken ? extractUserIdFromToken(authToken) : null;

    let creditInfo: { cost: number; newBalance?: number } = { cost: CREDIT_COSTS[actionType] };

    if (userId) {
      try {
        const balance = await checkBalance(userId, CREDIT_COSTS[actionType]);
        if (!balance.hasEnough && !balance.unlimited) {
          return NextResponse.json(
            {
              success: false,
              error: 'Créditos insuficientes',
              credits: { cost: CREDIT_COSTS[actionType], currentBalance: balance.currentBalance },
              response: `No tienes suficientes créditos para esta acción. Necesitas ${CREDIT_COSTS[actionType]} crédito${
                CREDIT_COSTS[actionType] !== 1 ? 's' : ''
              } pero tienes ${balance.currentBalance}.`,
            },
            { status: 402 }
          );
        }
      } catch (balanceErr) {
        console.error('[julia] Error verificando balance (continuando sin descontar):', balanceErr);
      }
    }

    const userContext = userId ? await buildUserContext(userId).catch(() => null) : null;

    let response: any;
    let conversationId: string | null = null;

    if (action === 'analyze' && message) {
      response = JSON.stringify(await aiService.analyzeSentiment(message));
    } else if (action === 'summarize' && context) {
      let articles: any[] = [];
      try {
        articles = JSON.parse(context);
      } catch {
        articles = [{ title: context }];
      }
      response = JSON.stringify(await aiService.summarizeNews(articles, userContext));
    } else if (action === 'crisis-response' && message) {
      let alertData: any;
      try {
        alertData = JSON.parse(message);
      } catch {
        alertData = { type: 'general', severity: 'medium', description: message };
      }
      response = JSON.stringify(await aiService.generateCrisisResponse(alertData, userContext));
    } else if (action === 'reputation' && message) {
      // Si el cliente mandó context, usarlo. Si no, cargar automáticamente datos
      // REALES del sistema: menciones del user + noticias scrapeadas relevantes.
      let newsData: any[] = [];
      try {
        newsData = context ? JSON.parse(context) : [];
      } catch {
        newsData = [];
      }

      if (newsData.length === 0) {
        try {
          const { supabase } = await import('@/lib/supabase-server');

          // 1) Traer menciones propias del user (últimos 30 días)
          if (userId) {
            const { data: mentions } = await supabase
              .from('mentions')
              .select('content, platform, published_at, metadata')
              .eq('user_id', userId)
              .order('published_at', { ascending: false })
              .limit(20);

            for (const m of (mentions || []) as any[]) {
              newsData.push({
                title: String(m.content || '').slice(0, 200),
                source: m.platform,
                sentiment: m.metadata?.sentiment || 'neutral',
                date: m.published_at,
              });
            }
          }

          // 2) Traer noticias scrapeadas que mencionen el nombre
          const { data: news } = await supabase
            .from('scraped_news')
            .select('title, source, sentiment, published_at')
            .ilike('title', `%${message}%`)
            .order('published_at', { ascending: false })
            .limit(20);

          for (const n of (news || []) as any[]) {
            newsData.push({
              title: n.title,
              source: n.source,
              sentiment: n.sentiment || 'neutral',
              date: n.published_at,
            });
          }
        } catch (enrichErr) {
          console.warn('[julia/reputation] enrichment falló, continuando:', enrichErr);
        }
      }

      response = JSON.stringify(await aiService.analyzeReputation(message, newsData, userContext));
    } else if (action === 'recommendations') {
      if (!userContext) {
        return NextResponse.json(
          { success: false, error: 'Se requiere autenticación para generar recomendaciones' },
          { status: 401 }
        );
      }
      response = JSON.stringify(await aiService.generateRecommendations(userContext));
    } else {
      // Chat general con persona Julia + contexto del usuario.
      // Si el user está autenticado, guardar la conversación en julia_conversations.
      response = await aiService.juliaChat(message || context || '', {
        context: context && context !== message ? context : undefined,
        user: userContext,
      });

      if (userId && message) {
        try {
          conversationId = await saveJuliaExchange(userId, message, response);
        } catch (saveErr) {
          console.warn('[julia] no se pudo guardar historial:', saveErr);
        }
      }
    }

    if (userId) {
      try {
        const result = await deductCreditsForAction(
          userId,
          actionType,
          1,
          `Julia IA: ${actionType}`
        );
        creditInfo = {
          cost: result.cost || CREDIT_COSTS[actionType],
          newBalance: result.newBalance,
        };
      } catch (dedErr) {
        console.warn('[julia] no se pudieron descontar créditos:', dedErr);
      }
    }

    return NextResponse.json({
      success: true,
      response,
      credits: creditInfo,
      conversationId,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Julia API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Error interno del servidor',
        response:
          'Lo siento, Julia está experimentando dificultades técnicas. Por favor, inténtalo más tarde.',
      },
      { status: 500 }
    );
  }
}

/**
 * Guarda un intercambio del chat en `amelia_conversations`/`amelia_messages`
 * (reusamos las tablas existentes ya que la feature Amelia fue consolidada en Julia).
 * Retorna el conversationId creado.
 */
async function saveJuliaExchange(
  userId: string,
  userMessage: string,
  assistantResponse: string
): Promise<string | null> {
  const { supabase } = await import('@/lib/supabase-server');

  // Crear conversación nueva (título = primeras 80 chars del mensaje)
  const { data: conv, error: convErr } = await supabase
    .from('amelia_conversations')
    .insert({
      user_id: userId,
      title: userMessage.slice(0, 80),
    })
    .select('id')
    .single();

  if (convErr || !conv) {
    throw new Error(convErr?.message || 'No se pudo crear conversación');
  }

  const conversationId = (conv as any).id as string;

  await supabase.from('amelia_messages').insert([
    { conversation_id: conversationId, role: 'user', content: userMessage },
    { conversation_id: conversationId, role: 'assistant', content: assistantResponse },
  ]);

  await supabase
    .from('amelia_conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  return conversationId;
}

/**
 * GET /api/julia?history=1 — devuelve las últimas conversaciones del usuario
 */
export async function GET(request: NextRequest) {
  try {
    const authToken = request.cookies.get('auth-token')?.value;
    const userId = authToken ? extractUserIdFromToken(authToken) : null;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }

    const { supabase } = await import('@/lib/supabase-server');

    const { data: conversations, error } = await supabase
      .from('amelia_conversations')
      .select('id, title, created_at, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Para cada conversación, traer último mensaje del asistente (preview)
    const enriched = await Promise.all(
      (conversations || []).map(async (c: any) => {
        const { data: messages } = await supabase
          .from('amelia_messages')
          .select('role, content, created_at')
          .eq('conversation_id', c.id)
          .order('created_at', { ascending: true })
          .limit(20);
        return {
          id: c.id,
          title: c.title,
          created_at: c.created_at,
          updated_at: c.updated_at,
          messages: messages || [],
        };
      })
    );

    return NextResponse.json({ success: true, data: enriched });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Error interno' },
      { status: 500 }
    );
  }
}
