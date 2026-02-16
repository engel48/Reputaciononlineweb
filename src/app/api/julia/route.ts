import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai-service';
import { deductCreditsForAction, extractUserIdFromToken, checkBalance } from '@/lib/credit-guard';
import { CREDIT_COSTS, CreditAction } from '@/lib/credit-costs';

export async function POST(request: NextRequest) {
  try {
    const { message, context, action } = await request.json();

    if (!message && !action) {
      return NextResponse.json(
        { success: false, error: 'Mensaje requerido' },
        { status: 400 }
      );
    }

    // Determinar tipo de accion y costo
    const actionType: CreditAction = action === 'analyze' ? 'julia_sentiment'
      : action === 'summarize' ? 'julia_summarize'
      : action === 'crisis-response' ? 'julia_crisis_response'
      : action === 'reputation' ? 'julia_reputation'
      : 'julia_chat';

    // Verificar creditos del usuario
    const authToken = request.cookies.get('auth-token')?.value;
    const userId = authToken ? extractUserIdFromToken(authToken) : null;
    let creditInfo: { cost: number; newBalance?: number } = { cost: CREDIT_COSTS[actionType] };

    if (userId) {
      const balance = await checkBalance(userId, CREDIT_COSTS[actionType]);
      if (!balance.hasEnough && !balance.unlimited) {
        return NextResponse.json({
          success: false,
          error: 'Creditos insuficientes',
          credits: { cost: CREDIT_COSTS[actionType], currentBalance: balance.currentBalance },
          response: `No tienes suficientes creditos para esta accion. Necesitas ${CREDIT_COSTS[actionType]} credito${CREDIT_COSTS[actionType] !== 1 ? 's' : ''} pero tienes ${balance.currentBalance}.`
        }, { status: 402 });
      }
    }

    // Enrutar a metodo especializado segun accion
    let response: any;

    if (action === 'analyze' && message) {
      // Analisis de sentimiento
      const result = await aiService.analyzeSentiment(message);
      response = JSON.stringify(result);
    } else if (action === 'summarize' && context) {
      // Resumir noticias
      let articles: any[] = [];
      try { articles = JSON.parse(context); } catch { articles = [{ title: context }]; }
      const result = await aiService.summarizeNews(articles);
      response = JSON.stringify(result);
    } else if (action === 'crisis-response' && message) {
      // Respuesta a crisis
      let alertData: any;
      try { alertData = JSON.parse(message); } catch { alertData = { type: 'general', severity: 'medium', description: message }; }
      const result = await aiService.generateCrisisResponse(alertData);
      response = JSON.stringify(result);
    } else if (action === 'reputation' && message) {
      // Analisis de reputacion
      let newsData: any[] = [];
      try { newsData = JSON.parse(context || '[]'); } catch { newsData = []; }
      const result = await aiService.analyzeReputation(message, newsData);
      response = JSON.stringify(result);
    } else {
      // Chat general con Julia
      const juliaContext = `Usuario consultando sobre reputacion online. Especializate en:
- Analisis de sentimientos en redes sociales
- Monitoreo de reputacion online
- Estrategias de marketing digital
- Influencers y politicos de Latinoamerica
- Gestion de crisis de reputacion
- Metricas y KPIs de social media

Contexto de la conversacion: ${context || 'Consulta general sobre reputacion online'}`;

      response = await aiService.juliaChat(message || context, juliaContext);
    }

    // Deducir creditos despues de respuesta exitosa
    if (userId) {
      const result = await deductCreditsForAction(userId, actionType, 1, `Julia IA: ${actionType}`);
      creditInfo = { cost: result.cost || CREDIT_COSTS[actionType], newBalance: result.newBalance };
    }

    return NextResponse.json({
      success: true,
      response,
      credits: creditInfo,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Julia API Error:', error);

    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      response: 'Lo siento, Julia esta experimentando dificultades tecnicas. Por favor, intentalo mas tarde.'
    }, { status: 500 });
  }
}