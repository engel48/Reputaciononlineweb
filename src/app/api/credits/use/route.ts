/**
 * POST /api/credits/use
 * Registra el uso de creditos para un servicio
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/auth-helper';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    const userId = auth.userId;

    const body = await request.json();
    const { amount, service, description } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Cantidad invalida' },
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

    if (currentBalance < amount) {
      return NextResponse.json(
        { success: false, error: 'Creditos insuficientes' },
        { status: 400 }
      );
    }

    const newBalance = currentBalance - amount;

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

    // Registrar transaccion
    const { error: txError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        type: 'usage',
        amount: -amount, // Negativo para uso
        balance_after: newBalance,
        description: description || `Uso de creditos: ${service}`,
        related_entity: service,
      });

    if (txError) {
      console.error('Error registrando transaccion:', txError);
      // No revertir, solo loguear
    }

    return NextResponse.json({
      success: true,
      data: {
        newBalance,
        amountUsed: amount,
      },
    });

  } catch (error: any) {
    console.error('Error en /api/credits/use:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
