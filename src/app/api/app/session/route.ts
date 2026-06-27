/**
 * POST /api/app/session
 * Registra una sesión de uso de la app (analíticas) y refresca last_seen
 * del dispositivo si se envía el token.
 * Body: { platform?, appVersion?, fcmToken? }
 */
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-helper';
import { supabase } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuthToken(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { platform, appVersion, fcmToken } = body as Record<string, string>;

    await supabase.from('app_sessions').insert({
      user_id: user.userId,
      platform: platform || null,
      app_version: appVersion || null,
      started_at: new Date().toISOString(),
    });

    if (fcmToken) {
      await supabase
        .from('app_devices')
        .update({ last_seen: new Date().toISOString(), app_version: appVersion || null })
        .eq('fcm_token', fcmToken);
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Error interno' }, { status: 500 });
  }
}
