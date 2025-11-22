/**
 * SCRAPING CACHE SYSTEM
 * High-performance caching layer for news scraping
 * - 5-minute TTL for real-time data
 * - Automatic expiration cleanup
 * - Hit tracking for analytics
 */

import { getDatabaseAdapter } from '@/lib/database-adapter';

export interface CacheEntry {
  id: string;
  sitio_id: string;
  cache_key: string;
  data: string; // JSON stringified
  created_at: string;
  expires_at: string;
  hits: number;
}

export interface CacheStats {
  total_entries: number;
  total_hits: number;
  hit_rate: number;
  oldest_entry: string | null;
  newest_entry: string | null;
}

/**
 * Cache Manager for scraping results
 */
export class ScrapingCache {
  private static TTL_MINUTES = 5; // 5-minute cache

  /**
   * Get cached data for a site
   */
  static async get(sitioId: string): Promise<any | null> {
    try {
      const db = await getDatabaseAdapter();
      const now = new Date().toISOString();
      const cacheKey = this.generateCacheKey(sitioId);

      // Query for valid cache entry
      const query = `
        SELECT * FROM scraping_cache
        WHERE cache_key = ?
        AND expires_at > ?
        LIMIT 1
      `;

      const result = await db.executeQuery(query, [cacheKey, now]);

      if (!result || result.length === 0) {
        return null;
      }

      const entry = result[0] as CacheEntry;

      // Increment hit counter
      await this.incrementHits(entry.id);

      // Parse and return cached data
      return JSON.parse(entry.data);
    } catch (error) {
      console.error('[ScrapingCache] Error getting cache:', error);
      return null;
    }
  }

  /**
   * Set cache data for a site
   */
  static async set(sitioId: string, data: any): Promise<boolean> {
    try {
      const db = await getDatabaseAdapter();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + this.TTL_MINUTES * 60 * 1000);

      const cacheKey = this.generateCacheKey(sitioId);
      const id = this.generateId();

      // Delete existing cache for this key
      await db.executeQuery('DELETE FROM scraping_cache WHERE cache_key = ?', [cacheKey]);

      // Insert new cache entry
      const query = `
        INSERT INTO scraping_cache (
          id, sitio_id, cache_key, data, created_at, expires_at, hits
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      await db.executeQuery(query, [
        id,
        sitioId,
        cacheKey,
        JSON.stringify(data),
        now.toISOString(),
        expiresAt.toISOString(),
        0
      ]);

      return true;
    } catch (error) {
      console.error('[ScrapingCache] Error setting cache:', error);
      return false;
    }
  }

  /**
   * Check if cache exists and is valid
   */
  static async has(sitioId: string): Promise<boolean> {
    try {
      const db = await getDatabaseAdapter();
      const now = new Date().toISOString();
      const cacheKey = this.generateCacheKey(sitioId);

      const query = `
        SELECT COUNT(*) as count FROM scraping_cache
        WHERE cache_key = ?
        AND expires_at > ?
      `;

      const result = await db.executeQuery(query, [cacheKey, now]);
      return result && result[0] && (result[0] as any).count > 0;
    } catch (error) {
      console.error('[ScrapingCache] Error checking cache:', error);
      return false;
    }
  }

  /**
   * Invalidate cache for a specific site
   */
  static async invalidate(sitioId: string): Promise<boolean> {
    try {
      const db = await getDatabaseAdapter();
      const cacheKey = this.generateCacheKey(sitioId);

      await db.executeQuery('DELETE FROM scraping_cache WHERE cache_key = ?', [cacheKey]);
      return true;
    } catch (error) {
      console.error('[ScrapingCache] Error invalidating cache:', error);
      return false;
    }
  }

  /**
   * Clean up expired cache entries
   */
  static async cleanup(): Promise<number> {
    try {
      const db = await getDatabaseAdapter();
      const now = new Date().toISOString();

      const result = await db.executeQuery(
        'DELETE FROM scraping_cache WHERE expires_at < ?',
        [now]
      );

      // Return number of deleted entries (if available)
      return (result as any)?.changes || 0;
    } catch (error) {
      console.error('[ScrapingCache] Error cleaning cache:', error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  static async getStats(): Promise<CacheStats> {
    try {
      const db = await getDatabaseAdapter();

      const statsQuery = `
        SELECT
          COUNT(*) as total_entries,
          COALESCE(SUM(hits), 0) as total_hits,
          MIN(created_at) as oldest_entry,
          MAX(created_at) as newest_entry
        FROM scraping_cache
        WHERE expires_at > ?
      `;

      const result = await db.executeQuery(statsQuery, [new Date().toISOString()]);

      if (!result || result.length === 0) {
        return {
          total_entries: 0,
          total_hits: 0,
          hit_rate: 0,
          oldest_entry: null,
          newest_entry: null
        };
      }

      const stats = result[0] as any;
      const hitRate = stats.total_entries > 0
        ? (stats.total_hits / stats.total_entries)
        : 0;

      return {
        total_entries: stats.total_entries || 0,
        total_hits: stats.total_hits || 0,
        hit_rate: parseFloat(hitRate.toFixed(2)),
        oldest_entry: stats.oldest_entry,
        newest_entry: stats.newest_entry
      };
    } catch (error) {
      console.error('[ScrapingCache] Error getting stats:', error);
      return {
        total_entries: 0,
        total_hits: 0,
        hit_rate: 0,
        oldest_entry: null,
        newest_entry: null
      };
    }
  }

  /**
   * Clear all cache entries
   */
  static async clear(): Promise<boolean> {
    try {
      const db = await getDatabaseAdapter();
      await db.executeQuery('DELETE FROM scraping_cache');
      return true;
    } catch (error) {
      console.error('[ScrapingCache] Error clearing cache:', error);
      return false;
    }
  }

  /**
   * Generate cache key for a site
   */
  private static generateCacheKey(sitioId: string): string {
    // Round to nearest 5 minutes for cache alignment
    const now = new Date();
    const roundedMinutes = Math.floor(now.getMinutes() / 5) * 5;
    const rounded = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), roundedMinutes);

    return `${sitioId}_${rounded.toISOString()}`;
  }

  /**
   * Increment hit counter for cache entry
   */
  private static async incrementHits(cacheId: string): Promise<void> {
    try {
      const db = await getDatabaseAdapter();
      await db.executeQuery(
        'UPDATE scraping_cache SET hits = hits + 1 WHERE id = ?',
        [cacheId]
      );
    } catch (error) {
      // Non-critical error, just log
      console.error('[ScrapingCache] Error incrementing hits:', error);
    }
  }

  /**
   * Generate unique ID
   */
  private static generateId(): string {
    return `cache_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * In-memory cache fallback for when database is unavailable
 */
class MemoryCache {
  private cache = new Map<string, { data: any; expires: number; hits: number }>();
  private static TTL_MS = 5 * 60 * 1000; // 5 minutes

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }

    entry.hits++;
    return entry.data;
  }

  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + MemoryCache.TTL_MS,
      hits: 0
    });
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  cleanup(): number {
    const now = Date.now();
    let deleted = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expires) {
        this.cache.delete(key);
        deleted++;
      }
    }

    return deleted;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Export singleton instance for in-memory cache
export const memoryCache = new MemoryCache();

// Auto-cleanup every 10 minutes
if (typeof window === 'undefined') {
  setInterval(() => {
    ScrapingCache.cleanup().catch(console.error);
    memoryCache.cleanup();
  }, 10 * 60 * 1000);
}
