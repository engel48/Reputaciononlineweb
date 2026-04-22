import { decryptToken, isEncrypted } from '@/lib/encryption';
import { DEFAULT_SYNC_OPTIONS, SyncOptions, SyncResult } from './types';
import { analyzeSentimentBasic } from './sentiment';
import { notifyFromMentions } from './notifications';

const GRAPH_API = 'https://graph.facebook.com/v18.0';

/**
 * Sincroniza Instagram Business para un usuario:
 * - Posts propios y comentarios
 * - Menciones externas vía tagged_media
 *
 * Inserta en `mentions` y actualiza `social_media.last_sync` + `connected=true`.
 */
export async function syncInstagramMentions(
  userId: string,
  rawAccessToken: string,
  options: SyncOptions = {}
): Promise<SyncResult> {
  const start = Date.now();
  const opts = { ...DEFAULT_SYNC_OPTIONS, ...options };
  const result: SyncResult = {
    platform: 'instagram',
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

    // 1. Resolver Instagram Business Account via Facebook Page
    const accountsRes = await fetch(
      `${GRAPH_API}/me/accounts?fields=id,access_token&access_token=${accessToken}`
    );
    if (!accountsRes.ok) {
      throw new Error(`Instagram accounts error: ${accountsRes.status}`);
    }
    const accountsData = await accountsRes.json();
    const pages = accountsData.data || [];
    if (pages.length === 0) {
      throw new Error('No hay páginas de Facebook vinculadas');
    }

    const page = pages[0];
    const pageAccessToken = page.access_token;
    const igRes = await fetch(
      `${GRAPH_API}/${page.id}?fields=instagram_business_account&access_token=${pageAccessToken}`
    );
    const igData = await igRes.json();
    const igId = igData.instagram_business_account?.id;
    if (!igId) {
      throw new Error('No hay cuenta de Instagram Business vinculada');
    }

    // 2. Perfil IG (followers, media_count)
    const profileRes = await fetch(
      `${GRAPH_API}/${igId}?fields=username,followers_count,media_count&access_token=${pageAccessToken}`
    );
    const profileData = profileRes.ok ? await profileRes.json() : {};
    result.followers = profileData.followers_count || 0;

    const since = Math.floor(Date.now() / 1000) - opts.lookbackDays * 24 * 60 * 60;

    // 3. Posts propios + comentarios
    const mediaRes = await fetch(
      `${GRAPH_API}/${igId}/media?` +
        `fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count&` +
        `since=${since}&limit=${opts.maxPosts}&access_token=${pageAccessToken}`
    );
    if (!mediaRes.ok) {
      throw new Error(`Instagram media error: ${mediaRes.status}`);
    }
    const mediaData = await mediaRes.json();
    const posts = mediaData.data || [];
    result.posts_processed = posts.length;

    let engagementTotal = 0;
    for (const post of posts) {
      engagementTotal += post.like_count || 0;
      const commentsRes = await fetch(
        `${GRAPH_API}/${post.id}/comments?` +
          `fields=id,from,text,timestamp,like_count&` +
          `limit=${opts.maxCommentsPerPost}&access_token=${pageAccessToken}`
      );
      if (!commentsRes.ok) continue;
      const commentsData = await commentsRes.json();
      const comments = commentsData.data || [];
      result.comments_processed += comments.length;

      for (const c of comments) {
        const url = post.permalink || `https://instagram.com/p/${post.id}`;
        const authorKey = c.from?.id || c.id;
        const { data: existing } = await supabase
          .from('mentions')
          .select('id')
          .eq('user_id', userId)
          .eq('platform', 'instagram')
          .eq('url', url)
          .eq('author_username', authorKey)
          .maybeSingle();
        if (existing) continue;

        const sentiment = analyzeSentimentBasic(c.text || '');
        const { error } = await supabase.from('mentions').insert({
          user_id: userId,
          platform: 'instagram',
          author_username: authorKey,
          author_name: c.from?.username || 'Instagram User',
          content: c.text || '',
          url,
          published_at: c.timestamp,
          likes: c.like_count || 0,
          shares: 0,
          comments: 0,
          metadata: {
            source_type: 'comment_on_own_post',
            post_id: post.id,
            post_content: post.caption || '',
            media_type: post.media_type,
            media_url: post.media_url,
            sentiment: sentiment.label,
            sentiment_score: sentiment.score,
          },
        });
        if (!error) result.mentions_created++;
      }
    }

    // 4. Menciones externas: tagged_media
    try {
      const taggedRes = await fetch(
        `${GRAPH_API}/${igId}/tags?` +
          `fields=id,caption,media_type,permalink,timestamp,like_count,username&` +
          `limit=${opts.maxExternalMentions}&access_token=${pageAccessToken}`
      );
      if (taggedRes.ok) {
        const taggedData = await taggedRes.json();
        const tagged = taggedData.data || [];
        for (const t of tagged) {
          const url = t.permalink || `https://instagram.com/p/${t.id}`;
          const { data: existing } = await supabase
            .from('mentions')
            .select('id')
            .eq('user_id', userId)
            .eq('platform', 'instagram')
            .eq('url', url)
            .maybeSingle();
          if (existing) continue;

          const sentiment = analyzeSentimentBasic(t.caption || '');
          const { error } = await supabase.from('mentions').insert({
            user_id: userId,
            platform: 'instagram',
            author_username: t.username || null,
            author_name: t.username || 'Instagram User',
            content: t.caption || '',
            url,
            published_at: t.timestamp,
            likes: t.like_count || 0,
            shares: 0,
            comments: 0,
            metadata: {
              source_type: 'external_tagged_post',
              media_type: t.media_type,
              sentiment: sentiment.label,
              sentiment_score: sentiment.score,
            },
          });
          if (!error) result.external_mentions_created++;
        }
      }
    } catch (taggedErr) {
      console.warn('[sync-instagram] tags endpoint falló, continuando:', (taggedErr as Error).message);
    }

    // 5. Actualizar social_media
    const avgEngagement = posts.length > 0 ? engagementTotal / posts.length : 0;
    result.engagement = avgEngagement;

    await supabase
      .from('social_media')
      .update({
        connected: true,
        followers: result.followers,
        posts: posts.length || profileData.media_count || 0,
        engagement: avgEngagement,
        last_sync: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('platform', 'instagram');

    const totalNew = result.mentions_created + result.external_mentions_created;
    if (totalNew > 0) {
      const sinceIso = new Date(start - 1000).toISOString();
      const { data: fresh } = await supabase
        .from('mentions')
        .select('content, url, metadata')
        .eq('user_id', userId)
        .eq('platform', 'instagram')
        .gte('scraped_at', sinceIso);
      if (fresh && fresh.length > 0) {
        await notifyFromMentions({ userId, platform: 'instagram', mentions: fresh as any });
      }
    }

    result.success = true;
  } catch (err: any) {
    result.error = err?.message || String(err);
  }

  result.duration_ms = Date.now() - start;
  return result;
}
