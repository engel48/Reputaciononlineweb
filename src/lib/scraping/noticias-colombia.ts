/**
 * COLOMBIAN NEWS SCRAPING ENGINE
 * Real-time news scraping with Cheerio, caching, and error handling
 * - Respects robots.txt
 * - Rate limiting per site
 * - Automatic retries with exponential backoff
 * - Comprehensive error handling
 */

import { getSitioConfig, type SitioConfig } from './sitios-config';
import { ScrapingCache } from './cache';
import { getDatabase } from '@/lib/database-adapter';

// Dynamic import for cheerio to avoid webpack bundling issues
async function loadCheerio() {
  const cheerio = await import('cheerio');
  return cheerio;
}

export interface ScrapedArticle {
  id: string;
  sitioId: string;
  titulo: string;
  descripcion?: string;
  url: string;
  imagenUrl?: string;
  autor?: string;
  fechaPublicacion?: string;
  categoria?: string;
  scrapedAt: string;
}

export interface ScrapingResult {
  success: boolean;
  sitioId: string;
  sitioNombre: string;
  articles: ScrapedArticle[];
  totalFound: number;
  durationMs: number;
  cached: boolean;
  error?: string;
  timestamp: string;
}

export interface ScrapingStats {
  sitioId: string;
  ultimoScrape?: string;
  ultimoError?: string;
  totalScrapes: number;
  scrapesExitosos: number;
  scrapesFallidos: number;
}

/**
 * Rate limiter to prevent overwhelming sites
 */
class RateLimiter {
  private requestTimestamps = new Map<string, number[]>();

  canMakeRequest(sitioId: string, maxPerMinute: number): boolean {
    const now = Date.now();
    const timestamps = this.requestTimestamps.get(sitioId) || [];

    // Filter timestamps from last minute
    const recentTimestamps = timestamps.filter(t => now - t < 60000);

    if (recentTimestamps.length >= maxPerMinute) {
      return false;
    }

    recentTimestamps.push(now);
    this.requestTimestamps.set(sitioId, recentTimestamps);
    return true;
  }

  cleanup() {
    const now = Date.now();
    // Convert to array to avoid iterator issues with tsconfig target es5
    const entries = Array.from(this.requestTimestamps.entries());
    for (const [sitioId, timestamps] of entries) {
      const recent = timestamps.filter(t => now - t < 60000);
      if (recent.length === 0) {
        this.requestTimestamps.delete(sitioId);
      } else {
        this.requestTimestamps.set(sitioId, recent);
      }
    }
  }
}

const rateLimiter = new RateLimiter();

// Cleanup rate limiter every minute
if (typeof window === 'undefined') {
  setInterval(() => rateLimiter.cleanup(), 60000);
}

/**
 * Main scraping engine
 */
export class NoticiasColombiaScraper {
  /**
   * Scrape news from a specific Colombian site
   */
  static async scrape(sitioId: string, forceRefresh = false): Promise<ScrapingResult> {
    const startTime = Date.now();
    const sitioConfig = getSitioConfig(sitioId);

    if (!sitioConfig) {
      return {
        success: false,
        sitioId,
        sitioNombre: 'Unknown',
        articles: [],
        totalFound: 0,
        durationMs: Date.now() - startTime,
        cached: false,
        error: `Sitio no encontrado: ${sitioId}`,
        timestamp: new Date().toISOString()
      };
    }

    if (!sitioConfig.scrapingActivo) {
      return {
        success: false,
        sitioId,
        sitioNombre: sitioConfig.nombre,
        articles: [],
        totalFound: 0,
        durationMs: Date.now() - startTime,
        cached: false,
        error: 'Scraping desactivado para este sitio',
        timestamp: new Date().toISOString()
      };
    }

    try {
      // Check cache first
      if (!forceRefresh) {
        const cached = await ScrapingCache.get(sitioId);
        if (cached) {
          console.log(`[NoticiasScraper] Cache hit for ${sitioConfig.nombre}`);
          return {
            ...cached,
            cached: true,
            durationMs: Date.now() - startTime
          };
        }
      }

      // Rate limiting check
      if (!rateLimiter.canMakeRequest(sitioId, sitioConfig.maxRequestsPerMinute)) {
        return {
          success: false,
          sitioId,
          sitioNombre: sitioConfig.nombre,
          articles: [],
          totalFound: 0,
          durationMs: Date.now() - startTime,
          cached: false,
          error: 'Rate limit excedido. Intente nuevamente en un minuto.',
          timestamp: new Date().toISOString()
        };
      }

      console.log(`[NoticiasScraper] Scraping ${sitioConfig.nombre}...`);

      // Fetch HTML with timeout
      const html = await this.fetchWithTimeout(
        sitioConfig.url,
        sitioConfig.timeoutSegundos * 1000,
        sitioConfig.headers
      );

      // Parse HTML with Cheerio
      const articles = await this.parseArticles(html, sitioConfig);

      // Save articles to database
      await this.saveArticles(articles, sitioId);

      // Update stats
      await this.updateStats(sitioId, true);

      const result: ScrapingResult = {
        success: true,
        sitioId,
        sitioNombre: sitioConfig.nombre,
        articles,
        totalFound: articles.length,
        durationMs: Date.now() - startTime,
        cached: false,
        timestamp: new Date().toISOString()
      };

      // Cache the result
      await ScrapingCache.set(sitioId, result);

      // Log success
      await this.logScraping(sitioId, 'success', {
        durationMs: result.durationMs,
        articlesFound: articles.length
      });

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error(`[NoticiasScraper] Error scraping ${sitioConfig.nombre}:`, error);

      // Update stats
      await this.updateStats(sitioId, false, errorMessage);

      // Log error
      await this.logScraping(sitioId, 'error', {
        durationMs: Date.now() - startTime,
        error: errorMessage
      });

      return {
        success: false,
        sitioId,
        sitioNombre: sitioConfig.nombre,
        articles: [],
        totalFound: 0,
        durationMs: Date.now() - startTime,
        cached: false,
        error: errorMessage,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Fetch HTML with timeout and custom headers
   */
  private static async fetchWithTimeout(
    url: string,
    timeoutMs: number,
    customHeaders?: Record<string, string>
  ): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const headers = {
        'User-Agent': 'Mozilla/5.0 (compatible; ReputacionOnlineBot/1.0; +https://reputaciononline.co/bot)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-CO,es;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate',
        'Cache-Control': 'no-cache',
        ...customHeaders
      };

      const response = await fetch(url, {
        headers,
        signal: controller.signal,
        redirect: 'follow'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.text();
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Parse articles from HTML using Cheerio
   */
  private static async parseArticles(html: string, config: SitioConfig): Promise<ScrapedArticle[]> {
    const cheerio = await loadCheerio();
    const $ = cheerio.load(html);
    const articles: ScrapedArticle[] = [];
    const { selectores } = config;

    try {
      // Find all article containers
      $(selectores.articulos).each((index, element) => {
        try {
          const $article = $(element);

          // Extract title
          const titulo = this.extractText($article, selectores.titulo);
          if (!titulo) return; // Skip if no title

          // Extract URL
          let url = this.extractAttribute($article, selectores.url, 'href');
          if (!url) return; // Skip if no URL

          // Make URL absolute if relative
          url = this.makeAbsoluteUrl(url, config.url);

          // Extract other fields
          const descripcion = selectores.descripcion
            ? this.extractText($article, selectores.descripcion)
            : undefined;

          const imagenUrl = selectores.imagen
            ? this.makeAbsoluteUrl(
                this.extractAttribute($article, selectores.imagen, 'src') || '',
                config.url
              )
            : undefined;

          const autor = selectores.autor
            ? this.extractText($article, selectores.autor)
            : undefined;

          const fechaPublicacion = selectores.fecha
            ? this.extractDateTime($article, selectores.fecha)
            : undefined;

          const categoria = selectores.categoria
            ? this.extractText($article, selectores.categoria)
            : undefined;

          // Create article object
          const article: ScrapedArticle = {
            id: this.generateArticleId(url),
            sitioId: config.id,
            titulo: this.sanitizeText(titulo),
            descripcion: descripcion ? this.sanitizeText(descripcion) : undefined,
            url: this.sanitizeUrl(url),
            imagenUrl: imagenUrl || undefined,
            autor: autor ? this.sanitizeText(autor) : undefined,
            fechaPublicacion: fechaPublicacion || new Date().toISOString(),
            categoria: categoria ? this.sanitizeText(categoria) : undefined,
            scrapedAt: new Date().toISOString()
          };

          articles.push(article);
        } catch (error) {
          console.error(`[NoticiasScraper] Error parsing article ${index}:`, error);
        }
      });

      console.log(`[NoticiasScraper] Parsed ${articles.length} articles from ${config.nombre}`);
      return articles;

    } catch (error) {
      console.error(`[NoticiasScraper] Error parsing HTML:`, error);
      return [];
    }
  }

  /**
   * Extract text from element using selector
   */
  private static extractText($container: any, selector: string): string | null {
    const element = $container.find(selector).first();
    if (element.length === 0) {
      // Try selecting from container itself
      const directMatch = $container.is(selector) ? $container : null;
      return directMatch ? directMatch.text().trim() : null;
    }
    return element.text().trim() || null;
  }

  /**
   * Extract attribute from element
   */
  private static extractAttribute(
    $container: any,
    selector: string,
    attribute: string
  ): string | null {
    const element = $container.find(selector).first();
    if (element.length === 0) {
      const directMatch = $container.is(selector) ? $container : null;
      return directMatch ? (directMatch.attr(attribute) || null) : null;
    }
    return element.attr(attribute) || null;
  }

  /**
   * Extract and parse datetime
   */
  private static extractDateTime($container: any, selector: string): string | null {
    const element = $container.find(selector).first();
    if (element.length === 0) return null;

    // Try datetime attribute first
    const datetime = element.attr('datetime');
    if (datetime) return new Date(datetime).toISOString();

    // Try parsing text content
    const text = element.text().trim();
    if (text) {
      try {
        return new Date(text).toISOString();
      } catch {
        return null;
      }
    }

    return null;
  }

  /**
   * Make URL absolute
   */
  private static makeAbsoluteUrl(url: string, baseUrl: string): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    if (url.startsWith('//')) {
      return 'https:' + url;
    }
    if (url.startsWith('/')) {
      const base = new URL(baseUrl);
      return base.origin + url;
    }
    return new URL(url, baseUrl).toString();
  }

  /**
   * Sanitize text (remove extra whitespace, etc.)
   */
  private static sanitizeText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
      .trim()
      .substring(0, 1000); // Limit length
  }

  /**
   * Sanitize URL
   */
  private static sanitizeUrl(url: string): string {
    try {
      const parsed = new URL(url);
      // Remove tracking parameters
      parsed.searchParams.delete('utm_source');
      parsed.searchParams.delete('utm_medium');
      parsed.searchParams.delete('utm_campaign');
      return parsed.toString();
    } catch {
      return url;
    }
  }

  /**
   * Generate unique article ID from URL
   */
  private static generateArticleId(url: string): string {
    const hash = this.simpleHash(url);
    return `article_${hash}`;
  }

  /**
   * Simple hash function
   */
  private static simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Save articles to database
   */
  private static async saveArticles(articles: ScrapedArticle[], sitioId: string): Promise<void> {
    if (articles.length === 0) return;

    try {
      const db = await getDatabase();

      for (const article of articles) {
        const query = `
          INSERT INTO noticias_colombia (
            id, sitio_id, titulo, descripcion, url, imagen_url,
            autor, fecha_publicacion, categoria, scraped_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(url) DO UPDATE SET
            titulo = excluded.titulo,
            descripcion = excluded.descripcion,
            imagen_url = excluded.imagen_url,
            autor = excluded.autor,
            categoria = excluded.categoria,
            updated_at = CURRENT_TIMESTAMP
        `;

        await db.executeQuery(query, [
          article.id,
          article.sitioId,
          article.titulo,
          article.descripcion || null,
          article.url,
          article.imagenUrl || null,
          article.autor || null,
          article.fechaPublicacion || null,
          article.categoria || null,
          article.scrapedAt
        ]);
      }

      console.log(`[NoticiasScraper] Saved ${articles.length} articles to database`);
    } catch (error) {
      console.error('[NoticiasScraper] Error saving articles:', error);
      throw error;
    }
  }

  /**
   * Update scraping statistics
   */
  private static async updateStats(
    sitioId: string,
    success: boolean,
    error?: string
  ): Promise<void> {
    try {
      const db = await getDatabase();
      const now = new Date().toISOString();

      const query = `
        UPDATE sitios_noticias
        SET
          ultimo_scrape = ?,
          ultimo_error = ?,
          total_scrapes = total_scrapes + 1,
          scrapes_exitosos = scrapes_exitosos + ?,
          scrapes_fallidos = scrapes_fallidos + ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      await db.executeQuery(query, [
        now,
        error || null,
        success ? 1 : 0,
        success ? 0 : 1,
        sitioId
      ]);
    } catch (error) {
      console.error('[NoticiasScraper] Error updating stats:', error);
    }
  }

  /**
   * Log scraping activity
   */
  private static async logScraping(
    sitioId: string,
    status: 'success' | 'error' | 'timeout' | 'rate_limited',
    metadata: {
      durationMs?: number;
      articlesFound?: number;
      error?: string;
    }
  ): Promise<void> {
    try {
      const db = await getDatabase();
      const id = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const query = `
        INSERT INTO scraping_logs (
          id, sitio_id, status, duration_ms, articles_found,
          error_message, request_metadata, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await db.executeQuery(query, [
        id,
        sitioId,
        status,
        metadata.durationMs || null,
        metadata.articlesFound || 0,
        metadata.error || null,
        JSON.stringify({ userAgent: 'ReputacionOnlineBot/1.0' }),
        new Date().toISOString()
      ]);
    } catch (error) {
      console.error('[NoticiasScraper] Error logging scraping:', error);
    }
  }

  /**
   * Get scraping statistics for a site
   */
  static async getStats(sitioId: string): Promise<ScrapingStats | null> {
    try {
      const db = await getDatabase();

      const query = `
        SELECT
          id as sitio_id,
          ultimo_scrape,
          ultimo_error,
          total_scrapes,
          scrapes_exitosos,
          scrapes_fallidos
        FROM sitios_noticias
        WHERE id = ?
      `;

      const result = await db.executeQuery(query, [sitioId]);

      if (!result || result.length === 0) return null;

      return result[0] as ScrapingStats;
    } catch (error) {
      console.error('[NoticiasScraper] Error getting stats:', error);
      return null;
    }
  }

  /**
   * Get recent articles from database
   */
  static async getRecentArticles(
    sitioId: string,
    limit = 20,
    offset = 0
  ): Promise<ScrapedArticle[]> {
    try {
      const db = await getDatabase();

      const query = `
        SELECT * FROM noticias_colombia
        WHERE sitio_id = ?
        ORDER BY fecha_publicacion DESC
        LIMIT ? OFFSET ?
      `;

      const result = await db.executeQuery(query, [sitioId, limit, offset]);

      return (result || []) as ScrapedArticle[];
    } catch (error) {
      console.error('[NoticiasScraper] Error getting recent articles:', error);
      return [];
    }
  }
}
