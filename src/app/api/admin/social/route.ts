import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helper';
import { createClient } from '@supabase/supabase-js';
import { disconnectAccountById } from '@/lib/oauth-storage';
import { tokenRefreshService } from '@/lib/oauth/token-refresh-service';
import { sanitizeSearch } from '@/lib/admin/search';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const MAX_LIMIT = 200;

function tokenStatusOf(tokenExpiry: string | null): 'valid' | 'expired' | 'unknown' {
  if (!tokenExpiry) return 'unknown';
  return new Date(tokenExpiry) < new Date() ? 'expired' : 'valid';
}

/**
 * GET /api/admin/social?platform=&connected=&tokenStatus=&search=&limit=&offset=
 *
 * Vista global de TODAS las cuentas de redes conectadas (todos los usuarios).
 * Nunca devuelve access_token/refresh_token.
 */
export async function GET(request: NextRequest) {
  const admin = await requireRole(request, 'admin');
  if (admin instanceof NextResponse) return admin;

  const { searchParams } = new URL(request.url);
  const platform = searchParams.get('platform') || '';
  const connected = searchParams.get('connected') || '';
  const tokenStatus = searchParams.get('tokenStatus') || '';
  const search = sanitizeSearch(searchParams.get('search'));
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
  const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));
  const nowIso = new Date().toISOString();

  let query = supabaseAdmin
    .from('social_media')
    .select(
      'id, user_id, platform, username, display_name, profile_url, profile_image, followers, following, posts, engagement, connected, last_sync, token_expiry, created_at',
      { count: 'exact' }
    )
    .order('last_sync', { ascending: false, nullsFirst: false });

  if (platform) query = query.eq('platform', platform);
  if (connected === 'true') query = query.eq('connected', true);
  if (connected === 'false') query = query.eq('connected', false);
  if (tokenStatus === 'expired') query = query.lt('token_expiry', nowIso);
  if (tokenStatus === 'valid') query = query.gte('token_expiry', nowIso);
  if (search) query = query.or(`username.ilike.%${search}%,display_name.ilike.%${search}%`);

  const { data, count, error } = await query.range(offset, offset + limit - 1);

  if (error) {
    console.error('[GET /api/admin/social] error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  // Enriquecer con datos del usuario (segunda consulta, evita depender de embeds)
  const userIds = [...new Set((data || []).map((r: any) => r.user_id).filter(Boolean))];
  const usersById: Record<string, any> = {};
  if (userIds.length) {
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, name, email, plan')
      .in('id', userIds);
    for (const u of users || []) usersById[u.id] = u;
  }

  const accounts = (data || []).map((s: any) => ({
    id: s.id,
    userId: s.user_id,
    user: usersById[s.user_id]
      ? { name: usersById[s.user_id].name, email: usersById[s.user_id].email, plan: usersById[s.user_id].plan }
      : null,
    platform: s.platform,
    username: s.username,
    displayName: s.display_name,
    profileUrl: s.profile_url,
    profileImage: s.profile_image,
    followers: s.followers || 0,
    following: s.following || 0,
    posts: s.posts || 0,
    engagement: s.engagement || 0,
    connected: !!s.connected,
    lastSync: s.last_sync,
    tokenExpiresAt: s.token_expiry,
    tokenStatus: tokenStatusOf(s.token_expiry),
    createdAt: s.created_at,
  }));

  // Stats globales (sobre una muestra amplia)
  const { data: allRows } = await supabaseAdmin
    .from('social_media')
    .select('platform, connected, token_expiry')
    .limit(5000);

  const byPlatform: Record<string, number> = {};
  let connectedCount = 0;
  let expiredCount = 0;
  for (const r of (allRows || []) as any[]) {
    byPlatform[r.platform] = (byPlatform[r.platform] || 0) + 1;
    if (r.connected) connectedCount++;
    if (r.token_expiry && new Date(r.token_expiry) < new Date()) expiredCount++;
  }

  return NextResponse.json({
    success: true,
    total: count || 0,
    limit,
    offset,
    accounts,
    stats: {
      totalAccounts: (allRows || []).length,
      connected: connectedCount,
      expiredTokens: expiredCount,
      byPlatform,
    },
  });
}

/**
 * POST /api/admin/social  body: { action: 'disconnect'|'refresh'|'delete', id?, userId }
 *  - disconnect: desconecta una cuenta concreta (limpia tokens, conserva el registro).
 *  - refresh: fuerza el chequeo/refresh de tokens del usuario.
 *  - delete: elimina por completo el registro de la cuenta.
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

  const { action, id, userId } = body || {};
  if (!action || !userId) {
    return NextResponse.json({ success: false, error: 'action y userId son requeridos' }, { status: 400 });
  }

  if (action === 'disconnect') {
    if (!id) return NextResponse.json({ success: false, error: 'id requerido' }, { status: 400 });
    const ok = await disconnectAccountById(userId, id);
    if (!ok) return NextResponse.json({ success: false, error: 'No se pudo desconectar' }, { status: 500 });
    return NextResponse.json({ success: true, action: 'disconnect' });
  }

  if (action === 'refresh') {
    const results = await tokenRefreshService.refreshUserTokens(userId);
    return NextResponse.json({ success: true, action: 'refresh', results });
  }

  if (action === 'delete') {
    if (!id) return NextResponse.json({ success: false, error: 'id requerido' }, { status: 400 });
    const { error } = await supabaseAdmin
      .from('social_media')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) {
      console.error('[POST /api/admin/social delete] error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, action: 'delete', deleted: id });
  }

  return NextResponse.json({ success: false, error: 'action no soportada' }, { status: 400 });
}
