import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

/**
 * X/Twitter Sync - Sincroniza tweets, menciones y métricas de X/Twitter
 *
 * POST /api/x/sync
 *
 * Body (opcional):
 * - maxPosts: número máximo de tweets a sincronizar (default: 20)
 * - maxCommentsPerPost: número máximo de replies por tweet (default: 50)
 * - lookbackDays: días hacia atrás para buscar tweets (default: 30)
 */

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 X/Twitter Sync: Iniciando sincronización...');

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

    // Parámetros de sincronización
    const body = await request.json().catch(() => ({}));
    const maxPosts = body.maxPosts || 20;
    const maxCommentsPerPost = body.maxCommentsPerPost || 50;
    const lookbackDays = body.lookbackDays || 30;

    const { supabase } = await import('@/lib/supabase-server');

    // 1. Obtener datos de conexión de X/Twitter
    const { data: socialMedia, error: socialMediaError } = await supabase
      .from('social_media')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', 'x')
      .single();

    if (socialMediaError || !socialMedia) {
      return NextResponse.json(
        { success: false, error: 'X/Twitter no está conectado' },
        { status: 400 }
      );
    }

    if (!socialMedia.access_token) {
      return NextResponse.json(
        { success: false, error: 'No hay access token disponible' },
        { status: 400 }
      );
    }

    console.log(`✅ Conexión encontrada para usuario: ${userId}`);

    // 2. Obtener información del usuario
    const meResponse = await fetch(
      'https://api.twitter.com/2/users/me?user.fields=id,name,username,public_metrics',
      {
        headers: {
          'Authorization': `Bearer ${socialMedia.access_token}`
        }
      }
    );

    if (!meResponse.ok) {
      const error = await meResponse.text();
      console.error('❌ Error obteniendo usuario:', error);
      return NextResponse.json(
        { success: false, error: 'Error obteniendo usuario de X/Twitter' },
        { status: 500 }
      );
    }

    const meData = await meResponse.json();
    const twitterUserId = meData.data.id;
    const username = meData.data.username;

    console.log(`🐦 Sincronizando perfil: @${username} (${twitterUserId})`);

    // 3. Obtener tweets del usuario
    const startTime = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString();
    const tweetsResponse = await fetch(
      `https://api.twitter.com/2/users/${twitterUserId}/tweets?` +
      `tweet.fields=created_at,public_metrics,text&` +
      `start_time=${startTime}&` +
      `max_results=${Math.min(maxPosts, 100)}`,
      {
        headers: {
          'Authorization': `Bearer ${socialMedia.access_token}`
        }
      }
    );

    if (!tweetsResponse.ok) {
      const error = await tweetsResponse.text();
      console.error('❌ Error obteniendo tweets:', error);
      return NextResponse.json(
        { success: false, error: 'Error obteniendo tweets de X/Twitter' },
        { status: 500 }
      );
    }

    const tweetsData = await tweetsResponse.json();
    const tweets = tweetsData.data || [];

    console.log(`📝 ${tweets.length} tweets encontrados`);

    let totalMentionsProcessed = 0;
    let totalMentionsCreated = 0;
    let totalLikes = 0;
    let totalRetweets = 0;

    // 4. Procesar cada tweet y obtener menciones
    for (const tweet of tweets) {
      const tweetId = tweet.id;
      const tweetText = tweet.text || '';
      const tweetCreatedAt = tweet.created_at;
      const metrics = tweet.public_metrics || {};

      const tweetLikes = metrics.like_count || 0;
      const tweetRetweets = metrics.retweet_count || 0;
      const tweetReplies = metrics.reply_count || 0;

      totalLikes += tweetLikes;
      totalRetweets += tweetRetweets;

      // Obtener menciones/replies del tweet
      const mentionsResponse = await fetch(
        `https://api.twitter.com/2/tweets/search/recent?` +
        `query=conversation_id:${tweetId}&` +
        `tweet.fields=created_at,author_id,public_metrics,text&` +
        `max_results=${Math.min(maxCommentsPerPost, 100)}`,
        {
          headers: {
            'Authorization': `Bearer ${socialMedia.access_token}`
          }
        }
      );

      if (!mentionsResponse.ok) {
        console.warn(`⚠️ No se pudieron obtener menciones del tweet ${tweetId}`);
        continue;
      }

      const mentionsData = await mentionsResponse.json();
      const mentions = mentionsData.data || [];

      totalMentionsProcessed += mentions.length;

      // 5. Analizar sentimiento y guardar menciones
      for (const mention of mentions) {
        const mentionText = mention.text || '';
        const mentionMetrics = mention.public_metrics || {};

        // Análisis básico de sentimiento
        const sentiment = analyzeSentiment(mentionText);

        // Verificar si ya existe la mención
        const { data: existingMention } = await supabase
          .from('mentions')
          .select('id')
          .eq('user_id', userId)
          .eq('platform', 'x')
          .eq('url', `https://twitter.com/i/web/status/${mention.id}`)
          .single();

        if (existingMention) {
          continue; // Ya existe, saltar
        }

        // Crear mención
        const { error: mentionError } = await supabase
          .from('mentions')
          .insert({
            user_id: userId,
            platform: 'x',
            author_username: mention.author_id,
            author_name: mention.author_id, // Se podría obtener el nombre con una llamada adicional
            content: mentionText,
            url: `https://twitter.com/i/web/status/${mention.id}`,
            published_at: mention.created_at,
            likes: mentionMetrics.like_count || 0,
            shares: mentionMetrics.retweet_count || 0,
            comments: mentionMetrics.reply_count || 0,
            metadata: {
              tweet_id: tweetId,
              tweet_content: tweetText,
              sentiment: sentiment.label,
              sentiment_score: sentiment.score
            }
          });

        if (!mentionError) {
          totalMentionsCreated++;
        }
      }
    }

    // 6. Actualizar métricas del perfil
    const avgEngagement = tweets.length > 0 ? (totalLikes + totalRetweets) / tweets.length : 0;

    const { error: updateError } = await supabase
      .from('social_media')
      .update({
        followers: meData.data.public_metrics?.followers_count || socialMedia.followers,
        posts: tweets.length,
        engagement: avgEngagement,
        last_sync: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('platform', 'x');

    if (updateError) {
      console.error('❌ Error actualizando métricas:', updateError);
    }

    console.log('✅ Sincronización de X/Twitter completada');

    return NextResponse.json({
      success: true,
      data: {
        posts_processed: tweets.length,
        comments_processed: totalMentionsProcessed,
        mentions_created: totalMentionsCreated,
        username: username
      },
      message: `Sincronización exitosa: ${totalMentionsCreated} nuevas menciones`
    });

  } catch (error: any) {
    console.error('❌ Error en X/Twitter sync:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Análisis básico de sentimiento
 */
function analyzeSentiment(text: string): { label: string; score: number } {
  const textLower = text.toLowerCase();

  const positiveWords = ['excelente', 'genial', 'increíble', 'amor', 'feliz', 'gracias', 'bueno', 'mejor', 'perfecto', '❤️', '👍', '😊', '🔥', '✨', 'great', 'awesome', 'love'];
  const negativeWords = ['malo', 'terrible', 'horrible', 'odio', 'pésimo', 'peor', 'nunca', 'decepción', '👎', '😠', '😡', 'hate', 'worst', 'awful'];

  let positiveCount = 0;
  let negativeCount = 0;

  positiveWords.forEach(word => {
    if (textLower.includes(word)) positiveCount++;
  });

  negativeWords.forEach(word => {
    if (textLower.includes(word)) negativeCount++;
  });

  if (positiveCount > negativeCount) {
    return { label: 'positive', score: Math.min(positiveCount * 25, 100) };
  } else if (negativeCount > positiveCount) {
    return { label: 'negative', score: -Math.min(negativeCount * 25, 100) };
  } else {
    return { label: 'neutral', score: 0 };
  }
}
