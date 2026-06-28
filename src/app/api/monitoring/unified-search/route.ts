import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/auth-helper';

interface UnifiedResult {
  id: string;
  type: 'news' | 'social' | 'hashtag';
  platform: string;
  author?: string;
  title?: string;
  content: string;
  url?: string;
  imageUrl?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  sentimentScore?: number;
  engagement?: {
    likes?: number;
    shares?: number;
    comments?: number;
    views?: number;
  };
  createdAt: string;
  source?: string;
}

export async function GET(request: NextRequest) {
  try {
    // Aislamiento multiusuario: exigir sesión y filtrar SIEMPRE por el userId
    // del token verificado. Nunca confiar en un userId que venga por query.
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    const userId = auth.userId;

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const type = searchParams.get('type') || 'all'; // all, news, social, hashtags
    const platform = searchParams.get('platform'); // facebook, instagram, x, youtube, etc.
    const sentiment = searchParams.get('sentiment'); // positive, negative, neutral
    const limit = parseInt(searchParams.get('limit') || '50');

    console.log('🔍 UNIFIED SEARCH API:', { query, type, platform, sentiment, limit });

    const results: UnifiedResult[] = [];

    // Buscar en noticias
    if (type === 'all' || type === 'news') {
      try {
        let newsQuery = supabase
          .from('news_mentions')
          .select('*')
          .order('published_at', { ascending: false })
          .limit(limit);

        if (query) {
          newsQuery = newsQuery.or(`title.ilike.%${query}%,content.ilike.%${query}%,source.ilike.%${query}%`);
        }

        if (sentiment) {
          newsQuery = newsQuery.eq('sentiment', sentiment);
        }

        // Aislamiento: solo noticias del usuario autenticado
        newsQuery = newsQuery.eq('user_id', userId);

        const { data: newsData, error: newsError } = await newsQuery;

        if (!newsError && newsData) {
          newsData.forEach((item: any) => {
            results.push({
              id: item.id,
              type: 'news',
              platform: 'news',
              author: item.source || 'Medio de comunicación',
              title: item.title,
              content: item.content || item.summary || '',
              url: item.url,
              imageUrl: item.image_url,
              sentiment: item.sentiment as 'positive' | 'negative' | 'neutral',
              sentimentScore: item.sentiment_score,
              engagement: {
                shares: item.shares || 0,
                comments: item.comments || 0
              },
              createdAt: item.published_at || item.created_at,
              source: item.source
            });
          });
        }
      } catch (e) {
        console.warn('Error buscando noticias:', e);
      }
    }

    // Buscar en menciones de redes sociales
    if (type === 'all' || type === 'social') {
      try {
        let socialQuery = supabase
          .from('mentions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (query) {
          socialQuery = socialQuery.or(`content.ilike.%${query}%,author.ilike.%${query}%,username.ilike.%${query}%`);
        }

        if (platform) {
          socialQuery = socialQuery.eq('platform', platform);
        }

        if (sentiment) {
          socialQuery = socialQuery.eq('sentiment', sentiment);
        }

        // Aislamiento: solo menciones del usuario autenticado
        socialQuery = socialQuery.eq('user_id', userId);

        const { data: socialData, error: socialError } = await socialQuery;

        if (!socialError && socialData) {
          socialData.forEach((item: any) => {
            results.push({
              id: item.id,
              type: 'social',
              platform: item.platform || 'unknown',
              author: item.author || item.username,
              content: item.content || item.text || '',
              url: item.url || item.post_url,
              imageUrl: item.image_url || item.profile_image,
              sentiment: item.sentiment as 'positive' | 'negative' | 'neutral',
              sentimentScore: item.sentiment_score,
              engagement: {
                likes: item.likes || item.like_count || 0,
                shares: item.shares || item.retweets || item.share_count || 0,
                comments: item.comments || item.reply_count || item.comment_count || 0,
                views: item.views || item.view_count || 0
              },
              createdAt: item.created_at || item.posted_at,
              source: item.platform
            });
          });
        }
      } catch (e) {
        console.warn('Error buscando menciones sociales:', e);
      }
    }

    // Buscar hashtags
    if (type === 'all' || type === 'hashtags') {
      try {
        // Buscar en la tabla de hashtags trackeados
        let hashtagQuery = supabase
          .from('hashtag_tracking')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (query) {
          // Limpiar el query de # si lo tiene
          const cleanQuery = query.replace(/^#/, '');
          hashtagQuery = hashtagQuery.ilike('hashtag', `%${cleanQuery}%`);
        }

        // Aislamiento: solo hashtags del usuario autenticado
        hashtagQuery = hashtagQuery.eq('user_id', userId);

        const { data: hashtagData, error: hashtagError } = await hashtagQuery;

        if (!hashtagError && hashtagData) {
          hashtagData.forEach((item: any) => {
            results.push({
              id: item.id,
              type: 'hashtag',
              platform: item.platform || 'multiple',
              author: `#${item.hashtag}`,
              title: `#${item.hashtag}`,
              content: item.description || `Hashtag trackeado: #${item.hashtag}`,
              sentiment: item.sentiment as 'positive' | 'negative' | 'neutral',
              sentimentScore: item.sentiment_score,
              engagement: {
                likes: item.total_likes || 0,
                shares: item.total_shares || 0,
                comments: item.total_comments || 0,
                views: item.total_views || item.mention_count || 0
              },
              createdAt: item.created_at,
              source: 'hashtag'
            });
          });
        }
      } catch (e) {
        console.warn('Error buscando hashtags:', e);
      }
    }

    // Ordenar resultados por fecha
    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Calcular estadísticas
    const stats = {
      total: results.length,
      byType: {
        news: results.filter(r => r.type === 'news').length,
        social: results.filter(r => r.type === 'social').length,
        hashtags: results.filter(r => r.type === 'hashtag').length
      },
      bySentiment: {
        positive: results.filter(r => r.sentiment === 'positive').length,
        negative: results.filter(r => r.sentiment === 'negative').length,
        neutral: results.filter(r => r.sentiment === 'neutral').length
      },
      byPlatform: results.reduce((acc: Record<string, number>, r) => {
        acc[r.platform] = (acc[r.platform] || 0) + 1;
        return acc;
      }, {})
    };

    console.log(`✅ UNIFIED SEARCH: ${results.length} resultados encontrados`);

    return NextResponse.json({
      success: true,
      data: {
        results: results.slice(0, limit),
        stats,
        query,
        type,
        platform,
        sentiment
      }
    });

  } catch (error: any) {
    console.error('❌ UNIFIED SEARCH API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error en búsqueda unificada' },
      { status: 500 }
    );
  }
}
