import { NextRequest, NextResponse } from 'next/server';

/**
 * Worker para procesar scraping jobs de YouTube automáticamente
 *
 * Este endpoint debe ser llamado periódicamente por:
 * - Supabase pg_cron (cada hora)
 * - Cron externo (cron-job.org, EasyCron, etc.)
 * - Vercel Cron Jobs
 * - Railway Cron
 *
 * GET /api/youtube/worker
 *
 * Configurar en Supabase:
 *
 * SELECT cron.schedule(
 *   'youtube-worker',
 *   '0 * * * *', -- Cada hora
 *   $$
 *   SELECT
 *     net.http_post(
 *       url:='https://tu-dominio.com/api/youtube/worker',
 *       headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SECRET_KEY"}'::jsonb
 *     ) as request_id;
 *   $$
 * );
 */

function getCronSecret(): string | null {
  const secret = process.env.CRON_SECRET_KEY;
  return secret && secret.trim().length > 0 ? secret : null;
}

export async function GET(request: NextRequest) {
  try {
    console.log('⚙️ YouTube Worker: Iniciando procesamiento de jobs...');

    // Verificar autenticación del worker
    const cronSecret = getCronSecret();
    if (!cronSecret) {
      console.error('❌ Worker: CRON_SECRET_KEY no configurado');
      return NextResponse.json(
        { success: false, error: 'CRON_SECRET_KEY no configurado en el servidor' },
        { status: 500 }
      );
    }
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('❌ Worker: Autenticación fallida');
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { supabase } = await import('@/lib/supabase-server');

    // 1. Obtener jobs pendientes o programados para ahora
    const now = new Date().toISOString();

    const { data: pendingJobs, error: jobsError } = await supabase
      .from('scraping_jobs')
      .select('*')
      .eq('platform', 'youtube')
      .in('status', ['pending', 'scheduled'])
      .lte('scheduled_at', now)
      .order('priority', { ascending: true }) // Mayor prioridad primero
      .order('created_at', { ascending: true }) // Más antiguos primero
      .limit(10); // Procesar máximo 10 jobs por ejecución

    if (jobsError) {
      console.error('❌ Worker: Error obteniendo jobs:', jobsError);
      return NextResponse.json(
        { success: false, error: 'Error obteniendo jobs' },
        { status: 500 }
      );
    }

    if (!pendingJobs || pendingJobs.length === 0) {
      console.log('✅ Worker: No hay jobs pendientes');
      return NextResponse.json({
        success: true,
        message: 'No hay jobs pendientes',
        processed: 0
      });
    }

    console.log(`📋 Worker: ${pendingJobs.length} jobs encontrados`);

    // 2. Procesar cada job
    const results = [];

    for (const job of pendingJobs) {
      console.log(`🔄 Procesando job ${job.id} para usuario ${job.user_id}...`);

      try {
        // Marcar job como en ejecución
        await supabase
            .from('scraping_jobs')
            .update({
              status: 'running',
              started_at: new Date().toISOString(),
              worker_id: 'youtube-worker'
            })
            .eq('id', job.id);

        // Obtener access token del usuario
        const { data: socialMedia } = await supabase
            .from('social_media')
            .select('*')
            .eq('user_id', job.user_id)
            .eq('platform', 'youtube')
            .eq('connected', true)
            .single();

        if (!socialMedia || !socialMedia.access_token) {
          throw new Error('YouTube no está conectado para este usuario');
        }

        // Ejecutar sincronización
        const config = job.config || {};
        const { youtubeOAuth } = await import('@/lib/oauth/youtube');
        const { aiService } = await import('@/lib/ai-service');

        console.log(`   Obteniendo datos del canal...`);
        const channelProfile = await youtubeOAuth.getChannelProfile(socialMedia.access_token);

        if (!channelProfile) {
          throw new Error('No se pudo obtener el perfil del canal');
        }

        const maxVideos = config.max_videos || 20;
        const maxCommentsPerVideo = config.max_comments_per_video || 50;

        console.log(`   Obteniendo ${maxVideos} videos...`);
        const videos = await youtubeOAuth.getChannelVideos(socialMedia.access_token, maxVideos);

        // Procesar comentarios y analizar sentimiento
        const allMentions: any[] = [];
        let totalComments = 0;

        for (const video of videos) {
          const comments = await youtubeOAuth.getVideoComments(
            socialMedia.access_token,
            video.id,
            maxCommentsPerVideo
          );

          totalComments += comments.length;

          // Analizar sentimiento
          for (const comment of comments) {
            try {
              const sentimentAnalysis = await aiService.analyzeSentiment(comment.snippet.textDisplay);

              allMentions.push({
                user_id: job.user_id,
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
                  sentiment: sentimentAnalysis.sentiment,
                  sentiment_score: sentimentAnalysis.score * 100,
                  ai_explanation: sentimentAnalysis.explanation
                }
              });
            } catch (error) {
              console.warn(`⚠️ Error analizando comentario:`, error);
            }
          }
        }

        console.log(`   ${totalComments} comentarios procesados`);

        // Guardar menciones en base de datos
        if (allMentions.length > 0) {
          await supabase
            .from('mentions')
            .upsert(allMentions, { onConflict: 'url' });
        }

        // Calcular métricas
        const positiveMentions = allMentions.filter(
          m => m.metadata.sentiment === 'positive'
        ).length;
        const negativeMentions = allMentions.filter(
          m => m.metadata.sentiment === 'negative'
        ).length;

        const totalLikes = parseInt(channelProfile.statistics.subscriberCount) || 0;
        const totalViews = videos.reduce((sum, v) => sum + parseInt(v.statistics.viewCount || '0'), 0);
        const engagementRate = totalViews > 0
          ? ((totalComments + totalLikes) / totalViews) * 100
          : 0;

        // Actualizar métricas
        await supabase
            .from('social_media')
            .update({
              followers: totalLikes,
              posts: parseInt(channelProfile.statistics.videoCount),
              engagement: engagementRate,
              last_sync: new Date().toISOString()
            })
            .eq('user_id', job.user_id)
            .eq('platform', 'youtube');

        await supabase
            .from('user_stats')
            .upsert({
              user_id: job.user_id,
              total_mentions: allMentions.length,
              positive_mentions: positiveMentions,
              negative_mentions: negativeMentions,
              neutral_mentions: allMentions.length - positiveMentions - negativeMentions,
              reach_estimate: totalViews,
              engagement_rate: engagementRate,
              last_calculated: new Date().toISOString()
            }, { onConflict: 'user_id' });

        // Marcar job como completado
        await supabase
            .from('scraping_jobs')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
              result: {
                videos_analyzed: videos.length,
                comments_analyzed: totalComments,
                mentions_saved: allMentions.length,
                engagement_rate: engagementRate
              }
            })
            .eq('id', job.id);

        // Programar siguiente ejecución si es recurrente
        if (config.frequency) {
          let nextScheduledAt = new Date();

          if (config.frequency === 'hourly') {
            nextScheduledAt.setHours(nextScheduledAt.getHours() + 1);
          } else if (config.frequency === 'daily') {
            nextScheduledAt.setDate(nextScheduledAt.getDate() + 1);
          } else if (config.frequency === 'weekly') {
            nextScheduledAt.setDate(nextScheduledAt.getDate() + 7);
          } else if (config.frequency === 'monthly') {
            nextScheduledAt.setMonth(nextScheduledAt.getMonth() + 1);
          }

          // Crear nuevo job para la próxima ejecución
          await supabase
            .from('scraping_jobs')
            .insert({
              user_id: job.user_id,
              platform: 'youtube',
              job_type: job.job_type,
              status: 'scheduled',
              priority: job.priority,
              config: job.config,
              scheduled_at: nextScheduledAt.toISOString()
            });

          console.log(`   ✅ Próxima ejecución programada para: ${nextScheduledAt.toLocaleString()}`);
        }

        results.push({
          job_id: job.id,
          user_id: job.user_id,
          status: 'success',
          videos: videos.length,
          comments: totalComments,
          mentions: allMentions.length
        });

        console.log(`✅ Job ${job.id} completado exitosamente`);

      } catch (jobError: any) {
        console.error(`❌ Error procesando job ${job.id}:`, jobError);

        // Marcar job como fallido
        await supabase
            .from('scraping_jobs')
            .update({
              status: 'failed',
              error_message: jobError.message,
              completed_at: new Date().toISOString(),
              retry_count: (job.retry_count || 0) + 1
            })
            .eq('id', job.id);

        results.push({
          job_id: job.id,
          user_id: job.user_id,
          status: 'failed',
          error: jobError.message
        });
      }
    }

    console.log(`✅ Worker: ${results.length} jobs procesados`);

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Worker: Error general:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST - Procesar job específico manualmente
 */
export async function POST(request: NextRequest) {
  try {
    const { job_id } = await request.json();

    if (!job_id) {
      return NextResponse.json(
        { success: false, error: 'job_id es requerido' },
        { status: 400 }
      );
    }

    // Verificar autenticación
    const cronSecret = getCronSecret();
    if (!cronSecret) {
      return NextResponse.json(
        { success: false, error: 'CRON_SECRET_KEY no configurado en el servidor' },
        { status: 500 }
      );
    }
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Forzar procesamiento del job específico
    const { supabase } = await import('@/lib/supabase-server');

    await supabase
      .from('scraping_jobs')
      .update({
        status: 'pending',
        scheduled_at: new Date().toISOString()
      })
      .eq('id', job_id);

    // Llamar al worker para procesarlo
    return GET(request);

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
