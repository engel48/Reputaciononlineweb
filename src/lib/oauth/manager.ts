import { facebookOAuth } from './facebook';
import { twitterOAuth } from './twitter';
import { youtubeOAuth } from './youtube';

export type SocialPlatform = 'facebook' | 'instagram' | 'x' | 'youtube';

export interface SocialConnection {
  platform: SocialPlatform;
  connected: boolean;
  username?: string;
  displayName?: string;
  profileImage?: string;
  followers?: number;
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

  /**
   * Desconecta una red social para un usuario
   */
  async disconnectSocialNetwork(userId: string, platform: SocialPlatform): Promise<boolean> {
    try {
      const { disconnectOAuth } = await import('@/lib/oauth-storage');
      const result = await disconnectOAuth(userId, platform);
      if (result) {
        console.log(`✅ ${platform} desconectado para usuario ${userId}`);
      }
      return result;
    } catch (error) {
      console.error(`❌ Error desconectando ${platform}:`, error);
      return false;
    }
  }

  /**
   * Obtiene todas las conexiones de un usuario desde Supabase
   */
  async getUserConnections(userId: string): Promise<Record<SocialPlatform, SocialConnection>> {
    try {
      const { supabase } = await import('@/lib/supabase-server');

      const { data: records, error } = await supabase
        .from('social_media')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Error cargando conexiones de Supabase:', error);
      }

      const connections: Record<SocialPlatform, SocialConnection> = {
        facebook: { platform: 'facebook', connected: false },
        instagram: { platform: 'instagram', connected: false },
        x: { platform: 'x', connected: false },
        youtube: { platform: 'youtube', connected: false }
      };

      if (records && records.length > 0) {
        for (const record of records) {
          const platform = record.platform as SocialPlatform;
          if (connections[platform]) {
            connections[platform] = {
              platform,
              connected: record.connected || false,
              username: record.username || '',
              displayName: record.display_name || record.username || '',
              profileImage: record.profile_image || '',
              followers: record.followers || 0,
              lastSync: record.last_sync || null,
              metrics: {
                posts: record.posts || 0,
                engagement: record.engagement || 0,
                reach: 0
              }
            };
          }
        }
      }

      return connections;
    } catch (error) {
      console.error('Error en getUserConnections:', error);
      return {
        facebook: { platform: 'facebook', connected: false },
        instagram: { platform: 'instagram', connected: false },
        x: { platform: 'x', connected: false },
        youtube: { platform: 'youtube', connected: false }
      };
    }
  }

  /**
   * Sincroniza datos Y menciones de todas las redes conectadas para un usuario.
   * Delega a src/lib/social-sync/* para traer menciones reales (no solo métricas).
   */
  async syncAllConnections(userId: string): Promise<boolean> {
    try {
      const { getAccessToken } = await import('@/lib/oauth-storage');
      const { supabase } = await import('@/lib/supabase-server');
      const { syncPlatformMentions } = await import('@/lib/social-sync');

      const { data: records, error } = await supabase
        .from('social_media')
        .select('platform, connected')
        .eq('user_id', userId)
        .eq('connected', true);

      if (error || !records || records.length === 0) {
        console.log('No hay conexiones activas para sincronizar');
        return false;
      }

      let synced = false;
      for (const record of records) {
        const platform = record.platform as SocialPlatform;
        const accessToken = await getAccessToken(userId, platform);

        if (!accessToken) {
          console.warn(`⚠️ No se pudo obtener token para ${platform} (expirado o no disponible)`);
          continue;
        }

        const result = await syncPlatformMentions(platform, userId, accessToken);
        if (result.success) {
          synced = true;
          console.log(
            `✅ ${platform} sync: ${result.mentions_created} menciones + ${result.external_mentions_created} externas`
          );
        } else {
          console.warn(`⚠️ ${platform} sync falló: ${result.error}`);
        }
      }

      return synced;
    } catch (error) {
      console.error('❌ Error sincronizando conexiones:', error);
      return false;
    }
  }

  /**
   * Sincroniza datos de una plataforma específica y actualiza Supabase
   */
  private async syncPlatformData(userId: string, platform: SocialPlatform, accessToken: string): Promise<void> {
    try {
      const { supabase } = await import('@/lib/supabase-server');
      let metrics = { posts: 0, engagement: 0, reach: 0 };
      let followers = 0;

      switch (platform) {
        case 'facebook':
          const pages = await facebookOAuth.getUserPages(accessToken);
          if (pages.length > 0) {
            followers = pages[0].followers_count || pages[0].likes || 0;
            const posts = await facebookOAuth.getPagePosts(accessToken, pages[0].id, 50);
            metrics.posts = posts.length;
            metrics.engagement = posts.reduce((sum: number, post: any) => {
              return sum + (post.likes?.summary?.total_count || 0) + (post.comments?.summary?.total_count || 0);
            }, 0);
          }
          break;

        case 'x':
          const tProfile = await twitterOAuth.getProfile(accessToken);
          if (tProfile) {
            followers = tProfile.public_metrics?.followers_count || 0;
            const tweets = await twitterOAuth.getUserTweets(accessToken, tProfile.id, 50);
            metrics.posts = tweets.length;
            metrics.engagement = tweets.reduce((sum: number, tweet: any) => {
              return sum + (tweet.public_metrics?.like_count || 0) + (tweet.public_metrics?.retweet_count || 0);
            }, 0);
          }
          break;

        case 'youtube':
          const channelMetrics = await youtubeOAuth.getChannelMetrics(accessToken);
          if (channelMetrics) {
            followers = channelMetrics.subscribers || 0;
            metrics.posts = channelMetrics.video_metrics?.total_videos || 0;
            metrics.engagement = (channelMetrics.video_metrics?.total_likes || 0) + (channelMetrics.video_metrics?.total_comments || 0);
            metrics.reach = channelMetrics.video_metrics?.total_views || 0;
          }
          break;

        case 'instagram':
          // Instagram data is fetched via Facebook API
          const igPages = await facebookOAuth.getUserPages(accessToken);
          for (const page of igPages) {
            const igAccounts = await facebookOAuth.getInstagramAccounts(accessToken, page.id);
            if (igAccounts && igAccounts.length > 0) {
              followers = igAccounts[0].followers_count || 0;
              metrics.posts = igAccounts[0].media_count || 0;
              break;
            }
          }
          break;
      }

      // Actualizar en Supabase
      const { error } = await supabase
        .from('social_media')
        .update({
          followers,
          posts: metrics.posts,
          engagement: metrics.engagement,
          last_sync: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('platform', platform);

      if (error) {
        console.error(`Error actualizando métricas de ${platform}:`, error);
      } else {
        console.log(`✅ ${platform} sincronizado: ${followers} followers, ${metrics.posts} posts`);
      }

    } catch (error) {
      console.error(`❌ Error sincronizando datos de ${platform}:`, error);
    }
  }

  /**
   * Valida si los tokens de un usuario siguen siendo válidos
   * Lee tokens de Supabase (desencriptados) en vez de memoria
   */
  async validateUserTokens(userId: string): Promise<Record<SocialPlatform, boolean>> {
    const results: Record<SocialPlatform, boolean> = {
      facebook: false,
      instagram: false,
      x: false,
      youtube: false
    };

    try {
      const { getAccessToken } = await import('@/lib/oauth-storage');
      const { supabase } = await import('@/lib/supabase-server');

      // Obtener plataformas conectadas
      const { data: records } = await supabase
        .from('social_media')
        .select('platform, connected')
        .eq('user_id', userId)
        .eq('connected', true);

      if (!records || records.length === 0) return results;

      for (const record of records) {
        const platform = record.platform as SocialPlatform;
        const accessToken = await getAccessToken(userId, platform);

        if (!accessToken) {
          // Token expired or missing - mark as disconnected
          await supabase
            .from('social_media')
            .update({ connected: false })
            .eq('user_id', userId)
            .eq('platform', platform);
          continue;
        }

        try {
          let isValid = false;

          switch (platform) {
            case 'facebook':
            case 'instagram':
              isValid = await facebookOAuth.validateToken(accessToken);
              break;
            case 'x':
              isValid = await twitterOAuth.validateToken(accessToken);
              break;
            case 'youtube':
              isValid = await youtubeOAuth.validateToken(accessToken);
              break;
          }

          results[platform] = isValid;

          if (!isValid) {
            console.warn(`⚠️ Token inválido para ${platform}, marcando como desconectado`);
            await supabase
              .from('social_media')
              .update({ connected: false })
              .eq('user_id', userId)
              .eq('platform', platform);
          }
        } catch (error) {
          console.error(`Error validando token de ${platform}:`, error);
        }
      }
    } catch (error) {
      console.error('Error en validateUserTokens:', error);
    }

    return results;
  }

  /**
   * Obtiene un resumen de todas las conexiones
   */
  async getConnectionSummary(userId: string): Promise<{
    total: number;
    connected: number;
    platforms: string[];
  }> {
    const connections = await this.getUserConnections(userId);
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
