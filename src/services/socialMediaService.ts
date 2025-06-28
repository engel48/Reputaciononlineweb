import { db as prisma } from "@/lib/db"

export interface SocialMediaMetrics {
  platform: string
  username: string
  followers: number
  following: number
  posts: number
  engagement: number
  recentPosts: SocialPost[]
}

export interface SocialPost {
  id: string
  content: string
  date: string
  likes: number
  shares: number
  comments: number
  sentiment?: 'positive' | 'negative' | 'neutral'
  sentimentScore?: number
  url: string
}

// Servicio para extraer datos de Facebook
export class FacebookService {
  private accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  async getUserProfile() {
    try {
      const response = await fetch(
        `https://graph.facebook.com/me?fields=id,name,followers_count&access_token=${this.accessToken}`
      )
      return await response.json()
    } catch (error) {
      console.error('Error fetching Facebook profile:', error)
      throw error
    }
  }

  async getPageMetrics(pageId: string) {
    try {
      const response = await fetch(
        `https://graph.facebook.com/${pageId}?fields=followers_count,fan_count,posts.limit(10){message,created_time,likes.summary(true),shares,comments.summary(true),permalink_url}&access_token=${this.accessToken}`
      )
      return await response.json()
    } catch (error) {
      console.error('Error fetching Facebook page metrics:', error)
      throw error
    }
  }

  async getRecentPosts(pageId: string): Promise<SocialPost[]> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/${pageId}/posts?fields=id,message,created_time,likes.summary(true),shares,comments.summary(true),permalink_url&limit=10&access_token=${this.accessToken}`
      )
      const data = await response.json()

      return data.data?.map((post: any) => ({
        id: post.id,
        content: post.message || '',
        date: post.created_time,
        likes: post.likes?.summary?.total_count || 0,
        shares: post.shares?.count || 0,
        comments: post.comments?.summary?.total_count || 0,
        url: post.permalink_url || ''
      })) || []
    } catch (error) {
      console.error('Error fetching Facebook posts:', error)
      return []
    }
  }
}

// Servicio para extraer datos de X (Twitter)
export class XService {
  private accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  async getUserProfile() {
    try {
      const response = await fetch(
        'https://api.twitter.com/2/users/me?user.fields=public_metrics,profile_image_url',
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )
      return await response.json()
    } catch (error) {
      console.error('Error fetching X profile:', error)
      throw error
    }
  }

  async getRecentTweets(userId: string): Promise<SocialPost[]> {
    try {
      const response = await fetch(
        `https://api.twitter.com/2/users/${userId}/tweets?tweet.fields=created_at,public_metrics,context_annotations&max_results=10`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )
      const data = await response.json()

      return data.data?.map((tweet: any) => ({
        id: tweet.id,
        content: tweet.text || '',
        date: tweet.created_at,
        likes: tweet.public_metrics?.like_count || 0,
        shares: tweet.public_metrics?.retweet_count || 0,
        comments: tweet.public_metrics?.reply_count || 0,
        url: `https://twitter.com/i/web/status/${tweet.id}`
      })) || []
    } catch (error) {
      console.error('Error fetching X tweets:', error)
      return []
    }
  }
}

// Servicio para extraer datos de Instagram (via Facebook Graph API)
export class InstagramService {
  private accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  async getUserProfile() {
    try {
      const response = await fetch(
        `https://graph.facebook.com/me/accounts?access_token=${this.accessToken}`
      )
      const accounts = await response.json()
      
      // Buscar cuenta de Instagram Business conectada
      const instagramAccount = accounts.data?.find((account: any) => 
        account.instagram_business_account
      )

      if (instagramAccount?.instagram_business_account?.id) {
        const igResponse = await fetch(
          `https://graph.facebook.com/${instagramAccount.instagram_business_account.id}?fields=followers_count,media_count,username&access_token=${this.accessToken}`
        )
        return await igResponse.json()
      }
      
      return null
    } catch (error) {
      console.error('Error fetching Instagram profile:', error)
      throw error
    }
  }

  async getRecentPosts(instagramAccountId: string): Promise<SocialPost[]> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/${instagramAccountId}/media?fields=id,caption,timestamp,like_count,comments_count,media_type,permalink&limit=10&access_token=${this.accessToken}`
      )
      const data = await response.json()

      return data.data?.map((post: any) => ({
        id: post.id,
        content: post.caption || '',
        date: post.timestamp,
        likes: post.like_count || 0,
        shares: 0, // Instagram no expone shares públicamente
        comments: post.comments_count || 0,
        url: post.permalink || ''
      })) || []
    } catch (error) {
      console.error('Error fetching Instagram posts:', error)
      return []
    }
  }
}

// Servicio para extraer datos de LinkedIn
export class LinkedInService {
  private accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  async getUserProfile() {
    try {
      const response = await fetch(
        'https://api.linkedin.com/v2/people/~:(id,firstName,lastName,profilePicture)',
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )
      return await response.json()
    } catch (error) {
      console.error('Error fetching LinkedIn profile:', error)
      throw error
    }
  }

  async getRecentPosts(): Promise<SocialPost[]> {
    try {
      // LinkedIn API es más restrictiva, pero podemos obtener posts básicos
      const response = await fetch(
        'https://api.linkedin.com/v2/shares?q=owners&owners=urn:li:person:PERSON_ID&count=10',
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )
      const data = await response.json()

      return data.elements?.map((share: any) => ({
        id: share.id,
        content: share.text?.text || '',
        date: new Date(share.created?.time || 0).toISOString(),
        likes: 0, // LinkedIn limita acceso a métricas
        shares: 0,
        comments: 0,
        url: ''
      })) || []
    } catch (error) {
      console.error('Error fetching LinkedIn posts:', error)
      return []
    }
  }
}

// Servicio para extraer datos de YouTube (via Google API)
export class YouTubeService {
  private accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  async getUserProfile() {
    try {
      const response = await fetch(
        'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )
      return await response.json()
    } catch (error) {
      console.error('Error fetching YouTube profile:', error)
      throw error
    }
  }

  async getRecentVideos(): Promise<SocialPost[]> {
    try {
      const response = await fetch(
        'https://www.googleapis.com/youtube/v3/search?part=snippet&forMine=true&type=video&order=date&maxResults=10',
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )
      const data = await response.json()

      return data.items?.map((video: any) => ({
        id: video.id.videoId,
        content: video.snippet.title + ' - ' + video.snippet.description,
        date: video.snippet.publishedAt,
        likes: 0, // Requiere llamada adicional para estadísticas
        shares: 0,
        comments: 0,
        url: `https://www.youtube.com/watch?v=${video.id.videoId}`
      })) || []
    } catch (error) {
      console.error('Error fetching YouTube videos:', error)
      return []
    }
  }
}

// Servicio principal para coordinar la extracción de datos
export class SocialListeningService {
  async extractDataForUser(userId: string): Promise<SocialMediaMetrics[]> {
    try {
      // Obtener todas las conexiones activas del usuario
      const connections = await prisma.socialMedia.findMany({
        where: {
          userId,
          connected: true,
          accessToken: { not: null }
        }
      })

      const metrics: SocialMediaMetrics[] = []

      for (const connection of connections) {
        if (!connection.accessToken) continue

        let posts: SocialPost[] = []
        let followers = connection.followers
        let following = connection.following
        let postsCount = connection.posts
        let engagement = connection.engagement

        try {
          switch (connection.platform) {
            case 'facebook':
              const fbService = new FacebookService(connection.accessToken)
              posts = await fbService.getRecentPosts('me') // Usar 'me' o el pageId específico
              break

            case 'x':
              const xService = new XService(connection.accessToken)
              posts = await xService.getRecentTweets('me')
              break

            case 'instagram':
              const igService = new InstagramService(connection.accessToken)
              posts = await igService.getRecentPosts('me')
              break

            case 'linkedin':
              const liService = new LinkedInService(connection.accessToken)
              posts = await liService.getRecentPosts()
              break

            case 'youtube':
              const ytService = new YouTubeService(connection.accessToken)
              posts = await ytService.getRecentVideos()
              break
          }

          // Calcular engagement promedio
          if (posts.length > 0) {
            const totalEngagement = posts.reduce((sum, post) => 
              sum + post.likes + post.shares + post.comments, 0
            )
            engagement = followers > 0 ? (totalEngagement / posts.length / followers) * 100 : 0
          }

          metrics.push({
            platform: connection.platform,
            username: connection.username || '',
            followers,
            following,
            posts: postsCount,
            engagement,
            recentPosts: posts
          })

          // Actualizar métricas en la base de datos
          await prisma.socialMedia.update({
            where: { id: connection.id },
            data: {
              engagement,
              lastSync: new Date()
            }
          })

        } catch (error) {
          console.error(`Error extracting data for ${connection.platform}:`, error)
        }
      }

      return metrics
    } catch (error) {
      console.error('Error in extractDataForUser:', error)
      return []
    }
  }
}
