import { Account, Profile } from 'next-auth';

export interface ThreadsProfile extends Profile {
  id: string;
  username: string;
  name: string;
  threads_profile_picture_url: string;
  threads_biography: string;
  account_type: 'PERSONAL' | 'BUSINESS';
  website_url?: string;
  followers_count?: number;
  media_count?: number;
}

export interface ThreadsAccount extends Account {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
}

export interface ThreadsMedia {
  id: string;
  media_type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url?: string;
  permalink: string;
  text?: string;
  timestamp: string;
  username: string;
  children?: {
    data: Array<{
      id: string;
      media_type: string;
      media_url?: string;
    }>;
  };
  insights?: {
    likes: number;
    replies: number;
    reposts: number;
    quotes: number;
    views: number;
  };
}

export interface ThreadsReply {
  id: string;
  text?: string;
  username: string;
  timestamp: string;
  media_type: 'TEXT' | 'IMAGE' | 'VIDEO';
  media_url?: string;
  permalink: string;
  has_replies: boolean;
  is_reply: boolean;
  is_reply_owned_by_me: boolean;
  root_post: {
    id: string;
  };
}

export interface ThreadsInsights {
  likes: number;
  replies: number;
  reposts: number;
  quotes: number;
  views: number;
  reach: number;
  profile_views: number;
}

export class ThreadsOAuthService {
  private baseUrl = 'https://graph.threads.net';
  private apiVersion = 'v1.0';

  /**
   * Obtiene el perfil del usuario autenticado en Threads
   */
  async getProfile(accessToken: string): Promise<ThreadsProfile | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${this.apiVersion}/me?fields=id,username,name,threads_profile_picture_url,threads_biography,account_type,website_url`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Threads API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error obteniendo perfil de Threads:', error);
      return null;
    }
  }

  /**
   * Obtiene métricas adicionales del perfil (requiere permisos especiales)
   */
  async getProfileMetrics(accessToken: string, userId: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${this.apiVersion}/${userId}?fields=followers_count,media_count`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Threads API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error obteniendo métricas de Threads:', error);
      return null;
    }
  }

  /**
   * Obtiene los posts/threads del usuario
   */
  async getUserThreads(accessToken: string, userId: string, limit: number = 25): Promise<ThreadsMedia[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${this.apiVersion}/${userId}/threads?fields=id,media_type,media_url,permalink,text,timestamp,username&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Threads API error: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error obteniendo threads del usuario:', error);
      return [];
    }
  }

  /**
   * Obtiene las respuestas a un thread específico
   */
  async getThreadReplies(accessToken: string, threadId: string, limit: number = 25): Promise<ThreadsReply[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${this.apiVersion}/${threadId}/replies?fields=id,text,username,timestamp,media_type,media_url,permalink,has_replies,is_reply,is_reply_owned_by_me,root_post&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Threads API error: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error obteniendo respuestas del thread:', error);
      return [];
    }
  }

  /**
   * Obtiene insights/métricas de un thread específico
   */
  async getThreadInsights(accessToken: string, threadId: string): Promise<ThreadsInsights | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${this.apiVersion}/${threadId}/insights?metric=likes,replies,reposts,quotes,views`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Threads API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Procesar métricas
      const insights: ThreadsInsights = {
        likes: 0,
        replies: 0,
        reposts: 0,
        quotes: 0,
        views: 0,
        reach: 0,
        profile_views: 0
      };

      data.data?.forEach((metric: any) => {
        switch (metric.name) {
          case 'likes':
            insights.likes = metric.values[0]?.value || 0;
            break;
          case 'replies':
            insights.replies = metric.values[0]?.value || 0;
            break;
          case 'reposts':
            insights.reposts = metric.values[0]?.value || 0;
            break;
          case 'quotes':
            insights.quotes = metric.values[0]?.value || 0;
            break;
          case 'views':
            insights.views = metric.values[0]?.value || 0;
            break;
        }
      });

      return insights;
    } catch (error) {
      console.error('Error obteniendo insights del thread:', error);
      return null;
    }
  }

  /**
   * Busca menciones del usuario en threads públicos
   */
  async searchMentions(accessToken: string, query: string, limit: number = 25): Promise<ThreadsMedia[]> {
    try {
      // Esta funcionalidad puede requerir permisos especiales en Threads API
      const response = await fetch(
        `${this.baseUrl}/${this.apiVersion}/threads/search?q=${encodeURIComponent(query)}&fields=id,media_type,media_url,permalink,text,timestamp,username&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Threads API error: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error buscando menciones en Threads:', error);
      return [];
    }
  }

  /**
   * Publica un nuevo thread (requiere permisos de publicación)
   */
  async publishThread(accessToken: string, userId: string, text: string, mediaUrl?: string): Promise<any> {
    try {
      const body: any = {
        media_type: mediaUrl ? 'IMAGE' : 'TEXT',
        text: text
      };

      if (mediaUrl) {
        body.image_url = mediaUrl;
      }

      const response = await fetch(
        `${this.baseUrl}/${this.apiVersion}/${userId}/threads`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body)
        }
      );

      if (!response.ok) {
        throw new Error(`Threads API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error publicando thread:', error);
      return null;
    }
  }

  /**
   * Responde a un thread existente
   */
  async replyToThread(accessToken: string, userId: string, text: string, replyToId: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${this.apiVersion}/${userId}/threads`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            media_type: 'TEXT',
            text: text,
            reply_to_id: replyToId
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Threads API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error respondiendo al thread:', error);
      return null;
    }
  }

  /**
   * Analiza el sentimiento de respuestas/menciones
   */
  async analyzeThreadSentiment(threads: ThreadsMedia[]): Promise<any> {
    try {
      const sentimentAnalysis = threads.map(thread => {
        const text = thread.text?.toLowerCase() || '';
        let sentiment = 'neutral';
        let score = 0;

        // Palabras positivas para Threads
        const positiveWords = [
          'excelente', 'increíble', 'genial', 'me gusta', 'love', 'awesome', 'amazing',
          'great', 'fantastic', 'wonderful', 'perfect', 'good', 'nice', 'cool',
          'thanks', 'gracias', 'helpful', 'útil', 'inspiring', 'brilliant'
        ];
        
        const negativeWords = [
          'malo', 'terrible', 'horrible', 'odio', 'disgusto', 'bad', 'hate', 'awful',
          'stupid', 'boring', 'waste', 'dislike', 'worst', 'garbage', 'trash', 'annoying'
        ];

        positiveWords.forEach(word => {
          if (text.includes(word)) score += 1;
        });

        negativeWords.forEach(word => {
          if (text.includes(word)) score -= 1;
        });

        if (score > 0) sentiment = 'positive';
        else if (score < 0) sentiment = 'negative';

        return {
          thread_id: thread.id,
          text: thread.text || '',
          username: thread.username,
          sentiment,
          score,
          engagement: (thread.insights?.likes || 0) + (thread.insights?.replies || 0),
          timestamp: thread.timestamp
        };
      });

      const totalThreads = sentimentAnalysis.length;
      const positive = sentimentAnalysis.filter(t => t.sentiment === 'positive').length;
      const negative = sentimentAnalysis.filter(t => t.sentiment === 'negative').length;
      const neutral = sentimentAnalysis.filter(t => t.sentiment === 'neutral').length;

      return {
        summary: {
          total_threads: totalThreads,
          positive_percentage: totalThreads > 0 ? (positive / totalThreads) * 100 : 0,
          negative_percentage: totalThreads > 0 ? (negative / totalThreads) * 100 : 0,
          neutral_percentage: totalThreads > 0 ? (neutral / totalThreads) * 100 : 0,
        },
        detailed_analysis: sentimentAnalysis
      };
    } catch (error) {
      console.error('Error analizando sentimiento de threads:', error);
      return null;
    }
  }

  /**
   * Obtiene métricas consolidadas del usuario en Threads
   */
  async getUserMetrics(accessToken: string, userId: string): Promise<any> {
    try {
      const profile = await this.getProfile(accessToken);
      if (!profile) return null;

      const profileMetrics = await this.getProfileMetrics(accessToken, userId);
      const threads = await this.getUserThreads(accessToken, userId, 100);
      
      // Calcular métricas agregadas
      let totalLikes = 0;
      let totalReplies = 0;
      let totalReposts = 0;
      let totalViews = 0;

      for (const thread of threads) {
        const insights = await this.getThreadInsights(accessToken, thread.id);
        if (insights) {
          totalLikes += insights.likes;
          totalReplies += insights.replies;
          totalReposts += insights.reposts;
          totalViews += insights.views;
        }
      }

      const avgLikes = threads.length > 0 ? totalLikes / threads.length : 0;
      const avgReplies = threads.length > 0 ? totalReplies / threads.length : 0;
      const avgEngagement = threads.length > 0 ? (totalLikes + totalReplies + totalReposts) / threads.length : 0;

      return {
        profile_stats: {
          followers_count: profileMetrics?.followers_count || 0,
          media_count: profileMetrics?.media_count || 0,
          account_type: profile.account_type
        },
        content_metrics: {
          total_threads: threads.length,
          total_likes: totalLikes,
          total_replies: totalReplies,
          total_reposts: totalReposts,
          total_views: totalViews,
          avg_likes_per_thread: Math.round(avgLikes),
          avg_replies_per_thread: Math.round(avgReplies),
          avg_engagement_per_thread: Math.round(avgEngagement)
        },
        recent_threads: threads.slice(0, 10)
      };
    } catch (error) {
      console.error('Error obteniendo métricas del usuario en Threads:', error);
      return null;
    }
  }

  /**
   * Verifica si el token de acceso es válido
   */
  async validateToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${this.apiVersion}/me?fields=id`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Error validando token de Threads:', error);
      return false;
    }
  }
}

export const threadsOAuth = new ThreadsOAuthService();
