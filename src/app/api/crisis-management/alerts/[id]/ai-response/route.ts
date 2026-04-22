import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai-service';
import { buildUserContext } from '@/lib/user-context';
import { extractUserIdFromToken, checkBalance, deductCreditsForAction } from '@/lib/credit-guard';
import { CREDIT_COSTS } from '@/lib/credit-costs';

/**
 * POST /api/crisis-management/alerts/[id]/ai-response
 *
 * Genera estrategia de respuesta a una alerta de crisis específica usando Julia IA,
 * con contexto personalizado del usuario.
 *
 * Body (opcional): { regenerate: boolean } — para forzar nueva respuesta
 *
 * Respuesta:
 *   {
 *     success: true,
 *     data: {
 *       immediateActions: [...],
 *       suggestedResponse: "...",
 *       communicationStrategy: "...",
 *       timeline: "..."
 *     },
 *     alertId
 *   }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authToken = request.cookies.get('auth-token')?.value;
    const userId = authToken ? extractUserIdFromToken(authToken) : null;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const alertId = params.id;
    const cost = CREDIT_COSTS.julia_crisis_response;

    const balance = await checkBalance(userId, cost);
    if (!balance.hasEnough && !balance.unlimited) {
      return NextResponse.json(
        { success: false, error: 'Créditos insuficientes', credits: { cost, currentBalance: balance.currentBalance } },
        { status: 402 }
      );
    }

    const { supabase } = await import('@/lib/supabase-server');
    const { data: alert, error: alertErr } = await supabase
      .from('crisis_alerts')
      .select('*')
      .eq('id', alertId)
      .eq('user_id', userId)
      .maybeSingle();

    if (alertErr || !alert) {
      return NextResponse.json(
        { success: false, error: 'Alerta no encontrada' },
        { status: 404 }
      );
    }

    const userContext = await buildUserContext(userId);

    const response = await aiService.generateCrisisResponse(
      {
        type: (alert as any).type || 'general',
        severity: (alert as any).severity || 'medium',
        description: (alert as any).description || (alert as any).title || '',
        keyword: (alert as any).keyword || undefined,
      },
      userContext
    );

    // Guardar la respuesta generada en la alerta (metadata)
    await supabase
      .from('crisis_alerts')
      .update({
        metadata: {
          ...((alert as any).metadata || {}),
          ai_response: response,
          ai_generated_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', alertId);

    const deduction = await deductCreditsForAction(
      userId,
      'julia_crisis_response',
      1,
      `Respuesta IA para alerta ${alertId}`
    );

    return NextResponse.json({
      success: true,
      data: response,
      alertId,
      credits: {
        cost: deduction.cost || cost,
        newBalance: deduction.newBalance,
      },
    });
  } catch (error: any) {
    console.error('[crisis ai-response] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Error interno' },
      { status: 500 }
    );
  }
}
