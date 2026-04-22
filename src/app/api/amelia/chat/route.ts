import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai-service';
import { buildUserContext, formatUserContextForPrompt } from '@/lib/user-context';
import { extractUserIdFromToken, checkBalance, deductCreditsForAction } from '@/lib/credit-guard';
import { CREDIT_COSTS } from '@/lib/credit-costs';

const AMELIA_PERSONALITY = `Eres Amelia, asistente conversacional del sistema Reputación Online.
Eres cercana, empática y recuerdas el contexto de conversaciones previas con este usuario.
Tu especialidad es interpretar datos de reputación, menciones, tendencias y dar recomendaciones prácticas.
Reglas:
- Trata al usuario por su nombre cuando esté disponible.
- Mantén memoria del hilo: si ya te preguntaron algo antes, no repitas información.
- Sé concreta. Evita respuestas largas cuando una corta funciona.
- Si no tienes datos, dilo y sugiere cómo conseguirlos.`;

const MAX_HISTORY_MESSAGES = 20;

/**
 * POST /api/amelia/chat
 *
 * Body:
 *   - message: string (requerido)
 *   - conversationId: string (opcional, crea nueva si no viene)
 *
 * Flujo:
 *   1. Auth JWT
 *   2. Busca/crea conversación
 *   3. Carga últimos N mensajes como historial
 *   4. Llama aiService.chatWithHistory con persona Amelia + contexto usuario
 *   5. Guarda mensaje user + respuesta assistant
 *   6. Retorna respuesta
 */
export async function POST(request: NextRequest) {
  try {
    const authToken = request.cookies.get('auth-token')?.value;
    const userId = authToken ? extractUserIdFromToken(authToken) : null;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { message, conversationId: incomingConvId } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Se requiere `message` (string)' },
        { status: 400 }
      );
    }

    const balance = await checkBalance(userId, CREDIT_COSTS.julia_chat);
    if (!balance.hasEnough && !balance.unlimited) {
      return NextResponse.json(
        {
          success: false,
          error: 'Créditos insuficientes',
          response: `Necesitas ${CREDIT_COSTS.julia_chat} crédito para chatear con Amelia. Tu balance actual: ${balance.currentBalance}.`,
        },
        { status: 402 }
      );
    }

    const { supabase } = await import('@/lib/supabase-server');

    // 1. Resolver conversación
    let conversationId = incomingConvId;
    if (!conversationId) {
      const { data: created, error: createErr } = await supabase
        .from('amelia_conversations')
        .insert({
          user_id: userId,
          title: message.slice(0, 80),
        })
        .select('id')
        .single();

      if (createErr || !created) {
        console.error('[amelia] Error creando conversación:', createErr);
        return NextResponse.json(
          { success: false, error: 'Error creando conversación' },
          { status: 500 }
        );
      }
      conversationId = created.id;
    } else {
      // verificar ownership
      const { data: conv } = await supabase
        .from('amelia_conversations')
        .select('id, user_id')
        .eq('id', conversationId)
        .maybeSingle();
      if (!conv || conv.user_id !== userId) {
        return NextResponse.json(
          { success: false, error: 'Conversación no encontrada' },
          { status: 404 }
        );
      }
    }

    // 2. Cargar historial
    const { data: historyRaw } = await supabase
      .from('amelia_messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(MAX_HISTORY_MESSAGES);

    const history = (historyRaw || []).map((m: any) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // 3. Contexto del usuario
    const userContext = await buildUserContext(userId);
    const personaWithContext = userContext
      ? `${AMELIA_PERSONALITY}\n\n${formatUserContextForPrompt(userContext)}`
      : AMELIA_PERSONALITY;

    // 4. Llamar IA
    const aiResponse = await aiService.chatWithHistory(history, message, {
      user: userContext,
      persona: personaWithContext,
      temperature: 0.7,
    });

    // 5. Guardar mensajes
    await supabase.from('amelia_messages').insert([
      { conversation_id: conversationId, role: 'user', content: message },
      { conversation_id: conversationId, role: 'assistant', content: aiResponse },
    ]);

    // Actualizar updated_at de la conversación
    await supabase
      .from('amelia_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    // 6. Deducir créditos
    const creditResult = await deductCreditsForAction(
      userId,
      'julia_chat',
      1,
      'Amelia chat'
    );

    return NextResponse.json({
      success: true,
      response: aiResponse,
      conversationId,
      credits: {
        cost: creditResult.cost || CREDIT_COSTS.julia_chat,
        newBalance: creditResult.newBalance,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[amelia/chat] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}
