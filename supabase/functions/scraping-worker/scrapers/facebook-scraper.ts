// =====================================================
// FACEBOOK SCRAPER - Scraping de Facebook e Instagram
// Fecha: 2025-10-29
// =====================================================

import { BaseScraper } from './base-scraper.ts'
import { RawItem, ScraperParams } from '../types.ts'
import { API_URLS } from '../config.ts'

export class FacebookScraper extends BaseScraper {
  platform = 'facebook'
  rateLimit = { requestsPerHour: 200 }

  async scrape(params: ScraperParams): Promise<RawItem[]> {
    this.validateToken(params.access_token)
    const items: RawItem[] = []

    try {
      this.log('Iniciando scraping...')

      // 1. Obtener páginas del usuario
      const pages = await this.getUserPages(params.access_token)
      this.log(`Encontradas ${pages.length} páginas`)

      if (pages.length === 0) {
        this.log('Usuario no tiene páginas de Facebook')
        return []
      }

      // 2. Para cada página, obtener posts
      for (const page of pages) {
        try {
          const posts = await this.getPagePosts(
            page.access_token,
            page.id,
            params.config.lookback_hours
          )

          this.log(`Página ${page.name}: ${posts.length} posts`)

          // Transformar posts a RawItem
          for (const post of posts) {
            items.push(this.transformPost(post, page))
          }

          // 3. Obtener comentarios si hay keywords
          if (params.keywords.length > 0) {
            for (const post of posts) {
              const comments = await this.getPostComments(
                page.access_token,
                post.id,
                params.keywords
              )

              for (const comment of comments) {
                items.push(this.transformComment(comment, page, post))
              }
            }
          }
        } catch (error) {
          console.error(`Error en página ${page.name}:`, error)
          // Continuar con siguiente página
        }
      }

      this.log(`✅ Total items scrapeados: ${items.length}`)
      return items

    } catch (error) {
      this.handleApiError(error, 'scrape')
    }
  }

  /**
   * Obtener páginas del usuario
   */
  private async getUserPages(accessToken: string): Promise<any[]> {
    const url = `${API_URLS.facebook}/me/accounts?fields=id,name,access_token&access_token=${accessToken}`

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to get pages: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data || []
  }

  /**
   * Obtener posts de una página
   */
  private async getPagePosts(
    pageAccessToken: string,
    pageId: string,
    lookbackHours: number
  ): Promise<any[]> {
    // Calcular fecha de inicio
    const since = Math.floor(
      (Date.now() - lookbackHours * 60 * 60 * 1000) / 1000
    )

    const url = `${API_URLS.facebook}/${pageId}/posts?` +
      `fields=id,message,created_time,likes.summary(true),comments.summary(true),shares&` +
      `since=${since}&` +
      `limit=50&` +
      `access_token=${pageAccessToken}`

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to get posts: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data || []
  }

  /**
   * Obtener comentarios de un post
   */
  private async getPostComments(
    pageAccessToken: string,
    postId: string,
    keywords: string[]
  ): Promise<any[]> {
    const url = `${API_URLS.facebook}/${postId}/comments?` +
      `fields=id,message,from,created_time,like_count&` +
      `limit=100&` +
      `access_token=${pageAccessToken}`

    const response = await fetch(url)
    if (!response.ok) {
      return [] // Si falla, retornar vacío
    }

    const data = await response.json()
    const comments = data.data || []

    // Filtrar por keywords
    return comments.filter((comment: any) => {
      const message = comment.message?.toLowerCase() || ''
      return keywords.some(kw => message.includes(kw.toLowerCase()))
    })
  }

  /**
   * Transformar post de Facebook a RawItem
   */
  private transformPost(post: any, page: any): RawItem {
    return {
      id: post.id,
      content: post.message || '',
      author: page.name,
      author_id: page.id,
      platform: 'facebook',
      type: 'post',
      url: `https://facebook.com/${post.id}`,
      published_at: new Date(post.created_time),
      engagement: {
        likes: post.likes?.summary?.total_count || 0,
        comments: post.comments?.summary?.total_count || 0,
        shares: post.shares?.count || 0
      },
      reach: (post.likes?.summary?.total_count || 0) * 10, // Estimación
      metadata: {
        page_id: page.id,
        page_name: page.name,
        post_type: 'page_post'
      }
    }
  }

  /**
   * Transformar comentario a RawItem
   */
  private transformComment(comment: any, page: any, post: any): RawItem {
    return {
      id: comment.id,
      content: comment.message || '',
      author: comment.from?.name || 'Unknown',
      author_id: comment.from?.id || 'unknown',
      platform: 'facebook',
      type: 'comment',
      url: `https://facebook.com/${post.id}?comment_id=${comment.id}`,
      published_at: new Date(comment.created_time),
      engagement: {
        likes: comment.like_count || 0,
        comments: 0,
        shares: 0
      },
      reach: comment.like_count || 0,
      metadata: {
        page_id: page.id,
        post_id: post.id,
        comment_type: 'post_comment'
      }
    }
  }
}
