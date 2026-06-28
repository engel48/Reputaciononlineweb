export type SocialPlatform = 'facebook' | 'instagram' | 'x' | 'youtube';

export interface SyncOptions {
  maxPosts?: number;
  maxCommentsPerPost?: number;
  lookbackDays?: number;
  maxExternalMentions?: number;
  /**
   * Si se pasa, las métricas (followers/posts/engagement) se escriben SOLO en
   * esa fila de social_media. Necesario para soportar varias cuentas de la misma
   * red por usuario (si no, se pisarían entre sí). Si no viene, cae al filtro por
   * (user_id, platform) — comportamiento mono-cuenta retrocompatible.
   */
  socialAccountId?: string;
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

export const DEFAULT_SYNC_OPTIONS: Required<Omit<SyncOptions, 'socialAccountId'>> = {
  maxPosts: 20,
  maxCommentsPerPost: 50,
  lookbackDays: 30,
  maxExternalMentions: 50,
};
