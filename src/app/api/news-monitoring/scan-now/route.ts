/**
 * POST /api/news-monitoring/scan-now
 * Fuerza un escaneo inmediato de un sitio monitoreado
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { scrapeSiteWithRateLimit } from '@/lib/news-monitoring/scraper';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: NextRequest) {
  try {
    // Obtener token de autenticación
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'No autorizado. Token de autenticación requerido.',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // Verificar usuario autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Token inválido o expirado',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { monitoredSiteId } = body;

    if (!monitoredSiteId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'monitoredSiteId es requerido',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Verificar que el sitio monitoreado existe y pertenece al usuario
    const { data: monitoredSite, error: fetchError } = await supabase
      .from('monitored_news_sites')
      .select('*')
      .eq('id', monitoredSiteId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !monitoredSite) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SITE_NOT_FOUND',
            message: 'Sitio monitoreado no encontrado o no tienes permiso',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    if (!monitoredSite.is_active) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SITE_INACTIVE',
            message: 'El sitio está desactivado',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Crear job de scraping
    const { data: job, error: jobError } = await supabase
      .from('scraping_jobs')
      .insert({
        monitored_site_id: monitoredSite.id,
        user_id: user.id,
        site_id: monitoredSite.site_id,
        status: 'pending',
        priority: 1, // Alta prioridad para scan manual
      })
      .select()
      .single();

    if (jobError) {
      throw new Error(`Job creation error: ${jobError.message}`);
    }

    // Ejecutar scraping inmediatamente
    console.log(`[NEWS-MONITORING] Starting immediate scan for site: ${monitoredSite.site_id}`);

    const startTime = Date.now();

    // Actualizar job a processing
    await supabase
      .from('scraping_jobs')
      .update({
        status: 'processing',
        started_at: new Date().toISOString(),
      })
      .eq('id', job.id);

    // Ejecutar scraping con rate limiting
    const scrapingResult = await scrapeSiteWithRateLimit(
      monitoredSite.site_id,
      monitoredSite.search_terms
    );

    const duration = Date.now() - startTime;

    console.log(`[NEWS-MONITORING] Scraping completed in ${duration}ms:`, {
      success: scrapingResult.success,
      articlesScraped: scrapingResult.articlesScraped,
      mentionsFound: scrapingResult.mentionsFound,
      error: scrapingResult.error,
    });

    if (scrapingResult.success) {
      // Guardar menciones encontradas
      if (scrapingResult.mentions.length > 0) {
        const mentionsToInsert = scrapingResult.mentions.map(mention => ({
          user_id: user.id,
          monitored_site_id: monitoredSite.id,
          article_url: mention.article.url,
          article_title: mention.article.title,
          article_author: mention.article.author,
          mention_context: mention.context,
          full_content: mention.article.content.substring(0, 5000), // Limitar a 5000 chars
          sentiment: mention.sentiment.type,
          sentiment_score: mention.sentiment.score,
          matched_terms: mention.matchedTerms,
          published_date: mention.article.publishedDate?.toISOString(),
          article_hash: mention.article.hash,
        }));

        // Insertar menciones (ignorar duplicados)
        const { error: insertError } = await supabase
          .from('news_mentions')
          .insert(mentionsToInsert);

        if (insertError) {
          console.error('[NEWS-MONITORING] Error inserting mentions:', insertError);
          // No lanzar error, continuar con la respuesta
        }
      }

      // Actualizar job como completado
      await supabase
        .from('scraping_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          articles_found: scrapingResult.articlesScraped,
          mentions_found: scrapingResult.mentionsFound,
        })
        .eq('id', job.id);

      // Actualizar last_checked_at del sitio monitoreado
      await supabase
        .from('monitored_news_sites')
        .update({
          last_checked_at: new Date().toISOString(),
        })
        .eq('id', monitoredSite.id);

      return NextResponse.json(
        {
          success: true,
          data: {
            jobId: job.id,
            articlesScraped: scrapingResult.articlesScraped,
            mentionsFound: scrapingResult.mentionsFound,
            mentions: scrapingResult.mentions.map(m => ({
              title: m.article.title,
              url: m.article.url,
              sentiment: m.sentiment.type,
              sentimentScore: m.sentiment.score,
              matchedTerms: m.matchedTerms,
              context: m.context.substring(0, 200), // Preview
            })),
            duration: `${duration}ms`,
          },
          message: `Escaneo completado: ${scrapingResult.mentionsFound} menciones encontradas`,
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );

    } else {
      // Actualizar job como fallido
      await supabase
        .from('scraping_jobs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: scrapingResult.error || 'Unknown error',
        })
        .eq('id', job.id);

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SCRAPING_FAILED',
            message: scrapingResult.error || 'Error al realizar el escaneo',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('[NEWS-MONITORING] Error in scan-now:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SCAN_ERROR',
          message: 'Error al ejecutar escaneo',
          details: error.message,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
