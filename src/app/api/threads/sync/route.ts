import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

/**
 * Threads Sync - Sincroniza threads, replies y métricas de Threads
 *
 * POST /api/threads/sync
 *
 * Body (opcional):
 * - maxPosts: número máximo de threads a sincronizar (default: 20)
 * - maxCommentsPerPost: número máximo de replies por thread (default: 50)
 * - lookbackDays: días hacia atrás para buscar threads (default: 30)
 */

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Threads Sync: Iniciando sincronización...');

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

    // 1. Obtener datos de conexión de Threads
    const { data: socialMedia, error: socialMediaError } = await supabase
      .from('social_media')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', 'threads')
      .single();

    if (socialMediaError || !socialMedia) {
      return NextResponse.json(
        { success: false, error: 'Threads no está conectado' },
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

    // 2. Obtener información del usuario de Threads
    const meResponse = await fetch(
      'https://graph.threads.net/v1.0/me?fields=id,username,threads_profile_picture_url,threads_biography',
      {
        headers: {
          'Authorization': `Bearer ${socialMedia.access_token}`
        }
      }
    );

    if (!meResponse.ok) {
      const error = await meResponse.text();
      console.error('❌ Error obteniendo perfil:', error);
      return NextResponse.json(
        { success: false, error: 'Error obteniendo perfil de Threads' },
        { status: 500 }
      );
    }

    const meData = await meResponse.json();
    const threadsUserId = meData.id;
    const username = meData.username;

    console.log(`🧵 Sincronizando perfil: @${username} (${threadsUserId})`);

    // 3. Obtener threads del usuario
    const since = Math.floor(Date.now() / 1000) - (lookbackDays * 24 * 60 * 60);
    const threadsResponse = await fetch(
      `https://graph.threads.net/v1.0/me/threads?` +
      `fields=id,text,timestamp,like_count,reply_count&` +
      `since=${since}&` +
      `limit=${maxPosts}`,
      {
        headers: {
          'Authorization': `Bearer ${socialMedia.access_token}`
        }
      }
    );

    if (!threadsResponse.ok) {
      const error = await threadsResponse.text();
      console.error('❌ Error obteniendo threads:', error);
      return NextResponse.json(
        { success: false, error: 'Error obteniendo threads de Threads' },
        { status: 500 }
      );
    }

    const threadsData = await threadsResponse.json();
    const threads = threadsData.data || [];

    console.log(`📝 ${threads.length} threads encontrados`);

    let totalRepliesProcessed = 0;
    let totalMentionsCreated = 0;
    let totalLikes = 0;

    // 4. Procesar cada thread y sus replies
    for (const thread of threads) {
      const threadId = thread.id;
      const threadText = thread.text || '';
      const threadTimestamp = thread.timestamp;
      const threadLikes = thread.like_count || 0;
      const threadReplies = thread.reply_count || 0;

      totalLikes += threadLikes;

      // Obtener replies del thread
      const repliesResponse = await fetch(
        `https://graph.threads.net/v1.0/${threadId}/replies?` +
        `fields=id,text,timestamp,username,like_count&` +
        `limit=${maxCommentsPerPost}`,
        {
          headers: {
            'Authorization': `Bearer ${socialMedia.access_token}`
          }
        }
      );

      if (!repliesResponse.ok) {
        console.warn(`⚠️ No se pudieron obtener replies del thread ${threadId}`);
        continue;
      }

      const repliesData = await repliesResponse.json();
      const replies = repliesData.data || [];

      totalRepliesProcessed += replies.length;

      // 5. Analizar sentimiento y guardar replies
      for (const reply of replies) {
        const replyText = reply.text || '';
        const replyUsername = reply.username || 'unknown';

        // Análisis básico de sentimiento
        const sentiment = analyzeSentiment(replyText);

        // Verificar si ya existe el reply
        const { data: existingMention } = await supabase
          .from('mentions')
          .select('id')
          .eq('user_id', userId)
          .eq('platform', 'threads')
          .eq('url', `https://www.threads.net/@${username}/post/${threadId}`)
          .eq('author_username', replyUsername)
          .single();

        if (existingMention) {
          continue; // Ya existe, saltar
        }

        // Crear mención
        const { error: mentionError } = await supabase
          .from('mentions')
          .insert({
            user_id: userId,
            platform: 'threads',
            author_username: replyUsername,
            author_name: replyUsername,
            content: replyText,
            url: `https://www.threads.net/@${username}/post/${threadId}`,
            published_at: reply.timestamp || new Date().toISOString(),
            likes: reply.like_count || 0,
            shares: 0,
            comments: 0,
            metadata: {
              thread_id: threadId,
              thread_content: threadText,
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
    const avgEngagement = threads.length > 0 ? totalLikes / threads.length : 0;

    const { error: updateError } = await supabase
      .from('social_media')
      .update({
        posts: threads.length,
        engagement: avgEngagement,
        last_sync: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('platform', 'threads');

    if (updateError) {
      console.error('❌ Error actualizando métricas:', updateError);
    }

    console.log('✅ Sincronización de Threads completada');

    return NextResponse.json({
      success: true,
      data: {
        posts_processed: threads.length,
        comments_processed: totalRepliesProcessed,
        mentions_created: totalMentionsCreated,
        username: username
      },
      message: `Sincronización exitosa: ${totalMentionsCreated} nuevas replies`
    });

  } catch (error: any) {
    console.error('❌ Error en Threads sync:', error);
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

  const positiveWords = ['excelente', 'genial', 'increíble', 'amor', 'feliz', 'gracias', 'bueno', 'mejor', 'perfecto', '❤️', '👍', '😊', '🔥', '✨'];
  const negativeWords = ['malo', 'terrible', 'horrible', 'odio', 'pésimo', 'peor', 'nunca', 'decepción', '👎', '😠', '😡'];

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
