/**
 * Endpoint para ejecutar scraping de noticias colombianas (ADMIN, manual).
 * Usa la configuración local de sites-config.ts y guarda en scraped_news.
 * La lógica de scraping+guardado vive en @/lib/news-monitoring/scraped-news-store
 * (compartida con el cron /api/cron/scrape-news).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getActiveSites, NEWS_SITES_CONFIG } from '@/lib/news-monitoring/sites-config';
import { runNewsScraping } from '@/lib/news-monitoring/scraped-news-store';
import { createClient } from '@supabase/supabase-js';
import { requireRole } from '@/lib/auth-helper';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * POST /api/scraping/run
 * Ejecuta scraping de todos los sitios activos o uno específico.
 * ADMIN ONLY (proceso pesado, no debe ser triggerable por usuarios).
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireRole(request, 'admin');
    if (admin instanceof NextResponse) return admin;

    const body = await request.json().catch(() => ({}));
    const { siteId, searchTerms = [], limit = 10 } = body;

    const stats = await runNewsScraping({ siteId, searchTerms, limit });

    return NextResponse.json({
      success: true,
      stats,
      message: `Scraping completado: ${stats.totalNewsSaved} noticias nuevas guardadas`,
    });
  } catch (error: any) {
    console.error('❌ Error en scraping:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/scraping/run
 * Retorna estadísticas del scraping y sitios disponibles.
 */
export async function GET() {
  try {
    const activeSites = getActiveSites();
    const sitesWithRss = activeSites.filter(s => s.rssUrl);
    const sitesWithSitemap = activeSites.filter(s => s.sitemapUrl);

    const { count: newsCount } = await supabase
      .from('scraped_news')
      .select('*', { count: 'exact', head: true });

    const { data: lastNews } = await supabase
      .from('scraped_news')
      .select('scraped_at, source')
      .order('scraped_at', { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({
      success: true,
      config: {
        totalSites: NEWS_SITES_CONFIG.length,
        activeSites: activeSites.length,
        sitesWithRss: sitesWithRss.length,
        sitesWithSitemap: sitesWithSitemap.length,
      },
      database: {
        totalNews: newsCount || 0,
        lastScraped: lastNews?.scraped_at || null,
        lastSource: lastNews?.source || null,
      },
      sites: sitesWithRss.map(s => ({
        id: s.id,
        name: s.name,
        category: s.category,
        rssUrl: s.rssUrl,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
