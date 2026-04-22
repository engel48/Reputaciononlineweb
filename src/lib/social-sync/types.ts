export type SocialPlatform = 'facebook' | 'instagram' | 'x' | 'youtube';

export interface SyncOptions {
  maxPosts?: number;
  maxCommentsPerPost?: number;
  lookbackDays?: number;
  maxExternalMentions?: number;
}

export interface SyncResult {
  platform: SocialPlatform;
  success: boolean;
  posts_processed: number;
  comments_processed: number;
  mentions_created: number;
  external_mentions_created: number;
  followers?: number;
  engagement?: number;
  error?: string;
  duration_ms: number;
}

export const DEFAULT_SYNC_OPTIONS: Required<SyncOptions> = {
  maxPosts: 20,
  maxCommentsPerPost: 50,
  lookbackDays: 30,
  maxExternalMentions: 50,
};
