import { Account, Profile } from 'next-auth';

export interface TwitterProfile extends Profile {
  id: string;
  name: string;
  username: string;
  profile_image_url: string;
  public_metrics: {
    followers_count: number;
    following_count: number;
    tweet_count: number;
    listed_count: number;
  };
  verified: boolean;
  description?: string;
}

export interface TwitterAccount extends Account {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
}

export interface TwitterTweet {
  id: string;
  text: string;
  created_at: string;
  public_metrics: {
    retweet_count: number;
    like_count: number;
    reply_count: number;
    quote_count: number;
  };
  author_id: string;
  context_annotations?: Array<{
    domain: { id: string; name: string; description: string };
    entity: { id: string; name: string; description?: string };
  }>;
}

export class TwitterOAuthService {
  private baseUrl = 'https://api.twitter.com/2';

  /**
   * Obtiene información del perfil del usuario autenticado
   */
  async getProfile(accessToken: string): Promise<TwitterProfile | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/users/me?user.fields=id,name,username,profile_image_url,public_metrics,verified,description`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Twitter API error: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error obteniendo perfil de Twitter:', error);
      return null;
    }
  }

  /**
   * Obtiene los tweets recientes del usuario autenticado
   */
  async getUserTweets(accessToken: string, userId: string, maxResults: number = 10): Promise<TwitterTweet[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/users/${userId}/tweets?max_results=${maxResults}&tweet.fields=id,text,created_at,public_metrics,author_id,context_annotations&expansions=author_id`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Twitter API error: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error obteniendo tweets del usuario:', error);
      return [];
    }
  }

  /**
   * Obtiene métricas de engagement del usuario
   */
  async getUserMetrics(accessToken: string, userId: string): Promise<any> {
    try {
      // Para métricas más detalladas, necesitaríamos Twitter API v2 Academic Research
      const profile = await this.getProfile(accessToken);
      
      if (!profile) return null;

      return {
        followers_count: profile.public_metrics.followers_count,
        following_count: profile.public_metrics.following_count,
        tweet_count: profile.public_metrics.tweet_count,
        listed_count: profile.public_metrics.listed_count,
        verified: profile.verified,
      };
    } catch (error) {
      console.error('Error obteniendo métricas de Twitter:', error);
      return null;
    }
  }

  /**
   * Busca tweets que mencionen al usuario
   */
  async getUserMentions(accessToken: string, userId: string, maxResults: number = 10): Promise<TwitterTweet[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/users/${userId}/mentions?max_results=${maxResults}&tweet.fields=id,text,created_at,public_metrics,author_id,context_annotations&expansions=author_id`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Twitter API error: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error obteniendo menciones de Twitter:', error);
      return [];
    }
  }

  /**
   * Busca tweets por palabra clave relacionada con el usuario
   */
  async searchTweets(accessToken: string, query: string, maxResults: number = 10): Promise<TwitterTweet[]> {
    try {
      const encodedQuery = encodeURIComponent(query);
      const response = await fetch(
        `${this.baseUrl}/tweets/search/recent?query=${encodedQuery}&max_results=${maxResults}&tweet.fields=id,text,created_at,public_metrics,author_id,context_annotations&expansions=author_id`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Twitter API error: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error buscando tweets:', error);
      return [];
    }
  }

  /**
   * Analiza el sentimiento de tweets (función básica)
   */
  async analyzeTweetSentiment(tweets: TwitterTweet[]): Promise<any> {
    try {
      const sentimentAnalysis = tweets.map(tweet => {
        // Análisis básico de sentimiento por palabras clave
        const text = tweet.text.toLowerCase();
        let sentiment = 'neutral';
        let score = 0;

        // Palabras positivas
        const positiveWords = ['excelente', 'increíble', 'fantástico', 'genial', 'bueno', 'me gusta', 'love', 'great', 'awesome', 'amazing'];
        const negativeWords = ['malo', 'terrible', 'horrible', 'odio', 'disgusto', 'bad', 'hate', 'awful', 'terrible', 'worst'];

        positiveWords.forEach(word => {
          if (text.includes(word)) score += 1;
        });

        negativeWords.forEach(word => {
          if (text.includes(word)) score -= 1;
        });

        if (score > 0) sentiment = 'positive';
        else if (score < 0) sentiment = 'negative';

        return {
          tweet_id: tweet.id,
          text: tweet.text,
          sentiment,
          score,
          engagement: tweet.public_metrics.like_count + tweet.public_metrics.retweet_count
        };
      });

      const totalTweets = sentimentAnalysis.length;
      const positive = sentimentAnalysis.filter(t => t.sentiment === 'positive').length;
      const negative = sentimentAnalysis.filter(t => t.sentiment === 'negative').length;
      const neutral = sentimentAnalysis.filter(t => t.sentiment === 'neutral').length;

      return {
        summary: {
          total_tweets: totalTweets,
          positive_percentage: totalTweets > 0 ? (positive / totalTweets) * 100 : 0,
          negative_percentage: totalTweets > 0 ? (negative / totalTweets) * 100 : 0,
          neutral_percentage: totalTweets > 0 ? (neutral / totalTweets) * 100 : 0,
        },
        detailed_analysis: sentimentAnalysis
      };
    } catch (error) {
      console.error('Error analizando sentimiento de tweets:', error);
      return null;
    }
  }

  /**
   * Verifica si el token de acceso es válido
   */
  async validateToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/users/me`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Error validando token de Twitter:', error);
      return false;
    }
  }
}

export const twitterOAuth = new TwitterOAuthService();
