import { NextRequest, NextResponse } from 'next/server';
import {
  SITIOS_NOTICIAS_COLOMBIA,
  getSitiosByCategoria,
  getSitiosActivos,
  getCategoriaCounts,
  type SitioConfig
} from '@/lib/scraping/sitios-config';
import { NoticiasColombiaScraper } from '@/lib/scraping/noticias-colombia';

export const dynamic = 'force-dynamic';

interface SitioResponse {
  id: string;
  nombre: string;
  url: string;
  logoUrl?: string;
  categoria: string;
  scrapingActivo: boolean;
  stats?: {
    ultimoScrape?: string;
    totalScrapes: number;
    scrapesExitosos: number;
    scrapesFallidos: number;
    tasaExito: number;
  };
}

/**
 * GET /api/noticias-colombia/sitios
 * Lista todos los sitios de noticias colombianos disponibles para scraping
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categoria = searchParams.get('categoria') as SitioConfig['categoria'] | null;
    const soloActivos = searchParams.get('activos') === 'true';
    const incluirStats = searchParams.get('stats') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log('[API] GET /api/noticias-colombia/sitios', {
      categoria,
      soloActivos,
      incluirStats,
      limit,
      offset
    });

    // Filter sites based on parameters
    let sitios = SITIOS_NOTICIAS_COLOMBIA;

    if (categoria) {
      sitios = getSitiosByCategoria(categoria);
    }

    if (soloActivos) {
      sitios = sitios.filter(s => s.scrapingActivo);
    }

    // Apply pagination
    const totalSitios = sitios.length;
    const paginatedSitios = sitios.slice(offset, offset + limit);

    // Build response with optional stats
    const sitiosResponse: SitioResponse[] = await Promise.all(
      paginatedSitios.map(async (sitio) => {
        const baseSitio: SitioResponse = {
          id: sitio.id,
          nombre: sitio.nombre,
          url: sitio.url,
          logoUrl: sitio.logoUrl,
          categoria: sitio.categoria,
          scrapingActivo: sitio.scrapingActivo
        };

        if (incluirStats) {
          const stats = await NoticiasColombiaScraper.getStats(sitio.id);
          if (stats) {
            baseSitio.stats = {
              ultimoScrape: stats.ultimoScrape,
              totalScrapes: stats.totalScrapes,
              scrapesExitosos: stats.scrapesExitosos,
              scrapesFallidos: stats.scrapesFallidos,
              tasaExito: stats.totalScrapes > 0
                ? parseFloat((stats.scrapesExitosos / stats.totalScrapes * 100).toFixed(2))
                : 0
            };
          }
        }

        return baseSitio;
      })
    );

    // Get category counts
    const categoryCounts = getCategoriaCounts();

    return NextResponse.json({
      success: true,
      data: {
        sitios: sitiosResponse,
        pagination: {
          total: totalSitios,
          limit,
          offset,
          hasMore: offset + limit < totalSitios
        },
        summary: {
          totalSitios: categoryCounts.total,
          sitiosActivos: getSitiosActivos().length,
          categorias: {
            nacional: categoryCounts.nacional,
            regional: categoryCounts.regional,
            digital: categoryCounts.digital,
            economico: categoryCounts.economico,
            deportivo: categoryCounts.deportivo
          }
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[API] Error in GET /api/noticias-colombia/sitios:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener lista de sitios de noticias',
        message: error instanceof Error ? error.message : 'Error desconocido',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
