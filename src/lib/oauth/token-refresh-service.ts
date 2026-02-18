/**
 * Servicio de Auto-Renovación de Tokens OAuth
 *
 * Renueva tokens de YouTube (Google), Facebook/Instagram, y Twitter/X
 * usando los refresh tokens almacenados (encriptados) en Supabase.
 */

import { createClient } from '@supabase/supabase-js';
import { decryptToken, encryptToken } from '@/lib/encryption';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RefreshResult {
  platform: string;
  success: boolean;
  error?: string;
  new_expiry?: string;
}

export class TokenRefreshService {

  /**
   * Renueva un token según la plataforma
   */
  async refreshToken(
    userId: string,
    platform: string,
    encryptedRefreshToken: string
  ): Promise<RefreshResult> {
    const result: RefreshResult = { platform, success: false };

    try {
      // Desencriptar refresh token
      const refreshToken = decryptToken(encryptedRefreshToken);

      switch (platform) {
        case 'youtube': {
          // Google OAuth2 refresh
          const resp = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              grant_type: 'refresh_token',
              refresh_token: refreshToken,
              client_id: process.env.GOOGLE_CLIENT_ID!,
              client_secret: process.env.GOOGLE_CLIENT_SECRET!
            })
          });

          if (!resp.ok) {
            const err = await resp.text();
            result.error = `Google refresh failed: ${err}`;
            break;
          }

          const data = await resp.json();
          const newExpiry = new Date(Date.now() + data.expires_in * 1000);

          // Guardar nuevo access_token encriptado
          await supabase
            .from('social_media')
            .update({
              access_token: encryptToken(data.access_token),
              token_expiry: newExpiry.toISOString(),
              last_sync: new Date().toISOString()
            })
            .eq('user_id', userId)
            .eq('platform', 'youtube');

          result.success = true;
          result.new_expiry = newExpiry.toISOString();
          console.log(`✅ YouTube token renovado, expira: ${newExpiry.toISOString()}`);
          break;
        }

        case 'facebook':
        case 'instagram': {
          // Facebook: intercambiar short-lived token por long-lived token
          // Para Facebook, el "refresh" es obtener un nuevo long-lived token
          // usando el access_token actual (no hay refresh_token separado)
          const currentAccessToken = decryptToken(encryptedRefreshToken);
          const resp = await fetch(
            `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.NEXT_PUBLIC_FACEBOOK_APP_ID}&client_secret=${process.env.FACEBOOK_APP_SECRET}&fb_exchange_token=${currentAccessToken}`
          );

          if (!resp.ok) {
            const err = await resp.text();
            result.error = `Facebook token exchange failed: ${err}`;
            break;
          }

          const data = await resp.json();
          // Long-lived tokens last ~60 days
          const newExpiry = new Date(Date.now() + (data.expires_in || 5184000) * 1000);

          await supabase
            .from('social_media')
            .update({
              access_token: encryptToken(data.access_token),
              token_expiry: newExpiry.toISOString(),
              last_sync: new Date().toISOString()
            })
            .eq('user_id', userId)
            .eq('platform', platform);

          result.success = true;
          result.new_expiry = newExpiry.toISOString();
          console.log(`✅ ${platform} token renovado, expira: ${newExpiry.toISOString()}`);
          break;
        }

        case 'x': {
          // Twitter OAuth 2.0 refresh
          const clientId = process.env.TWITTER_CLIENT_ID || process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID;
          const clientSecret = process.env.TWITTER_CLIENT_SECRET;

          if (!clientId || !clientSecret) {
            result.error = 'Twitter credentials not configured';
            break;
          }

          const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

          const resp = await fetch('https://api.twitter.com/2/oauth2/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': `Basic ${basicAuth}`
            },
            body: new URLSearchParams({
              grant_type: 'refresh_token',
              refresh_token: refreshToken
            })
          });

          if (!resp.ok) {
            const err = await resp.text();
            result.error = `Twitter refresh failed: ${err}`;
            break;
          }

          const data = await resp.json();
          const newExpiry = new Date(Date.now() + (data.expires_in || 7200) * 1000);

          const updateData: any = {
            access_token: encryptToken(data.access_token),
            token_expiry: newExpiry.toISOString(),
            last_sync: new Date().toISOString()
          };

          // Twitter returns a new refresh_token on each refresh
          if (data.refresh_token) {
            updateData.refresh_token = encryptToken(data.refresh_token);
          }

          await supabase
            .from('social_media')
            .update(updateData)
            .eq('user_id', userId)
            .eq('platform', 'x');

          result.success = true;
          result.new_expiry = newExpiry.toISOString();
          console.log(`✅ Twitter token renovado, expira: ${newExpiry.toISOString()}`);
          break;
        }

        default:
          result.error = `Plataforma ${platform} no soporta refresh`;
      }
    } catch (error: any) {
      result.error = error.message || 'Error desconocido';
      console.error(`❌ Error renovando token de ${platform}:`, error);
    }

    return result;
  }

  /**
   * Renueva tokens que están por expirar para todos los usuarios
   */
  async refreshExpiringTokens(hoursThreshold: number = 24): Promise<RefreshResult[]> {
    console.log(`🔄 Buscando tokens que expiran en ${hoursThreshold}h...`);

    const thresholdDate = new Date(Date.now() + hoursThreshold * 60 * 60 * 1000);

    const { data: connections, error } = await supabase
      .from('social_media')
      .select('user_id, platform, username, access_token, refresh_token, token_expiry')
      .eq('connected', true)
      .not('token_expiry', 'is', null)
      .lt('token_expiry', thresholdDate.toISOString())
      .gt('token_expiry', new Date().toISOString()); // Not already expired

    if (error || !connections || connections.length === 0) {
      console.log('✅ No hay tokens por expirar');
      return [];
    }

    console.log(`⚠️ ${connections.length} tokens expiran pronto`);

    const results: RefreshResult[] = [];

    for (const conn of connections) {
      // For Facebook/Instagram, use access_token as the "refresh" source
      // For YouTube/Twitter, use the actual refresh_token
      const tokenToUse = (conn.platform === 'facebook' || conn.platform === 'instagram')
        ? conn.access_token
        : conn.refresh_token;

      if (!tokenToUse) {
        results.push({ platform: conn.platform, success: false, error: 'No refresh token' });
        continue;
      }

      const result = await this.refreshToken(conn.user_id, conn.platform, tokenToUse);
      results.push(result);
    }

    const ok = results.filter(r => r.success).length;
    const fail = results.filter(r => !r.success).length;
    console.log(`📊 Renovación: ${ok} exitosos, ${fail} fallidos`);

    return results;
  }

  /**
   * Renueva tokens para un usuario específico
   */
  async refreshUserTokens(userId: string): Promise<RefreshResult[]> {
    console.log(`🔄 Verificando tokens para usuario ${userId}...`);

    const { data: connections } = await supabase
      .from('social_media')
      .select('platform, access_token, refresh_token, token_expiry')
      .eq('user_id', userId)
      .eq('connected', true)
      .not('token_expiry', 'is', null);

    if (!connections || connections.length === 0) return [];

    const results: RefreshResult[] = [];

    for (const conn of connections) {
      const expiryDate = new Date(conn.token_expiry);
      const hoursLeft = (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60);

      if (hoursLeft < 24 && hoursLeft > 0) {
        const tokenToUse = (conn.platform === 'facebook' || conn.platform === 'instagram')
          ? conn.access_token
          : conn.refresh_token;

        if (!tokenToUse) {
          results.push({ platform: conn.platform, success: false, error: 'No refresh token' });
          continue;
        }

        const result = await this.refreshToken(userId, conn.platform, tokenToUse);
        results.push(result);
      }
    }

    return results;
  }
}

export const tokenRefreshService = new TokenRefreshService();
export default tokenRefreshService;
