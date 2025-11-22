/**
 * POST /api/news-monitoring/seed-catalog
 * Inicializa el catálogo de sitios de noticias en Supabase
 * ADMIN ONLY - Usar solo en setup inicial o actualización del catálogo
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { NEWS_SITES_CONFIG } from '@/lib/news-monitoring/sites-config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    // Verificar admin secret (simple auth para endpoint de setup)
    const adminSecret = request.headers.get('x-admin-secret');

    if (adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Admin secret inválido',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Preparar datos del catálogo
    const catalogData = NEWS_SITES_CONFIG.map(site => ({
      id: site.id,
      name: site.name,
      url: site.url,
      logo_url: site.logoUrl,
      category: site.category,
      scraping_method: site.scrapingMethod,
      rss_url: site.rssUrl,
      sitemap_url: site.sitemapUrl,
      selectors: site.selectors || {},
      is_active: site.isActive,
      max_requests_per_hour: site.maxRequestsPerHour,
    }));

    console.log(`[SEED-CATALOG] Seeding ${catalogData.length} news sites...`);

    // Upsert (insert or update)
    const { data, error } = await supabase
      .from('news_sites_catalog')
      .upsert(catalogData, {
        onConflict: 'id',
        ignoreDuplicates: false,
      })
      .select();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    console.log(`[SEED-CATALOG] ✓ Successfully seeded ${data?.length || 0} sites`);

    return NextResponse.json(
      {
        success: true,
        data: {
          sitesSeeded: data?.length || 0,
          sites: data,
        },
        message: `Catálogo de ${data?.length || 0} sitios inicializado exitosamente`,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('[SEED-CATALOG] Error seeding catalog:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SEED_ERROR',
          message: 'Error al inicializar catálogo',
          details: error.message,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
