/**
 * GET /api/credits
 * Obtiene el balance de creditos y transacciones del usuario autenticado
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/auth-helper';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    const userId = auth.userId;

    // Obtener datos del usuario (balance de creditos)
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('credits')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error obteniendo usuario:', userError);
      return NextResponse.json(
        { success: false, error: 'Error al obtener datos del usuario' },
        { status: 500 }
      );
    }

    // Obtener transacciones de creditos
    const { data: transactions, error: txError } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (txError) {
      console.error('Error obteniendo transacciones:', txError);
      // No fallar si no hay transacciones
    }

    // Calcular totales desde las transacciones
    const txList = transactions || [];

    const totalPurchased = txList
      .filter(t => t.type === 'purchase' || t.type === 'bonus')
      .reduce((sum, t) => sum + (t.amount > 0 ? t.amount : 0), 0);

    const totalUsed = txList
      .filter(t => t.type === 'usage')
      .reduce((sum, t) => sum + Math.abs(t.amount < 0 ? t.amount : 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        balance: user?.credits || 0,
        totalPurchased,
        totalUsed,
        transactions: txList,
      },
    });

  } catch (error: any) {
    console.error('Error en /api/credits:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
