/**
 * RATE LIMITING AND SECURITY FOR NEWS SCRAPING
 * - IP-based rate limiting
 * - User-based rate limiting
 * - Request validation
 * - Security headers
 */

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

/**
 * In-memory rate limiter (can be replaced with Redis in production)
 */
class RateLimiter {
  private requests = new Map<string, { count: number; resetTime: number }>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Cleanup expired entries every 5 minutes
    if (typeof window === 'undefined') {
      this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }
  }

  /**
   * Check if request is allowed
   */
  check(key: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now();
    const entry = this.requests.get(key);

    // No previous requests or window expired
    if (!entry || now > entry.resetTime) {
      this.requests.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      });

      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: now + config.windowMs
      };
    }

    // Window still active
    const remaining = config.maxRequests - entry.count;

    if (remaining > 0) {
      entry.count++;
      this.requests.set(key, entry);

      return {
        allowed: true,
        remaining: remaining - 1,
        resetTime: entry.resetTime
      };
    }

    // Rate limit exceeded
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000)
    };
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    this.requests.delete(key);
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    // Convert to array to avoid iterator issues with tsconfig target es5
    const entries = Array.from(this.requests.entries());
    for (const [key, entry] of entries) {
      if (now > entry.resetTime) {
        this.requests.delete(key);
      }
    }
  }

  /**
   * Get current stats
   */
  getStats(): { totalKeys: number; activeKeys: number } {
    const now = Date.now();
    let activeKeys = 0;

    for (const entry of this.requests.values()) {
      if (now <= entry.resetTime) {
        activeKeys++;
      }
    }

    return {
      totalKeys: this.requests.size,
      activeKeys
    };
  }

  /**
   * Cleanup on destroy
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.requests.clear();
  }
}

// Singleton instance
const globalRateLimiter = new RateLimiter();

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMIT_CONFIGS = {
  // General scraping: 30 requests per minute per IP
  scraping: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30
  },

  // Scrape-all: 5 requests per hour per IP (admin endpoint)
  scrapeAll: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5
  },

  // Site listing: 100 requests per minute per IP
  siteListing: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100
  },

  // User-based scraping: 100 requests per hour per user
  userScraping: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 100
  }
};

/**
 * Check rate limit for IP address
 */
export function checkIPRateLimit(
  ip: string,
  config: RateLimitConfig
): RateLimitResult {
  const key = `ip:${ip}`;
  return globalRateLimiter.check(key, config);
}

/**
 * Check rate limit for user
 */
export function checkUserRateLimit(
  userId: string,
  config: RateLimitConfig
): RateLimitResult {
  const key = `user:${userId}`;
  return globalRateLimiter.check(key, config);
}

/**
 * Reset rate limit for IP
 */
export function resetIPRateLimit(ip: string): void {
  globalRateLimiter.reset(`ip:${ip}`);
}

/**
 * Reset rate limit for user
 */
export function resetUserRateLimit(userId: string): void {
  globalRateLimiter.reset(`user:${userId}`);
}

/**
 * Get rate limiter stats
 */
export function getRateLimiterStats() {
  return globalRateLimiter.getStats();
}

/**
 * Extract IP address from request
 */
export function getClientIP(request: Request): string {
  // Check common headers for real IP
  const headers = request.headers;

  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback to 'unknown' if no IP found
  return 'unknown';
}

/**
 * Validate URL for scraping (security check)
 */
export function isValidScrapingURL(url: string): boolean {
  try {
    const parsed = new URL(url);

    // Only allow HTTP and HTTPS
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }

    // Block localhost and private IPs
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.16.') ||
      hostname.startsWith('172.17.') ||
      hostname.startsWith('172.18.') ||
      hostname.startsWith('172.19.') ||
      hostname.startsWith('172.2') ||
      hostname.startsWith('172.30.') ||
      hostname.startsWith('172.31.')
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitize HTML content
 */
export function sanitizeHTML(html: string): string {
  // Remove script tags
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');

  // Remove javascript: URLs
  sanitized = sanitized.replace(/javascript:/gi, '');

  return sanitized;
}

/**
 * Validate sitio ID
 */
export function isValidSitioID(sitioId: string): boolean {
  // Only allow alphanumeric and hyphens
  return /^[a-z0-9-]+$/i.test(sitioId);
}

/**
 * Generate security headers for responses
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
  };
}

/**
 * Check if user agent is a bot
 */
export function isBotUserAgent(userAgent: string): boolean {
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i
  ];

  return botPatterns.some(pattern => pattern.test(userAgent));
}

/**
 * Log security event
 */
export function logSecurityEvent(event: {
  type: 'rate_limit' | 'invalid_url' | 'bot_detected' | 'invalid_sitio';
  ip: string;
  userId?: string;
  details?: any;
}): void {
  console.warn('[Security]', {
    ...event,
    timestamp: new Date().toISOString()
  });
}
