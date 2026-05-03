/**
 * API ENDPOINT: POST /api/noticias-colombia/scrape-all
 * Scraping masivo de múltiples sitios (admin only)
 *
 * Body params:
 * - sitios: Array de IDs de sitios a scrapear (opcional, default: todos los activos)
 * - categoria: Scrapear solo sitios de una categoría (opcional)
 * - concurrency: Número de scrapes simultáneos (opcional, default: 3, max: 5)
 */

import { NextRequest, NextResponse } from 'next/server';
import { NoticiasColombiaScraper } from '@/lib/scraping/noticias-colombia';
import { requireRole } from '@/lib/auth-helper';
import {
  SITIOS_NOTICIAS_COLOMBIA,
  getSitiosActivos,
  getSitiosByCategoria,
  type SitioConfig
} from '@/lib/scraping/sitios-config';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds for bulk scraping

interface ScrapeAllRequest {
  sitios?: string[];
  categoria?: SitioConfig['categoria'];
  concurrency?: number;
}

interface ScrapeResult {
  sitioId: string;
  sitioNombre: string;
  success: boolean;
  articlesCount: number;
  durationMs: number;
  error?: string;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Admin only — proceso pesado de scraping masivo
    const admin = await requireRole(request, 'admin');
    if (admin instanceof NextResponse) return admin;

    const body: ScrapeAllRequest = await request.json().catch(() => ({}));
    const { sitios: sitioIds, categoria, concurrency = 3 } = body;

    // Validate concurrency
    const maxConcurrency = Math.min(Math.max(1, concurrency), 5);

    console.log('[API] POST /api/noticias-colombia/scrape-all', {
      sitioIds,
      categoria,
      concurrency: maxConcurrency
    });

    // Determine which sites to scrape
    let sitiosToScrape = SITIOS_NOTICIAS_COLOMBIA;

    if (categoria) {
      sitiosToScrape = getSitiosByCategoria(categoria);
    }

    if (sitioIds && sitioIds.length > 0) {
      sitiosToScrape = sitiosToScrape.filter(s => sitioIds.includes(s.id));
    } else {
      // Only scrape active sites if no specific sites requested
      sitiosToScrape = sitiosToScrape.filter(s => s.scrapingActivo);
    }

    if (sitiosToScrape.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No se encontraron sitios para scrapear',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    console.log(`[API] Scraping ${sitiosToScrape.length} sitios con concurrency ${maxConcurrency}`);

    // Perform scraping with concurrency control
    const results = await scrapeWithConcurrency(
      sitiosToScrape.map(s => s.id),
      maxConcurrency
    );

    // Calculate statistics
    const stats = {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      totalArticles: results.reduce((sum, r) => sum + r.articlesCount, 0),
      averageDuration: Math.round(
        results.reduce((sum, r) => sum + r.durationMs, 0) / results.length
      )
    };

    return NextResponse.json({
      success: true,
      data: {
        results,
        stats,
        configuration: {
          sitiosScraped: sitiosToScrape.length,
          concurrency: maxConcurrency,
          categoria: categoria || 'todas'
        }
      },
      timestamp: new Date().toISOString(),
      totalDuration: Date.now() - startTime
    });

  } catch (error) {
    console.error('[API] Error in POST /api/noticias-colombia/scrape-all:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Error en scraping masivo',
        message: error instanceof Error ? error.message : 'Error desconocido',
        timestamp: new Date().toISOString(),
        totalDuration: Date.now() - startTime
      },
      { status: 500 }
    );
  }
}

/**
 * Scrape multiple sites with concurrency control
 */
async function scrapeWithConcurrency(
  sitioIds: string[],
  concurrency: number
): Promise<ScrapeResult[]> {
  const results: ScrapeResult[] = [];
  const queue = [...sitioIds];

  // Process in batches
  while (queue.length > 0) {
    const batch = queue.splice(0, concurrency);

    const batchResults = await Promise.all(
      batch.map(async (sitioId) => {
        const startTime = Date.now();

        try {
          const result = await NoticiasColombiaScraper.scrape(sitioId, false);

          return {
            sitioId,
            sitioNombre: result.sitioNombre,
            success: result.success,
            articlesCount: result.totalFound,
            durationMs: result.durationMs,
            error: result.error
          };
        } catch (error) {
          return {
            sitioId,
            sitioNombre: 'Unknown',
            success: false,
            articlesCount: 0,
            durationMs: Date.now() - startTime,
            error: error instanceof Error ? error.message : 'Error desconocido'
          };
        }
      })
    );

    results.push(...batchResults);

    // Log progress
    console.log(`[ScrapeAll] Processed ${results.length}/${sitioIds.length} sitios`);

    // Small delay between batches to avoid overwhelming the system
    if (queue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}

/**
 * GET endpoint for checking scrape-all status
 */
export async function GET(request: NextRequest) {
  try {
    // Return information about the scrape-all endpoint
    return NextResponse.json({
      success: true,
      info: {
        endpoint: 'POST /api/noticias-colombia/scrape-all',
        description: 'Scraping masivo de múltiples sitios de noticias colombianos',
        authentication: 'Admin only (TODO: Implement)',
        parameters: {
          sitios: {
            type: 'string[]',
            required: false,
            description: 'Array de IDs de sitios a scrapear'
          },
          categoria: {
            type: 'string',
            required: false,
            enum: ['nacional', 'regional', 'digital', 'economico', 'deportivo'],
            description: 'Scrapear solo sitios de una categoría'
          },
          concurrency: {
            type: 'number',
            required: false,
            default: 3,
            max: 5,
            description: 'Número de scrapes simultáneos'
          }
        },
        example: {
          sitios: ['eltiempo', 'elespectador', 'semana'],
          concurrency: 3
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener información del endpoint',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
