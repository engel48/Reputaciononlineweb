/**
 * POST /api/news-monitoring/scan-now
 * Fuerza un escaneo inmediato de un sitio monitoreado
 */

import { NextRequest, NextResponse } from 'next/server';
import * as jwt from 'jsonwebtoken';
import { supabase } from '@/lib/supabase-server';
import { scrapeSiteWithRateLimit } from '@/lib/news-monitoring/scraper';
import { checkBalance, deductCreditsForAction } from '@/lib/credit-guard';
import { CREDIT_COSTS } from '@/lib/credit-costs';

import { getJwtSecret } from '@/lib/jwt-secret';

export async function POST(request: NextRequest) {
  try {
    // Obtener token de autenticación desde cookie (JWT Local)
    const authToken = request.cookies.get('auth-token')?.value;

    if (!authToken) {
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

    // Verificar token JWT Local
    let userId: string;
    try {
      const decoded = jwt.verify(authToken, getJwtSecret()) as { userId: string; email: string };
      userId = decoded.userId;
    } catch (error) {
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
      .eq('user_id', userId)
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

    // Verificar créditos ANTES de gastar recursos (escaneo manual = monitoring_hourly).
    const SCAN_COST = CREDIT_COSTS.monitoring_hourly;
    const balance = await checkBalance(userId, SCAN_COST);
    if (!balance.hasEnough && !balance.unlimited) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INSUFFICIENT_CREDITS',
            message: `Créditos insuficientes. Este escaneo cuesta ${SCAN_COST} créditos y tienes ${balance.currentBalance}.`,
          },
          credits: { cost: SCAN_COST, currentBalance: balance.currentBalance },
          timestamp: new Date().toISOString(),
        },
        { status: 402 }
      );
    }

    // Obtener el nombre del usuario para filtrar las noticias
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('name')
      .eq('id', userId)
      .single();

    // Generar términos de búsqueda desde el nombre del usuario
    let searchTerms: string[] = monitoredSite.search_terms || [];

    // Si no hay términos configurados o están vacíos, usar el nombre del usuario
    if (searchTerms.length === 0 && userData?.name) {
      const userName = userData.name;
      searchTerms = [userName.toLowerCase()];

      // Agregar variaciones del nombre
      const nameParts = userName.trim().split(/\s+/);
      if (nameParts.length >= 2) {
        searchTerms.push(nameParts[0].toLowerCase()); // Primer nombre
        searchTerms.push(nameParts[nameParts.length - 1].toLowerCase()); // Apellido
      }

      // Actualizar los search_terms en la base de datos para futuros escaneos
      await supabase
        .from('monitored_news_sites')
        .update({ search_terms: searchTerms })
        .eq('id', monitoredSite.id);

      console.log(`[NEWS-MONITORING] Auto-configured search terms from user name: ${searchTerms.join(', ')}`);
    }

    // Crear job de scraping (usando estructura correcta de scraping_jobs)
    const { data: job, error: jobError } = await supabase
      .from('scraping_jobs')
      .insert({
        user_id: userId,
        platform: monitoredSite.site_id, // Usamos platform para el site_id
        job_type: 'news_scraping',
        status: 'pending',
        priority: 1, // Alta prioridad para scan manual
        config: {
          monitored_site_id: monitoredSite.id,
          search_terms: searchTerms,
        },
      })
      .select()
      .single();

    if (jobError) {
      console.error('[NEWS-MONITORING] Job creation error:', jobError);
      // Continuar sin job tracking si falla
    }

    // Ejecutar scraping inmediatamente
    console.log(`[NEWS-MONITORING] Starting immediate scan for site: ${monitoredSite.site_id}`);

    const startTime = Date.now();

    // Actualizar job a processing (si se creó correctamente)
    if (job?.id) {
      await supabase
        .from('scraping_jobs')
        .update({
          status: 'processing',
          started_at: new Date().toISOString(),
        })
        .eq('id', job.id);
    }

    // Ejecutar scraping con rate limiting
    // Usar los searchTerms que incluyen el nombre del usuario
    const scrapingResult = await scrapeSiteWithRateLimit(
      monitoredSite.site_id,
      searchTerms
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
          user_id: userId,
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

      // Actualizar job como completado (si existe)
      if (job?.id) {
        await supabase
          .from('scraping_jobs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            result: {
              articles_found: scrapingResult.articlesScraped,
              mentions_found: scrapingResult.mentionsFound,
              duration_ms: duration,
            },
          })
          .eq('id', job.id);
      }

      // Actualizar last_checked_at del sitio monitoreado
      await supabase
        .from('monitored_news_sites')
        .update({
          last_checked_at: new Date().toISOString(),
        })
        .eq('id', monitoredSite.id);

      // Cobrar el escaneo (solo si fue exitoso; el saldo ya se validó arriba).
      let creditsAfter: number | undefined;
      if (!balance.unlimited) {
        const deduct = await deductCreditsForAction(userId, 'monitoring_hourly', 1, 'Escaneo manual de noticias');
        creditsAfter = deduct.newBalance;
      }

      return NextResponse.json(
        {
          success: true,
          data: {
            jobId: job?.id || null,
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
          credits: { cost: SCAN_COST, newBalance: creditsAfter },
          message: `Escaneo completado: ${scrapingResult.mentionsFound} menciones encontradas`,
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );

    } else {
      // Actualizar job como fallido (si existe)
      if (job?.id) {
        await supabase
          .from('scraping_jobs')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_message: scrapingResult.error || 'Unknown error',
          })
          .eq('id', job.id);
      }

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
