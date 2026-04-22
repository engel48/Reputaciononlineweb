/**
 * Dashboard Analytics - Real Data from Supabase
 *
 * GET /api/dashboard-analytics
 *
 * Headers: Authorization: Bearer {token}
 * Response: { success: true, data: {...}, generated_at: string }
 *
 * IMPORTANT: This endpoint returns REAL data from Supabase, not AI-generated data
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth-helper';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface DashboardAnalytics {
  mentions: {
    total: number;
    positive: number;
    negative: number;
    neutral: number;
    trend: string;
    byPlatform: {
      x: number;
      facebook: number;
      instagram: number;
      youtube: number;
      news: number;
    };
    recent: Array<{
      id: string;
      author: string;
      content: string;
      sentiment: 'positive' | 'negative' | 'neutral';
      date: string;
      platform: string;
    }>;
    timeSeries: Array<{
      date: string;
      value: number;
    }>;
  };
  reputation: {
    score: number;
    previousScore: number;
    trend: 'up' | 'down' | 'stable';
  };
  socialMedia: {
    connected: number;
    platforms: Array<{
      platform: string;
      followers: number;
      engagement: number;
      connected: boolean;
    }>;
  };
}

async function getRealAnalytics(userId: string): Promise<DashboardAnalytics & { no_data: boolean }> {
  // Get date ranges
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // 1. Get social media mentions from last 7 days
  const { data: mentions, error: mentionsError } = await supabase
    .from('mentions')
    .select('*')
    .eq('user_id', userId)
    .gte('scraped_at', sevenDaysAgo.toISOString())
    .order('scraped_at', { ascending: false });

  if (mentionsError) {
    console.error('Error fetching mentions:', mentionsError);
  }

  // 1b. Get previous-period mentions (7-14 days ago) for real trend calculation
  const { data: prevMentions } = await supabase
    .from('mentions')
    .select('id, metadata, content')
    .eq('user_id', userId)
    .gte('scraped_at', fourteenDaysAgo.toISOString())
    .lt('scraped_at', sevenDaysAgo.toISOString());

  // 2. Get news mentions from last 7 days
  const { data: newsMentions, error: newsError } = await supabase
    .from('news_mentions')
    .select('*')
    .eq('user_id', userId)
    .gte('discovered_at', sevenDaysAgo.toISOString())
    .order('discovered_at', { ascending: false });

  if (newsError) {
    console.error('Error fetching news mentions:', newsError);
  }

  // 3. Get user stats
  const { data: userStats } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  // 4. Get connected social media accounts
  const { data: socialAccounts } = await supabase
    .from('social_media')
    .select('platform, followers, engagement, connected')
    .eq('user_id', userId);

  // 5. Get sentiment analysis data
  const { data: sentimentData } = await supabase
    .from('sentiment_analysis')
    .select('sentiment_score, analyzed_at')
    .eq('user_id', userId)
    .gte('analyzed_at', sevenDaysAgo.toISOString());

  // Process social media mentions
  const socialMentions = mentions || [];
  const newsData = newsMentions || [];

  // Combine all mentions for counting
  const allMentions = [
    ...socialMentions.map(m => ({
      id: m.id,
      author: m.author_name || m.author_username || 'Unknown',
      content: m.content || '',
      sentiment: determineSentiment(m),
      date: m.scraped_at,
      platform: m.platform
    })),
    ...newsData.map(n => ({
      id: n.id,
      author: n.article_author || 'Unknown',
      content: n.mention_context || n.article_title || '',
      sentiment: n.sentiment || 'neutral' as const,
      date: n.discovered_at,
      platform: 'news'
    }))
  ];

  // Count by sentiment
  const positive = allMentions.filter(m => m.sentiment === 'positive').length;
  const negative = allMentions.filter(m => m.sentiment === 'negative').length;
  const neutral = allMentions.filter(m => m.sentiment === 'neutral').length;
  const total = allMentions.length;

  // Count by platform
  const byPlatform = {
    x: socialMentions.filter(m => m.platform === 'x' || m.platform === 'twitter').length,
    facebook: socialMentions.filter(m => m.platform === 'facebook').length,
    instagram: socialMentions.filter(m => m.platform === 'instagram').length,
    youtube: socialMentions.filter(m => m.platform === 'youtube').length,
    news: newsData.length
  };

  // Calculate time series (last 7 days)
  const timeSeries: Array<{ date: string; value: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const dayDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dayStr = dayDate.toISOString().split('T')[0];
    const dayMentions = allMentions.filter(m => {
      const mentionDate = new Date(m.date).toISOString().split('T')[0];
      return mentionDate === dayStr;
    }).length;
    timeSeries.push({ date: dayStr, value: dayMentions });
  }

  // Calculate trend
  const recentDays = timeSeries.slice(-3);
  const olderDays = timeSeries.slice(0, 4);
  const recentAvg = recentDays.reduce((sum, d) => sum + d.value, 0) / recentDays.length;
  const olderAvg = olderDays.reduce((sum, d) => sum + d.value, 0) / olderDays.length || 1;
  const percentChange = ((recentAvg - olderAvg) / olderAvg) * 100;

  let trend = 'stable';
  if (percentChange > 10) trend = 'up';
  else if (percentChange < -10) trend = 'down';

  // Calculate reputation score from REAL data only. If no data, return null/0 and
  // signal via `no_data` flag so the frontend can render an empty state instead of
  // fake numbers.
  let reputationScore = 0;
  if (sentimentData && sentimentData.length > 0) {
    const avgSentiment =
      sentimentData.reduce((sum, s) => sum + (s.sentiment_score || 0), 0) / sentimentData.length;
    reputationScore = Math.round(((avgSentiment + 100) / 200) * 100);
  } else if (total > 0) {
    reputationScore = Math.round((positive * 100 + neutral * 50 + negative * 0) / total);
  } else if (userStats?.sentiment_score != null) {
    reputationScore = Math.round(((userStats.sentiment_score + 100) / 200) * 100);
  }

  // Previous score calculated from real mentions of the PREVIOUS 7-day window.
  // No random jitter, no fake baseline.
  const prev = prevMentions || [];
  let previousScore = 0;
  if (prev.length > 0) {
    let prevPos = 0;
    let prevNeg = 0;
    let prevNeu = 0;
    for (const m of prev) {
      const s = determineSentiment(m);
      if (s === 'positive') prevPos++;
      else if (s === 'negative') prevNeg++;
      else prevNeu++;
    }
    previousScore = Math.round((prevPos * 100 + prevNeu * 50) / prev.length);
  }

  const accounts = socialAccounts || [];
  const connectedCount = accounts.filter((a) => a.connected).length;

  const noData = total === 0 && (prev?.length || 0) === 0 && accounts.length === 0;

  return {
    mentions: {
      total,
      positive,
      negative,
      neutral,
      trend: total === 0 ? '0.0%' : `${percentChange > 0 ? '+' : ''}${percentChange.toFixed(1)}%`,
      byPlatform,
      recent: allMentions.slice(0, 10).map((m) => ({
        ...m,
        sentiment: m.sentiment as 'positive' | 'negative' | 'neutral',
      })),
      timeSeries,
    },
    reputation: {
      score: reputationScore,
      previousScore,
      trend:
        reputationScore > previousScore
          ? 'up'
          : reputationScore < previousScore
          ? 'down'
          : 'stable',
    },
    socialMedia: {
      connected: connectedCount,
      platforms: accounts.map((a) => ({
        platform: a.platform,
        followers: a.followers || 0,
        engagement: a.engagement || 0,
        connected: a.connected || false,
      })),
    },
    no_data: noData,
  };
}

// Helper function to determine sentiment from mention metadata
function determineSentiment(mention: any): 'positive' | 'negative' | 'neutral' {
  // Check if there's a sentiment field in metadata
  if (mention.metadata?.sentiment) {
    return mention.metadata.sentiment;
  }

  // Check for sentiment_score in metadata
  if (mention.metadata?.sentiment_score !== undefined) {
    const score = mention.metadata.sentiment_score;
    if (score > 0.3) return 'positive';
    if (score < -0.3) return 'negative';
    return 'neutral';
  }

  // Simple keyword-based analysis as fallback
  const content = (mention.content || '').toLowerCase();
  const positiveWords = ['excelente', 'bueno', 'genial', 'increíble', 'feliz', 'gracias', 'great', 'good', 'excellent', 'happy', 'love'];
  const negativeWords = ['malo', 'terrible', 'horrible', 'peor', 'odio', 'bad', 'terrible', 'hate', 'worst', 'awful'];

  const hasPositive = positiveWords.some(w => content.includes(w));
  const hasNegative = negativeWords.some(w => content.includes(w));

  if (hasPositive && !hasNegative) return 'positive';
  if (hasNegative && !hasPositive) return 'negative';
  return 'neutral';
}

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult; // Error 401
    }

    console.log('📊 Fetching real analytics from Supabase for user:', authResult.userId);

    const analytics = await getRealAnalytics(authResult.userId);

    console.log(`✅ Analytics fetched: ${analytics.mentions.total} total mentions, ${analytics.socialMedia.connected} connected platforms`);

    return NextResponse.json({
      success: true,
      data: analytics,
      no_data: analytics.no_data,
      generated_at: new Date().toISOString(),
      source: 'supabase_realtime'
    });

  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al obtener analytics',
      details: error?.message || 'Error desconocido'
    }, { status: 500 });
  }
}
