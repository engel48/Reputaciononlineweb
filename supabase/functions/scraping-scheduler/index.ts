import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

interface UserWithPlatforms {
  id: string;
  plan: string;
  email: string;
  keywords?: string[];
  platforms: {
    platform: string;
    connected: boolean;
    access_token?: string;
  }[];
}

// Configuración de prioridades y frecuencias por plan
// Planes reales en BD: free, basic, pro, enterprise (free se excluye del scraping)
const PLAN_CONFIG = {
  enterprise: {
    priority: 1,
    lookback_hours: 1,
    frequency_minutes: 5
  },
  pro: {
    priority: 2,
    lookback_hours: 2,
    frequency_minutes: 15
  },
  basic: {
    priority: 3,
    lookback_hours: 4,
    frequency_minutes: 30
  }
};

// Plataformas soportadas por scraping-worker: Facebook, X (twitter), Instagram.
// YouTube NO esta aqui porque el scraping-worker no lo implementa;
// las menciones de YouTube se sincronizan via /api/cron/sync-social-all (jobid=12 cada 30min).
const SUPPORTED_PLATFORMS = [
  'facebook',
  'twitter',
  'instagram'
];

Deno.serve(async (req: Request) => {
  try {
    console.log('🕐 Scraping scheduler started at', new Date().toISOString());

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Obtener usuarios con planes activos (excluir plan básico para este ejemplo)
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(`
        id,
        plan,
        email,
        keywords,
        social_media (
          platform,
          connected,
          access_token
        )
      `)
      .in('plan', ['basic', 'pro', 'enterprise'])
      .order('plan', { ascending: true }); // Prioridad: enterprise > pro > basic

    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw usersError;
    }

    console.log(`Found ${users?.length || 0} users with active plans`);

    let jobsCreated = 0;
    let jobsSkipped = 0;
    const stats: Record<string, number> = {};

    // Procesar cada usuario
    for (const user of users || []) {
      const planConfig = PLAN_CONFIG[user.plan as keyof typeof PLAN_CONFIG];
      if (!planConfig) {
        console.warn(`Unknown plan: ${user.plan} for user ${user.id}`);
        continue;
      }

      // Filtrar plataformas conectadas
      const connectedPlatforms = user.social_media
        ?.filter((sm: any) => sm.connected && SUPPORTED_PLATFORMS.includes(sm.platform))
        || [];

      if (connectedPlatforms.length === 0) {
        console.log(`User ${user.id} has no connected platforms, skipping`);
        jobsSkipped++;
        continue;
      }

      console.log(`Processing user ${user.id} (${user.plan}) with ${connectedPlatforms.length} platforms`);

      // Verificar si ya existen jobs pendientes para este usuario
      const { data: existingJobs, error: existingJobsError } = await supabase
        .from('scraping_jobs')
        .select('id, platform')
        .eq('user_id', user.id)
        .in('status', ['pending', 'processing'])
        .gte('created_at', new Date(Date.now() - planConfig.frequency_minutes * 60 * 1000).toISOString());

      if (existingJobsError) {
        console.error('Error checking existing jobs:', existingJobsError);
        continue;
      }

      const existingPlatforms = new Set(existingJobs?.map((j: any) => j.platform) || []);

      // Crear jobs para cada plataforma conectada
      for (const socialMedia of connectedPlatforms) {
        const platform = socialMedia.platform;

        // Evitar duplicados
        if (existingPlatforms.has(platform)) {
          console.log(`Skipping ${platform} for user ${user.id} - job already exists`);
          jobsSkipped++;
          continue;
        }

        // Crear job de scraping
        const jobData = {
          user_id: user.id,
          platform: platform,
          status: 'pending',
          priority: planConfig.priority,
          config: {
            lookback_hours: planConfig.lookback_hours,
            include_sentiment: true,
            include_engagement: true,
            keywords: user.keywords || [],
            access_token: socialMedia.access_token ? 'stored' : null,
            user_plan: user.plan
          },
          scheduled_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        };

        const { error: jobError } = await supabase
          .from('scraping_jobs')
          .insert(jobData);

        if (jobError) {
          console.error(`Error creating job for ${platform}:`, jobError);
          continue;
        }

        jobsCreated++;
        stats[platform] = (stats[platform] || 0) + 1;
        console.log(`✅ Created ${platform} job for user ${user.id} (priority ${planConfig.priority})`);
      }
    }

    // Registrar estadísticas de ejecución
    const summary = {
      timestamp: new Date().toISOString(),
      users_processed: users?.length || 0,
      jobs_created: jobsCreated,
      jobs_skipped: jobsSkipped,
      platform_breakdown: stats
    };

    console.log('📊 Scheduler summary:', JSON.stringify(summary, null, 2));

    // Registrar actividad del sistema
    const { error: activityError } = await supabase
      .from('activities')
      .insert({
        user_id: 'system',
        type: 'scraping_scheduled',
        description: `Scheduler ejecutado: ${jobsCreated} jobs creados`,
        metadata: summary,
        created_at: new Date().toISOString()
      });

    if (activityError) {
      console.error('Error logging activity:', activityError);
    }

    // Limpieza: Eliminar jobs antiguos completados o fallidos (> 7 días)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { error: cleanupError } = await supabase
      .from('scraping_jobs')
      .delete()
      .in('status', ['completed', 'failed'])
      .lt('created_at', sevenDaysAgo);

    if (cleanupError) {
      console.error('Error cleaning up old jobs:', cleanupError);
    } else {
      console.log('🧹 Cleaned up old completed/failed jobs');
    }

    return new Response(JSON.stringify({
      success: true,
      summary: summary
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Scraping scheduler error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      details: error.toString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
