import { decryptToken, isEncrypted } from '@/lib/encryption';
import { DEFAULT_SYNC_OPTIONS, SyncOptions, SyncResult } from './types';
import { analyzeSentimentBasic } from './sentiment';
import { notifyFromMentions } from './notifications';

const TWITTER_API = 'https://api.twitter.com/2';

interface TwitterUserLookup {
  id: string;
  name: string;
  username: string;
  public_metrics?: {
    followers_count?: number;
    following_count?: number;
    tweet_count?: number;
    listed_count?: number;
  };
}

/**
 * Sincroniza X/Twitter para un usuario:
 * - Tweets propios del user
 * - Menciones externas reales vía GET /2/users/{id}/mentions (endpoint oficial)
 *
 * Reemplaza el método incorrecto anterior basado en `conversation_id`.
 */
export async function syncTwitterMentions(
  userId: string,
  rawAccessToken: string,
  options: SyncOptions = {}
): Promise<SyncResult> {
  const start = Date.now();
  const opts = { ...DEFAULT_SYNC_OPTIONS, ...options };
  const result: SyncResult = {
    platform: 'x',
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

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    // 1. Identidad del usuario
    const meRes = await fetch(
      `${TWITTER_API}/users/me?user.fields=id,name,username,public_metrics`,
      { headers }
    );
    if (!meRes.ok) {
      throw new Error(`X /users/me error: ${meRes.status}`);
    }
    const meData = await meRes.json();
    const twitterUserId = meData.data?.id;
    const username = meData.data?.username;
    if (!twitterUserId) {
      throw new Error('No se pudo obtener el ID de usuario X');
    }
    result.followers = meData.data?.public_metrics?.followers_count || 0;

    const startTime = new Date(Date.now() - opts.lookbackDays * 24 * 60 * 60 * 1000).toISOString();

    // 2. Tweets propios
    const tweetsRes = await fetch(
      `${TWITTER_API}/users/${twitterUserId}/tweets?` +
        `tweet.fields=created_at,public_metrics,text&` +
        `start_time=${startTime}&max_results=${Math.min(opts.maxPosts, 100)}`,
      { headers }
    );
    if (!tweetsRes.ok) {
      throw new Error(`X /tweets error: ${tweetsRes.status}`);
    }
    const tweetsData = await tweetsRes.json();
    const tweets = tweetsData.data || [];
    result.posts_processed = tweets.length;

    let likesTotal = 0;
    let retweetsTotal = 0;
    for (const tweet of tweets) {
      likesTotal += tweet.public_metrics?.like_count || 0;
      retweetsTotal += tweet.public_metrics?.retweet_count || 0;
    }

    // 3. Menciones externas REALES: GET /2/users/:id/mentions
    const mentionsRes = await fetch(
      `${TWITTER_API}/users/${twitterUserId}/mentions?` +
        `tweet.fields=created_at,public_metrics,text,author_id,conversation_id&` +
        `expansions=author_id&user.fields=id,name,username,public_metrics&` +
        `start_time=${startTime}&max_results=${Math.min(opts.maxExternalMentions, 100)}`,
      { headers }
    );

    if (!mentionsRes.ok) {
      throw new Error(`X /mentions error: ${mentionsRes.status}`);
    }

    const mentionsData = await mentionsRes.json();
    const mentions = mentionsData.data || [];
    const authorMap = new Map<string, TwitterUserLookup>();
    for (const u of mentionsData.includes?.users || []) {
      authorMap.set(u.id, u);
    }
    result.comments_processed = mentions.length;

    for (const m of mentions) {
      const url = `https://twitter.com/i/web/status/${m.id}`;
      const { data: existing } = await supabase
        .from('mentions')
        .select('id')
        .eq('user_id', userId)
        .eq('platform', 'x')
        .eq('url', url)
        .maybeSingle();
      if (existing) continue;

      const author = authorMap.get(m.author_id);
      const sentiment = analyzeSentimentBasic(m.text || '');
      const metrics = m.public_metrics || {};

      const { error } = await supabase.from('mentions').insert({
        user_id: userId,
        platform: 'x',
        author_username: author?.username || m.author_id,
        author_name: author?.name || author?.username || m.author_id,
        author_followers: author?.public_metrics?.followers_count || 0,
        content: m.text || '',
        url,
        published_at: m.created_at,
        likes: metrics.like_count || 0,
        shares: metrics.retweet_count || 0,
        comments: metrics.reply_count || 0,
        metadata: {
          source_type: 'external_mention',
          tweet_id: m.id,
          conversation_id: m.conversation_id,
          quote_count: metrics.quote_count || 0,
          target_handle: username,
          sentiment: sentiment.label,
          sentiment_score: sentiment.score,
        },
      });
      if (!error) result.external_mentions_created++;
    }

    // 4. Actualizar social_media
    const avgEngagement = tweets.length > 0 ? (likesTotal + retweetsTotal) / tweets.length : 0;
    result.engagement = avgEngagement;

    await supabase
      .from('social_media')
      .update({
        connected: true,
        followers: result.followers,
        posts: tweets.length,
        engagement: avgEngagement,
        last_sync: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('platform', 'x');

    const totalNew = result.mentions_created + result.external_mentions_created;
    if (totalNew > 0) {
      const sinceIso = new Date(start - 1000).toISOString();
      const { data: fresh } = await supabase
        .from('mentions')
        .select('content, url, metadata')
        .eq('user_id', userId)
        .eq('platform', 'x')
        .gte('scraped_at', sinceIso);
      if (fresh && fresh.length > 0) {
        await notifyFromMentions({ userId, platform: 'x', mentions: fresh as any });
      }
    }

    result.success = true;
  } catch (err: any) {
    result.error = err?.message || String(err);
  }

  result.duration_ms = Date.now() - start;
  return result;
}
