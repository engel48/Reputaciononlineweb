import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

/**
 * LinkedIn Sync - Sincroniza posts, comentarios y métricas de LinkedIn
 *
 * POST /api/linkedin/sync
 *
 * Body (opcional):
 * - maxPosts: número máximo de posts a sincronizar (default: 20)
 * - maxCommentsPerPost: número máximo de comentarios por post (default: 50)
 * - lookbackDays: días hacia atrás para buscar posts (default: 30)
 */

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 LinkedIn Sync: Iniciando sincronización...');

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

    // 1. Obtener datos de conexión de LinkedIn
    const { data: socialMedia, error: socialMediaError } = await supabase
      .from('social_media')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', 'linkedin')
      .single();

    if (socialMediaError || !socialMedia) {
      return NextResponse.json(
        { success: false, error: 'LinkedIn no está conectado' },
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

    // 2. Obtener información del perfil
    const profileResponse = await fetch(
      'https://api.linkedin.com/v2/me',
      {
        headers: {
          'Authorization': `Bearer ${socialMedia.access_token}`,
          'X-Restli-Protocol-Version': '2.0.0'
        }
      }
    );

    if (!profileResponse.ok) {
      const error = await profileResponse.text();
      console.error('❌ Error obteniendo perfil:', error);
      return NextResponse.json(
        { success: false, error: 'Error obteniendo perfil de LinkedIn' },
        { status: 500 }
      );
    }

    const profileData = await profileResponse.json();
    const personId = `urn:li:person:${profileData.id}`;

    console.log(`👔 Sincronizando perfil de LinkedIn: ${personId}`);

    // 3. Obtener posts (UGC Posts)
    const since = Date.now() - (lookbackDays * 24 * 60 * 60 * 1000);
    const postsResponse = await fetch(
      `https://api.linkedin.com/v2/ugcPosts?q=authors&authors=List(${encodeURIComponent(personId)})&count=${maxPosts}`,
      {
        headers: {
          'Authorization': `Bearer ${socialMedia.access_token}`,
          'X-Restli-Protocol-Version': '2.0.0'
        }
      }
    );

    if (!postsResponse.ok) {
      const error = await postsResponse.text();
      console.error('❌ Error obteniendo posts:', error);
      return NextResponse.json(
        { success: false, error: 'Error obteniendo posts de LinkedIn' },
        { status: 500 }
      );
    }

    const postsData = await postsResponse.json();
    const posts = postsData.elements || [];

    console.log(`📝 ${posts.length} posts encontrados`);

    let totalCommentsProcessed = 0;
    let totalMentionsCreated = 0;
    let totalLikes = 0;
    let totalShares = 0;

    // 4. Procesar cada post y obtener sus estadísticas
    for (const post of posts) {
      const postId = post.id;
      const postContent = post.specificContent?.['com.linkedin.ugc.ShareContent']?.shareCommentary?.text || '';
      const postCreatedTime = new Date(post.created?.time || Date.now()).toISOString();

      // Obtener estadísticas del post (likes, comments, shares)
      const statsResponse = await fetch(
        `https://api.linkedin.com/v2/socialActions/${encodeURIComponent(postId)}`,
        {
          headers: {
            'Authorization': `Bearer ${socialMedia.access_token}`,
            'X-Restli-Protocol-Version': '2.0.0'
          }
        }
      );

      let postLikes = 0;
      let postComments = 0;
      let postSharesCount = 0;

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        postLikes = statsData.likesSummary?.totalLikes || 0;
        postComments = statsData.commentsSummary?.totalComments || 0;
        postSharesCount = statsData.sharesSummary?.totalShares || 0;

        totalLikes += postLikes;
        totalShares += postSharesCount;
      }

      // Obtener comentarios del post
      const commentsResponse = await fetch(
        `https://api.linkedin.com/v2/socialActions/${encodeURIComponent(postId)}/comments?count=${maxCommentsPerPost}`,
        {
          headers: {
            'Authorization': `Bearer ${socialMedia.access_token}`,
            'X-Restli-Protocol-Version': '2.0.0'
          }
        }
      );

      if (!commentsResponse.ok) {
        console.warn(`⚠️ No se pudieron obtener comentarios del post ${postId}`);
        continue;
      }

      const commentsData = await commentsResponse.json();
      const comments = commentsData.elements || [];

      totalCommentsProcessed += comments.length;

      // 5. Analizar sentimiento y guardar comentarios
      for (const comment of comments) {
        const commentText = comment.message?.text || '';
        const commentAuthor = comment.actor || 'Unknown';

        // Análisis básico de sentimiento
        const sentiment = analyzeSentiment(commentText);

        // Verificar si ya existe el comentario
        const { data: existingMention } = await supabase
          .from('mentions')
          .select('id')
          .eq('user_id', userId)
          .eq('platform', 'linkedin')
          .eq('url', `https://www.linkedin.com/feed/update/${postId}`)
          .eq('author_username', commentAuthor)
          .single();

        if (existingMention) {
          continue; // Ya existe, saltar
        }

        // Crear mención
        const { error: mentionError } = await supabase
          .from('mentions')
          .insert({
            user_id: userId,
            platform: 'linkedin',
            author_username: commentAuthor,
            author_name: commentAuthor,
            content: commentText,
            url: `https://www.linkedin.com/feed/update/${postId}`,
            published_at: comment.created?.time ? new Date(comment.created.time).toISOString() : new Date().toISOString(),
            likes: comment.likesSummary?.totalLikes || 0,
            shares: 0,
            comments: 0,
            metadata: {
              post_id: postId,
              post_content: postContent,
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
    const avgEngagement = posts.length > 0 ? (totalLikes + totalShares) / posts.length : 0;

    const { error: updateError } = await supabase
      .from('social_media')
      .update({
        posts: posts.length,
        engagement: avgEngagement,
        last_sync: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('platform', 'linkedin');

    if (updateError) {
      console.error('❌ Error actualizando métricas:', updateError);
    }

    console.log('✅ Sincronización de LinkedIn completada');

    return NextResponse.json({
      success: true,
      data: {
        posts_processed: posts.length,
        comments_processed: totalCommentsProcessed,
        mentions_created: totalMentionsCreated,
        profile_id: personId
      },
      message: `Sincronización exitosa: ${totalMentionsCreated} nuevos comentarios`
    });

  } catch (error: any) {
    console.error('❌ Error en LinkedIn sync:', error);
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

  const positiveWords = ['excelente', 'genial', 'increíble', 'amor', 'feliz', 'gracias', 'bueno', 'mejor', 'perfecto', 'profesional', 'congratulations', 'great', 'excellent'];
  const negativeWords = ['malo', 'terrible', 'horrible', 'odio', 'pésimo', 'peor', 'nunca', 'decepción', 'unprofessional', 'disappointed'];

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
