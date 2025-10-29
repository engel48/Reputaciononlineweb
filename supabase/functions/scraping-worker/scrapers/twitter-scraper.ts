// =====================================================
// TWITTER SCRAPER - Scraping de Twitter/X
// Fecha: 2025-10-29
// =====================================================

import { BaseScraper } from './base-scraper.ts'
import { RawItem, ScraperParams } from '../types.ts'
import { API_URLS } from '../config.ts'

export class TwitterScraper extends BaseScraper {
  platform = 'twitter'
  rateLimit = { requestsPerMinute: 20 } // 300 per 15min = 20 per min

  async scrape(params: ScraperParams): Promise<RawItem[]> {
    this.validateToken(params.access_token)
    const items: RawItem[] = []

    try {
      this.log('Iniciando scraping...')

      // 1. Obtener información del usuario autenticado
      const user = await this.getAuthenticatedUser(params.access_token)
      this.log(`Usuario: @${user.username}`)

      // 2. Buscar menciones del usuario
      const mentions = await this.getUserMentions(
        params.access_token,
        user.id,
        params.config.lookback_hours
      )
      this.log(`Encontradas ${mentions.length} menciones`)

      for (const tweet of mentions) {
        items.push(this.transformTweet(tweet, 'mention'))
      }

      // 3. Si hay keywords, buscar tweets que las contengan
      if (params.keywords.length > 0) {
        for (const keyword of params.keywords) {
          const tweets = await this.searchTweets(
            params.access_token,
            keyword,
            params.config.lookback_hours
          )

          this.log(`Keyword "${keyword}": ${tweets.length} tweets`)

          for (const tweet of tweets) {
            // Evitar duplicados
            if (!items.find(item => item.id === tweet.id)) {
              items.push(this.transformTweet(tweet, 'tweet'))
            }
          }
        }
      }

      this.log(`✅ Total items scrapeados: ${items.length}`)
      return items

    } catch (error) {
      this.handleApiError(error, 'scrape')
    }
  }

  /**
   * Obtener información del usuario autenticado
   */
  private async getAuthenticatedUser(accessToken: string): Promise<any> {
    const url = `${API_URLS.twitter}/users/me?user.fields=id,username,name,profile_image_url`

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to get user: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data
  }

  /**
   * Obtener menciones del usuario
   */
  private async getUserMentions(
    accessToken: string,
    userId: string,
    lookbackHours: number
  ): Promise<any[]> {
    // Calcular fecha de inicio (formato ISO 8601)
    const startTime = new Date(Date.now() - lookbackHours * 60 * 60 * 1000).toISOString()

    const url = `${API_URLS.twitter}/users/${userId}/mentions?` +
      `max_results=100&` +
      `start_time=${startTime}&` +
      `tweet.fields=id,text,created_at,public_metrics,author_id,entities&` +
      `expansions=author_id&` +
      `user.fields=id,username,name,public_metrics`

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      // Si no hay menciones, Twitter retorna 400
      if (response.status === 400) {
        return []
      }
      throw new Error(`Failed to get mentions: ${response.statusText}`)
    }

    const data = await response.json()

    // Combinar tweets con información de autores
    const tweets = data.data || []
    const users = data.includes?.users || []

    return tweets.map((tweet: any) => {
      const author = users.find((u: any) => u.id === tweet.author_id)
      return { ...tweet, author }
    })
  }

  /**
   * Buscar tweets por keyword
   */
  private async searchTweets(
    accessToken: string,
    keyword: string,
    lookbackHours: number
  ): Promise<any[]> {
    // Calcular fecha de inicio
    const startTime = new Date(Date.now() - lookbackHours * 60 * 60 * 1000).toISOString()

    // Escapar keyword para query de Twitter
    const query = encodeURIComponent(keyword)

    const url = `${API_URLS.twitter}/tweets/search/recent?` +
      `query=${query}&` +
      `max_results=100&` +
      `start_time=${startTime}&` +
      `tweet.fields=id,text,created_at,public_metrics,author_id,entities&` +
      `expansions=author_id&` +
      `user.fields=id,username,name,public_metrics`

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      // Si no hay resultados, retornar vacío
      if (response.status === 400) {
        return []
      }
      throw new Error(`Failed to search tweets: ${response.statusText}`)
    }

    const data = await response.json()

    // Combinar tweets con información de autores
    const tweets = data.data || []
    const users = data.includes?.users || []

    return tweets.map((tweet: any) => {
      const author = users.find((u: any) => u.id === tweet.author_id)
      return { ...tweet, author }
    })
  }

  /**
   * Transformar tweet a RawItem
   */
  private transformTweet(tweet: any, type: 'tweet' | 'mention'): RawItem {
    const metrics = tweet.public_metrics || {}
    const author = tweet.author || {}

    return {
      id: tweet.id,
      content: tweet.text || '',
      author: author.name || author.username || 'Unknown',
      author_id: tweet.author_id || 'unknown',
      platform: 'twitter',
      type: type,
      url: `https://twitter.com/i/web/status/${tweet.id}`,
      published_at: new Date(tweet.created_at),
      engagement: {
        likes: metrics.like_count || 0,
        comments: metrics.reply_count || 0,
        shares: metrics.retweet_count || 0
      },
      reach: (metrics.impression_count || 0) ||
             ((metrics.like_count || 0) + (metrics.retweet_count || 0)) * 10,
      metadata: {
        author_username: author.username,
        author_followers: author.public_metrics?.followers_count || 0,
        entities: tweet.entities || {},
        quote_count: metrics.quote_count || 0,
        bookmark_count: metrics.bookmark_count || 0
      }
    }
  }
}
