export * from './types';
export { syncFacebookMentions } from './facebook';
export { syncInstagramMentions } from './instagram';
export { syncTwitterMentions } from './twitter';
export { syncYoutubeMentions } from './youtube';
export { analyzeSentimentBasic } from './sentiment';

import type { SocialPlatform, SyncOptions, SyncResult } from './types';
import { syncFacebookMentions } from './facebook';
import { syncInstagramMentions } from './instagram';
import { syncTwitterMentions } from './twitter';
import { syncYoutubeMentions } from './youtube';

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
