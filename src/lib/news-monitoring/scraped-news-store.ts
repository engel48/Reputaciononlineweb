/**
 * Almacén de noticias scrapeadas (tabla scraped_news).
 *
 * Lógica compartida entre:
 *  - POST /api/scraping/run        (admin, manual)
 *  - GET  /api/cron/scrape-news    (cron automático)
 *
 * El sentimiento viene de `scrapeSite` (Groq vía news-monitoring/sentiment.ts); puede ser
 * null = pendiente. No se fabrican valores: se guarda lo que devuelve el análisis real.
 */

import { getActiveSites, NEWS_SITES_CONFIG } from '@/lib/news-monitoring/sites-config';
import { scrapeSite, ScrapingResult, MentionMatch } from '@/lib/news-monitoring/scraper';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export interface ScrapingStats {
  sitesProcessed: number;
  sitesSuccessful: number;
  sitesFailed: number;
  totalArticles: number;
  totalNewsSaved: number;
  errors: string[];
  duration: number;
}

function getClient() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Guarda un artículo en scraped_news (dedup por content_hash). Devuelve true si se insertó.
 */
export async function saveArticleToScrapedNews(
  article: MentionMatch,
  siteName: string,
  siteUrl: string
): Promise<boolean> {
  const supabase = getClient();
  try {
    const contentHash = crypto
      .createHash('sha256')
      .update(`${article.article.url}|${article.article.title}`)
      .digest('hex');

    const { data: existing } = await supabase
      .from('scraped_news')
      .select('id')
      .eq('content_hash', contentHash)
      .single();

    if (existing) return false;

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
    return true;
  } catch (error: any) {
    console.error(`❌ Error en saveArticleToScrapedNews: ${error.message}`);
    return false;
  }
}

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
      if (await saveArticleToScrapedNews(mention, siteName, siteUrl)) saved++;
    }
  }

  return { result, saved };
}

/**
 * Ejecuta scraping de noticias y guarda en scraped_news.
 * Sin searchTerms → usa las keywords activas de todos los usuarios.
 */
export async function runNewsScraping(
  opts: { siteId?: string; searchTerms?: string[]; limit?: number } = {}
): Promise<ScrapingStats> {
  const startTime = Date.now();
  const supabase = getClient();
  const { siteId, searchTerms = [], limit = 10 } = opts;

  let finalSearchTerms = searchTerms;
  if (finalSearchTerms.length === 0) {
    const { data: allKeywords } = await supabase
      .from('monitored_keywords')
      .select('keyword')
      .eq('is_active', true);
    finalSearchTerms = [...new Set((allKeywords || []).map((k: any) => k.keyword))];
  }

  const stats: ScrapingStats = {
    sitesProcessed: 0,
    sitesSuccessful: 0,
    sitesFailed: 0,
    totalArticles: 0,
    totalNewsSaved: 0,
    errors: [],
    duration: 0,
  };

  if (siteId) {
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
    const activeSites = getActiveSites()
      .filter(site => site.rssUrl)
      .slice(0, limit);

    for (const site of activeSites) {
      try {
        const { result, saved } = await scrapeSingleSite(site.id, finalSearchTerms);
        stats.sitesProcessed++;
        if (result.success) {
          stats.sitesSuccessful++;
          stats.totalArticles += result.articlesScraped;
          stats.totalNewsSaved += saved;
        } else {
          stats.sitesFailed++;
          stats.errors.push(`${site.name}: ${result.error}`);
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error: any) {
        stats.sitesFailed++;
        stats.errors.push(`${site.name}: ${error.message}`);
      }
    }
  }

  stats.duration = Date.now() - startTime;
  return stats;
}
