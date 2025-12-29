/**
 * Endpoint para ejecutar scraping de noticias colombianas
 * Usa la configuración local de sites-config.ts y guarda en Supabase
 */

import { NextResponse } from 'next/server';
import { getActiveSites, NEWS_SITES_CONFIG } from '@/lib/news-monitoring/sites-config';
import { scrapeSite, ScrapingResult, MentionMatch } from '@/lib/news-monitoring/scraper';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Inicializar cliente Supabase con service role para escritura
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ScrapingStats {
  sitesProcessed: number;
  sitesSuccessful: number;
  sitesFailed: number;
  totalArticles: number;
  totalNewsSaved: number;
  errors: string[];
  duration: number;
}

/**
 * Guarda un artículo en la tabla scraped_news
 */
async function saveArticleToDatabase(
  article: MentionMatch,
  siteName: string,
  siteUrl: string
): Promise<boolean> {
  try {
    // Generar hash único para evitar duplicados
    const contentHash = crypto
      .createHash('sha256')
      .update(`${article.article.url}|${article.article.title}`)
      .digest('hex');

    // Verificar si ya existe
    const { data: existing } = await supabase
      .from('scraped_news')
      .select('id')
      .eq('content_hash', contentHash)
      .single();

    if (existing) {
      console.log(`⏭️ Noticia ya existe: ${article.article.title.substring(0, 50)}...`);
      return false;
    }

    // Insertar nueva noticia
    const { error } = await supabase.from('scraped_news').insert({
      title: article.article.title,
      content: article.article.content || article.context,
      summary: article.context.substring(0, 300),
      source: siteName,
      source_url: siteUrl,
      article_url: article.article.url,
      published_at: article.article.publishedDate || new Date().toISOString(),
      scraped_at: new Date().toISOString(),
      author: article.article.author || null,
      sentiment: article.sentiment.type,
      sentiment_score: article.sentiment.score,
      relevance_score: article.sentiment.confidence,
      verified: false,
      language: 'es',
      category: 'general',
      keywords: article.matchedTerms || [],
      content_hash: contentHash,
    });

    if (error) {
      console.error(`❌ Error guardando noticia: ${error.message}`);
      return false;
    }

    console.log(`✅ Noticia guardada: ${article.article.title.substring(0, 50)}...`);
    return true;
  } catch (error: any) {
    console.error(`❌ Error en saveArticleToDatabase: ${error.message}`);
    return false;
  }
}

/**
 * Ejecuta scraping para un sitio específico
 */
async function scrapeSingleSite(
  siteId: string,
  searchTerms: string[] = []
): Promise<{ result: ScrapingResult; saved: number }> {
  const result = await scrapeSite(siteId, searchTerms);
  let saved = 0;

  if (result.success && result.mentions.length > 0) {
    const site = NEWS_SITES_CONFIG.find(s => s.id === siteId);
    const siteName = site?.name || siteId;
    const siteUrl = site?.url || '';

    for (const mention of result.mentions) {
      const wasSaved = await saveArticleToDatabase(mention, siteName, siteUrl);
      if (wasSaved) saved++;
    }
  }

  return { result, saved };
}

/**
 * POST /api/scraping/run
 * Ejecuta scraping de todos los sitios activos o uno específico
 */
export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    const body = await request.json().catch(() => ({}));
    const { siteId, searchTerms = [], limit = 10 } = body;

    // Si no hay searchTerms, obtener keywords activas de todos los usuarios
    let finalSearchTerms = searchTerms;
    if (searchTerms.length === 0) {
      const { data: allKeywords } = await supabase
        .from('monitored_keywords')
        .select('keyword')
        .eq('is_active', true);

      finalSearchTerms = [...new Set(allKeywords?.map(k => k.keyword) || [])];
      console.log(`📋 Keywords de usuarios activas: ${finalSearchTerms.length > 0 ? finalSearchTerms.join(', ') : '[ninguna - scrapeando todas]'}`);
    }

    console.log('🚀 Iniciando scraping de noticias...');
    console.log(`📋 Términos de búsqueda: ${finalSearchTerms.length > 0 ? finalSearchTerms.join(', ') : '[todas las noticias]'}`);

    const stats: ScrapingStats = {
      sitesProcessed: 0,
      sitesSuccessful: 0,
      sitesFailed: 0,
      totalArticles: 0,
      totalNewsSaved: 0,
      errors: [],
      duration: 0,
    };

    // Si se especifica un sitio, solo scrapear ese
    if (siteId) {
      console.log(`🎯 Scraping sitio específico: ${siteId}`);
      const { result, saved } = await scrapeSingleSite(siteId, finalSearchTerms);

      stats.sitesProcessed = 1;
      if (result.success) {
        stats.sitesSuccessful = 1;
        stats.totalArticles = result.articlesScraped;
        stats.totalNewsSaved = saved;
      } else {
        stats.sitesFailed = 1;
        stats.errors.push(`${siteId}: ${result.error}`);
      }
    } else {
      // Scrapear múltiples sitios activos con RSS
      const activeSites = getActiveSites()
        .filter(site => site.rssUrl) // Solo sitios con RSS
        .slice(0, limit); // Limitar para no sobrecargar

      console.log(`📡 Procesando ${activeSites.length} sitios con RSS...`);

      for (const site of activeSites) {
        console.log(`\n🔍 Scraping: ${site.name}...`);

        try {
          const { result, saved } = await scrapeSingleSite(site.id, finalSearchTerms);
          stats.sitesProcessed++;

          if (result.success) {
            stats.sitesSuccessful++;
            stats.totalArticles += result.articlesScraped;
            stats.totalNewsSaved += saved;
            console.log(`  ✅ ${result.articlesScraped} artículos, ${saved} guardados`);
          } else {
            stats.sitesFailed++;
            stats.errors.push(`${site.name}: ${result.error}`);
            console.log(`  ❌ ${result.error}`);
          }

          // Pequeña pausa entre sitios para no sobrecargar
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error: any) {
          stats.sitesFailed++;
          stats.errors.push(`${site.name}: ${error.message}`);
          console.log(`  ❌ Error: ${error.message}`);
        }
      }
    }

    stats.duration = Date.now() - startTime;

    console.log('\n📊 RESUMEN DEL SCRAPING:');
    console.log(`  Sitios procesados: ${stats.sitesProcessed}`);
    console.log(`  Exitosos: ${stats.sitesSuccessful}`);
    console.log(`  Fallidos: ${stats.sitesFailed}`);
    console.log(`  Artículos encontrados: ${stats.totalArticles}`);
    console.log(`  Noticias guardadas: ${stats.totalNewsSaved}`);
    console.log(`  Duración: ${stats.duration}ms`);

    return NextResponse.json({
      success: true,
      stats,
      message: `Scraping completado: ${stats.totalNewsSaved} noticias nuevas guardadas`,
    });

  } catch (error: any) {
    console.error('❌ Error en scraping:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stats: {
          sitesProcessed: 0,
          duration: Date.now() - startTime,
        }
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/scraping/run
 * Retorna estadísticas del scraping y sitios disponibles
 */
export async function GET() {
  try {
    const activeSites = getActiveSites();
    const sitesWithRss = activeSites.filter(s => s.rssUrl);
    const sitesWithSitemap = activeSites.filter(s => s.sitemapUrl);

    // Obtener conteo de noticias en BD
    const { count: newsCount } = await supabase
      .from('scraped_news')
      .select('*', { count: 'exact', head: true });

    // Obtener última noticia scrapeada
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
