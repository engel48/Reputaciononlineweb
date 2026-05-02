import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helper';
import { supabase } from '@/lib/supabase-server';

/**
 * Endpoint del dashboard que devuelve resumen de social listening:
 *  - Plataformas sociales conectadas del usuario (de social_media)
 *  - Menciones recientes capturadas (de mentions, ultimos N dias)
 *  - Distribucion de sentimiento agregado por plataforma
 *  - Top hashtags / palabras clave de las menciones
 *
 * Reemplaza los antiguos /api/social-listening/sync y /analysis que usaban
 * Prisma con un schema desactualizado.
 *
 * GET /api/dashboard/social-listening?days=7
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const userId = auth.userId;

  const { searchParams } = new URL(request.url);
  const daysParam = parseInt(searchParams.get('days') || '7', 10);
  const days = Number.isFinite(daysParam) && daysParam > 0 && daysParam <= 90 ? daysParam : 7;

  // 1. Plataformas conectadas del usuario
  const { data: socials, error: socialErr } = await supabase
    .from('social_media')
    .select('id, platform, username, display_name, followers, following, posts, engagement, connected, last_sync, profile_url, profile_image')
    .eq('user_id', userId)
    .eq('connected', true)
    .order('platform', { ascending: true });

  if (socialErr) {
    console.error('[GET /api/dashboard/social-listening] socials error:', socialErr);
    return NextResponse.json({ error: 'Error consultando redes conectadas' }, { status: 500 });
  }

  const connectedPlatforms = socials || [];

  // 2. Menciones recientes (ultimos N dias)
  const sinceIso = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data: mentions, error: mentionsErr } = await supabase
    .from('mentions')
    .select('id, platform, author_username, author_name, author_followers, content, url, published_at, scraped_at, likes, shares, comments, reach_estimate, hashtags, metadata')
    .eq('user_id', userId)
    .gte('scraped_at', sinceIso)
    .order('published_at', { ascending: false })
    .limit(200);

  if (mentionsErr) {
    console.error('[GET /api/dashboard/social-listening] mentions error:', mentionsErr);
    return NextResponse.json({ error: 'Error consultando menciones' }, { status: 500 });
  }

  const allMentions = mentions || [];

  // 3. Agregaciones globales
  const totalFollowers = connectedPlatforms.reduce((acc, s: any) => acc + (s.followers || 0), 0);
  const totalMentions = allMentions.length;
  const totalEngagement = allMentions.reduce(
    (acc, m: any) => acc + (m.likes || 0) + (m.shares || 0) + (m.comments || 0),
    0
  );
  const totalReach = allMentions.reduce((acc, m: any) => acc + (m.reach_estimate || 0), 0);

  // 4. Sentiment distribution global (de metadata.sentiment)
  let pos = 0, neg = 0, neu = 0;
  let scoreSum = 0;
  let scoreCount = 0;
  for (const m of allMentions as any[]) {
    const s = String(m.metadata?.sentiment || '').toLowerCase();
    if (s === 'positive') pos++;
    else if (s === 'negative') neg++;
    else if (s === 'neutral') neu++;

    const score = m.metadata?.sentiment_score;
    if (typeof score === 'number') {
      scoreSum += score;
      scoreCount++;
    }
  }
  const totalClassified = pos + neg + neu;
  const sentimentDistribution = {
    positive: totalClassified > 0 ? Math.round((pos / totalClassified) * 100) : 0,
    neutral: totalClassified > 0 ? Math.round((neu / totalClassified) * 100) : 0,
    negative: totalClassified > 0 ? Math.round((neg / totalClassified) * 100) : 0,
  };
  const overallSentiment = scoreCount > 0 ? Math.round(scoreSum / scoreCount) : 50;

  // 5. Por plataforma (combina datos de social_media + mentions del lapso)
  const platformAnalysis = connectedPlatforms.map((s: any) => {
    const platMentions = allMentions.filter((m: any) => m.platform === s.platform);
    let pPos = 0, pNeg = 0, pNeu = 0;
    let pScoreSum = 0, pScoreCount = 0;
    for (const m of platMentions as any[]) {
      const sent = String(m.metadata?.sentiment || '').toLowerCase();
      if (sent === 'positive') pPos++;
      else if (sent === 'negative') pNeg++;
      else if (sent === 'neutral') pNeu++;
      const score = m.metadata?.sentiment_score;
      if (typeof score === 'number') {
        pScoreSum += score;
        pScoreCount++;
      }
    }
    const pTotal = pPos + pNeg + pNeu;
    return {
      platform: s.platform,
      username: s.username || '',
      displayName: s.display_name || s.username || '',
      profileUrl: s.profile_url || '',
      profileImage: s.profile_image || null,
      followers: s.followers || 0,
      following: s.following || 0,
      posts: s.posts || 0,
      engagement: typeof s.engagement === 'number' ? s.engagement : 0,
      lastSync: s.last_sync,
      mentionsInPeriod: platMentions.length,
      sentimentDistribution: {
        positive: pTotal > 0 ? Math.round((pPos / pTotal) * 100) : 0,
        neutral: pTotal > 0 ? Math.round((pNeu / pTotal) * 100) : 0,
        negative: pTotal > 0 ? Math.round((pNeg / pTotal) * 100) : 0,
      },
      averageScore: pScoreCount > 0 ? Math.round(pScoreSum / pScoreCount) : 50,
      recentMentions: platMentions.slice(0, 5).map((m: any) => ({
        id: m.id,
        content: String(m.content || '').slice(0, 280),
        url: m.url,
        author: m.author_name || m.author_username || 'Anonimo',
        authorFollowers: m.author_followers || 0,
        publishedAt: m.published_at,
        likes: m.likes || 0,
        shares: m.shares || 0,
        comments: m.comments || 0,
        sentiment: m.metadata?.sentiment || 'neutral',
        sentimentScore: typeof m.metadata?.sentiment_score === 'number' ? m.metadata.sentiment_score : null,
      })),
    };
  });

  // 6. Top hashtags
  const hashtagCount = new Map<string, number>();
  for (const m of allMentions as any[]) {
    const tags: string[] = Array.isArray(m.hashtags) ? m.hashtags : [];
    for (const tag of tags) {
      const k = String(tag || '').trim().toLowerCase();
      if (k) hashtagCount.set(k, (hashtagCount.get(k) || 0) + 1);
    }
  }
  const topHashtags = Array.from(hashtagCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([tag, count]) => ({ tag, count }));

  return NextResponse.json({
    success: true,
    period: { days, since: sinceIso },
    summary: {
      connectedPlatforms: connectedPlatforms.length,
      totalFollowers,
      totalMentions,
      totalEngagement,
      totalReach,
      overallSentiment,
      sentimentDistribution,
      lastSync: connectedPlatforms.reduce((latest: string | null, s: any) => {
        if (!s.last_sync) return latest;
        if (!latest) return s.last_sync;
        return s.last_sync > latest ? s.last_sync : latest;
      }, null as string | null),
    },
    platforms: platformAnalysis,
    topHashtags,
  });
}
