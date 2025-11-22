/**
 * GET /api/news-monitoring/available-sites
 * Retorna lista de sitios de noticias disponibles para monitorear
 */

import { NextRequest, NextResponse } from 'next/server';
import { NEWS_SITES_CONFIG, getSitesStats, getSitesByCategory, type SiteCategory } from '@/lib/news-monitoring/sites-config';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as SiteCategory | null;
    const includeInactive = searchParams.get('includeInactive') === 'true';

    // Filtrar por categoría si se especifica
    let sites = category
      ? getSitesByCategory(category)
      : NEWS_SITES_CONFIG;

    // Filtrar por estado activo si no se solicitan inactivos
    if (!includeInactive) {
      sites = sites.filter(site => site.isActive);
    }

    // Obtener estadísticas
    const stats = getSitesStats();

    // Formatear respuesta
    const response = {
      success: true,
      data: {
        sites: sites.map(site => ({
          id: site.id,
          name: site.name,
          url: site.url,
          logoUrl: site.logoUrl,
          category: site.category,
          scrapingMethod: site.scrapingMethod,
          isActive: site.isActive,
          maxRequestsPerHour: site.maxRequestsPerHour,
        })),
        stats: {
          total: stats.total,
          active: stats.active,
          byCategory: stats.byCategory,
          byMethod: stats.byMethod,
        },
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error: any) {
    console.error('[NEWS-MONITORING] Error fetching available sites:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_SITES_ERROR',
          message: 'Error al obtener sitios disponibles',
          details: error.message,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
