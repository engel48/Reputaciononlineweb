import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helper';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const MAX_LIMIT = 200;

async function attachUsers(rows: any[]) {
  const userIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))];
  const usersById: Record<string, any> = {};
  if (userIds.length) {
    const { data: users } = await supabaseAdmin.from('users').select('id, name, email').in('id', userIds);
    for (const u of users || []) usersById[u.id] = u;
  }
  return rows.map((r) => ({
    ...r,
    user: usersById[r.user_id] ? { name: usersById[r.user_id].name, email: usersById[r.user_id].email } : null,
  }));
}

/**
 * GET /api/admin/communications?type=notifications|alerts|subscriptions&search=&limit=&offset=
 */
export async function GET(request: NextRequest) {
  const admin = await requireRole(request, 'admin');
  if (admin instanceof NextResponse) return admin;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'notifications';
  const search = searchParams.get('search') || '';
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
  const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));

  if (!['notifications', 'alerts', 'subscriptions'].includes(type)) {
    return NextResponse.json({ success: false, error: 'type inválido' }, { status: 400 });
  }

  if (type === 'notifications') {
    let q = supabaseAdmin
      .from('notifications')
      .select('id, user_id, title, message, type, is_read, priority, created_at', { count: 'exact' })
      .order('created_at', { ascending: false });
    if (search) q = q.or(`title.ilike.%${search}%,message.ilike.%${search}%`);
    const { data, count, error } = await q.range(offset, offset + limit - 1);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, type, total: count || 0, limit, offset, items: await attachUsers(data || []) });
  }

  if (type === 'alerts') {
    let q = supabaseAdmin
      .from('alerts')
      .select('id, user_id, name, keywords, platforms, sentiment, is_active, frequency, last_triggered, created_at', { count: 'exact' })
      .order('created_at', { ascending: false });
    if (search) q = q.ilike('name', `%${search}%`);
    const { data, count, error } = await q.range(offset, offset + limit - 1);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, type, total: count || 0, limit, offset, items: await attachUsers(data || []) });
  }

  // subscriptions (solo lectura)
  let q = supabaseAdmin
    .from('subscriptions')
    .select('id, user_id, plan_type, status, billing_cycle, current_period_start, current_period_end, cancel_at_period_end, cancelled_at, created_at', { count: 'exact' })
    .order('created_at', { ascending: false });
  if (search) q = q.ilike('plan_type', `%${search}%`);
  const { data, count, error } = await q.range(offset, offset + limit - 1);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, type, total: count || 0, limit, offset, items: await attachUsers(data || []) });
}

/**
 * DELETE /api/admin/communications?type=notifications|alerts&id=...
 */
export async function DELETE(request: NextRequest) {
  const admin = await requireRole(request, 'admin');
  if (admin instanceof NextResponse) return admin;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || '';
  const id = searchParams.get('id') || '';

  if (!['notifications', 'alerts'].includes(type)) {
    return NextResponse.json({ success: false, error: 'type debe ser notifications o alerts' }, { status: 400 });
  }
  if (!id) return NextResponse.json({ success: false, error: 'id requerido' }, { status: 400 });

  const { error } = await supabaseAdmin.from(type).delete().eq('id', id);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, deleted: id });
}

/**
 * POST /api/admin/communications  body: { action: 'purge', olderThanDays }
 * Purga notificaciones leídas más antiguas que N días.
 */
export async function POST(request: NextRequest) {
  const admin = await requireRole(request, 'admin');
  if (admin instanceof NextResponse) return admin;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'JSON inválido' }, { status: 400 });
  }

  const { action, olderThanDays } = body || {};
  if (action !== 'purge') {
    return NextResponse.json({ success: false, error: 'action no soportada' }, { status: 400 });
  }

  const days = Math.max(1, parseInt(String(olderThanDays || 30), 10));
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { error, count } = await supabaseAdmin
    .from('notifications')
    .delete({ count: 'exact' })
    .eq('is_read', true)
    .lt('created_at', cutoff);

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, purged: count || 0, olderThanDays: days });
}
