import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

/**
 * Dashboard de X/Twitter - Datos consolidados para visualización
 *
 * GET /api/x/dashboard
 *
 * Retorna:
 * - Métricas del perfil (seguidores, tweets, engagement)
 * - Análisis de sentimiento agregado
 * - Menciones y replies recientes
 * - Tendencias temporales
 * - Top tweets por engagement
 * - Distribución de reacciones
 * - Score de reputación
 */

export async function GET(request: NextRequest) {
  try {
    console.log('📊 X/Twitter Dashboard: Generando datos...');

    // Autenticar usuario
    const cookieStore = cookies();
    const authToken = cookieStore.get('auth-token')?.value;

    if (!authToken) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(authToken, process.env.JWT_SECRET!) as any;
    const userId = decoded.userId;

    const { supabase } = await import('@/lib/supabase-server');

    // 1. Obtener datos de social_media
    // Cuenta conectada más reciente. Evita `.single()` (falla con 0 o varias filas).
    const { data: socialRows } = await supabase
      .from('social_media')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', 'x')
      .eq('connected', true)
      .order('last_sync', { ascending: false, nullsFirst: false });

    const socialMedia = (socialRows || [])[0];

    if (!socialMedia) {
      return NextResponse.json(
        { success: false, error: 'X/Twitter no está conectado' },
        { status: 400 }
      );
    }

    // 2. Obtener user_stats
    const { data: userStats } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    // 3. Obtener menciones recientes
    const { data: recentMentions } = await supabase
      .from('mentions')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', 'x')
      .order('published_at', { ascending: false })
      .limit(50);

    // 4. Obtener histórico de métricas
    const { data: metricsHistory } = await supabase
      .from('social_metrics_history')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', 'x')
      .order('date', { ascending: true })
      .limit(30);

    // 5. Calcular métricas agregadas
    const mentions = recentMentions || [];
    const totalMentions = mentions.length;

    // Análisis de sentimiento
    const positiveMentions = mentions.filter(
      m => m.metadata?.sentiment === 'positive'
    ).length;
    const negativeMentions = mentions.filter(
      m => m.metadata?.sentiment === 'negative'
    ).length;
    const neutralMentions = totalMentions - positiveMentions - negativeMentions;

    const avgSentimentScore = totalMentions > 0
      ? mentions.reduce((sum, m) => {
          const score = m.metadata?.sentiment_score || 0;
          return sum + score;
        }, 0) / totalMentions
      : 0;

    // Top menciones por likes
    const topPositiveMentions = mentions
      .filter(m => m.metadata?.sentiment === 'positive')
      .sort((a, b) => (b.likes || 0) - (a.likes || 0))
      .slice(0, 5);

    const topNegativeMentions = mentions
      .filter(m => m.metadata?.sentiment === 'negative')
      .sort((a, b) => (b.likes || 0) - (a.likes || 0))
      .slice(0, 5);

    // Tendencias temporales (últimos 7 días)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    const trendData = last7Days.map(date => {
      const dayMentions = mentions.filter(m => {
        const mentionDate = new Date(m.published_at).toISOString().split('T')[0];
        return mentionDate === date;
      });

      const dayPositive = dayMentions.filter(m => m.metadata?.sentiment === 'positive').length;
      const dayNegative = dayMentions.filter(m => m.metadata?.sentiment === 'negative').length;

      return {
        date,
        total: dayMentions.length,
        positive: dayPositive,
        negative: dayNegative,
        neutral: dayMentions.length - dayPositive - dayNegative
      };
    });

    // Tweets más comentados
    const tweetStats: { [key: string]: any } = {};

    mentions.forEach(m => {
      const tweetId = m.metadata?.tweet_id;
      if (tweetId) {
        if (!tweetStats[tweetId]) {
          tweetStats[tweetId] = {
            tweet_id: tweetId,
            tweet_content: m.metadata?.tweet_content || 'Sin contenido',
            total_replies: 0,
            positive_replies: 0,
            negative_replies: 0,
            neutral_replies: 0,
            avg_sentiment: 0,
            total_likes: 0,
            total_retweets: 0
          };
        }

        tweetStats[tweetId].total_replies++;
        tweetStats[tweetId].total_likes += (m.likes || 0);
        tweetStats[tweetId].total_retweets += (m.shares || 0);

        if (m.metadata?.sentiment === 'positive') tweetStats[tweetId].positive_replies++;
        else if (m.metadata?.sentiment === 'negative') tweetStats[tweetId].negative_replies++;
        else tweetStats[tweetId].neutral_replies++;
      }
    });

    const topTweets = Object.values(tweetStats)
      .map(tweet => ({
        ...tweet,
        avg_sentiment: tweet.total_replies > 0
          ? ((tweet.positive_replies - tweet.negative_replies) / tweet.total_replies) * 100
          : 0
      }))
      .sort((a, b) => b.total_replies - a.total_replies)
      .slice(0, 10);

    // Score de reputación (0-100)
    const sentimentWeight = 0.4; // 40%
    const engagementWeight = 0.3; // 30%
    const growthWeight = 0.3; // 30%

    const sentimentScore = totalMentions > 0
      ? ((positiveMentions / totalMentions) * 100)
      : 50;

    const engagementScore = Math.min((socialMedia.engagement || 0) * 100, 100);

    const reputationScore = Math.round(
      sentimentScore * sentimentWeight +
      engagementScore * engagementWeight +
      50 * growthWeight // Placeholder para growth
    );

    // 6. Construir respuesta
    const dashboard = {
      success: true,
      data: {
        // Información del perfil
        profile: {
          id: socialMedia.username || 'unknown',
          name: socialMedia.display_name || 'Perfil de X',
          url: socialMedia.profile_url || '',
          followers: socialMedia.followers || 0,
          total_tweets: socialMedia.posts || 0,
          engagement_rate: socialMedia.engagement || 0,
          last_sync: socialMedia.last_sync,
          connected: socialMedia.connected
        },

        // Métricas principales
        overview: {
          reputation_score: reputationScore,
          total_mentions: totalMentions,
          positive_mentions: positiveMentions,
          negative_mentions: negativeMentions,
          neutral_mentions: neutralMentions,
          avg_sentiment_score: parseFloat(avgSentimentScore.toFixed(2)),
          reach_estimate: userStats?.reach_estimate || 0,
          engagement_rate: socialMedia.engagement || 0,
          influence_score: userStats?.influence_score || 0
        },

        // Distribución de sentimientos
        sentiment_distribution: {
          positive_percentage: totalMentions > 0
            ? (positiveMentions / totalMentions) * 100
            : 0,
          negative_percentage: totalMentions > 0
            ? (negativeMentions / totalMentions) * 100
            : 0,
          neutral_percentage: totalMentions > 0
            ? (neutralMentions / totalMentions) * 100
            : 0
        },

        // Tendencias temporales
        trends: {
          last_7_days: trendData,
          total_change: trendData.length >= 2
            ? trendData[trendData.length - 1].total - trendData[0].total
            : 0,
          sentiment_trend: avgSentimentScore > 0 ? 'improving' : avgSentimentScore < 0 ? 'declining' : 'stable'
        },

        // Top menciones
        top_mentions: {
          most_positive: topPositiveMentions.map(m => ({
            text: m.content,
            author: m.author_name,
            likes: m.likes,
            retweets: m.shares,
            url: m.url,
            published_at: m.published_at,
            tweet_content: m.metadata?.tweet_content
          })),
          most_negative: topNegativeMentions.map(m => ({
            text: m.content,
            author: m.author_name,
            likes: m.likes,
            retweets: m.shares,
            url: m.url,
            published_at: m.published_at,
            tweet_content: m.metadata?.tweet_content
          }))
        },

        // Top tweets por engagement
        top_tweets: topTweets,

        // Menciones recientes (últimas 20)
        recent_mentions: mentions.slice(0, 40).map(m => ({
          id: m.id,
          content: m.content,
          author: m.author_name,
          sentiment: m.metadata?.sentiment || 'neutral',
          sentiment_score: m.metadata?.sentiment_score || 0,
          source_type: m.metadata?.source_type || null,
          likes: m.likes,
          retweets: m.shares,
          replies: m.comments,
          url: m.url,
          published_at: m.published_at,
          tweet_content: m.metadata?.tweet_content
        })),

        // Histórico de métricas
        metrics_history: (metricsHistory || []).map(h => ({
          date: h.date,
          followers: h.followers,
          engagement_rate: h.engagement_rate,
          sentiment_score: h.sentiment_score,
          reach_estimate: h.reach_estimate
        })),

        // Metadata
        generated_at: new Date().toISOString(),
        data_freshness: socialMedia.last_sync
          ? Math.round((new Date().getTime() - new Date(socialMedia.last_sync).getTime()) / (1000 * 60))
          : null // minutos desde última sincronización
      }
    };

    console.log('✅ Dashboard de X/Twitter generado exitosamente');

    return NextResponse.json(dashboard);

  } catch (error: any) {
    console.error('❌ Error generando dashboard de X/Twitter:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
