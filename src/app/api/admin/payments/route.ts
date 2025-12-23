import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Crear cliente Supabase admin
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function GET(request: NextRequest) {
  try {
    // Obtener parámetros de filtrado
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    console.log('🔍 ADMIN PAYMENTS API: Obteniendo pagos con filtros:', {
      status, userId, startDate, endDate, page, limit
    });

    // Construir query base
    let query = supabaseAdmin
      .from('payments')
      .select(`
        id,
        user_id,
        subscription_id,
        wompi_transaction_id,
        transaction_id,
        amount,
        currency,
        status,
        payment_method,
        plan_type,
        credits_purchased,
        paid_at,
        created_at,
        updated_at,
        metadata,
        users!payments_user_id_fkey (
          id,
          name,
          email
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // Aplicar filtros
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    // Aplicar paginación
    query = query.range(offset, offset + limit - 1);

    const { data: payments, error, count } = await query;

    if (error) {
      console.error('❌ Error obteniendo pagos:', error);
      throw error;
    }

    console.log(`✅ ADMIN PAYMENTS API: ${payments?.length || 0} pagos obtenidos`);

    // Calcular estadísticas
    const { data: statsData } = await supabaseAdmin
      .from('payments')
      .select('amount, status');

    const stats = {
      totalPayments: statsData?.length || 0,
      totalRevenue: statsData?.filter(p => p.status === 'approved' || p.status === 'completed')
        .reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0) || 0,
      pendingPayments: statsData?.filter(p => p.status === 'pending').length || 0,
      approvedPayments: statsData?.filter(p => p.status === 'approved' || p.status === 'completed').length || 0,
      declinedPayments: statsData?.filter(p => p.status === 'declined' || p.status === 'failed').length || 0
    };

    return NextResponse.json({
      success: true,
      data: {
        payments: payments || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        },
        stats
      }
    });

  } catch (error: any) {
    console.error('❌ ADMIN PAYMENTS API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error obteniendo pagos' },
      { status: 500 }
    );
  }
}

// POST - Actualizar estado de pago (para casos especiales)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentId, status, notes } = body;

    if (!paymentId || !status) {
      return NextResponse.json(
        { success: false, error: 'paymentId y status son requeridos' },
        { status: 400 }
      );
    }

    // Validar status
    const validStatuses = ['pending', 'approved', 'declined', 'voided', 'completed', 'failed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Estado inválido' },
        { status: 400 }
      );
    }

    console.log(`🔄 ADMIN PAYMENTS API: Actualizando pago ${paymentId} a ${status}`);

    // Obtener pago actual
    const { data: currentPayment } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (!currentPayment) {
      return NextResponse.json(
        { success: false, error: 'Pago no encontrado' },
        { status: 404 }
      );
    }

    // Actualizar pago
    const { data: updatedPayment, error } = await supabaseAdmin
      .from('payments')
      .update({
        status,
        paid_at: status === 'approved' || status === 'completed' ? new Date().toISOString() : currentPayment.paid_at,
        metadata: {
          ...currentPayment.metadata,
          admin_notes: notes,
          updated_by_admin: true,
          admin_update_at: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error actualizando pago:', error);
      throw error;
    }

    // Si el pago fue aprobado y tiene créditos, agregarlos al usuario
    if ((status === 'approved' || status === 'completed') && currentPayment.credits_purchased && currentPayment.user_id) {
      // Obtener créditos actuales del usuario
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('credits')
        .eq('id', currentPayment.user_id)
        .single();

      if (user) {
        const newCredits = (user.credits || 0) + currentPayment.credits_purchased;

        // Actualizar créditos
        await supabaseAdmin
          .from('users')
          .update({ credits: newCredits })
          .eq('id', currentPayment.user_id);

        // Registrar transacción
        await supabaseAdmin
          .from('credit_transactions')
          .insert({
            user_id: currentPayment.user_id,
            type: 'purchase',
            amount: currentPayment.credits_purchased,
            balance_after: newCredits,
            description: `Compra de créditos - Pago ${paymentId}`,
            related_entity: 'payment',
            related_id: paymentId
          });

        console.log(`✅ Créditos agregados: ${currentPayment.credits_purchased} al usuario ${currentPayment.user_id}`);
      }
    }

    console.log(`✅ Pago ${paymentId} actualizado a ${status}`);

    return NextResponse.json({
      success: true,
      data: updatedPayment
    });

  } catch (error: any) {
    console.error('❌ ADMIN PAYMENTS API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error actualizando pago' },
      { status: 500 }
    );
  }
}
