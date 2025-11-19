import { NextRequest, NextResponse } from 'next/server';
import { youtubeOAuth } from '@/lib/oauth/youtube';
import { aiService } from '@/lib/ai-service';
import { userService, socialMediaService } from '@/lib/database-adapter';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

/**
 * Endpoint para sincronización completa de YouTube
 *
 * Funcionalidad:
 * 1. Obtiene datos del canal (perfil, videos, comentarios)
 * 2. Analiza sentimiento usando Gemini AI
 * 3. Calcula métricas de reputación
 * 4. Guarda en Supabase
 * 5. Retorna datos procesados
 *
 * POST /api/youtube/sync
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🎬 YouTube Sync: Iniciando sincronización...');

    // 1. Autenticar usuario
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

    console.log(`✅ Usuario autenticado: ${userId}`);

    // 2. Obtener conexión de YouTube del usuario
    const { supabase } = await import('@/lib/supabase-server');
    const { data: socialMedia, error: socialError } = await supabase
      .from('social_media')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', 'youtube')
      .eq('connected', true)
      .single();

    if (socialError || !socialMedia || !socialMedia.access_token) {
      console.error('❌ YouTube no conectado:', socialError);
      return NextResponse.json(
        { success: false, error: 'YouTube no está conectado. Conecta tu cuenta primero.' },
        { status: 400 }
      );
    }

    const accessToken = socialMedia.access_token;
    console.log('✅ Token de YouTube encontrado');

    // 3. Obtener configuración de sincronización
    const { maxVideos = 20, maxCommentsPerVideo = 50, lookbackDays = 30 } = await request.json();

    console.log(`📊 Configuración: ${maxVideos} videos, ${maxCommentsPerVideo} comentarios/video, ${lookbackDays} días atrás`);

    // 4. Extraer datos del canal
    console.log('🔍 Obteniendo perfil del canal...');
    const channelProfile = await youtubeOAuth.getChannelProfile(accessToken);

    if (!channelProfile) {
      return NextResponse.json(
        { success: false, error: 'No se pudo obtener el perfil del canal' },
        { status: 500 }
      );
    }

    console.log(`✅ Canal encontrado: ${channelProfile.snippet.title}`);
    console.log(`   - Suscriptores: ${channelProfile.statistics.subscriberCount}`);
    console.log(`   - Videos: ${channelProfile.statistics.videoCount}`);

    // 5. Obtener videos recientes
    console.log(`🎥 Obteniendo últimos ${maxVideos} videos...`);
    const videos = await youtubeOAuth.getChannelVideos(accessToken, maxVideos);
    console.log(`✅ ${videos.length} videos encontrados`);

    // 6. Obtener comentarios de cada video y analizar sentimiento
    console.log('💬 Procesando comentarios y analizando sentimiento...');
    const allMentions: any[] = [];
    const sentimentResults: any[] = [];

    for (const video of videos) {
      console.log(`   Procesando video: ${video.snippet.title}`);

      try {
        const comments = await youtubeOAuth.getVideoComments(
          accessToken,
          video.id,
          maxCommentsPerVideo
        );

        console.log(`   - ${comments.length} comentarios obtenidos`);

        // Analizar sentimiento de cada comentario usando Gemini AI
        for (const comment of comments) {
          try {
            // Usar Gemini AI para análisis de sentimiento
            const sentimentAnalysis = await aiService.analyzeSentiment(
              comment.snippet.textDisplay
            );

            const mention = {
              user_id: userId,
              platform: 'youtube',
              content: comment.snippet.textDisplay,
              author_username: comment.snippet.authorChannelId || 'unknown',
              author_name: comment.snippet.authorDisplayName,
              url: `https://www.youtube.com/watch?v=${video.id}&lc=${comment.id}`,
              published_at: comment.snippet.publishedAt,
              likes: comment.snippet.likeCount,
              metadata: {
                video_id: video.id,
                video_title: video.snippet.title,
                video_views: video.statistics.viewCount,
                comment_id: comment.id,
                sentiment: sentimentAnalysis.sentiment,
                sentiment_score: sentimentAnalysis.score * 100, // Normalizar a -100/+100
                ai_explanation: sentimentAnalysis.explanation
              }
            };

            allMentions.push(mention);
            sentimentResults.push(sentimentAnalysis);

          } catch (sentimentError) {
            console.error(`⚠️ Error analizando sentimiento del comentario ${comment.id}:`, sentimentError);
            // Continuar con el siguiente comentario
          }
        }

      } catch (videoError) {
        console.error(`⚠️ Error procesando video ${video.id}:`, videoError);
        // Continuar con el siguiente video
      }
    }

    console.log(`✅ Total de ${allMentions.length} menciones procesadas`);

    // 7. Calcular métricas agregadas
    const totalMentions = allMentions.length;
    const positiveMentions = allMentions.filter(m => m.metadata?.sentiment === 'positive').length;
    const negativeMentions = allMentions.filter(m => m.metadata?.sentiment === 'negative').length;
    const neutralMentions = allMentions.filter(m => m.metadata?.sentiment === 'neutral').length;

    const avgSentimentScore = totalMentions > 0
      ? allMentions.reduce((sum: number, m) => sum + (m.metadata?.sentiment_score || 0), 0) / totalMentions
      : 0;

    const totalLikes = parseInt(channelProfile.statistics.subscriberCount) || 0;
    const totalViews = videos.reduce((sum: number, v) => sum + parseInt(v.statistics.viewCount || '0'), 0);
    const totalVideoLikes = videos.reduce((sum: number, v) => sum + parseInt(v.statistics.likeCount || '0'), 0);
    const totalComments = videos.reduce((sum: number, v) => sum + parseInt(v.statistics.commentCount || '0'), 0);

    const engagementRate = totalViews > 0
      ? ((totalVideoLikes + totalComments) / totalViews) * 100
      : 0;

    const reputationScore = Math.round(
      (positiveMentions / Math.max(totalMentions, 1)) * 40 + // 40% sentimiento
      Math.min((engagementRate * 10), 30) +                  // 30% engagement
      Math.min((totalLikes / 1000), 30)                       // 30% suscriptores
    );

    console.log('📊 Métricas calculadas:');
    console.log(`   - Score de reputación: ${reputationScore}/100`);
    console.log(`   - Sentimiento promedio: ${avgSentimentScore.toFixed(2)}`);
    console.log(`   - Engagement rate: ${engagementRate.toFixed(2)}%`);

    // 8. Guardar datos en Supabase
    console.log('💾 Guardando datos en Supabase...');

    try {
      // Guardar menciones
      if (allMentions.length > 0) {
        const { error: mentionsError } = await supabase
          .from('mentions')
          .upsert(allMentions, {
            onConflict: 'url',
            ignoreDuplicates: false
          });

        if (mentionsError) {
          console.error('❌ Error guardando menciones:', mentionsError);
        } else {
          console.log(`✅ ${allMentions.length} menciones guardadas`);
        }
      }

      // Actualizar métricas de social_media
      const { error: updateError } = await supabase
        .from('social_media')
        .update({
          followers: totalLikes,
          posts: parseInt(channelProfile.statistics.videoCount),
          engagement: engagementRate,
          last_sync: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('platform', 'youtube');

      if (updateError) {
        console.error('❌ Error actualizando social_media:', updateError);
      } else {
        console.log('✅ Métricas de social_media actualizadas');
      }

      // Guardar métricas históricas
      const { error: historyError } = await supabase
        .from('social_metrics_history')
        .insert({
          user_id: userId,
          platform: 'youtube',
          date: new Date().toISOString().split('T')[0],
          followers: totalLikes,
          posts: parseInt(channelProfile.statistics.videoCount),
          engagement_rate: engagementRate,
          reach_estimate: totalViews,
          sentiment_score: avgSentimentScore,
          metadata: {
            videos_analyzed: videos.length,
            comments_analyzed: totalMentions,
            reputation_score: reputationScore
          }
        });

      if (historyError) {
        console.error('❌ Error guardando histórico:', historyError);
      } else {
        console.log('✅ Histórico guardado');
      }

      // Actualizar user_stats
      const { error: statsError } = await supabase
        .from('user_stats')
        .upsert({
          user_id: userId,
          total_mentions: totalMentions,
          positive_mentions: positiveMentions,
          negative_mentions: negativeMentions,
          neutral_mentions: neutralMentions,
          sentiment_score: avgSentimentScore,
          reach_estimate: totalViews,
          engagement_rate: engagementRate,
          influence_score: reputationScore,
          last_calculated: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (statsError) {
        console.error('❌ Error actualizando user_stats:', statsError);
      } else {
        console.log('✅ user_stats actualizado');
      }

    } catch (dbError) {
      console.error('❌ Error en operaciones de base de datos:', dbError);
    }

    // 9. Retornar resultados
    const response = {
      success: true,
      data: {
        channel: {
          id: channelProfile.id,
          title: channelProfile.snippet.title,
          description: channelProfile.snippet.description,
          subscribers: channelProfile.statistics.subscriberCount,
          total_videos: channelProfile.statistics.videoCount,
          total_views: channelProfile.statistics.viewCount,
          thumbnail: channelProfile.snippet.thumbnails.high.url
        },
        metrics: {
          reputation_score: reputationScore,
          total_mentions: totalMentions,
          positive_mentions: positiveMentions,
          negative_mentions: negativeMentions,
          neutral_mentions: neutralMentions,
          sentiment_score: avgSentimentScore,
          engagement_rate: engagementRate,
          total_views: totalViews,
          total_likes: totalVideoLikes,
          total_comments: totalComments
        },
        videos_analyzed: videos.length,
        comments_analyzed: totalMentions,
        recent_mentions: allMentions.slice(0, 10),
        sentiment_breakdown: {
          positive_percentage: (positiveMentions / Math.max(totalMentions, 1)) * 100,
          negative_percentage: (negativeMentions / Math.max(totalMentions, 1)) * 100,
          neutral_percentage: (neutralMentions / Math.max(totalMentions, 1)) * 100
        },
        synced_at: new Date().toISOString()
      },
      message: `Sincronización completada: ${videos.length} videos y ${totalMentions} comentarios analizados`
    };

    console.log('✅ Sincronización completada exitosamente');
    return NextResponse.json(response);

  } catch (error: any) {
    console.error('❌ Error en sincronización de YouTube:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error en la sincronización',
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/youtube/sync
 * Obtiene el estado de la última sincronización
 */
export async function GET(request: NextRequest) {
  try {
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

    // Obtener última sincronización
    const { supabase } = await import('@/lib/supabase-server');

    const { data: socialMedia } = await supabase
      .from('social_media')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', 'youtube')
      .single();

    const { data: stats } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    const { data: recentMentions } = await supabase
      .from('mentions')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', 'youtube')
      .order('published_at', { ascending: false })
      .limit(20);

    return NextResponse.json({
      success: true,
      data: {
        connected: socialMedia?.connected || false,
        last_sync: socialMedia?.last_sync,
        stats: stats || null,
        recent_mentions: recentMentions || [],
        total_mentions: recentMentions?.length || 0
      }
    });

  } catch (error: any) {
    console.error('Error obteniendo estado de sincronización:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
