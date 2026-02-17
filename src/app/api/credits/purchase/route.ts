/**
 * POST /api/credits/purchase
 * Registra la compra de creditos (despues de pago exitoso)
 */

import { NextRequest, NextResponse } from 'next/server';
import * as jwt from 'jsonwebtoken';
import { supabase } from '@/lib/supabase-server';
import { sendPurchaseConfirmationEmail } from '@/lib/email-service';

const JWT_SECRET = process.env.JWT_SECRET || 'reputacion-online-secret-key-2025';

export async function POST(request: NextRequest) {
  try {
    // Obtener token de autenticacion desde cookie (JWT Local)
    const authToken = request.cookies.get('auth-token')?.value;

    if (!authToken) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar token JWT Local
    let userId: string;
    try {
      const decoded = jwt.verify(authToken, JWT_SECRET) as { userId: string; email: string };
      userId = decoded.userId;
    } catch {
      return NextResponse.json(
        { success: false, error: 'Token invalido o expirado' },
        { status: 401 }
      );
    }

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

    // Enviar email de confirmacion de compra (non-blocking)
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('email, name')
        .eq('id', userId)
        .single();

      if (userData?.email) {
        sendPurchaseConfirmationEmail(
          userData.email,
          userData.name || 'Usuario',
          {
            plan: planId || 'creditos',
            credits: credits,
            amount: amount || 0,
            transactionId: `TX-${Date.now()}`
          }
        ).catch(err => console.error('Error enviando email de compra:', err));
      }
    } catch (emailError) {
      console.error('Error preparando email de compra:', emailError);
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
