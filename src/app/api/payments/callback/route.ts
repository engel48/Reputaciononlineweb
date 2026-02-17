/**
 * GET /api/payments/callback
 * Callback de Wompi despues de pago por redirect (PSE, Bancolombia, Nequi)
 * Verifica estado de la transaccion y redirige al usuario
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-server';
import { sendPurchaseConfirmationEmail } from '@/lib/email-service';

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

    // Enviar email de confirmacion si pago aprobado (non-blocking)
    if (transactionStatus === 'APPROVED') {
      try {
        const { data: payment } = await supabase
          .from('payments')
          .select('user_id, amount, credits_purchased, plan_type')
          .eq('transaction_id', reference)
          .single();

        if (payment?.user_id) {
          const { data: userData } = await supabase
            .from('users')
            .select('email, name')
            .eq('id', payment.user_id)
            .single();

          if (userData?.email) {
            sendPurchaseConfirmationEmail(
              userData.email,
              userData.name || 'Usuario',
              {
                plan: payment.plan_type || 'creditos',
                credits: payment.credits_purchased || 0,
                amount: Number(payment.amount) || 0,
                transactionId: transactionId || reference || `TX-${Date.now()}`
              }
            ).catch(err => console.error('Error enviando email de compra:', err));
          }
        }
      } catch (emailError) {
        console.error('Error preparando email de compra:', emailError);
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
