import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helper';
import { createClient } from '@supabase/supabase-js';
import { sanitizeSearch } from '@/lib/admin/search';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const MAX_LIMIT = 200;

/**
 * GET /api/admin/julia?search=&limit=&offset=
 *
 * Uso de la IA Julia: stats de consumo de créditos (related_entity LIKE 'julia_%'),
 * top usuarios y lista de conversaciones recientes.
 */
export async function GET(request: NextRequest) {
  const admin = await requireRole(request, 'admin');
  if (admin instanceof NextResponse) return admin;

  const { searchParams } = new URL(request.url);
  const search = sanitizeSearch(searchParams.get('search'));
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
  const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));

  // 1. Total de conversaciones
  const { count: conversationsTotal } = await supabaseAdmin
    .from('amelia_conversations')
    .select('id', { count: 'exact', head: true });

  // 2. Consumo de créditos de IA (todas las acciones julia_*)
  const { data: juliaTx } = await supabaseAdmin
    .from('credit_transactions')
    .select('user_id, amount, related_entity, created_at')
    .like('related_entity', 'julia_%')
    .limit(5000);

  let creditsConsumed = 0;
  const byAction: Record<string, number> = {};
  const byUser: Record<string, number> = {};
  for (const t of (juliaTx || []) as any[]) {
    const spent = Math.abs(t.amount || 0);
    creditsConsumed += spent;
    byAction[t.related_entity] = (byAction[t.related_entity] || 0) + spent;
    if (t.user_id) byUser[t.user_id] = (byUser[t.user_id] || 0) + spent;
  }

  // Top usuarios por consumo de IA
  const topUserIds = Object.entries(byUser)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([uid]) => uid);
  const usersById: Record<string, any> = {};
  if (topUserIds.length) {
    const { data: users } = await supabaseAdmin.from('users').select('id, name, email, plan').in('id', topUserIds);
    for (const u of users || []) usersById[u.id] = u;
  }
  const topUsers = topUserIds.map((uid) => ({
    userId: uid,
    name: usersById[uid]?.name || null,
    email: usersById[uid]?.email || null,
    plan: usersById[uid]?.plan || null,
    creditsConsumed: byUser[uid],
  }));

  // 3. Conversaciones recientes
  let convQuery = supabaseAdmin
    .from('amelia_conversations')
    .select('id, user_id, title, created_at, updated_at', { count: 'exact' })
    .order('updated_at', { ascending: false, nullsFirst: false });
  if (search) convQuery = convQuery.ilike('title', `%${search}%`);

  const { data: convs, count: convCount } = await convQuery.range(offset, offset + limit - 1);

  const convUserIds = [...new Set((convs || []).map((c: any) => c.user_id).filter(Boolean))];
  const convUsers: Record<string, any> = {};
  if (convUserIds.length) {
    const { data: users } = await supabaseAdmin.from('users').select('id, name, email').in('id', convUserIds);
    for (const u of users || []) convUsers[u.id] = u;
  }

  const conversations = (convs || []).map((c: any) => ({
    id: c.id,
    userId: c.user_id,
    user: convUsers[c.user_id] ? { name: convUsers[c.user_id].name, email: convUsers[c.user_id].email } : null,
    title: c.title,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  }));

  return NextResponse.json({
    success: true,
    stats: {
      conversationsTotal: conversationsTotal || 0,
      creditsConsumed,
      byAction,
      topUsers,
    },
    total: convCount || 0,
    limit,
    offset,
    conversations,
  });
}

/**
 * DELETE /api/admin/julia?id=...  → elimina una conversación.
 */
export async function DELETE(request: NextRequest) {
  const admin = await requireRole(request, 'admin');
  if (admin instanceof NextResponse) return admin;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id') || '';
  if (!id) return NextResponse.json({ success: false, error: 'id requerido' }, { status: 400 });

  const { error } = await supabaseAdmin.from('amelia_conversations').delete().eq('id', id);
  if (error) {
    console.error('[DELETE /api/admin/julia] error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, deleted: id });
}
