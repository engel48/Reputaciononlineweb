/**
 * GET /api/payments/callback
 * Callback de Wompi despues de pago por redirect (PSE, Bancolombia, Nequi)
 * Verifica estado de la transaccion y redirige al usuario
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-server';
import { sendPurchaseConfirmationEmail, sendPlanChangeEmail, sendInvoiceEmail } from '@/lib/email-service';

const WOMPI_PRIVATE_KEY = process.env.WOMPI_PRIVATE_KEY || '';
const WOMPI_API_URL = process.env.WOMPI_API_URL || 'https://sandbox.wompi.co/v1';
const APP_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const reference = searchParams.get('ref');
    const transactionId = searchParams.get('id');

    if (!reference) {
      return NextResponse.redirect(new URL('/dashboard/pago?error=missing_reference', APP_URL));
    }

    // Verificar estado de transaccion con Wompi
    let transactionStatus = 'PENDING';

    if (transactionId && WOMPI_PRIVATE_KEY) {
      try {
        const response = await fetch(`${WOMPI_API_URL}/transactions/${transactionId}`, {
          headers: {
            'Authorization': `Bearer ${WOMPI_PRIVATE_KEY}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          transactionStatus = data.data?.status || 'PENDING';
        }
      } catch (error) {
        console.error('Error verificando transaccion Wompi:', error);
      }
    }

    // Actualizar estado del pago en DB
    const newStatus = transactionStatus === 'APPROVED' ? 'approved'
      : transactionStatus === 'DECLINED' ? 'declined'
      : transactionStatus === 'VOIDED' ? 'voided'
      : 'pending';

    await supabase
      .from('payments')
      .update({
        status: newStatus,
        wompi_transaction_id: transactionId,
        updated_at: new Date().toISOString(),
      })
      .eq('transaction_id', reference);

    // Procesar pago aprobado: actualizar plan, creditos y enviar emails
    if (transactionStatus === 'APPROVED') {
      try {
        const { data: payment } = await supabase
          .from('payments')
          .select('user_id, amount, credits_purchased, plan_type')
          .eq('transaction_id', reference)
          .single();

        if (payment?.user_id) {
          // Actualizar plan del usuario si aplica
          if (payment.plan_type) {
            const { data: currentUser } = await supabase
              .from('users')
              .select('plan, credits, email, name')
              .eq('id', payment.user_id)
              .single();

            if (currentUser) {
              const oldPlan = currentUser.plan || 'free';
              const updateData: any = { plan: payment.plan_type };

              // Sumar creditos si aplica
              if (payment.credits_purchased && payment.credits_purchased > 0) {
                updateData.credits = (currentUser.credits || 0) + payment.credits_purchased;

                // Registrar transaccion de creditos
                await supabase.from('credit_transactions').insert({
                  user_id: payment.user_id,
                  type: 'purchase',
                  amount: payment.credits_purchased,
                  balance_after: updateData.credits,
                  description: `Compra de ${payment.credits_purchased} creditos - Plan ${payment.plan_type}`,
                  related_entity: 'payment',
                });
              }

              await supabase.from('users').update(updateData).eq('id', payment.user_id);

              // Enviar email de confirmacion de compra
              if (currentUser.email) {
                await sendPurchaseConfirmationEmail(
                  currentUser.email,
                  currentUser.name || 'Usuario',
                  {
                    plan: payment.plan_type || 'creditos',
                    credits: payment.credits_purchased || 0,
                    amount: Number(payment.amount) || 0,
                    transactionId: transactionId || reference || `TX-${Date.now()}`
                  }
                );

                // Enviar email de cambio de plan si cambio
                if (payment.plan_type !== oldPlan) {
                  await sendPlanChangeEmail(currentUser.email, currentUser.name || 'Usuario', oldPlan, payment.plan_type);
                }

                // Enviar factura
                await sendInvoiceEmail(currentUser.email, currentUser.name || 'Usuario', {
                  transactionId: transactionId || reference || `TX-${Date.now()}`,
                  plan: payment.plan_type || 'creditos',
                  credits: payment.credits_purchased || 0,
                  amount: Number(payment.amount) || 0,
                  paymentMethod: 'Wompi',
                });
              }
            }
          } else {
            // Solo compra de creditos sin cambio de plan
            if (payment.credits_purchased && payment.credits_purchased > 0) {
              const { data: currentUser } = await supabase
                .from('users')
                .select('credits, email, name')
                .eq('id', payment.user_id)
                .single();

              if (currentUser) {
                const newCredits = (currentUser.credits || 0) + payment.credits_purchased;
                await supabase.from('users').update({ credits: newCredits }).eq('id', payment.user_id);
                await supabase.from('credit_transactions').insert({
                  user_id: payment.user_id,
                  type: 'purchase',
                  amount: payment.credits_purchased,
                  balance_after: newCredits,
                  description: `Compra de ${payment.credits_purchased} creditos`,
                  related_entity: 'payment',
                });

                if (currentUser.email) {
                  const txId = transactionId || reference || `TX-${Date.now()}`;
                  await sendPurchaseConfirmationEmail(
                    currentUser.email,
                    currentUser.name || 'Usuario',
                    {
                      plan: 'creditos',
                      credits: payment.credits_purchased,
                      amount: Number(payment.amount) || 0,
                      transactionId: txId
                    }
                  );
                  // Enviar factura
                  await sendInvoiceEmail(currentUser.email, currentUser.name || 'Usuario', {
                    transactionId: txId,
                    plan: 'creditos',
                    credits: payment.credits_purchased,
                    amount: Number(payment.amount) || 0,
                    paymentMethod: 'Wompi',
                  });
                }
              }
            }
          }
        }
      } catch (callbackError) {
        console.error('Error procesando pago aprobado:', callbackError);
      }
    }

    // Redirigir al usuario
    if (transactionStatus === 'APPROVED') {
      return NextResponse.redirect(new URL('/dashboard/perfil?tab=plan&success=true', APP_URL));
    } else if (transactionStatus === 'DECLINED') {
      return NextResponse.redirect(new URL('/dashboard/pago?error=declined', APP_URL));
    } else {
      // Pendiente - el webhook lo procesara
      return NextResponse.redirect(new URL('/dashboard/perfil?tab=plan&pending=true', APP_URL));
    }

  } catch (error: any) {
    console.error('Error en callback de pago:', error);
    return NextResponse.redirect(new URL('/dashboard/pago?error=unknown', APP_URL));
  }
}
