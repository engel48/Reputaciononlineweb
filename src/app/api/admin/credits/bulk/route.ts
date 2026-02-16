import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireRole } from '@/lib/auth-helper';

// Crear cliente Supabase admin
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación y rol admin
    const admin = await requireRole(request, 'admin');
    if (admin instanceof NextResponse) return admin;

    const body = await request.json();
    const { userIds, amount, description, type = 'bonus' } = body;

    // Validaciones
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Se requiere un array de userIds' },
        { status: 400 }
      );
    }

    if (!amount || typeof amount !== 'number' || amount === 0) {
      return NextResponse.json(
        { success: false, error: 'Se requiere una cantidad válida (positiva o negativa)' },
        { status: 400 }
      );
    }

    // Validar tipo de transacción
    const validTypes = ['bonus', 'refund', 'usage', 'purchase'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Tipo de transacción inválido. Usar: bonus, refund, usage, purchase' },
        { status: 400 }
      );
    }

    console.log(`🔄 BULK CREDITS API: Procesando ${userIds.length} usuarios, ${amount} créditos cada uno`);

    const results: {
      success: string[];
      failed: { userId: string; error: string }[];
    } = {
      success: [],
      failed: []
    };

    // Procesar cada usuario
    for (const userId of userIds) {
      try {
        // Obtener usuario actual
        const { data: user, error: userError } = await supabaseAdmin
          .from('users')
          .select('id, name, email, credits')
          .eq('id', userId)
          .single();

        if (userError || !user) {
          results.failed.push({ userId, error: 'Usuario no encontrado' });
          continue;
        }

        // Calcular nuevo balance
        const currentCredits = user.credits || 0;
        const newBalance = currentCredits + amount;

        // No permitir balance negativo
        if (newBalance < 0) {
          results.failed.push({ userId, error: `Balance insuficiente. Actual: ${currentCredits}, Requerido: ${Math.abs(amount)}` });
          continue;
        }

        // Actualizar créditos del usuario
        const { error: updateError } = await supabaseAdmin
          .from('users')
          .update({
            credits: newBalance,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (updateError) {
          results.failed.push({ userId, error: updateError.message });
          continue;
        }

        // Registrar transacción
        const { error: transactionError } = await supabaseAdmin
          .from('credit_transactions')
          .insert({
            user_id: userId,
            type,
            amount,
            balance_after: newBalance,
            description: description || `Asignación masiva de créditos por admin`,
            related_entity: 'admin_bulk',
            created_at: new Date().toISOString()
          });

        if (transactionError) {
          console.warn(`⚠️ Error registrando transacción para ${userId}:`, transactionError);
          // No fallar la operación principal, solo advertir
        }

        results.success.push(userId);
        console.log(`✅ Usuario ${userId}: ${currentCredits} → ${newBalance} créditos`);

      } catch (error: any) {
        results.failed.push({ userId, error: error.message || 'Error desconocido' });
      }
    }

    console.log(`✅ BULK CREDITS API: ${results.success.length} exitosos, ${results.failed.length} fallidos`);

    return NextResponse.json({
      success: true,
      data: {
        processed: userIds.length,
        successful: results.success.length,
        failed: results.failed.length,
        details: {
          successfulUsers: results.success,
          failedUsers: results.failed
        }
      }
    });

  } catch (error: any) {
    console.error('❌ BULK CREDITS API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error procesando créditos en lote' },
      { status: 500 }
    );
  }
}

// GET - Obtener usuarios con sus créditos actuales para selección
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación y rol admin
    const admin = await requireRole(request, 'admin');
    if (admin instanceof NextResponse) return admin;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    let query = supabaseAdmin
      .from('users')
      .select('id, name, email, credits, plan')
      .order('name', { ascending: true });

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: users, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: users || []
    });

  } catch (error: any) {
    console.error('❌ BULK CREDITS GET API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error obteniendo usuarios' },
      { status: 500 }
    );
  }
}
