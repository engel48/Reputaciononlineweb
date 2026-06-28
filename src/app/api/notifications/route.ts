import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helper';

export const dynamic = 'force-dynamic';

/**
 * GET  /api/notifications        → últimas notificaciones del usuario + no leídas.
 * POST /api/notifications        → { action: 'markRead', id } | { action: 'markAllRead' }
 * Auth: requireAuth (lee Bearer o cookie auth-token).
 */
export async function GET(request: NextRequest) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;
  const userId = (user as any).userId;

  const { supabase } = await import('@/lib/supabase-server');

  const { data, error } = await supabase
    .from('notifications')
    .select('id, type, title, message, is_read, priority, metadata, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) {
    console.error('[GET /api/notifications]', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  const { count: unread } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  const notifications = (data || []).map((n: any) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    read: !!n.is_read,
    priority: n.priority,
    timestamp: n.created_at,
    actionUrl: n.metadata?.sample_url || n.metadata?.actionUrl || null,
    source: n.metadata?.platform || null,
  }));

  return NextResponse.json({ success: true, notifications, unreadCount: unread || 0 });
}

export async function POST(request: NextRequest) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;
  const userId = (user as any).userId;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'JSON inválido' }, { status: 400 });
  }

  const { supabase } = await import('@/lib/supabase-server');

  if (body?.action === 'markAllRead') {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (body?.action === 'markRead' && body?.id) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', body.id)
      .eq('user_id', userId);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (body?.action === 'delete' && body?.id) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', body.id)
      .eq('user_id', userId);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ success: false, error: 'action no soportada' }, { status: 400 });
}
