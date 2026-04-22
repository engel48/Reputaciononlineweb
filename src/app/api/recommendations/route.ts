import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai-service';
import { buildUserContext } from '@/lib/user-context';
import { extractUserIdFromToken, checkBalance, deductCreditsForAction } from '@/lib/credit-guard';
import { CREDIT_COSTS } from '@/lib/credit-costs';

/**
 * GET /api/recommendations
 *
 * Genera recomendaciones accionables personalizadas para el usuario usando Julia IA (Groq)
 * con contexto real del usuario: nombre, plan, redes conectadas, keywords,
 * menciones recientes (positivas/negativas).
 *
 * Respuesta:
 *   {
 *     success: true,
 *     data: {
 *       recommendations: [{ title, description, priority, category }, ...],
 *       summary: "Texto personalizado dirigido al usuario por su nombre"
 *     },
 *     credits: { cost, newBalance }
 *   }
 */
export async function GET(request: NextRequest) {
  try {
    const authToken = request.cookies.get('auth-token')?.value;
    const userId = authToken ? extractUserIdFromToken(authToken) : null;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const cost = CREDIT_COSTS.julia_reputation;
    const balance = await checkBalance(userId, cost);
    if (!balance.hasEnough && !balance.unlimited) {
      return NextResponse.json(
        {
          success: false,
          error: 'Créditos insuficientes',
          credits: { cost, currentBalance: balance.currentBalance },
        },
        { status: 402 }
      );
    }

    const userContext = await buildUserContext(userId);
    if (!userContext) {
      return NextResponse.json(
        { success: false, error: 'No se pudo cargar el contexto del usuario' },
        { status: 500 }
      );
    }

    const result = await aiService.generateRecommendations(userContext);

    const deduction = await deductCreditsForAction(
      userId,
      'julia_reputation',
      1,
      'Recomendaciones personalizadas IA'
    );

    return NextResponse.json({
      success: true,
      data: result,
      credits: {
        cost: deduction.cost || cost,
        newBalance: deduction.newBalance,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[recommendations] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Error interno' },
      { status: 500 }
    );
  }
}
