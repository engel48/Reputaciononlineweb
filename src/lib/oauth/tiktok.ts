import { Account, Profile } from 'next-auth';

export interface TikTokProfile extends Profile {
  open_id: string;
  union_id: string;
  avatar_url: string;
  avatar_url_100: string;
  avatar_large_url: string;
  display_name: string;
  bio_description: string;
  profile_deep_link: string;
  is_verified: boolean;
  follower_count: number;
  following_count: number;
  likes_count: number;
  video_count: number;
}

export interface TikTokAccount extends Account {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  token_type: string;
  scope: string;
}

export interface TikTokVideo {
  id: string;
  create_time: number;
  cover_image_url: string;
  share_url: string;
  video_description: string;
  duration: number;
  height: number;
  width: number;
  title: string;
  embed_html: string;
  embed_link: string;
  like_count: number;
  comment_count: number;
  share_count: number;
  view_count: number;
}

export interface TikTokVideoInsights {
  video_id: string;
  likes: number;
  comments: number;
  shares: number;
  views: number;
}

export class TikTokOAuthService {
  private baseUrl = 'https://open.tiktokapis.com/v2';

  /**
   * Obtiene información del perfil de TikTok
   */
  async getProfile(accessToken: string): Promise<TikTokProfile | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/user/info/?fields=open_id,union_id,avatar_url,avatar_url_100,avatar_large_url,display_name,bio_description,profile_deep_link,is_verified,follower_count,following_count,likes_count,video_count`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('TikTok API error:', response.status, errorText);
        throw new Error(`TikTok API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || 'TikTok API error');
      }

      return data.data?.user || null;
    } catch (error) {
      console.error('Error obteniendo perfil de TikTok:', error);
      return null;
    }
  }

  /**
   * Obtiene los videos del usuario
   */
  async getUserVideos(accessToken: string, limit: number = 20): Promise<TikTokVideo[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/video/list/?fields=id,create_time,cover_image_url,share_url,video_description,duration,height,width,title,embed_html,embed_link,like_count,comment_count,share_count,view_count&max_count=${limit}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`TikTok API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || 'Error obteniendo videos');
      }

      return data.data?.videos || [];
    } catch (error) {
      console.error('Error obteniendo videos de TikTok:', error);
      return [];
    }
  }

  /**
   * Obtiene insights/métricas de un video específico
   */
  async getVideoInsights(accessToken: string, videoIds: string[]): Promise<TikTokVideoInsights[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/video/query/?fields=id,like_count,comment_count,share_count,view_count`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            filters: {
              video_ids: videoIds
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`TikTok API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || 'Error obteniendo insights');
      }

      return data.data?.videos?.map((video: any) => ({
        video_id: video.id,
        likes: video.like_count || 0,
        comments: video.comment_count || 0,
        shares: video.share_count || 0,
        views: video.view_count || 0
      })) || [];
    } catch (error) {
      console.error('Error obteniendo insights de TikTok:', error);
      return [];
    }
  }

  /**
   * Verifica si el token de acceso es válido
   */
  async validateToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/user/info/?fields=open_id`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Error validando token de TikTok:', error);
      return false;
    }
  }

  /**
   * Refresca el access token usando el refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  } | null> {
    try {
      const response = await fetch(
        'https://open.tiktokapis.com/v2/oauth/token/',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cache-Control': 'no-cache'
          },
          body: new URLSearchParams({
            client_key: process.env.TIKTOK_CLIENT_KEY || '',
            client_secret: process.env.TIKTOK_CLIENT_SECRET || '',
            grant_type: 'refresh_token',
            refresh_token: refreshToken
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('TikTok refresh token error:', response.status, errorText);
        throw new Error(`TikTok API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error || 'Error refreshing token');
      }

      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in
      };
    } catch (error) {
      console.error('Error refrescando token de TikTok:', error);
      return null;
    }
  }

  /**
   * Intercambia el código de autorización por access token
   */
  async exchangeCodeForToken(code: string, redirectUri: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
    scope: string;
    open_id: string;
  } | null> {
    try {
      const response = await fetch(
        'https://open.tiktokapis.com/v2/oauth/token/',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cache-Control': 'no-cache'
          },
          body: new URLSearchParams({
            client_key: process.env.TIKTOK_CLIENT_KEY || '',
            client_secret: process.env.TIKTOK_CLIENT_SECRET || '',
            code: code,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('TikTok token exchange error:', response.status, errorText);
        throw new Error(`TikTok API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error || 'Error exchanging code');
      }

      return data;
    } catch (error) {
      console.error('Error intercambiando código de TikTok:', error);
      return null;
    }
  }

  /**
   * Revoca el access token (logout)
   */
  async revokeToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(
        'https://open.tiktokapis.com/v2/oauth/revoke/',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cache-Control': 'no-cache'
          },
          body: new URLSearchParams({
            client_key: process.env.TIKTOK_CLIENT_KEY || '',
            client_secret: process.env.TIKTOK_CLIENT_SECRET || '',
            token: accessToken
          })
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Error revocando token de TikTok:', error);
      return false;
    }
  }
}

export const tiktokOAuth = new TikTokOAuthService();
