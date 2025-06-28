import { Account, Profile } from 'next-auth';

export interface YouTubeProfile extends Profile {
  id: string;
  snippet: {
    title: string;
    description: string;
    customUrl: string;
    publishedAt: string;
    thumbnails: {
      default: { url: string };
      medium: { url: string };
      high: { url: string };
    };
    country?: string;
  };
  statistics: {
    viewCount: string;
    subscriberCount: string;
    hiddenSubscriberCount: boolean;
    videoCount: string;
  };
}

export interface YouTubeAccount extends Account {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
}

export interface YouTubeVideo {
  id: string;
  snippet: {
    title: string;
    description: string;
    publishedAt: string;
    thumbnails: {
      default: { url: string };
      medium: { url: string };
      high: { url: string };
    };
    channelId: string;
    channelTitle: string;
    tags?: string[];
  };
  statistics: {
    viewCount: string;
    likeCount: string;
    favoriteCount: string;
    commentCount: string;
  };
}

export interface YouTubeComment {
  id: string;
  snippet: {
    textDisplay: string;
    textOriginal: string;
    authorDisplayName: string;
    authorProfileImageUrl: string;
    authorChannelUrl: string;
    authorChannelId: string;
    likeCount: number;
    publishedAt: string;
    updatedAt: string;
  };
}

export class YouTubeOAuthService {
  private baseUrl = 'https://www.googleapis.com/youtube/v3';

  /**
   * Obtiene información del canal del usuario autenticado
   */
  async getChannelProfile(accessToken: string): Promise<YouTubeProfile | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/channels?part=snippet,statistics&mine=true`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        return {
          id: data.items[0].id,
          snippet: data.items[0].snippet,
          statistics: data.items[0].statistics
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error obteniendo perfil de YouTube:', error);
      return null;
    }
  }

  /**
   * Obtiene los videos del canal del usuario
   */
  async getChannelVideos(accessToken: string, maxResults: number = 10): Promise<YouTubeVideo[]> {
    try {
      // Primero obtenemos el canal para conseguir el channelId
      const channel = await this.getChannelProfile(accessToken);
      if (!channel) return [];

      const response = await fetch(
        `${this.baseUrl}/search?part=snippet&channelId=${channel.id}&type=video&order=date&maxResults=${maxResults}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        // Obtenemos estadísticas detalladas para cada video
        const videoIds = data.items.map((item: any) => item.id.videoId).join(',');
        const statsResponse = await fetch(
          `${this.baseUrl}/videos?part=statistics&id=${videoIds}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        let videoStats: any = {};
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          statsData.items?.forEach((item: any) => {
            videoStats[item.id] = item.statistics;
          });
        }

        return data.items.map((item: any) => ({
          id: item.id.videoId,
          snippet: item.snippet,
          statistics: videoStats[item.id.videoId] || {
            viewCount: '0',
            likeCount: '0',
            favoriteCount: '0',
            commentCount: '0'
          }
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error obteniendo videos de YouTube:', error);
      return [];
    }
  }

  /**
   * Obtiene comentarios de un video específico
   */
  async getVideoComments(accessToken: string, videoId: string, maxResults: number = 10): Promise<YouTubeComment[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/commentThreads?part=snippet&videoId=${videoId}&maxResults=${maxResults}&order=relevance`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.items) {
        return data.items.map((item: any) => ({
          id: item.id,
          snippet: item.snippet.topLevelComment.snippet
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error obteniendo comentarios de YouTube:', error);
      return [];
    }
  }

  /**
   * Obtiene analytics del canal (requiere YouTube Analytics API)
   */
  async getChannelAnalytics(accessToken: string, channelId: string, startDate: string, endDate: string): Promise<any> {
    try {
      const response = await fetch(
        `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==${channelId}&startDate=${startDate}&endDate=${endDate}&metrics=views,estimatedMinutesWatched,averageViewDuration,subscribersGained,subscribersLost`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`YouTube Analytics API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error obteniendo analytics de YouTube:', error);
      return null;
    }
  }

  /**
   * Busca menciones del canal en comentarios y títulos
   */
  async searchMentions(accessToken: string, query: string, maxResults: number = 10): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${maxResults}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`);
      }

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('Error buscando menciones en YouTube:', error);
      return [];
    }
  }

  /**
   * Analiza el sentimiento de comentarios
   */
  async analyzeCommentSentiment(comments: YouTubeComment[]): Promise<any> {
    try {
      const sentimentAnalysis = comments.map(comment => {
        const text = comment.snippet.textDisplay.toLowerCase();
        let sentiment = 'neutral';
        let score = 0;

        // Palabras positivas para YouTube
        const positiveWords = [
          'excelente', 'increíble', 'genial', 'me gusta', 'love', 'awesome', 'amazing',
          'great', 'fantastic', 'wonderful', 'perfect', 'good', 'nice', 'cool',
          'thanks', 'gracias', 'helpful', 'útil'
        ];
        
        const negativeWords = [
          'malo', 'terrible', 'horrible', 'odio', 'disgusto', 'bad', 'hate', 'awful',
          'stupid', 'boring', 'waste', 'dislike', 'worst', 'garbage', 'trash'
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
          comment_id: comment.id,
          text: comment.snippet.textDisplay,
          author: comment.snippet.authorDisplayName,
          sentiment,
          score,
          likes: comment.snippet.likeCount,
          published_at: comment.snippet.publishedAt
        };
      });

      const totalComments = sentimentAnalysis.length;
      const positive = sentimentAnalysis.filter(c => c.sentiment === 'positive').length;
      const negative = sentimentAnalysis.filter(c => c.sentiment === 'negative').length;
      const neutral = sentimentAnalysis.filter(c => c.sentiment === 'neutral').length;

      return {
        summary: {
          total_comments: totalComments,
          positive_percentage: totalComments > 0 ? (positive / totalComments) * 100 : 0,
          negative_percentage: totalComments > 0 ? (negative / totalComments) * 100 : 0,
          neutral_percentage: totalComments > 0 ? (neutral / totalComments) * 100 : 0,
        },
        detailed_analysis: sentimentAnalysis
      };
    } catch (error) {
      console.error('Error analizando sentimiento de comentarios:', error);
      return null;
    }
  }

  /**
   * Obtiene métricas consolidadas del canal
   */
  async getChannelMetrics(accessToken: string): Promise<any> {
    try {
      const channel = await this.getChannelProfile(accessToken);
      if (!channel) return null;

      const videos = await this.getChannelVideos(accessToken, 50);
      
      // Calcular métricas agregadas
      const totalViews = videos.reduce((sum, video) => sum + parseInt(video.statistics.viewCount || '0'), 0);
      const totalLikes = videos.reduce((sum, video) => sum + parseInt(video.statistics.likeCount || '0'), 0);
      const totalComments = videos.reduce((sum, video) => sum + parseInt(video.statistics.commentCount || '0'), 0);
      
      const avgViews = videos.length > 0 ? totalViews / videos.length : 0;
      const avgLikes = videos.length > 0 ? totalLikes / videos.length : 0;
      const avgComments = videos.length > 0 ? totalComments / videos.length : 0;

      return {
        channel_stats: channel.statistics,
        video_metrics: {
          total_videos: videos.length,
          total_views: totalViews,
          total_likes: totalLikes,
          total_comments: totalComments,
          avg_views_per_video: Math.round(avgViews),
          avg_likes_per_video: Math.round(avgLikes),
          avg_comments_per_video: Math.round(avgComments)
        },
        recent_videos: videos.slice(0, 10)
      };
    } catch (error) {
      console.error('Error obteniendo métricas del canal:', error);
      return null;
    }
  }

  /**
   * Verifica si el token de acceso es válido
   */
  async validateToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/channels?part=snippet&mine=true`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Error validando token de YouTube:', error);
      return false;
    }
  }
}

export const youtubeOAuth = new YouTubeOAuthService();
