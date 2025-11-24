/**
 * Servicio de Auto-Renovación de Tokens OAuth
 *
 * Este servicio gestiona automáticamente la renovación de tokens OAuth
 * antes de que expiren para mantener las conexiones activas.
 *
 * Características:
 * - Detecta tokens que están por expirar (24h antes)
 * - Renueva automáticamente usando refresh_token
 * - Registra intentos en oauth_logs
 * - Desconecta plataformas si el refresh falla
 *
 * Uso:
 * 1. Ejecutar manualmente: await tokenRefreshService.refreshExpiringTokens()
 * 2. Cron job: Ejecutar cada 6 horas
 * 3. API endpoint: /api/cron/refresh-tokens
 */

import { createClient } from '@supabase/supabase-js';
import { youtubeOAuth } from './youtube';
import { tiktokOAuth } from './tiktok';
import { facebookOAuth } from './facebook';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ExpiringToken {
  connection_id: string;
  user_id: string;
  platform: string;
  username: string;
  token_expiry: string;
  hours_until_expiry: number;
}

interface RefreshResult {
  connection_id: string;
  platform: string;
  success: boolean;
  error?: string;
  new_expiry?: string;
}

export class TokenRefreshService {
  /**
   * Obtiene tokens que expiran en las próximas N horas
   */
  async getExpiringTokens(hoursThreshold: number = 24): Promise<ExpiringToken[]> {
    try {
      const { data, error } = await supabase.rpc('get_expiring_tokens', {
        hours_threshold: hoursThreshold
      });

      if (error) {
        console.error('❌ Error obteniendo tokens por expirar:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error en getExpiringTokens:', error);
      return [];
    }
  }

  /**
   * Renueva un token específico según la plataforma
   */
  async refreshToken(
    connectionId: string,
    platform: string,
    userId: string,
    refreshToken: string
  ): Promise<RefreshResult> {
    const result: RefreshResult = {
      connection_id: connectionId,
      platform,
      success: false
    };

    try {
      let newTokenData: any = null;

      switch (platform) {
        case 'youtube':
        case 'google':
          // YouTube usa Google OAuth - requiere refresh via Google APIs
          // Por ahora, marcar para reconexión manual
          result.error = 'YouTube requiere reconexión manual por ahora';
          await this.logRefreshAttempt(userId, platform, false, result.error);
          break;

        case 'tiktok':
          // TikTok tiene método de refresh implementado
          newTokenData = await tiktokOAuth.refreshAccessToken(refreshToken);

          if (newTokenData) {
            // Actualizar en BD
            const { error } = await supabase.rpc('update_refreshed_token', {
              p_connection_id: connectionId,
              p_access_token: newTokenData.access_token,
              p_refresh_token: newTokenData.refresh_token,
              p_expires_in: newTokenData.expires_in
            });

            if (!error) {
              result.success = true;
              result.new_expiry = new Date(Date.now() + newTokenData.expires_in * 1000).toISOString();
              await this.logRefreshAttempt(userId, platform, true);
              console.log(`✅ Token de ${platform} renovado exitosamente para conexión ${connectionId}`);
            } else {
              result.error = error.message;
              await this.logRefreshAttempt(userId, platform, false, error.message);
            }
          } else {
            result.error = 'No se pudo obtener nuevo token de TikTok';
            await this.logRefreshAttempt(userId, platform, false, result.error);
          }
          break;

        case 'facebook':
        case 'instagram':
          // Facebook puede intercambiar por long-lived token
          // Requiere implementación específica
          result.error = 'Facebook requiere intercambio de long-lived token';
          await this.logRefreshAttempt(userId, platform, false, result.error);
          break;

        default:
          result.error = `Plataforma ${platform} no soporta refresh automático`;
          await this.logRefreshAttempt(userId, platform, false, result.error);
      }
    } catch (error: any) {
      result.error = error.message || 'Error desconocido';
      await this.logRefreshAttempt(userId, platform, false, result.error);
      console.error(`❌ Error renovando token de ${platform}:`, error);
    }

    return result;
  }

  /**
   * Procesa todos los tokens que están por expirar
   */
  async refreshExpiringTokens(hoursThreshold: number = 24): Promise<RefreshResult[]> {
    console.log(`🔄 Iniciando proceso de renovación de tokens (umbral: ${hoursThreshold}h)...`);

    const expiringTokens = await this.getExpiringTokens(hoursThreshold);

    if (expiringTokens.length === 0) {
      console.log('✅ No hay tokens por expirar en este momento');
      return [];
    }

    console.log(`⚠️  Encontrados ${expiringTokens.length} tokens que expiran pronto:`);
    expiringTokens.forEach(token => {
      console.log(`   - ${token.platform} (${token.username}): expira en ${token.hours_until_expiry.toFixed(1)}h`);
    });

    const results: RefreshResult[] = [];

    // Obtener refresh tokens de la BD
    for (const token of expiringTokens) {
      const { data: connection } = await supabase
        .from('social_media')
        .select('refresh_token')
        .eq('id', token.connection_id)
        .single();

      if (!connection?.refresh_token) {
        console.log(`⚠️  ${token.platform} (${token.username}): No tiene refresh_token, requiere reconexión manual`);
        results.push({
          connection_id: token.connection_id,
          platform: token.platform,
          success: false,
          error: 'No refresh_token disponible'
        });
        continue;
      }

      // Intentar renovar
      const result = await this.refreshToken(
        token.connection_id,
        token.platform,
        token.user_id,
        connection.refresh_token
      );

      results.push(result);
    }

    // Resumen de resultados
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`\n📊 Resumen de renovación:`);
    console.log(`   ✅ Exitosos: ${successful}`);
    console.log(`   ❌ Fallidos: ${failed}`);

    return results;
  }

  /**
   * Registra intento de renovación en oauth_logs
   */
  private async logRefreshAttempt(
    userId: string,
    platform: string,
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    try {
      await supabase.rpc('log_token_refresh_attempt', {
        p_user_id: userId,
        p_platform: platform,
        p_success: success,
        p_error_message: errorMessage || null
      });
    } catch (error) {
      console.error('Error logging refresh attempt:', error);
    }
  }

  /**
   * Obtiene estado de conexiones de un usuario
   */
  async getUserConnectionsStatus(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase.rpc('get_active_social_connections', {
        p_user_id: userId
      });

      if (error) {
        console.error('Error obteniendo estado de conexiones:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error en getUserConnectionsStatus:', error);
      return [];
    }
  }

  /**
   * Verifica y renueva tokens para un usuario específico
   */
  async refreshUserTokens(userId: string): Promise<RefreshResult[]> {
    console.log(`🔄 Verificando tokens para usuario ${userId}...`);

    const { data: connections } = await supabase
      .from('social_media')
      .select('id, platform, username, token_expiry, refresh_token')
      .eq('user_id', userId)
      .eq('connected', true)
      .not('token_expiry', 'is', null);

    if (!connections || connections.length === 0) {
      console.log('✅ No hay tokens con expiración para este usuario');
      return [];
    }

    const results: RefreshResult[] = [];

    for (const conn of connections) {
      const expiryDate = new Date(conn.token_expiry);
      const hoursUntilExpiry = (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60);

      // Si expira en menos de 24 horas, renovar
      if (hoursUntilExpiry < 24 && hoursUntilExpiry > 0) {
        console.log(`⚠️  ${conn.platform}: expira en ${hoursUntilExpiry.toFixed(1)}h, renovando...`);

        if (!conn.refresh_token) {
          results.push({
            connection_id: conn.id,
            platform: conn.platform,
            success: false,
            error: 'No refresh_token disponible'
          });
          continue;
        }

        const result = await this.refreshToken(
          conn.id,
          conn.platform,
          userId,
          conn.refresh_token
        );

        results.push(result);
      }
    }

    return results;
  }

  /**
   * Desconecta plataformas con tokens inválidos
   */
  async disconnectInvalidTokens(): Promise<number> {
    console.log('🔍 Buscando conexiones con tokens expirados...');

    const { data: expiredConnections } = await supabase
      .from('social_media')
      .select('id, platform, username, token_expiry')
      .eq('connected', true)
      .not('token_expiry', 'is', null)
      .lt('token_expiry', new Date().toISOString());

    if (!expiredConnections || expiredConnections.length === 0) {
      console.log('✅ No hay tokens expirados');
      return 0;
    }

    console.log(`⚠️  Encontradas ${expiredConnections.length} conexiones con tokens expirados`);

    let disconnected = 0;

    for (const conn of expiredConnections) {
      const { error } = await supabase.rpc('disconnect_social_platform', {
        p_connection_id: conn.id,
        p_reason: 'token_expired'
      });

      if (!error) {
        disconnected++;
        console.log(`❌ Desconectado: ${conn.platform} (${conn.username})`);
      }
    }

    console.log(`\n📊 Total desconectados: ${disconnected}`);
    return disconnected;
  }
}

// Singleton instance
export const tokenRefreshService = new TokenRefreshService();

// Export para uso en API routes
export default tokenRefreshService;
