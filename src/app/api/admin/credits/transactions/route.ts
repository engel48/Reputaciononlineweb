import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Crear cliente Supabase admin
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;

    console.log('🔍 ADMIN TRANSACTIONS API: Obteniendo transacciones');

    // Construir query
    let query = supabaseAdmin
      .from('credit_transactions')
      .select(`
        id,
        user_id,
        type,
        amount,
        balance_after,
        description,
        related_entity,
        related_id,
        created_at,
        users!credit_transactions_user_id_fkey (
          id,
          name,
          email
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // Aplicar filtros
    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (type && type !== 'all') {
      query = query.eq('type', type);
    }

    // Aplicar paginación
    query = query.range(offset, offset + limit - 1);

    const { data: transactions, error, count } = await query;

    if (error) {
      console.error('❌ Error obteniendo transacciones:', error);
      throw error;
    }

    console.log(`✅ ADMIN TRANSACTIONS API: ${transactions?.length || 0} transacciones obtenidas`);

    return NextResponse.json({
      success: true,
      data: transactions || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error: any) {
    console.error('❌ ADMIN TRANSACTIONS API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error obteniendo transacciones' },
      { status: 500 }
    );
  }
}
