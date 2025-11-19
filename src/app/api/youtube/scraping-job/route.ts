import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

/**
 * Endpoint para gestionar scraping jobs de YouTube
 *
 * POST /api/youtube/scraping-job - Crear nuevo job
 * GET  /api/youtube/scraping-job - Obtener jobs del usuario
 * DELETE /api/youtube/scraping-job - Cancelar un job
 */

/**
 * POST - Crear nuevo scraping job para YouTube
 */
export async function POST(request: NextRequest) {
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

    // Obtener configuración del job
    const {
      frequency = 'hourly', // hourly, daily, weekly, monthly
      max_videos = 20,
      max_comments_per_video = 50,
      lookback_days = 30,
      auto_start = true
    } = await request.json();

    console.log(`📋 Creando scraping job de YouTube para usuario ${userId}`);
    console.log(`   Frecuencia: ${frequency}`);
    console.log(`   Videos: ${max_videos}, Comentarios/video: ${max_comments_per_video}`);

    // Verificar que el usuario tenga YouTube conectado
    const { supabase } = await import('@/lib/supabase-server');

    const { data: socialMedia, error: socialError } = await supabase
      .from('social_media')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', 'youtube')
      .eq('connected', true)
      .single();

    if (socialError || !socialMedia) {
      return NextResponse.json(
        { success: false, error: 'YouTube no está conectado. Conecta tu cuenta primero.' },
        { status: 400 }
      );
    }

    // Calcular próxima ejecución
    let scheduled_at = new Date();
    if (frequency === 'hourly') {
      scheduled_at.setHours(scheduled_at.getHours() + 1);
    } else if (frequency === 'daily') {
      scheduled_at.setDate(scheduled_at.getDate() + 1);
    } else if (frequency === 'weekly') {
      scheduled_at.setDate(scheduled_at.getDate() + 7);
    } else if (frequency === 'monthly') {
      scheduled_at.setMonth(scheduled_at.getMonth() + 1);
    }

    // Crear job en la base de datos
    const { data: job, error: jobError } = await supabase
      .from('scraping_jobs')
      .insert({
        user_id: userId,
        platform: 'youtube',
        job_type: 'sync',
        status: auto_start ? 'pending' : 'scheduled',
        priority: 3, // Prioridad media
        config: {
          frequency,
          max_videos,
          max_comments_per_video,
          lookback_days
        },
        scheduled_at: auto_start ? new Date().toISOString() : scheduled_at.toISOString(),
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (jobError) {
      console.error('Error creando scraping job:', jobError);
      return NextResponse.json(
        { success: false, error: 'Error creando job de scraping' },
        { status: 500 }
      );
    }

    console.log(`✅ Scraping job creado: ${job.id}`);

    // Si auto_start, ejecutar inmediatamente
    if (auto_start) {
      console.log('🚀 Ejecutando job inmediatamente...');

      // Llamar al endpoint de sync de forma asíncrona
      fetch(`${process.env.NEXTAUTH_URL}/api/youtube/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `auth-token=${authToken}`
        },
        body: JSON.stringify({
          maxVideos: max_videos,
          maxCommentsPerVideo: max_comments_per_video,
          lookbackDays: lookback_days
        })
      }).then(async (res) => {
        const result = await res.json();
        console.log('✅ Sincronización completada:', result);

        // Actualizar job como completado
        await supabase
            .from('scraping_jobs')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
              result: result.data
            })
            .eq('id', job.id);
      }).catch(async (error) => {
        console.error('Error en sincronización:', error);

        // Actualizar job como fallido
        await supabase
            .from('scraping_jobs')
            .update({
              status: 'failed',
              error_message: error.message,
              completed_at: new Date().toISOString()
            })
            .eq('id', job.id);
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        job_id: job.id,
        status: job.status,
        scheduled_at: job.scheduled_at,
        frequency,
        config: job.config,
        message: auto_start
          ? 'Job creado y ejecutándose en segundo plano'
          : `Job programado para ${scheduled_at.toLocaleString()}`
      }
    });

  } catch (error: any) {
    console.error('Error en POST /api/youtube/scraping-job:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET - Obtener jobs de scraping del usuario
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

    const { supabase } = await import('@/lib/supabase-server');

    // Obtener jobs del usuario
    const { data: jobs, error } = await supabase
      .from('scraping_jobs')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', 'youtube')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error obteniendo jobs:', error);
      return NextResponse.json(
        { success: false, error: 'Error obteniendo jobs' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        jobs: jobs || [],
        total: jobs?.length || 0,
        active_jobs: jobs?.filter(j => j.status === 'pending' || j.status === 'running').length || 0
      }
    });

  } catch (error: any) {
    console.error('Error en GET /api/youtube/scraping-job:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Cancelar un job de scraping
 */
export async function DELETE(request: NextRequest) {
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

    const { job_id } = await request.json();

    if (!job_id) {
      return NextResponse.json(
        { success: false, error: 'job_id es requerido' },
        { status: 400 }
      );
    }

    const { supabase } = await import('@/lib/supabase-server');

    // Cancelar job
    const { error } = await supabase
      .from('scraping_jobs')
      .update({
        status: 'failed',
        error_message: 'Cancelado por el usuario',
        completed_at: new Date().toISOString()
      })
      .eq('id', job_id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error cancelando job:', error);
      return NextResponse.json(
        { success: false, error: 'Error cancelando job' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Job cancelado exitosamente'
    });

  } catch (error: any) {
    console.error('Error en DELETE /api/youtube/scraping-job:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
