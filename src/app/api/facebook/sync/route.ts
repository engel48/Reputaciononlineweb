import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

/**
 * Facebook Sync - Sincroniza posts, comentarios y métricas de Facebook
 *
 * POST /api/facebook/sync
 *
 * Body (opcional):
 * - maxPosts: número máximo de posts a sincronizar (default: 20)
 * - maxCommentsPerPost: número máximo de comentarios por post (default: 50)
 * - lookbackDays: días hacia atrás para buscar posts (default: 30)
 */

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Facebook Sync: Iniciando sincronización...');

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

    // 1. Obtener datos de conexión de Facebook
    const { data: socialMedia, error: socialMediaError } = await supabase
      .from('social_media')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', 'facebook')
      .single();

    if (socialMediaError || !socialMedia) {
      return NextResponse.json(
        { success: false, error: 'Facebook no está conectado' },
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

    // 2. Obtener páginas del usuario
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${socialMedia.access_token}`
    );

    if (!pagesResponse.ok) {
      const error = await pagesResponse.text();
      console.error('❌ Error obteniendo páginas:', error);
      return NextResponse.json(
        { success: false, error: 'Error obteniendo páginas de Facebook' },
        { status: 500 }
      );
    }

    const pagesData = await pagesResponse.json();
    const pages = pagesData.data || [];

    if (pages.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No se encontraron páginas de Facebook' },
        { status: 400 }
      );
    }

    // Usar la primera página
    const page = pages[0];
    const pageAccessToken = page.access_token;
    const pageId = page.id;

    console.log(`📄 Sincronizando página: ${page.name} (${pageId})`);

    // 3. Obtener posts de la página
    const since = Math.floor(Date.now() / 1000) - (lookbackDays * 24 * 60 * 60);
    const postsResponse = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/posts?` +
      `fields=id,message,created_time,likes.summary(true),comments.summary(true),shares&` +
      `since=${since}&` +
      `limit=${maxPosts}&` +
      `access_token=${pageAccessToken}`
    );

    if (!postsResponse.ok) {
      const error = await postsResponse.text();
      console.error('❌ Error obteniendo posts:', error);
      return NextResponse.json(
        { success: false, error: 'Error obteniendo posts de Facebook' },
        { status: 500 }
      );
    }

    const postsData = await postsResponse.json();
    const posts = postsData.data || [];

    console.log(`📝 ${posts.length} posts encontrados`);

    let totalCommentsProcessed = 0;
    let totalMentionsCreated = 0;

    // 4. Procesar cada post y sus comentarios
    for (const post of posts) {
      const postId = post.id;
      const postMessage = post.message || '';
      const postCreatedTime = post.created_time;
      const postLikes = post.likes?.summary?.total_count || 0;
      const postShares = post.shares?.count || 0;

      // Obtener comentarios del post
      const commentsResponse = await fetch(
        `https://graph.facebook.com/v18.0/${postId}/comments?` +
        `fields=id,from,message,created_time,like_count&` +
        `limit=${maxCommentsPerPost}&` +
        `access_token=${pageAccessToken}`
      );

      if (!commentsResponse.ok) {
        console.warn(`⚠️ No se pudieron obtener comentarios del post ${postId}`);
        continue;
      }

      const commentsData = await commentsResponse.json();
      const comments = commentsData.data || [];

      totalCommentsProcessed += comments.length;

      // 5. Analizar sentimiento y guardar comentarios
      for (const comment of comments) {
        const commentText = comment.message || '';

        // Análisis básico de sentimiento (se puede mejorar con IA)
        const sentiment = analyzeSentiment(commentText);

        // Verificar si ya existe el comentario
        const { data: existingMention } = await supabase
          .from('mentions')
          .select('id')
          .eq('user_id', userId)
          .eq('platform', 'facebook')
          .eq('url', `https://facebook.com/${comment.id}`)
          .single();

        if (existingMention) {
          continue; // Ya existe, saltar
        }

        // Crear mención
        const { error: mentionError } = await supabase
          .from('mentions')
          .insert({
            user_id: userId,
            platform: 'facebook',
            author_username: comment.from.id,
            author_name: comment.from.name,
            content: commentText,
            url: `https://facebook.com/${comment.id}`,
            published_at: comment.created_time,
            likes: comment.like_count || 0,
            shares: 0,
            comments: 0,
            metadata: {
              post_id: postId,
              post_content: postMessage,
              sentiment: sentiment.label,
              sentiment_score: sentiment.score
            }
          });

        if (!mentionError) {
          totalMentionsCreated++;
        }
      }
    }

    // 6. Actualizar métricas de la página
    const { error: updateError } = await supabase
      .from('social_media')
      .update({
        followers: page.fan_count || socialMedia.followers,
        posts: posts.length,
        engagement: posts.length > 0 ?
          posts.reduce((sum, p) => sum + (p.likes?.summary?.total_count || 0), 0) / posts.length : 0,
        last_sync: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('platform', 'facebook');

    if (updateError) {
      console.error('❌ Error actualizando métricas:', updateError);
    }

    console.log('✅ Sincronización de Facebook completada');

    return NextResponse.json({
      success: true,
      data: {
        posts_processed: posts.length,
        comments_processed: totalCommentsProcessed,
        mentions_created: totalMentionsCreated,
        page_name: page.name,
        page_id: pageId
      },
      message: `Sincronización exitosa: ${totalMentionsCreated} nuevos comentarios`
    });

  } catch (error: any) {
    console.error('❌ Error en Facebook sync:', error);
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

  const positiveWords = ['excelente', 'genial', 'increíble', 'amor', 'feliz', 'gracias', 'bueno', 'mejor', 'perfecto', '❤️', '👍', '😊'];
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
