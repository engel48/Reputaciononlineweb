import { decryptToken, isEncrypted } from '@/lib/encryption';
import { DEFAULT_SYNC_OPTIONS, SyncOptions, SyncResult } from './types';
import { analyzeSentimentAI } from './sentiment';
import { notifyFromMentions } from './notifications';

const GRAPH_API = 'https://graph.facebook.com/v18.0';

/**
 * Sincroniza Facebook para un usuario: posts propios, comentarios y menciones externas (tagged).
 * Inserta en tabla `mentions` y actualiza `social_media.last_sync` + `connected=true`.
 */
export async function syncFacebookMentions(
  userId: string,
  rawAccessToken: string,
  options: SyncOptions = {}
): Promise<SyncResult> {
  const start = Date.now();
  const opts = { ...DEFAULT_SYNC_OPTIONS, ...options };
  const result: SyncResult = {
    platform: 'facebook',
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

    // 1. Obtener páginas del usuario
    const pagesRes = await fetch(
      `${GRAPH_API}/me/accounts?fields=id,name,access_token,fan_count,followers_count&access_token=${accessToken}`
    );
    if (!pagesRes.ok) {
      throw new Error(`Facebook /me/accounts error: ${pagesRes.status}`);
    }
    const pagesData = await pagesRes.json();
    const pages = pagesData.data || [];
    if (pages.length === 0) {
      throw new Error('No se encontraron páginas de Facebook');
    }

    const page = pages[0];
    const pageAccessToken = page.access_token;
    const pageId = page.id;
    const since = Math.floor(Date.now() / 1000) - opts.lookbackDays * 24 * 60 * 60;

    // 2. Posts propios + comentarios
    const postsRes = await fetch(
      `${GRAPH_API}/${pageId}/posts?` +
        `fields=id,message,created_time,likes.summary(true),comments.summary(true),shares,permalink_url&` +
        `since=${since}&limit=${opts.maxPosts}&access_token=${pageAccessToken}`
    );
    if (!postsRes.ok) {
      throw new Error(`Facebook posts error: ${postsRes.status}`);
    }
    const postsData = await postsRes.json();
    const posts = postsData.data || [];
    result.posts_processed = posts.length;

    let engagementTotal = 0;
    for (const post of posts) {
      engagementTotal += post.likes?.summary?.total_count || 0;
      const commentsRes = await fetch(
        `${GRAPH_API}/${post.id}/comments?` +
          `fields=id,from,message,created_time,like_count,permalink_url&` +
          `limit=${opts.maxCommentsPerPost}&access_token=${pageAccessToken}`
      );
      if (!commentsRes.ok) continue;
      const commentsData = await commentsRes.json();
      const comments = commentsData.data || [];
      result.comments_processed += comments.length;

      for (const c of comments) {
        const url = `https://facebook.com/${c.id}`;
        const { data: existing } = await supabase
          .from('mentions')
          .select('id')
          .eq('user_id', userId)
          .eq('platform', 'facebook')
          .eq('url', url)
          .maybeSingle();
        if (existing) continue;

        const sentiment = await analyzeSentimentAI(c.message || '');
        const { error } = await supabase.from('mentions').insert({
          user_id: userId,
          platform: 'facebook',
          author_username: c.from?.id || null,
          author_name: c.from?.name || 'Facebook User',
          content: c.message || '',
          url,
          published_at: c.created_time,
          likes: c.like_count || 0,
          shares: 0,
          comments: 0,
          metadata: {
            source_type: 'comment_on_own_post',
            post_id: post.id,
            post_content: post.message || '',
            post_url: post.permalink_url || null,
            sentiment: sentiment.label,
            sentiment_score: sentiment.score,
            sentiment_explanation: sentiment.explanation,
          },
        });
        if (!error) result.mentions_created++;
      }
    }

    // 3. Menciones externas: posts de terceros que etiquetaron la página
    try {
      const taggedRes = await fetch(
        `${GRAPH_API}/${pageId}/tagged?` +
          `fields=id,message,from,created_time,permalink_url&` +
          `limit=${opts.maxExternalMentions}&access_token=${pageAccessToken}`
      );
      if (taggedRes.ok) {
        const taggedData = await taggedRes.json();
        const tagged = taggedData.data || [];
        for (const t of tagged) {
          const url = t.permalink_url || `https://facebook.com/${t.id}`;
          const { data: existing } = await supabase
            .from('mentions')
            .select('id')
            .eq('user_id', userId)
            .eq('platform', 'facebook')
            .eq('url', url)
            .maybeSingle();
          if (existing) continue;

          const sentiment = await analyzeSentimentAI(t.message || '');
          const { error } = await supabase.from('mentions').insert({
            user_id: userId,
            platform: 'facebook',
            author_username: t.from?.id || null,
            author_name: t.from?.name || 'Facebook User',
            content: t.message || '',
            url,
            published_at: t.created_time,
            likes: 0,
            shares: 0,
            comments: 0,
            metadata: {
              source_type: 'external_tagged_post',
              sentiment: sentiment.label,
              sentiment_score: sentiment.score,
              sentiment_explanation: sentiment.explanation,
            },
          });
          if (!error) result.external_mentions_created++;
        }
      }
    } catch (taggedErr) {
      // El endpoint /tagged puede requerir permisos adicionales — no falla el sync.
      console.warn('[sync-facebook] tagged endpoint falló, continuando:', (taggedErr as Error).message);
    }

    // 4. Actualizar social_media
    const avgEngagement = posts.length > 0 ? engagementTotal / posts.length : 0;
    result.followers = page.followers_count || page.fan_count || 0;
    result.engagement = avgEngagement;

    const fbMetrics = supabase
      .from('social_media')
      .update({
        connected: true,
        followers: result.followers,
        posts: posts.length,
        engagement: avgEngagement,
        last_sync: new Date().toISOString(),
      });
    // Escribir SOLO en la fila de esta cuenta si se conoce su id (multi-cuenta).
    await (opts.socialAccountId
      ? fbMetrics.eq('id', opts.socialAccountId)
      : fbMetrics.eq('user_id', userId).eq('platform', 'facebook'));

    // Notificaciones automáticas si hay menciones nuevas relevantes
    const totalNew = result.mentions_created + result.external_mentions_created;
    if (totalNew > 0) {
      const sinceIso = new Date(start - 1000).toISOString();
      const { data: fresh } = await supabase
        .from('mentions')
        .select('content, url, metadata')
        .eq('user_id', userId)
        .eq('platform', 'facebook')
        .gte('scraped_at', sinceIso);
      if (fresh && fresh.length > 0) {
        await notifyFromMentions({ userId, platform: 'facebook', mentions: fresh as any });
      }
    }

    result.success = true;
  } catch (err: any) {
    result.error = err?.message || String(err);
  }

  result.duration_ms = Date.now() - start;
  return result;
}
