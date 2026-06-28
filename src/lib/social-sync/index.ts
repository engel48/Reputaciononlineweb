export * from './types';
export { syncFacebookMentions } from './facebook';
export { syncInstagramMentions } from './instagram';
export { syncTwitterMentions } from './twitter';
export { syncYoutubeMentions } from './youtube';
export { analyzeSentimentAI } from './sentiment';

import type { SocialPlatform, SyncOptions, SyncResult } from './types';
import { syncFacebookMentions } from './facebook';
import { syncInstagramMentions } from './instagram';
import { syncTwitterMentions } from './twitter';
import { syncYoutubeMentions } from './youtube';

/**
 * Combina los resultados de sincronizar varias cuentas de la misma red en uno
 * solo (suma contadores; success = al menos una OK). Mantiene el shape SyncResult
 * que espera el front. Si todas fallan, propaga el primer error.
 */
export function aggregateSyncResults(results: SyncResult[]): SyncResult {
  if (results.length === 1) return results[0];
  const agg: SyncResult = {
    platform: results[0]?.platform ?? 'facebook',
    success: results.some((r) => r.success),
    posts_processed: 0,
    comments_processed: 0,
    mentions_created: 0,
    external_mentions_created: 0,
    duration_ms: 0,
  };
  for (const r of results) {
    agg.posts_processed += r.posts_processed || 0;
    agg.comments_processed += r.comments_processed || 0;
    agg.mentions_created += r.mentions_created || 0;
    agg.external_mentions_created += r.external_mentions_created || 0;
    agg.duration_ms += r.duration_ms || 0;
  }
  if (!agg.success) agg.error = results.find((r) => r.error)?.error;
  return agg;
}

export async function syncPlatformMentions(
  platform: SocialPlatform,
  userId: string,
  accessToken: string,
  options?: SyncOptions
): Promise<SyncResult> {
  switch (platform) {
    case 'facebook':
      return syncFacebookMentions(userId, accessToken, options);
    case 'instagram':
      return syncInstagramMentions(userId, accessToken, options);
    case 'x':
      return syncTwitterMentions(userId, accessToken, options);
    case 'youtube':
      return syncYoutubeMentions(userId, accessToken, options);
    default:
      return {
        platform,
        success: false,
        posts_processed: 0,
        comments_processed: 0,
        mentions_created: 0,
        external_mentions_created: 0,
        error: `Plataforma no soportada: ${platform}`,
        duration_ms: 0,
      };
  }
}
