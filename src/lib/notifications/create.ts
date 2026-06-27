import { sendPushToTokens, isPushConfigured } from '@/lib/firebase-admin';

/**
 * Crea una notificación: la inserta en la tabla `notifications` (campanita web)
 * y, además, envía un push FCM a los dispositivos móviles del usuario.
 * Best-effort: ningún fallo de push rompe la creación de la notificación.
 */
export interface CreateNotificationInput {
  userId: string;
  type: string; // crisis | warning | success | system | mention | alert | update
  title: string;
  message: string;
  priority?: string; // low | normal | medium | high
  metadata?: Record<string, any>;
  /** Si false, no envía push móvil (solo guarda en BD). Default true. */
  push?: boolean;
}

export async function createNotification(input: CreateNotificationInput): Promise<void> {
  const { supabase } = await import('@/lib/supabase-server');

  const { error } = await supabase.from('notifications').insert({
    user_id: input.userId,
    type: input.type,
    priority: input.priority || 'normal',
    title: input.title,
    message: input.message,
    metadata: input.metadata || {},
  });
  if (error) {
    console.warn('[notifications] error insertando:', error.message);
  }

  if (input.push !== false) {
    await pushToUserDevices(input.userId, input.title, input.message, {
      type: input.type,
      ...(input.metadata?.platform ? { platform: String(input.metadata.platform) } : {}),
    }).catch((e) => console.warn('[notifications] error enviando push:', e));
  }
}

/** Envía un push a todos los dispositivos (FCM) del usuario; limpia tokens muertos. */
async function pushToUserDevices(
  userId: string,
  title: string,
  body: string,
  data: Record<string, string>,
): Promise<void> {
  if (!isPushConfigured()) return; // Firebase no configurado → no-op
  const { supabase } = await import('@/lib/supabase-server');

  const { data: devices } = await supabase
    .from('app_devices')
    .select('fcm_token')
    .eq('user_id', userId);

  const tokens = (devices || []).map((d: any) => d.fcm_token).filter(Boolean);
  if (tokens.length === 0) return;

  const res = await sendPushToTokens(tokens, { title, body, data });
  if (res.invalidTokens.length) {
    await supabase.from('app_devices').delete().in('fcm_token', res.invalidTokens);
  }
}
