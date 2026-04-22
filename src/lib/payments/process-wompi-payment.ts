/**
 * Lógica compartida para procesar un pago Wompi aprobado.
 * Usada por:
 *  - /api/payments/callback (redirect GET después del pago)
 *  - /api/payments/webhook  (notificación POST automática de Wompi)
 */

import { sendPurchaseConfirmationEmail, sendPlanChangeEmail, sendInvoiceEmail } from '@/lib/email-service';
import { MAX_MONTHLY_CREDITS } from '@/lib/plan-limits';

export type WompiStatus = 'APPROVED' | 'DECLINED' | 'VOIDED' | 'PENDING' | 'ERROR';

export interface ProcessPaymentResult {
  success: boolean;
  status: 'approved' | 'declined' | 'voided' | 'pending';
  error?: string;
  userId?: string;
  newCredits?: number;
  newPlan?: string;
}

/**
 * Procesa un cambio de status de pago Wompi. Actualiza payments, users,
 * credit_transactions y opcionalmente subscriptions. Envía emails si approved.
 */
export async function processWompiPayment(params: {
  reference: string;
  wompiTransactionId: string | null;
  wompiStatus: WompiStatus;
}): Promise<ProcessPaymentResult> {
  const { supabase } = await import('@/lib/supabase-server');

  const newStatus: ProcessPaymentResult['status'] =
    params.wompiStatus === 'APPROVED' ? 'approved'
    : params.wompiStatus === 'DECLINED' ? 'declined'
    : params.wompiStatus === 'VOIDED' ? 'voided'
    : 'pending';

  // 1. Actualizar el payment
  const { error: updateErr } = await supabase
    .from('payments')
    .update({
      status: newStatus,
      wompi_transaction_id: params.wompiTransactionId,
      paid_at: params.wompiStatus === 'APPROVED' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('transaction_id', params.reference);

  if (updateErr) {
    return { success: false, status: newStatus, error: updateErr.message };
  }

  // Si no fue approved, no hay más que hacer
  if (params.wompiStatus !== 'APPROVED') {
    return { success: true, status: newStatus };
  }

  // 2. Cargar el payment para saber a quién acreditar
  const { data: payment, error: paymentErr } = await supabase
    .from('payments')
    .select('user_id, amount, credits_purchased, plan_type, credit_pack_id')
    .eq('transaction_id', params.reference)
    .maybeSingle();

  if (paymentErr || !payment?.user_id) {
    return {
      success: false,
      status: 'approved',
      error: `Payment sin user_id: ${paymentErr?.message || 'not found'}`,
    };
  }

  const userId = (payment as any).user_id as string;
  const creditsPurchased = Number((payment as any).credits_purchased || 0);
  const planType = (payment as any).plan_type as string | null;

  // 3. Cargar user actual
  const { data: currentUser } = await supabase
    .from('users')
    .select('plan, credits, email, name')
    .eq('id', userId)
    .maybeSingle();

  if (!currentUser) {
    return { success: false, status: 'approved', error: 'User not found', userId };
  }

  const oldPlan = (currentUser as any).plan || 'free';
  const oldCredits = Number((currentUser as any).credits || 0);

  // 4. Calcular nuevo balance + plan
  let newPlan = oldPlan;
  let newCredits = oldCredits;

  if (planType) {
    // Upgrade/downgrade de plan: resetea créditos al límite del nuevo plan
    newPlan = planType;
    newCredits = MAX_MONTHLY_CREDITS[planType] ?? oldCredits;
  }

  if (creditsPurchased > 0) {
    // Compra de paquete de créditos: suma al balance actual (o al nuevo si hubo upgrade)
    newCredits = newCredits + creditsPurchased;
  }

  // 5. Actualizar user
  await supabase
    .from('users')
    .update({ plan: newPlan, credits: newCredits, updated_at: new Date().toISOString() })
    .eq('id', userId);

  // 6. Registrar transacciones en credit_transactions
  if (creditsPurchased > 0) {
    await supabase.from('credit_transactions').insert({
      user_id: userId,
      type: 'purchase',
      amount: creditsPurchased,
      balance_after: newCredits,
      description: `Compra de ${creditsPurchased} créditos${planType ? ` + plan ${planType}` : ''}`,
      related_entity: 'payment',
    });
  }
  if (planType && planType !== oldPlan) {
    await supabase.from('credit_transactions').insert({
      user_id: userId,
      type: 'bonus',
      amount: MAX_MONTHLY_CREDITS[planType] ?? 0,
      balance_after: newCredits,
      description: `Upgrade a plan ${planType}`,
      related_entity: 'plan_upgrade',
    });
  }

  // 7. Registrar en subscriptions si hay plan
  if (planType) {
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    const subPayload = {
      user_id: userId,
      plan_type: planType,
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (existingSub) {
      await supabase.from('subscriptions').update(subPayload).eq('id', (existingSub as any).id);
    } else {
      await supabase.from('subscriptions').insert(subPayload);
    }
  }

  // 8. Emails (mejor esfuerzo, no fallar el webhook si falla)
  const email = (currentUser as any).email;
  const name = (currentUser as any).name || 'Usuario';
  const txId = params.wompiTransactionId || params.reference;

  if (email) {
    try {
      await sendPurchaseConfirmationEmail(email, name, {
        plan: planType || 'créditos',
        credits: creditsPurchased,
        amount: Number((payment as any).amount) || 0,
        transactionId: txId,
      });

      if (planType && planType !== oldPlan) {
        await sendPlanChangeEmail(email, name, oldPlan, planType);
      }

      await sendInvoiceEmail(email, name, {
        transactionId: txId,
        plan: planType || 'créditos',
        credits: creditsPurchased,
        amount: Number((payment as any).amount) || 0,
        paymentMethod: 'Wompi',
      });
    } catch (emailErr) {
      console.warn('[wompi] Emails falló (no blocking):', emailErr);
    }
  }

  return {
    success: true,
    status: 'approved',
    userId,
    newCredits,
    newPlan,
  };
}
