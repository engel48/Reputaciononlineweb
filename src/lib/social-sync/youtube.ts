import { decryptToken, isEncrypted } from '@/lib/encryption';
import { youtubeOAuth } from '@/lib/oauth/youtube';
import { DEFAULT_SYNC_OPTIONS, SyncOptions, SyncResult } from './types';
import { analyzeSentimentAI } from './sentiment';
import { notifyFromMentions } from './notifications';

/**
 * Sincroniza YouTube para un usuario:
 * - Videos del canal + comentarios (análisis de sentimiento con Groq)
 * - Menciones externas reales vía searchMentions (activa dead code previamente)
 *
 * Inserta en `mentions` y actualiza `social_media.last_sync` + `connected=true`.
 */
export async function syncYoutubeMentions(
  userId: string,
  rawAccessToken: string,
  options: SyncOptions = {}
): Promise<SyncResult> {
  const start = Date.now();
  const opts = { ...DEFAULT_SYNC_OPTIONS, ...options };
  const result: SyncResult = {
    platform: 'youtube',
    success: false,
    posts_processed: 0,
    comments_processed: 0,
    mentions_created: 0,
    external_mentions_created: 0,
    duration_ms: 0,
  };

  try {
    const accessToken = isEncrypted(rawAccessToken) ? decryptToken(rawAccessToken) : rawAccessToken;
    const { supabase } = await import('@/lib/supabase-server');

    // 1. Perfil del canal
    const channel = await youtubeOAuth.getChannelProfile(accessToken);
    if (!channel) {
      throw new Error('No se pudo obtener el canal de YouTube');
    }
    const channelTitle = channel.snippet?.title || '';
    result.followers = parseInt(channel.statistics?.subscriberCount || '0', 10);

    // 2. Videos recientes
    const videos = await youtubeOAuth.getChannelVideos(accessToken, opts.maxPosts);
    result.posts_processed = videos.length;

    let totalViews = 0;
    let totalLikes = 0;
    let totalComments = 0;

    // 3. Comentarios de cada video + análisis de sentimiento con Groq
    for (const video of videos) {
      totalViews += parseInt(video.statistics?.viewCount || '0', 10);
      totalLikes += parseInt(video.statistics?.likeCount || '0', 10);
      totalComments += parseInt(video.statistics?.commentCount || '0', 10);

      let comments: any[] = [];
      try {
        comments = await youtubeOAuth.getVideoComments(accessToken, video.id, opts.maxCommentsPerPost);
      } catch {
        continue;
      }
      result.comments_processed += comments.length;

      for (const comment of comments) {
        const url = `https://www.youtube.com/watch?v=${video.id}&lc=${comment.id}`;
        const { data: existing } = await supabase
          .from('mentions')
          .select('id')
          .eq('user_id', userId)
          .eq('platform', 'youtube')
          .eq('url', url)
          .maybeSingle();
        if (existing) continue;

        // Sentimiento con Groq REAL; si falla queda pendiente (null), nunca simulado.
        const ai = await analyzeSentimentAI(comment.snippet.textDisplay);
        const sentimentLabel = ai.label;
        const sentimentScore = ai.score;
        const aiExplanation = ai.explanation || '';
        const aiPowered = ai.label !== null;

        const { error } = await supabase.from('mentions').insert({
          user_id: userId,
          platform: 'youtube',
          author_username: comment.snippet.authorChannelId || 'unknown',
          author_name: comment.snippet.authorDisplayName || 'YouTube User',
          content: comment.snippet.textDisplay || '',
          url,
          published_at: comment.snippet.publishedAt,
          likes: comment.snippet.likeCount || 0,
          shares: 0,
          comments: 0,
          metadata: {
            source_type: 'comment_on_own_video',
            video_id: video.id,
            video_title: video.snippet?.title,
            video_views: video.statistics?.viewCount,
            comment_id: comment.id,
            sentiment: sentimentLabel,
            sentiment_score: sentimentScore,
            ai_powered: aiPowered,
            ai_explanation: aiExplanation,
          },
        });
        if (!error) result.mentions_created++;
      }
    }

    // 4. Menciones externas: búsqueda del nombre del canal en videos de terceros
    if (channelTitle) {
      try {
        const externalVideos = await youtubeOAuth.searchMentions(
          accessToken,
          channelTitle,
          opts.maxExternalMentions
        );
        for (const v of externalVideos) {
          const videoId = v.id?.videoId;
          if (!videoId) continue;
          // Saltar videos del propio canal
          if (v.snippet?.channelId === channel.id) continue;

          const url = `https://www.youtube.com/watch?v=${videoId}`;
          const { data: existing } = await supabase
            .from('mentions')
            .select('id')
            .eq('user_id', userId)
            .eq('platform', 'youtube')
            .eq('url', url)
            .maybeSingle();
          if (existing) continue;

          const text = `${v.snippet?.title || ''} ${v.snippet?.description || ''}`.trim();
          // Sentimiento con Groq REAL; si falla queda pendiente (null), nunca simulado.
          const ai = await analyzeSentimentAI(text);
          const sentimentLabel = ai.label;
          const sentimentScore = ai.score;

          const { error } = await supabase.from('mentions').insert({
            user_id: userId,
            platform: 'youtube',
            author_username: v.snippet?.channelId || null,
            author_name: v.snippet?.channelTitle || 'YouTube Channel',
            content: text,
            url,
            published_at: v.snippet?.publishedAt,
            likes: 0,
            shares: 0,
            comments: 0,
            metadata: {
              source_type: 'external_video_mention',
              video_id: videoId,
              video_title: v.snippet?.title,
              search_query: channelTitle,
              sentiment: sentimentLabel,
              sentiment_score: sentimentScore,
            },
          });
          if (!error) result.external_mentions_created++;
        }
      } catch (searchErr) {
        console.warn('[sync-youtube] searchMentions falló:', (searchErr as Error).message);
      }
    }

    // 5. Actualizar social_media
    const engagementRate =
      totalViews > 0 ? ((totalLikes + totalComments) / totalViews) * 100 : 0;
    result.engagement = engagementRate;

    const ytMetrics = supabase
      .from('social_media')
      .update({
        connected: true,
        followers: result.followers,
        posts: parseInt(channel.statistics?.videoCount || '0', 10),
        engagement: engagementRate,
        last_sync: new Date().toISOString(),
      });
    // Escribir SOLO en la fila de esta cuenta si se conoce su id (multi-cuenta).
    await (opts.socialAccountId
      ? ytMetrics.eq('id', opts.socialAccountId)
      : ytMetrics.eq('user_id', userId).eq('platform', 'youtube'));

    const totalNew = result.mentions_created + result.external_mentions_created;
    if (totalNew > 0) {
      const sinceIso = new Date(start - 1000).toISOString();
      const { data: fresh } = await supabase
        .from('mentions')
        .select('content, url, metadata')
        .eq('user_id', userId)
        .eq('platform', 'youtube')
        .gte('scraped_at', sinceIso);
      if (fresh && fresh.length > 0) {
        await notifyFromMentions({ userId, platform: 'youtube', mentions: fresh as any });
      }
    }

    result.success = true;
  } catch (err: any) {
    result.error = err?.message || String(err);
  }

  result.duration_ms = Date.now() - start;
  return result;
}
