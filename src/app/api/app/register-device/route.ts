/**
 * POST /api/app/register-device
 * Registra (o actualiza) el token FCM del dispositivo del usuario para push.
 * Body: { fcmToken, platform?, appVersion?, deviceModel?, locale? }
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
    const { fcmToken, platform, appVersion, deviceModel, locale } = body as Record<string, string>;

    if (!fcmToken || fcmToken.length < 10) {
      return NextResponse.json({ success: false, error: 'fcmToken requerido' }, { status: 400 });
    }

    const validPlatform = ['android', 'ios', 'web'].includes(platform) ? platform : 'android';

    // Upsert por fcm_token (un token = un dispositivo; reasigna al usuario actual).
    const { error } = await supabase
      .from('app_devices')
      .upsert(
        {
          user_id: user.userId,
          fcm_token: fcmToken,
          platform: validPlatform,
          app_version: appVersion || null,
          device_model: deviceModel || null,
          locale: locale || null,
          last_seen: new Date().toISOString(),
        },
        { onConflict: 'fcm_token' }
      );

    if (error) {
      console.error('[register-device] error:', error);
      return NextResponse.json({ success: false, error: 'No se pudo registrar el dispositivo' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Error interno' }, { status: 500 });
  }
}
