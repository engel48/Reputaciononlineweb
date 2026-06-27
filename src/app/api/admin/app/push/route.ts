/**
 * POST /api/admin/app/push — envía una notificación push (FCM) a un segmento.
 * Body: { title, body, segment?, plan?, platform?, userIds?, data? }
 *   segment: 'all' (default) | 'plan' | 'platform' | 'users'
 * Registra la campaña en push_campaigns y limpia tokens inválidos.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helper';
import { supabase } from '@/lib/supabase-server';
import { isPushConfigured, sendPushToTokens } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const admin = await requireRole(request, 'admin');
  if (admin instanceof NextResponse) return admin;

  if (!isPushConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error: 'Push no configurado',
        message:
          'Falta la service account de Firebase. Configurá FIREBASE_SERVICE_ACCOUNT en el entorno del servidor.',
      },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const { title, body: message, segment = 'all', plan, platform, userIds, data } = body as {
    title?: string;
    body?: string;
    segment?: string;
    plan?: string;
    platform?: string;
    userIds?: string[];
    data?: Record<string, string>;
  };

  if (!title || !message) {
    return NextResponse.json({ success: false, error: 'title y body son requeridos' }, { status: 400 });
  }

  // Resolver tokens según el segmento
  let deviceQuery = supabase.from('app_devices').select('fcm_token, user_id, platform');

  if (segment === 'platform' && platform) {
    deviceQuery = deviceQuery.eq('platform', platform);
  } else if (segment === 'users' && Array.isArray(userIds) && userIds.length > 0) {
    deviceQuery = deviceQuery.in('user_id', userIds);
  } else if (segment === 'plan' && plan) {
    const { data: planUsers } = await supabase.from('users').select('id').eq('plan', plan);
    const ids = (planUsers || []).map((u: any) => u.id);
    if (ids.length === 0) {
      return NextResponse.json({ success: true, data: { sent: 0, failed: 0, total: 0 } });
    }
    deviceQuery = deviceQuery.in('user_id', ids);
  }

  const { data: devices, error: devErr } = await deviceQuery;
  if (devErr) {
    return NextResponse.json({ success: false, error: devErr.message }, { status: 500 });
  }

  const tokens = (devices || []).map((d: any) => d.fcm_token).filter(Boolean);
  if (tokens.length === 0) {
    return NextResponse.json({ success: true, data: { sent: 0, failed: 0, total: 0 } });
  }

  let result;
  try {
    result = await sendPushToTokens(tokens, { title, body: message, data });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Error enviando push' }, { status: 500 });
  }

  // Limpiar tokens inválidos
  if (result.invalidTokens.length > 0) {
    await supabase.from('app_devices').delete().in('fcm_token', result.invalidTokens);
  }

  // Registrar campaña
  await supabase.from('push_campaigns').insert({
    admin_id: admin.userId,
    segment: segment === 'plan' ? `plan:${plan}` : segment === 'platform' ? `platform:${platform}` : segment,
    title,
    body: message,
    data: data || {},
    sent_count: result.sent,
    failed_count: result.failed,
  });

  return NextResponse.json({
    success: true,
    data: { sent: result.sent, failed: result.failed, total: tokens.length, cleaned: result.invalidTokens.length },
  });
}

/**
 * GET /api/admin/app/push — historial de campañas enviadas.
 */
export async function GET(request: NextRequest) {
  const admin = await requireRole(request, 'admin');
  if (admin instanceof NextResponse) return admin;

  const { data, error } = await supabase
    .from('push_campaigns')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true, data: data || [] });
}
