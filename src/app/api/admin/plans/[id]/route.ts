import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helper';
import { createClient } from '@supabase/supabase-js';
import { invalidatePlansCache } from '@/lib/plan-limits';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface RouteCtx {
  params: { id: string };
}

export async function PUT(request: NextRequest, { params }: RouteCtx) {
  const admin = await requireRole(request, 'admin');
  if (admin instanceof NextResponse) return admin;

  const id = params.id;
  if (!id) {
    return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));

  // Mapeo camelCase -> snake_case, solo campos permitidos
  const updateData: Record<string, any> = {};
  if (body.name !== undefined) updateData.name = String(body.name).trim();
  if (body.description !== undefined) updateData.description = body.description;
  if (body.priceCop !== undefined) updateData.price_cop = Math.max(0, Math.floor(body.priceCop));
  if (body.monthlyCredits !== undefined) updateData.monthly_credits = Math.max(0, Math.floor(body.monthlyCredits));
  // Tope duro: máximo 3 cuentas (la plataforma no soporta más por usuario)
  if (body.maxSocialAccounts !== undefined) updateData.max_social_accounts = Math.min(3, Math.max(0, Math.floor(body.maxSocialAccounts)));
  if (body.multiAccountPerPlatform !== undefined) updateData.multi_account_per_platform = !!body.multiAccountPerPlatform;
  if (body.maxAccountsPerPlatform !== undefined) updateData.max_accounts_per_platform = Math.min(3, Math.max(1, Math.floor(body.maxAccountsPerPlatform)));
  if (body.features !== undefined) updateData.features = body.features;
  if (body.isActive !== undefined) updateData.is_active = !!body.isActive;
  if (body.isPopular !== undefined) updateData.is_popular = !!body.isPopular;
  if (body.billingCycle !== undefined) updateData.billing_cycle = body.billingCycle;
  if (body.displayOrder !== undefined) updateData.display_order = Math.floor(body.displayOrder);

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ success: false, error: 'Sin campos a actualizar' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('plans')
    .update(updateData)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('ADMIN PLAN PUT error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }

  if (!data) {
    return NextResponse.json({ success: false, error: 'Plan no encontrado' }, { status: 404 });
  }

  invalidatePlansCache();
  return NextResponse.json({ success: true, plan: data });
}

export async function DELETE(request: NextRequest, { params }: RouteCtx) {
  const admin = await requireRole(request, 'admin');
  if (admin instanceof NextResponse) return admin;

  const id = params.id;
  if (!id) {
    return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 });
  }

  // Verificar el codigo antes de borrar
  const { data: plan } = await supabaseAdmin
    .from('plans')
    .select('code')
    .eq('id', id)
    .maybeSingle();

  if (!plan) {
    return NextResponse.json({ success: false, error: 'Plan no encontrado' }, { status: 404 });
  }

  // Bloqueo: no permitir borrar planes que tienen usuarios suscritos
  const { count } = await supabaseAdmin
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('plan', plan.code);

  if ((count || 0) > 0) {
    return NextResponse.json(
      {
        success: false,
        error: `No se puede eliminar: hay ${count} usuario(s) en este plan. Primero migralos a otro plan.`,
      },
      { status: 409 }
    );
  }

  const { error } = await supabaseAdmin
    .from('plans')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('ADMIN PLAN DELETE error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }

  invalidatePlansCache();
  return NextResponse.json({ success: true });
}
