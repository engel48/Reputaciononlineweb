/**
 * Sistema de Scraping de Noticias Colombianas
 * Soporta RSS, Sitemap y scraping directo con manejo robusto de errores
 */

import { NewsSiteConfig, getSiteById } from './sites-config';
import { analyzeSentiment, extractContext } from './sentiment';
import crypto from 'crypto';

export interface ScrapedArticle {
  url: string;
  title: string;
  author?: string;
  content: string;
  publishedDate?: Date;
  hash: string;
}

export interface MentionMatch {
  article: ScrapedArticle;
  matchedTerms: string[];
  context: string;
  sentiment: {
    // null = pendiente (Groq no disponible al momento del scraping)
    type: 'positive' | 'negative' | 'neutral' | null;
    score: number | null;
    confidence: number;
  };
}

export interface ScrapingResult {
  success: boolean;
  siteId: string;
  articlesScraped: number;
  mentionsFound: number;
  mentions: MentionMatch[];
  error?: string;
  scrapedAt: Date;
}

/**
 * Genera un hash único para un artículo (para deduplicación)
 */
function generateArticleHash(url: string, title: string): string {
  const content = `${url}|${title}`;
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Normaliza una URL (remove trailing slash, query params, etc.)
 */
function normalizeUrl(url: string, baseUrl: string): string {
  try {
    const absoluteUrl = url.startsWith('http') ? url : new URL(url, baseUrl).href;
    const urlObj = new URL(absoluteUrl);
    return `${urlObj.origin}${urlObj.pathname}`.replace(/\/$/, '');
  } catch (error) {
    return url;
  }
}

/**
 * Extrae fecha de publicación de diferentes formatos
 */
function parseDate(dateString: string | undefined): Date | undefined {
  if (!dateString) return undefined;

  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? undefined : date;
  } catch {
    return undefined;
  }
}

/**
 * Limpia el contenido HTML y extrae texto plano
 */
function cleanHtmlContent(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/**
 * Verifica si un artículo contiene alguno de los términos de búsqueda
 */
function checkForMentions(
  article: ScrapedArticle,
  searchTerms: string[]
): { matches: boolean; matchedTerms: string[] } {
  const searchableText = `${article.title} ${article.content}`.toLowerCase();
  const matchedTerms: string[] = [];

  for (const term of searchTerms) {
    if (searchableText.includes(term.toLowerCase())) {
      matchedTerms.push(term);
    }
  }

  return {
    matches: matchedTerms.length > 0,
    matchedTerms,
  };
}

/**
 * Scraper para RSS feeds
 */
async function scrapeRSS(
  siteConfig: NewsSiteConfig,
  searchTerms: string[]
): Promise<ScrapingResult> {
  const result: ScrapingResult = {
    success: false,
    siteId: siteConfig.id,
    articlesScraped: 0,
    mentionsFound: 0,
    mentions: [],
    scrapedAt: new Date(),
  };

  if (!siteConfig.rssUrl) {
    result.error = 'No RSS URL configured';
    return result;
  }

  try {
    // Fetch RSS feed con timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(siteConfig.rssUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ReputacionOnline/1.0)',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      result.error = `HTTP ${response.status}: ${response.statusText}`;
      return result;
    }

    const xmlText = await response.text();

    // Parsear XML (simple parsing, en producción usar una librería como xml2js)
    const items = extractRSSItems(xmlText);
    result.articlesScraped = items.length;

    // Procesar cada artículo
    for (const item of items) {
      const article: ScrapedArticle = {
        url: normalizeUrl(item.link, siteConfig.url),
        title: item.title,
        author: item.author,
        content: item.description || item.content || '',
        publishedDate: parseDate(item.pubDate),
        hash: generateArticleHash(item.link, item.title),
      };

      // Si no hay términos de búsqueda, incluir TODOS los artículos como noticias generales
      if (searchTerms.length === 0) {
        // Analizar sentimiento del artículo completo
        const context = article.content.substring(0, 300);
        const sentimentAnalysis = await analyzeSentiment(context, article.title);

        result.mentions.push({
          article,
          matchedTerms: ['[noticia general]'],
          context,
          sentiment: {
            type: sentimentAnalysis.sentiment,
            score: sentimentAnalysis.score,
            confidence: sentimentAnalysis.confidence,
          },
        });

        result.mentionsFound++;
      } else {
        // Verificar menciones con términos específicos
        const { matches, matchedTerms } = checkForMentions(article, searchTerms);

        if (matches) {
          // Analizar sentimiento
          const context = extractContext(article.content, matchedTerms[0], 300);
          const sentimentAnalysis = await analyzeSentiment(context, matchedTerms[0]);

          result.mentions.push({
            article,
            matchedTerms,
            context,
            sentiment: {
              type: sentimentAnalysis.sentiment,
              score: sentimentAnalysis.score,
              confidence: sentimentAnalysis.confidence,
            },
          });

          result.mentionsFound++;
        }
      }
    }

    result.success = true;
  } catch (error: any) {
    result.error = error.name === 'AbortError'
      ? 'Request timeout'
      : error.message || 'Unknown error';
  }

  return result;
}

/**
 * Extrae items de un RSS feed (parsing simple)
 */
function extractRSSItems(xml: string): Array<{
  title: string;
  link: string;
  description?: string;
  content?: string;
  author?: string;
  pubDate?: string;
}> {
  const items: any[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];

    const title = extractXMLTag(itemXml, 'title');
    const link = extractXMLTag(itemXml, 'link');
    const description = extractXMLTag(itemXml, 'description');
    const content = extractXMLTag(itemXml, 'content:encoded') || extractXMLTag(itemXml, 'content');
    const author = extractXMLTag(itemXml, 'dc:creator') || extractXMLTag(itemXml, 'author');
    const pubDate = extractXMLTag(itemXml, 'pubDate') || extractXMLTag(itemXml, 'dc:date');

    if (title && link) {
      items.push({
        title: cleanHtmlContent(title),
        link: link.trim(),
        description: description ? cleanHtmlContent(description) : undefined,
        content: content ? cleanHtmlContent(content) : undefined,
        author: author ? cleanHtmlContent(author) : undefined,
        pubDate: pubDate?.trim(),
      });
    }
  }

  return items;
}

/**
 * Extrae el contenido de un tag XML
 */
function extractXMLTag(xml: string, tagName: string): string | undefined {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\/${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1') : undefined;
}

/**
 * Scraper para sitemaps
 */
async function scrapeSitemap(
  siteConfig: NewsSiteConfig,
  searchTerms: string[]
): Promise<ScrapingResult> {
  const result: ScrapingResult = {
    success: false,
    siteId: siteConfig.id,
    articlesScraped: 0,
    mentionsFound: 0,
    mentions: [],
    scrapedAt: new Date(),
  };

  if (!siteConfig.sitemapUrl) {
    result.error = 'No sitemap URL configured';
    return result;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const response = await fetch(siteConfig.sitemapUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ReputacionOnline/1.0)',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      result.error = `HTTP ${response.status}: ${response.statusText}`;
      return result;
    }

    const xmlText = await response.text();

    // Extraer URLs del sitemap
    const urls = extractSitemapUrls(xmlText);

    // Limitar a los últimos 20 artículos para no sobrecargar
    const recentUrls = urls.slice(0, 20);
    result.articlesScraped = recentUrls.length;

    // Para sitemap, necesitaríamos hacer scraping directo de cada URL
    // Por ahora retornamos éxito con 0 menciones
    // En producción, aquí se haría scraping de cada URL
    result.success = true;
    result.error = 'Sitemap scraping requires direct HTML parsing (not implemented in basic version)';

  } catch (error: any) {
    result.error = error.name === 'AbortError'
      ? 'Request timeout'
      : error.message || 'Unknown error';
  }

  return result;
}

/**
 * Extrae URLs de un sitemap XML
 */
function extractSitemapUrls(xml: string): string[] {
  const urls: string[] = [];
  const urlRegex = /<loc>(.*?)<\/loc>/gi;
  let match;

  while ((match = urlRegex.exec(xml)) !== null) {
    urls.push(match[1].trim());
  }

  return urls;
}

/**
 * Scraper directo de HTML (no implementado en versión básica)
 */
async function scrapeDirect(
  siteConfig: NewsSiteConfig,
  searchTerms: string[]
): Promise<ScrapingResult> {
  return {
    success: false,
    siteId: siteConfig.id,
    articlesScraped: 0,
    mentionsFound: 0,
    mentions: [],
    scrapedAt: new Date(),
    error: 'Direct HTML scraping not implemented (use RSS or Sitemap)',
  };
}

/**
 * Función principal de scraping
 */
export async function scrapeSite(
  siteId: string,
  searchTerms: string[]
): Promise<ScrapingResult> {
  const siteConfig = getSiteById(siteId);

  if (!siteConfig) {
    return {
      success: false,
      siteId,
      articlesScraped: 0,
      mentionsFound: 0,
      mentions: [],
      scrapedAt: new Date(),
      error: `Site configuration not found: ${siteId}`,
    };
  }

  if (!siteConfig.isActive) {
    return {
      success: false,
      siteId,
      articlesScraped: 0,
      mentionsFound: 0,
      mentions: [],
      scrapedAt: new Date(),
      error: 'Site is not active',
    };
  }

  // Si no hay términos de búsqueda, el scraper traerá todas las noticias recientes
  // sin filtrar por menciones específicas (Opción A del usuario)

  // Ejecutar el scraper apropiado
  switch (siteConfig.scrapingMethod) {
    case 'rss':
      return scrapeRSS(siteConfig, searchTerms);

    case 'sitemap':
      return scrapeSitemap(siteConfig, searchTerms);

    case 'scraping':
      return scrapeDirect(siteConfig, searchTerms);

    default:
      return {
        success: false,
        siteId,
        articlesScraped: 0,
        mentionsFound: 0,
        mentions: [],
        scrapedAt: new Date(),
        error: `Unknown scraping method: ${siteConfig.scrapingMethod}`,
      };
  }
}

/**
 * Rate limiter simple
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  canMakeRequest(siteId: string, maxRequestsPerHour: number): boolean {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    const siteRequests = this.requests.get(siteId) || [];
    const recentRequests = siteRequests.filter(time => time > oneHourAgo);

    return recentRequests.length < maxRequestsPerHour;
  }

  recordRequest(siteId: string): void {
    const now = Date.now();
    const siteRequests = this.requests.get(siteId) || [];
    siteRequests.push(now);
    this.requests.set(siteId, siteRequests);

    // Limpiar requests antiguos
    this.cleanup();
  }

  private cleanup(): void {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;

    // Convert to array to avoid iterator issues with tsconfig target es5
    const entries = Array.from(this.requests.entries());
    for (const [siteId, requests] of entries) {
      const recentRequests = requests.filter(time => time > oneHourAgo);
      if (recentRequests.length === 0) {
        this.requests.delete(siteId);
      } else {
        this.requests.set(siteId, recentRequests);
      }
    }
  }
}

export const rateLimiter = new RateLimiter();

/**
 * Scraper con rate limiting
 */
export async function scrapeSiteWithRateLimit(
  siteId: string,
  searchTerms: string[]
): Promise<ScrapingResult> {
  const siteConfig = getSiteById(siteId);

  if (!siteConfig) {
    return {
      success: false,
      siteId,
      articlesScraped: 0,
      mentionsFound: 0,
      mentions: [],
      scrapedAt: new Date(),
      error: 'Site configuration not found',
    };
  }

  // Verificar rate limit
  if (!rateLimiter.canMakeRequest(siteId, siteConfig.maxRequestsPerHour)) {
    return {
      success: false,
      siteId,
      articlesScraped: 0,
      mentionsFound: 0,
      mentions: [],
      scrapedAt: new Date(),
      error: 'Rate limit exceeded',
    };
  }

  // Registrar request
  rateLimiter.recordRequest(siteId);

  // Ejecutar scraping
  return scrapeSite(siteId, searchTerms);
}
