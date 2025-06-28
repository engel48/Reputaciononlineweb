import { Account, Profile } from 'next-auth';

export interface FacebookProfile extends Profile {
  id: string;
  name: string;
  email: string;
  picture: {
    data: {
      url: string;
    };
  };
}

export interface FacebookAccount extends Account {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
}

export interface FacebookPageInfo {
  id: string;
  name: string;
  category: string;
  followers_count?: number;
  likes?: number;
  access_token: string;
}

export interface InstagramBusinessAccount {
  id: string;
  username: string;
  followers_count: number;
  media_count: number;
  account_type: string;
}

export class FacebookOAuthService {
  private baseUrl = 'https://graph.facebook.com/v18.0';

  /**
   * Obtiene información del perfil de Facebook
   */
  async getProfile(accessToken: string): Promise<FacebookProfile | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/me?fields=id,name,email,picture&access_token=${accessToken}`
      );

      if (!response.ok) {
        throw new Error(`Facebook API error: ${response.status}`);
      }

      const profile = await response.json();
      return profile;
    } catch (error) {
      console.error('Error obteniendo perfil de Facebook:', error);
      return null;
    }
  }

  /**
   * Obtiene las páginas de Facebook del usuario
   */
  async getUserPages(accessToken: string): Promise<FacebookPageInfo[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/me/accounts?fields=id,name,category,followers_count,likes,access_token&access_token=${accessToken}`
      );

      if (!response.ok) {
        throw new Error(`Facebook API error: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error obteniendo páginas de Facebook:', error);
      return [];
    }
  }

  /**
   * Obtiene las cuentas de Instagram Business conectadas
   */
  async getInstagramAccounts(accessToken: string, pageId: string): Promise<InstagramBusinessAccount[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${pageId}?fields=instagram_business_account{id,username,followers_count,media_count,account_type}&access_token=${accessToken}`
      );

      if (!response.ok) {
        throw new Error(`Facebook API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.instagram_business_account) {
        return [data.instagram_business_account];
      }
      
      return [];
    } catch (error) {
      console.error('Error obteniendo cuentas de Instagram:', error);
      return [];
    }
  }

  /**
   * Obtiene métricas de engagement de una página de Facebook
   */
  async getPageInsights(pageAccessToken: string, pageId: string): Promise<any> {
    try {
      const metrics = [
        'page_followers',
        'page_impressions',
        'page_engaged_users',
        'page_post_engagements'
      ];

      const response = await fetch(
        `${this.baseUrl}/${pageId}/insights?metric=${metrics.join(',')}&period=day&access_token=${pageAccessToken}`
      );

      if (!response.ok) {
        throw new Error(`Facebook API error: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error obteniendo insights de Facebook:', error);
      return [];
    }
  }

  /**
   * Obtiene posts recientes de una página de Facebook
   */
  async getPagePosts(pageAccessToken: string, pageId: string, limit: number = 10): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${pageId}/posts?fields=id,message,created_time,likes.summary(true),comments.summary(true),shares&limit=${limit}&access_token=${pageAccessToken}`
      );

      if (!response.ok) {
        throw new Error(`Facebook API error: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error obteniendo posts de Facebook:', error);
      return [];
    }
  }

  /**
   * Verifica si el token de acceso es válido
   */
  async validateToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/me?access_token=${accessToken}`
      );

      return response.ok;
    } catch (error) {
      console.error('Error validando token de Facebook:', error);
      return false;
    }
  }

  /**
   * Intercambia un token de corta duración por uno de larga duración
   */
  async exchangeForLongLivedToken(shortLivedToken: string): Promise<string | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.FACEBOOK_CLIENT_ID}&client_secret=${process.env.FACEBOOK_CLIENT_SECRET}&fb_exchange_token=${shortLivedToken}`
      );

      if (!response.ok) {
        throw new Error(`Facebook API error: ${response.status}`);
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Error intercambiando token de Facebook:', error);
      return null;
    }
  }
}

export const facebookOAuth = new FacebookOAuthService();
