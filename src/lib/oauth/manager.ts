import { facebookOAuth, FacebookProfile } from './facebook';
import { twitterOAuth, TwitterProfile } from './twitter';
import { linkedinOAuth, LinkedInProfile } from './linkedin';
import { youtubeOAuth, YouTubeProfile } from './youtube';
import { threadsOAuth, ThreadsProfile } from './threads';

export type SocialPlatform = 'facebook' | 'instagram' | 'x' | 'linkedin' | 'youtube' | 'threads' | 'tiktok';

export interface SocialConnection {
  platform: SocialPlatform;
  connected: boolean;
  username?: string;
  displayName?: string;
  profileImage?: string;
  followers?: number;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  lastSync?: string;
  metrics?: {
    posts?: number;
    engagement?: number;
    reach?: number;
  };
}

export interface UserSocialData {
  userId: string;
  connections: Record<SocialPlatform, SocialConnection>;
  lastUpdated: string;
}

export class SocialOAuthManager {
  private connections: Map<string, UserSocialData> = new Map();

  /**
   * Conecta una red social para un usuario
   */
  async connectSocialNetwork(
    userId: string, 
    platform: SocialPlatform, 
    accessToken: string, 
    refreshToken?: string, 
    expiresAt?: number
  ): Promise<boolean> {
    try {
      let profileData: any = null;
      let username = '';
      let displayName = '';
      let profileImage = '';
      let followers = 0;

      // Obtener datos del perfil según la plataforma
      switch (platform) {
        case 'facebook':
          profileData = await facebookOAuth.getProfile(accessToken);
          if (profileData) {
            username = profileData.name;
            displayName = profileData.name;
            profileImage = profileData.picture?.data?.url || '';
            
            // Obtener páginas para obtener seguidores
            const pages = await facebookOAuth.getUserPages(accessToken);
            if (pages.length > 0) {
              followers = pages[0].followers_count || pages[0].likes || 0;
            }
          }
          break;

        case 'instagram':
          // Instagram usa Facebook OAuth
          profileData = await facebookOAuth.getProfile(accessToken);
          if (profileData) {
            const pages = await facebookOAuth.getUserPages(accessToken);
            for (const page of pages) {
              const instagramAccounts = await facebookOAuth.getInstagramAccounts(accessToken, page.id);
              if (instagramAccounts.length > 0) {
                const igAccount = instagramAccounts[0];
                username = igAccount.username;
                displayName = igAccount.username;
                followers = igAccount.followers_count;
                break;
              }
            }
          }
          break;

        case 'x':
          profileData = await twitterOAuth.getProfile(accessToken);
          if (profileData) {
            username = profileData.username;
            displayName = profileData.name;
            profileImage = profileData.profile_image_url;
            followers = profileData.public_metrics?.followers_count || 0;
          }
          break;

        case 'linkedin':
          profileData = await linkedinOAuth.getProfile(accessToken);
          if (profileData) {
            username = `${profileData.localizedFirstName} ${profileData.localizedLastName}`;
            displayName = username;
            profileImage = profileData.profilePicture?.['displayImage~']?.elements?.[0]?.identifiers?.[0]?.identifier || '';
            
            // LinkedIn no proporciona fácilmente el número de seguidores personales
            const organizations = await linkedinOAuth.getUserOrganizations(accessToken);
            if (organizations.length > 0) {
              followers = organizations[0].followerCount || 0;
            }
          }
          break;

        case 'youtube':
          profileData = await youtubeOAuth.getChannelProfile(accessToken);
          if (profileData) {
            username = profileData.snippet.customUrl || profileData.snippet.title;
            displayName = profileData.snippet.title;
            profileImage = profileData.snippet.thumbnails?.high?.url || '';
            followers = parseInt(profileData.statistics.subscriberCount) || 0;
          }
          break;

        case 'threads':
          profileData = await threadsOAuth.getProfile(accessToken);
          if (profileData) {
            username = profileData.username;
            displayName = profileData.name;
            profileImage = profileData.threads_profile_picture_url || '';
            // Obtener métricas adicionales para followers
            const metrics = await threadsOAuth.getProfileMetrics(accessToken, profileData.id);
            followers = metrics?.followers_count || 0;
          }
          break;

        default:
          console.warn(`Plataforma ${platform} no implementada aún`);
          return false;
      }

      if (!profileData) {
        throw new Error(`No se pudo obtener el perfil de ${platform}`);
      }

      // Obtener o crear datos del usuario
      let userData = this.connections.get(userId);
      if (!userData) {
        userData = {
          userId,
          connections: {} as Record<SocialPlatform, SocialConnection>,
          lastUpdated: new Date().toISOString()
        };
      }

      // Actualizar conexión
      userData.connections[platform] = {
        platform,
        connected: true,
        username,
        displayName,
        profileImage,
        followers,
        accessToken,
        refreshToken,
        expiresAt,
        lastSync: new Date().toISOString(),
        metrics: {
          posts: 0,
          engagement: 0,
          reach: 0
        }
      };

      userData.lastUpdated = new Date().toISOString();
      this.connections.set(userId, userData);

      // En una implementación real, guardarías esto en la base de datos
      console.log(`✅ ${platform} conectado exitosamente para usuario ${userId}`);
      return true;

    } catch (error) {
      console.error(`❌ Error conectando ${platform}:`, error);
      return false;
    }
  }

  /**
   * Desconecta una red social para un usuario
   */
  async disconnectSocialNetwork(userId: string, platform: SocialPlatform): Promise<boolean> {
    try {
      const userData = this.connections.get(userId);
      if (!userData || !userData.connections[platform]) {
        return false;
      }

      // Marcar como desconectado
      userData.connections[platform] = {
        platform,
        connected: false
      };

      userData.lastUpdated = new Date().toISOString();
      this.connections.set(userId, userData);

      console.log(`✅ ${platform} desconectado exitosamente para usuario ${userId}`);
      return true;

    } catch (error) {
      console.error(`❌ Error desconectando ${platform}:`, error);
      return false;
    }
  }

  /**
   * Obtiene todas las conexiones de un usuario
   */
  getUserConnections(userId: string): Record<SocialPlatform, SocialConnection> {
    const userData = this.connections.get(userId);
    if (!userData) {
      // Retornar conexiones por defecto
      const defaultConnections: Record<SocialPlatform, SocialConnection> = {
        facebook: { platform: 'facebook', connected: false },
        instagram: { platform: 'instagram', connected: false },
        x: { platform: 'x', connected: false },
        linkedin: { platform: 'linkedin', connected: false },
        youtube: { platform: 'youtube', connected: false },
        threads: { platform: 'threads', connected: false },
        tiktok: { platform: 'tiktok', connected: false }
      };
      return defaultConnections;
    }

    return userData.connections;
  }

  /**
   * Sincroniza datos de todas las redes conectadas
   */
  async syncAllConnections(userId: string): Promise<boolean> {
    try {
      const userData = this.connections.get(userId);
      if (!userData) return false;

      for (const [platform, connection] of Object.entries(userData.connections)) {
        if (connection.connected && connection.accessToken) {
          await this.syncPlatformData(userId, platform as SocialPlatform, connection.accessToken);
        }
      }

      return true;
    } catch (error) {
      console.error('❌ Error sincronizando conexiones:', error);
      return false;
    }
  }

  /**
   * Sincroniza datos de una plataforma específica
   */
  private async syncPlatformData(userId: string, platform: SocialPlatform, accessToken: string): Promise<void> {
    try {
      let metrics = { posts: 0, engagement: 0, reach: 0 };

      switch (platform) {
        case 'facebook':
          const pages = await facebookOAuth.getUserPages(accessToken);
          if (pages.length > 0) {
            const posts = await facebookOAuth.getPagePosts(accessToken, pages[0].id, 50);
            metrics.posts = posts.length;
            metrics.engagement = posts.reduce((sum, post) => {
              return sum + (post.likes?.summary?.total_count || 0) + (post.comments?.summary?.total_count || 0);
            }, 0);
          }
          break;

        case 'x':
          const profile = await twitterOAuth.getProfile(accessToken);
          if (profile) {
            const tweets = await twitterOAuth.getUserTweets(accessToken, profile.id, 50);
            metrics.posts = tweets.length;
            metrics.engagement = tweets.reduce((sum, tweet) => {
              return sum + tweet.public_metrics.like_count + tweet.public_metrics.retweet_count;
            }, 0);
          }
          break;

        case 'youtube':
          const channelMetrics = await youtubeOAuth.getChannelMetrics(accessToken);
          if (channelMetrics) {
            metrics.posts = channelMetrics.video_metrics.total_videos;
            metrics.engagement = channelMetrics.video_metrics.total_likes + channelMetrics.video_metrics.total_comments;
            metrics.reach = channelMetrics.video_metrics.total_views;
          }
          break;

        // Agregar más plataformas según sea necesario
      }

      // Actualizar métricas en userData
      const userData = this.connections.get(userId);
      if (userData && userData.connections[platform]) {
        userData.connections[platform].metrics = metrics;
        userData.connections[platform].lastSync = new Date().toISOString();
        this.connections.set(userId, userData);
      }

    } catch (error) {
      console.error(`❌ Error sincronizando datos de ${platform}:`, error);
    }
  }

  /**
   * Valida si los tokens de un usuario siguen siendo válidos
   */
  async validateUserTokens(userId: string): Promise<Record<SocialPlatform, boolean>> {
    const userData = this.connections.get(userId);
    const results: Record<SocialPlatform, boolean> = {
      facebook: false,
      instagram: false,
      x: false,
      linkedin: false,
      youtube: false,
      threads: false,
      tiktok: false
    };

    if (!userData) return results;

    for (const [platform, connection] of Object.entries(userData.connections)) {
      if (connection.connected && connection.accessToken) {
        try {
          let isValid = false;

          switch (platform) {
            case 'facebook':
            case 'instagram':
              isValid = await facebookOAuth.validateToken(connection.accessToken);
              break;
            case 'x':
              isValid = await twitterOAuth.validateToken(connection.accessToken);
              break;
            case 'linkedin':
              isValid = await linkedinOAuth.validateToken(connection.accessToken);
              break;
            case 'youtube':
              isValid = await youtubeOAuth.validateToken(connection.accessToken);
              break;
            case 'threads':
              isValid = await threadsOAuth.validateToken(connection.accessToken);
              break;
          }

          results[platform as SocialPlatform] = isValid;

          // Si el token no es válido, marcar como desconectado
          if (!isValid && userData.connections[platform as SocialPlatform]) {
            userData.connections[platform as SocialPlatform].connected = false;
          }

        } catch (error) {
          console.error(`Error validando token de ${platform}:`, error);
        }
      }
    }

    return results;
  }

  /**
   * Obtiene un resumen de todas las conexiones
   */
  getConnectionSummary(userId: string): {
    total: number;
    connected: number;
    platforms: string[];
  } {
    const connections = this.getUserConnections(userId);
    const connectedPlatforms = Object.values(connections).filter(conn => conn.connected);
    
    return {
      total: Object.keys(connections).length,
      connected: connectedPlatforms.length,
      platforms: connectedPlatforms.map(conn => conn.platform)
    };
  }
}

// Instancia singleton del manager
export const socialOAuthManager = new SocialOAuthManager();
