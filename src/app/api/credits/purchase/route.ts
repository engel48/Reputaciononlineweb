/**
 * POST /api/credits/purchase
 * Registra la compra de creditos (despues de pago exitoso)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-server';
import { sendPurchaseConfirmationEmail, sendInvoiceEmail } from '@/lib/email-service';
import { requireAuth } from '@/lib/auth-helper';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    const userId = auth.userId;

    const body = await request.json();
    const { planId, credits, amount } = body;

    if (!credits || credits <= 0) {
      return NextResponse.json(
        { success: false, error: 'Cantidad de creditos invalida' },
        { status: 400 }
      );
    }

    // Obtener balance actual del usuario
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('credits')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const currentBalance = user.credits || 0;
    const newBalance = currentBalance + credits;

    // Actualizar balance del usuario
    const { error: updateError } = await supabase
      .from('users')
      .update({ credits: newBalance })
      .eq('id', userId);

    if (updateError) {
      console.error('Error actualizando creditos:', updateError);
      return NextResponse.json(
        { success: false, error: 'Error al actualizar creditos' },
        { status: 500 }
      );
    }

    // Registrar transaccion de compra
    const { error: txError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        type: 'purchase',
        amount: credits,
        balance_after: newBalance,
        description: `Compra de ${credits} creditos - Plan ${planId}`,
        related_entity: planId,
      });

    if (txError) {
      console.error('Error registrando transaccion:', txError);
      // No revertir, solo loguear
    }

    // Registrar pago (si hay monto)
    if (amount && amount > 0) {
      await supabase
        .from('payments')
        .insert({
          user_id: userId,
          amount: amount,
          currency: 'COP',
          status: 'completed',
          payment_method: 'credit_purchase',
          plan_type: planId,
          credits_purchased: credits,
          paid_at: new Date().toISOString(),
        });
    }

    // Enviar email de confirmacion de compra
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('email, name')
        .eq('id', userId)
        .single();

      if (userData?.email) {
        const txId = `TX-${Date.now()}`;
        await sendPurchaseConfirmationEmail(
          userData.email,
          userData.name || 'Usuario',
          {
            plan: planId || 'creditos',
            credits: credits,
            amount: amount || 0,
            transactionId: txId
          }
        );
        // Enviar factura
        if (amount && amount > 0) {
          await sendInvoiceEmail(userData.email, userData.name || 'Usuario', {
            transactionId: txId,
            plan: planId || 'creditos',
            credits: credits,
            amount: amount,
            paymentMethod: 'Compra de creditos',
          });
        }
      }
    } catch (emailError) {
      console.error('Error enviando email de compra:', emailError);
    }

    return NextResponse.json({
      success: true,
      data: {
        newBalance,
        creditsPurchased: credits,
      },
    });

  } catch (error: any) {
    console.error('Error en /api/credits/purchase:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
