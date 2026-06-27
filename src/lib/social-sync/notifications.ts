/**
 * Helper para crear notificaciones automáticas cuando se detectan menciones
 * negativas durante los syncs. Usa la tabla `notifications` de Supabase.
 *
 * Estrategia:
 * - Al final de un sync, si encontró al menos 1 mención con score < -0.5
 *   (muy negativa), crea una notificación agregada (no una por mención
 *   para evitar spam).
 * - Si encontró >= 5 menciones negativas en total (aunque no cada una
 *   sea muy negativa), también notifica.
 * - Si encontró >= 20 menciones positivas, notifica "buenas noticias".
 */

type PlatformId = 'facebook' | 'instagram' | 'x' | 'youtube';

const PLATFORM_LABELS: Record<PlatformId, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  x: 'X (Twitter)',
  youtube: 'YouTube',
};

interface NotifyIfRelevantArgs {
  userId: string;
  platform: PlatformId;
  mentions: Array<{
    content: string;
    url?: string;
    metadata?: any;
  }>;
}

/**
 * Revisa un lote recién insertado de menciones. Si hay señales de reputación
 * negativa (o muy positiva), crea una notificación en la BD.
 */
export async function notifyFromMentions({
  userId,
  platform,
  mentions,
}: NotifyIfRelevantArgs): Promise<void> {
  if (!userId || mentions.length === 0) return;

  try {
    const veryNegative: typeof mentions = [];
    let totalNegative = 0;
    let totalPositive = 0;

    for (const m of mentions) {
      const sentiment = (m.metadata?.sentiment || '').toLowerCase();
      const score =
        typeof m.metadata?.sentiment_score === 'number'
          ? m.metadata.sentiment_score
          : null;

      if (sentiment === 'negative') totalNegative++;
      if (sentiment === 'positive') totalPositive++;

      // Para detectar "muy negativa", aceptamos ambas convenciones:
      // score -1..1 (score < -0.5) o score 0..100 (score < 25)
      const isVeryNeg =
        sentiment === 'negative' &&
        ((typeof score === 'number' && score < 0 && score < -0.5) ||
          (typeof score === 'number' && score >= 0 && score < 25));

      if (isVeryNeg) veryNegative.push(m);
    }

    const { createNotification } = await import('@/lib/notifications/create');
    const label = PLATFORM_LABELS[platform] || platform;
    const now = new Date().toISOString();

    // 1) Alerta crítica: alguna mención muy negativa
    if (veryNegative.length > 0) {
      const sample = veryNegative[0];
      const previewText = String(sample.content || '').slice(0, 160);
      await createNotification({
        userId,
        type: 'crisis',
        priority: 'high',
        title: `⚠️ Mención muy negativa en ${label}`,
        message: `Julia detectó ${veryNegative.length} mención${
          veryNegative.length !== 1 ? 'es' : ''
        } muy negativa${veryNegative.length !== 1 ? 's' : ''} en ${label}. Ejemplo: "${previewText}${
          previewText.length >= 160 ? '...' : ''
        }"`,
        metadata: {
          platform,
          count: veryNegative.length,
          sample_url: sample.url,
          detected_at: now,
          source: 'social_sync',
        },
      });
      return; // evita duplicar con la notif de "varias negativas"
    }

    // 2) Tendencia negativa acumulada
    if (totalNegative >= 5) {
      await createNotification({
        userId,
        type: 'warning',
        priority: 'medium',
        title: `Varias menciones negativas en ${label}`,
        message: `Se detectaron ${totalNegative} menciones negativas en ${label} durante el último sync. Te recomendamos revisarlas.`,
        metadata: { platform, count: totalNegative, detected_at: now, source: 'social_sync' },
      });
      return;
    }

    // 3) Buena noticia: pico de positivas
    if (totalPositive >= 20) {
      await createNotification({
        userId,
        type: 'success',
        priority: 'low',
        title: `✨ Buena recepción en ${label}`,
        message: `${totalPositive} menciones positivas detectadas en ${label}. Tu reputación está mejorando.`,
        metadata: { platform, count: totalPositive, detected_at: now, source: 'social_sync' },
      });
    }
  } catch (err) {
    console.warn(`[notify-from-mentions:${platform}] error creando notificación:`, err);
  }
}
