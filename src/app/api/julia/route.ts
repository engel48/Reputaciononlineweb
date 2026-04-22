import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai-service';
import { buildUserContext } from '@/lib/user-context';
import { deductCreditsForAction, extractUserIdFromToken, checkBalance } from '@/lib/credit-guard';
import { CREDIT_COSTS, CreditAction } from '@/lib/credit-costs';

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
    const { message, context, action } = await request.json();

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
    }

    const userContext = userId ? await buildUserContext(userId) : null;

    let response: any;

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
      let newsData: any[] = [];
      try {
        newsData = JSON.parse(context || '[]');
      } catch {
        newsData = [];
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
      // Chat general con persona Julia + contexto del usuario
      response = await aiService.juliaChat(message || context, {
        context: context && context !== message ? context : undefined,
        user: userContext,
      });
    }

    if (userId) {
      const result = await deductCreditsForAction(
        userId,
        actionType,
        1,
        `Julia IA: ${actionType}`
      );
      creditInfo = { cost: result.cost || CREDIT_COSTS[actionType], newBalance: result.newBalance };
    }

    return NextResponse.json({
      success: true,
      response,
      credits: creditInfo,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Julia API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        response:
          'Lo siento, Julia está experimentando dificultades técnicas. Por favor, inténtalo más tarde.',
      },
      { status: 500 }
    );
  }
}
