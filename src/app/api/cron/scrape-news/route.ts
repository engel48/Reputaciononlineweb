/**
 * Cron de scraping de noticias colombianas → tabla scraped_news.
 *
 * Antes NO existía: scraped_news solo se llenaba con POST /api/scraping/run (admin, manual),
 * por eso dejó de alimentarse (~28-abr). Este endpoint lo automatiza vía pg_cron.
 *
 * GET /api/cron/scrape-news?limit=24
 * Auth: header `Authorization: Bearer <CRON_SECRET>` (igual que /api/cron/monitor-keywords).
 */

import { NextRequest, NextResponse } from 'next/server';
import { runNewsScraping } from '@/lib/news-monitoring/scraped-news-store';

export const dynamic = 'force-dynamic';

const CRON_SECRET = process.env.CRON_SECRET || '';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  try {
    const authHeader = request.headers.get('authorization');
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '24', 10);

    console.log('🕐 Cron scrape-news iniciado');
    const stats = await runNewsScraping({ limit });
    console.log(`📊 scrape-news: ${stats.totalNewsSaved} noticias nuevas (${stats.sitesSuccessful}/${stats.sitesProcessed} sitios OK)`);

    return NextResponse.json({
      success: true,
      stats,
      duration: `${Date.now() - startTime}ms`,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('❌ Error en cron scrape-news:', error);
    return NextResponse.json(
      { success: false, error: error.message, duration: `${Date.now() - startTime}ms` },
      { status: 500 }
    );
  }
}
