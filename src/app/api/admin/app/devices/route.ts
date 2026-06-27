/**
 * GET /api/admin/app/devices?platform=&limit=&offset=
 * Lista dispositivos registrados con datos del usuario (para soporte/analíticas).
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helper';
import { supabase } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const admin = await requireRole(request, 'admin');
  if (admin instanceof NextResponse) return admin;

  const { searchParams } = new URL(request.url);
  const platform = searchParams.get('platform');
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
  const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));

  let query = supabase
    .from('app_devices')
    .select('id, user_id, platform, app_version, device_model, locale, last_seen, created_at', {
      count: 'exact',
    })
    .order('last_seen', { ascending: false });

  if (platform) query = query.eq('platform', platform);

  const { data: devices, count, error } = await query.range(offset, offset + limit - 1);
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  // Enriquecer con nombre/email del usuario
  const userIds = [...new Set((devices || []).map((d: any) => d.user_id).filter(Boolean))];
  const userMap: Record<string, any> = {};
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from('users')
      .select('id, name, email, plan')
      .in('id', userIds);
    for (const u of users || []) userMap[(u as any).id] = u;
  }

  const enriched = (devices || []).map((d: any) => ({
    ...d,
    user: userMap[d.user_id] || null,
  }));

  return NextResponse.json({
    success: true,
    data: enriched,
    pagination: { limit, offset, total: count || 0 },
  });
}
