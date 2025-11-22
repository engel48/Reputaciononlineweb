/**
 * Sistema de Queue para procesamiento background de scraping
 * Procesa sitios monitoreados automáticamente basado en check_frequency_minutes
 */

import { createClient } from '@supabase/supabase-js';
import { scrapeSiteWithRateLimit } from './scraper';
import type { ScrapingResult } from './scraper';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Service role para operaciones de sistema

interface MonitoredSiteJob {
  id: string;
  userId: string;
  siteId: string;
  searchTerms: string[];
  lastCheckedAt: string | null;
  checkFrequencyMinutes: number;
}

/**
 * Obtiene sitios que necesitan ser escaneados
 */
async function getSitesNeedingScraping(): Promise<MonitoredSiteJob[]> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Usar la función de PostgreSQL para obtener sitios que necesitan scraping
  const { data, error } = await supabase.rpc('get_sites_needing_scraping');

  if (error) {
    console.error('[QUEUE] Error fetching sites needing scraping:', error);
    return [];
  }

  return (data || []).map((site: any) => ({
    id: site.monitored_site_id,
    userId: site.user_id,
    siteId: site.site_id,
    searchTerms: site.search_terms,
    lastCheckedAt: site.last_checked_at,
    checkFrequencyMinutes: site.check_frequency_minutes,
  }));
}

/**
 * Procesa un sitio monitoreado
 */
async function processSite(job: MonitoredSiteJob): Promise<void> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log(`[QUEUE] Processing site: ${job.siteId} for user: ${job.userId}`);

  // Crear job en la base de datos
  const { data: dbJob, error: jobError } = await supabase
    .from('scraping_jobs')
    .insert({
      monitored_site_id: job.id,
      user_id: job.userId,
      site_id: job.siteId,
      status: 'pending',
      priority: 5, // Prioridad normal para jobs automáticos
    })
    .select()
    .single();

  if (jobError) {
    console.error('[QUEUE] Error creating job:', jobError);
    return;
  }

  const startTime = Date.now();

  try {
    // Actualizar job a processing
    await supabase
      .from('scraping_jobs')
      .update({
        status: 'processing',
        started_at: new Date().toISOString(),
      })
      .eq('id', dbJob.id);

    // Ejecutar scraping
    const result: ScrapingResult = await scrapeSiteWithRateLimit(
      job.siteId,
      job.searchTerms
    );

    const duration = Date.now() - startTime;

    if (result.success) {
      // Guardar menciones encontradas
      if (result.mentions.length > 0) {
        const mentionsToInsert = result.mentions.map(mention => ({
          user_id: job.userId,
          monitored_site_id: job.id,
          article_url: mention.article.url,
          article_title: mention.article.title,
          article_author: mention.article.author,
          mention_context: mention.context,
          full_content: mention.article.content.substring(0, 5000),
          sentiment: mention.sentiment.type,
          sentiment_score: mention.sentiment.score,
          matched_terms: mention.matchedTerms,
          published_date: mention.article.publishedDate?.toISOString(),
          article_hash: mention.article.hash,
        }));

        // Insertar menciones (ignorar duplicados por constraint unique_article_per_user)
        const { error: insertError } = await supabase
          .from('news_mentions')
          .insert(mentionsToInsert);

        if (insertError && !insertError.message.includes('duplicate')) {
          console.error('[QUEUE] Error inserting mentions:', insertError);
        }
      }

      // Actualizar job como completado
      await supabase
        .from('scraping_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          articles_found: result.articlesScraped,
          mentions_found: result.mentionsFound,
        })
        .eq('id', dbJob.id);

      // Actualizar last_checked_at del sitio monitoreado
      await supabase
        .from('monitored_news_sites')
        .update({
          last_checked_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      console.log(`[QUEUE] ✓ Successfully processed ${job.siteId}: ${result.mentionsFound} mentions in ${duration}ms`);

    } else {
      // Actualizar job como fallido
      await supabase
        .from('scraping_jobs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: result.error || 'Unknown error',
        })
        .eq('id', dbJob.id);

      console.error(`[QUEUE] ✗ Failed to process ${job.siteId}: ${result.error}`);
    }

  } catch (error: any) {
    console.error(`[QUEUE] ✗ Error processing site ${job.siteId}:`, error);

    // Actualizar job como fallido
    await supabase
      .from('scraping_jobs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: error.message || 'Unknown error',
      })
      .eq('id', dbJob.id);
  }
}

/**
 * Procesa la cola de scraping
 */
export async function processQueue(): Promise<void> {
  console.log('[QUEUE] Starting queue processing...');

  const sites = await getSitesNeedingScraping();

  if (sites.length === 0) {
    console.log('[QUEUE] No sites need scraping at this time');
    return;
  }

  console.log(`[QUEUE] Found ${sites.length} sites to process`);

  // Procesar sitios secuencialmente para evitar sobrecarga
  for (const site of sites) {
    await processSite(site);

    // Pequeño delay entre sitios para distribuir la carga
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('[QUEUE] Queue processing completed');
}

/**
 * Limpia jobs antiguos (más de 7 días)
 */
export async function cleanupOldJobs(): Promise<void> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { error } = await supabase
    .from('scraping_jobs')
    .delete()
    .lt('created_at', sevenDaysAgo.toISOString());

  if (error) {
    console.error('[QUEUE] Error cleaning up old jobs:', error);
  } else {
    console.log('[QUEUE] ✓ Cleaned up jobs older than 7 days');
  }
}

/**
 * Ejecuta el procesamiento de cola en intervalos
 */
export function startQueueProcessor(intervalMinutes: number = 5): NodeJS.Timeout {
  console.log(`[QUEUE] Starting queue processor with ${intervalMinutes}min interval`);

  // Ejecutar inmediatamente
  processQueue();

  // Luego ejecutar cada X minutos
  const interval = setInterval(() => {
    processQueue();
  }, intervalMinutes * 60 * 1000);

  // Ejecutar limpieza una vez al día
  setInterval(() => {
    cleanupOldJobs();
  }, 24 * 60 * 60 * 1000);

  return interval;
}

/**
 * Para el procesamiento de cola
 */
export function stopQueueProcessor(interval: NodeJS.Timeout): void {
  clearInterval(interval);
  console.log('[QUEUE] Queue processor stopped');
}

/**
 * Obtiene estadísticas de la cola
 */
export async function getQueueStats() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Jobs por estado
  const { data: jobs } = await supabase
    .from('scraping_jobs')
    .select('status')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Últimas 24 horas

  const stats = {
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
  };

  jobs?.forEach(job => {
    if (job.status in stats) {
      stats[job.status as keyof typeof stats]++;
    }
  });

  // Sitios activos
  const { count: activeSites } = await supabase
    .from('monitored_news_sites')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  return {
    last24Hours: stats,
    activeSites: activeSites || 0,
  };
}
