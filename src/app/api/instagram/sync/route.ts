import { NextRequest, NextResponse } from 'next/server';
import { decryptToken, isEncrypted } from '@/lib/encryption';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

/**
 * Instagram Sync - Sincroniza posts, comentarios y métricas de Instagram
 *
 * POST /api/instagram/sync
 *
 * Body (opcional):
 * - maxPosts: número máximo de posts a sincronizar (default: 20)
 * - maxCommentsPerPost: número máximo de comentarios por post (default: 50)
 * - lookbackDays: días hacia atrás para buscar posts (default: 30)
 */

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Instagram Sync: Iniciando sincronización...');

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

    // 1. Obtener datos de conexión de Instagram
    const { data: socialMedia, error: socialMediaError } = await supabase
      .from('social_media')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', 'instagram')
      .single();

    if (socialMediaError || !socialMedia) {
      return NextResponse.json(
        { success: false, error: 'Instagram no está conectado' },
        { status: 400 }
      );
    }

    if (!socialMedia.access_token) {
      return NextResponse.json(
        { success: false, error: 'No hay access token disponible' },
        { status: 400 }
      );
    }

    // Desencriptar token antes de usarlo
    const rawToken = socialMedia.access_token;
    const accessToken = isEncrypted(rawToken) ? decryptToken(rawToken) : rawToken;

    console.log(`✅ Conexión encontrada para usuario: ${userId}`);

    // 2. Obtener ID de cuenta de Instagram Business/Creator
    const accountResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
    );

    if (!accountResponse.ok) {
      const error = await accountResponse.text();
      console.error('❌ Error obteniendo cuenta:', error);
      return NextResponse.json(
        { success: false, error: 'Error obteniendo cuenta de Instagram' },
        { status: 500 }
      );
    }

    const accountData = await accountResponse.json();
    const pages = accountData.data || [];

    if (pages.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No se encontraron páginas vinculadas' },
        { status: 400 }
      );
    }

    // Obtener Instagram Business Account desde la página
    const page = pages[0];
    const igAccountResponse = await fetch(
      `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
    );

    const igAccountData = await igAccountResponse.json();
    const instagramAccountId = igAccountData.instagram_business_account?.id;

    if (!instagramAccountId) {
      return NextResponse.json(
        { success: false, error: 'No se encontró cuenta de Instagram Business vinculada' },
        { status: 400 }
      );
    }

    console.log(`📸 Sincronizando cuenta de Instagram: ${instagramAccountId}`);

    // 3. Obtener posts (media) de Instagram
    const since = Math.floor(Date.now() / 1000) - (lookbackDays * 24 * 60 * 60);
    const postsResponse = await fetch(
      `https://graph.facebook.com/v18.0/${instagramAccountId}/media?` +
      `fields=id,caption,media_type,media_url,timestamp,like_count,comments_count&` +
      `since=${since}&` +
      `limit=${maxPosts}&` +
      `access_token=${page.access_token}`
    );

    if (!postsResponse.ok) {
      const error = await postsResponse.text();
      console.error('❌ Error obteniendo posts:', error);
      return NextResponse.json(
        { success: false, error: 'Error obteniendo posts de Instagram' },
        { status: 500 }
      );
    }

    const postsData = await postsResponse.json();
    const posts = postsData.data || [];

    console.log(`📝 ${posts.length} posts encontrados`);

    let totalCommentsProcessed = 0;
    let totalMentionsCreated = 0;
    let totalLikes = 0;

    // 4. Procesar cada post y sus comentarios
    for (const post of posts) {
      const postId = post.id;
      const postCaption = post.caption || '';
      const postTimestamp = post.timestamp;
      const postLikes = post.like_count || 0;
      const mediaType = post.media_type || 'IMAGE';
      const mediaUrl = post.media_url || '';

      totalLikes += postLikes;

      // Obtener comentarios del post
      const commentsResponse = await fetch(
        `https://graph.facebook.com/v18.0/${postId}/comments?` +
        `fields=id,from,text,timestamp,like_count&` +
        `limit=${maxCommentsPerPost}&` +
        `access_token=${page.access_token}`
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
        const commentText = comment.text || '';

        // Análisis básico de sentimiento (se puede mejorar con IA)
        const sentiment = analyzeSentiment(commentText);

        // Verificar si ya existe el comentario
        const { data: existingMention } = await supabase
          .from('mentions')
          .select('id')
          .eq('user_id', userId)
          .eq('platform', 'instagram')
          .eq('url', `https://instagram.com/p/${postId}`)
          .eq('author_username', comment.from?.id || comment.id)
          .single();

        if (existingMention) {
          continue; // Ya existe, saltar
        }

        // Crear mención
        const { error: mentionError } = await supabase
          .from('mentions')
          .insert({
            user_id: userId,
            platform: 'instagram',
            author_username: comment.from?.id || comment.id,
            author_name: comment.from?.username || 'Instagram User',
            content: commentText,
            url: `https://instagram.com/p/${postId}`,
            published_at: comment.timestamp,
            likes: comment.like_count || 0,
            shares: 0,
            comments: 0,
            metadata: {
              post_id: postId,
              post_content: postCaption,
              media_type: mediaType,
              media_url: mediaUrl,
              sentiment: sentiment.label,
              sentiment_score: sentiment.score
            }
          });

        if (!mentionError) {
          totalMentionsCreated++;
        }
      }
    }

    // 6. Actualizar métricas de la cuenta
    const avgEngagement = posts.length > 0 ? totalLikes / posts.length : 0;

    const { error: updateError } = await supabase
      .from('social_media')
      .update({
        posts: posts.length,
        engagement: avgEngagement,
        last_sync: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('platform', 'instagram');

    if (updateError) {
      console.error('❌ Error actualizando métricas:', updateError);
    }

    console.log('✅ Sincronización de Instagram completada');

    return NextResponse.json({
      success: true,
      data: {
        posts_processed: posts.length,
        comments_processed: totalCommentsProcessed,
        mentions_created: totalMentionsCreated,
        account_id: instagramAccountId
      },
      message: `Sincronización exitosa: ${totalMentionsCreated} nuevos comentarios`
    });

  } catch (error: any) {
    console.error('❌ Error en Instagram sync:', error);
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
