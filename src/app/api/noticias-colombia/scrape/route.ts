/**
 * API ENDPOINT: GET /api/noticias-colombia/scrape
 * Scraping en tiempo real de noticias de un sitio específico
 *
 * Query params:
 * - sitio: ID del sitio (requerido)
 * - refresh: Forzar refresh ignorando cache (opcional, default: false)
 * - limit: Número de artículos a retornar (opcional, default: 20)
 * - offset: Offset para paginación (opcional, default: 0)
 */

import { NextRequest, NextResponse } from 'next/server';
import { NoticiasColombiaScraper, type ScrapedArticle } from '@/lib/scraping/noticias-colombia';
import { getSitioConfig } from '@/lib/scraping/sitios-config';

export const dynamic = 'force-dynamic';
export const maxDuration = 30; // 30 seconds max for scraping

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const searchParams = request.nextUrl.searchParams;
    const sitioId = searchParams.get('sitio');
    const forceRefresh = searchParams.get('refresh') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Validate sitio parameter
    if (!sitioId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Parámetro "sitio" requerido',
          example: '/api/noticias-colombia/scrape?sitio=eltiempo',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    // Validate sitio exists
    const sitioConfig = getSitioConfig(sitioId);
    if (!sitioConfig) {
      return NextResponse.json(
        {
          success: false,
          error: `Sitio no encontrado: ${sitioId}`,
          message: 'Use /api/noticias-colombia/sitios para ver sitios disponibles',
          timestamp: new Date().toISOString()
        },
        { status: 404 }
      );
    }

    console.log(`[API] GET /api/noticias-colombia/scrape - Sitio: ${sitioId}, Refresh: ${forceRefresh}`);

    // Perform scraping
    const result = await NoticiasColombiaScraper.scrape(sitioId, forceRefresh);

    // Apply pagination to articles
    const paginatedArticles = result.articles.slice(offset, offset + limit);

    // Get recent articles from database if scraping failed
    let dbArticles: ScrapedArticle[] = [];
    if (!result.success) {
      dbArticles = await NoticiasColombiaScraper.getRecentArticles(sitioId, limit, offset);
    }

    const response = {
      success: result.success,
      data: {
        sitio: {
          id: sitioId,
          nombre: sitioConfig.nombre,
          url: sitioConfig.url,
          categoria: sitioConfig.categoria
        },
        scraping: {
          success: result.success,
          cached: result.cached,
          timestamp: result.timestamp,
          durationMs: result.durationMs,
          error: result.error
        },
        articles: result.success ? paginatedArticles : dbArticles,
        pagination: {
          total: result.success ? result.totalFound : dbArticles.length,
          limit,
          offset,
          hasMore: result.success
            ? offset + limit < result.totalFound
            : dbArticles.length >= limit
        }
      },
      timestamp: new Date().toISOString(),
      processingTime: Date.now() - startTime
    };

    // Return 200 even if scraping failed but we have cached data
    const statusCode = result.success || dbArticles.length > 0 ? 200 : 500;

    return NextResponse.json(response, { status: statusCode });

  } catch (error) {
    console.error('[API] Error in GET /api/noticias-colombia/scrape:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Error al realizar scraping',
        message: error instanceof Error ? error.message : 'Error desconocido',
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime
      },
      { status: 500 }
    );
  }
}
