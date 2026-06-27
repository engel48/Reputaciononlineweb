/**
 * GET /api/admin/app/analytics — métricas de uso de la app móvil:
 * dispositivos por plataforma, instalaciones, sesiones (7/30 días), activos.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helper';
import { supabase } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const admin = await requireRole(request, 'admin');
  if (admin instanceof NextResponse) return admin;

  const now = Date.now();
  const d7 = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  const d30 = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    devicesRes,
    androidRes,
    iosRes,
    active7Res,
    sessions7Res,
    sessions30Res,
  ] = await Promise.all([
    supabase.from('app_devices').select('id', { count: 'exact', head: true }),
    supabase.from('app_devices').select('id', { count: 'exact', head: true }).eq('platform', 'android'),
    supabase.from('app_devices').select('id', { count: 'exact', head: true }).eq('platform', 'ios'),
    supabase.from('app_devices').select('id', { count: 'exact', head: true }).gte('last_seen', d7),
    supabase.from('app_sessions').select('id', { count: 'exact', head: true }).gte('started_at', d7),
    supabase.from('app_sessions').select('id', { count: 'exact', head: true }).gte('started_at', d30),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      devices: {
        total: devicesRes.count || 0,
        android: androidRes.count || 0,
        ios: iosRes.count || 0,
        active7d: active7Res.count || 0,
      },
      sessions: {
        last7d: sessions7Res.count || 0,
        last30d: sessions30Res.count || 0,
      },
    },
  });
}
