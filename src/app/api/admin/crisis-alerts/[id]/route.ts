import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helper';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface RouteCtx {
  params: { id: string };
}

const ALLOWED_STATUS = ['active', 'acknowledged', 'resolved'];

/**
 * GET /api/admin/crisis-alerts/[id]: detalle completo
 */
export async function GET(request: NextRequest, { params }: RouteCtx) {
  const admin = await requireRole(request, 'admin');
  if (admin instanceof NextResponse) return admin;

  const { data, error } = await supabaseAdmin
    .from('crisis_alerts')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ success: false, error: 'Alerta no encontrada' }, { status: 404 });
  }

  // Info del usuario afectado
  let user = null;
  if (data.user_id) {
    const { data: u } = await supabaseAdmin
      .from('users')
      .select('id, name, email, plan')
      .eq('id', data.user_id)
      .maybeSingle();
    user = u;
  }

  return NextResponse.json({ success: true, alert: data, user });
}

/**
 * PATCH /api/admin/crisis-alerts/[id]
 *   body: { status: 'acknowledged' | 'resolved' }
 *
 * Actualiza el estado de la alerta. Si pasa a acknowledged/resolved,
 * sella el timestamp correspondiente.
 */
export async function PATCH(request: NextRequest, { params }: RouteCtx) {
  const admin = await requireRole(request, 'admin');
  if (admin instanceof NextResponse) return admin;

  const body = await request.json().catch(() => ({}));
  const newStatus = body.status as string;

  if (!ALLOWED_STATUS.includes(newStatus)) {
    return NextResponse.json(
      { success: false, error: `status invalido. Valores: ${ALLOWED_STATUS.join(', ')}` },
      { status: 400 }
    );
  }

  const updateData: Record<string, any> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };
  if (newStatus === 'acknowledged') updateData.acknowledged_at = new Date().toISOString();
  if (newStatus === 'resolved') {
    updateData.resolved_at = new Date().toISOString();
    if (!updateData.acknowledged_at) updateData.acknowledged_at = new Date().toISOString();
  }

  const { data, error } = await supabaseAdmin
    .from('crisis_alerts')
    .update(updateData)
    .eq('id', params.id)
    .select('*')
    .single();

  if (error || !data) {
    return NextResponse.json(
      { success: false, error: error?.message || 'No se pudo actualizar' },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true, alert: data });
}
