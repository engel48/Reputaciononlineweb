// =====================================================
// BASE SCRAPER - Clase abstracta para scrapers
// Fecha: 2025-10-29
// =====================================================

import { RawItem, ScraperParams } from '../types.ts'

export abstract class BaseScraper {
  abstract platform: string
  abstract rateLimit: { requestsPerHour?: number; requestsPerMinute?: number }

  /**
   * Método principal de scraping
   * @param params Parámetros de scraping
   * @returns Array de items crudos scrapeados
   */
  abstract scrape(params: ScraperParams): Promise<RawItem[]>

  /**
   * Validar token de acceso
   */
  protected validateToken(accessToken: string | undefined): void {
    if (!accessToken) {
      throw new Error(`No access token provided for ${this.platform}`)
    }
  }

  /**
   * Filtrar items por ventana de tiempo
   */
  protected filterByTimeWindow(
    items: RawItem[],
    lookbackHours: number
  ): RawItem[] {
    const cutoff = new Date(Date.now() - lookbackHours * 60 * 60 * 1000)

    return items.filter(item => {
      return new Date(item.published_at) >= cutoff
    })
  }

  /**
   * Manejar errores de API
   */
  protected handleApiError(error: any, context: string): never {
    console.error(`❌ Error en ${this.platform} (${context}):`, error)

    if (error.response?.status === 429) {
      throw new Error(`RATE_LIMIT: ${this.platform} rate limit exceeded`)
    }

    if (error.response?.status === 401) {
      throw new Error(`AUTH_ERROR: Invalid token for ${this.platform}`)
    }

    throw new Error(`API_ERROR: ${error.message || 'Unknown error'}`)
  }

  /**
   * Log de progreso
   */
  protected log(message: string): void {
    console.log(`[${this.platform.toUpperCase()}] ${message}`)
  }
}
