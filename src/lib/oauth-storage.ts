/**
 * Servicio de Almacenamiento OAuth en Supabase
 *
 * Maneja la persistencia segura de tokens OAuth en la base de datos
 * con encriptación AES-256-GCM.
 */

import { supabase } from './supabase-server';
import { encryptToken, decryptToken } from './encryption';

export interface OAuthConnectionData {
  userId: string;
  platform: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  profile: {
    id: string;
    name?: string;
    email?: string;
    username?: string;
    profileImage?: string;
    followers?: number;
  };
}

/**
 * Guarda una conexión OAuth en Supabase con encriptación
 */
export async function saveOAuthConnection(data: OAuthConnectionData): Promise<boolean> {
  try {
    console.log(`🔐 Guardando conexión OAuth para ${data.platform} (usuario: ${data.userId})`);

    // Encriptar tokens antes de guardar
    const encryptedAccessToken = encryptToken(data.accessToken);
    const encryptedRefreshToken = data.refreshToken ? encryptToken(data.refreshToken) : null;

    const { error } = await supabase
      .from('social_media')
      .upsert({
        user_id: data.userId,
        platform: data.platform,
        username: data.profile.username || data.profile.name || 'Usuario',
        profile_url: null, // Se puede agregar después
        followers: data.profile.followers || 0,
        following: 0,
        posts: 0,
        engagement: 0,
        connected: true,
        last_sync: new Date().toISOString(),
        access_token: encryptedAccessToken,
        refresh_token: encryptedRefreshToken,
        token_expiry: data.expiresAt || null,
        profile_data: JSON.stringify(data.profile)
      }, {
        onConflict: 'user_id,platform'
      });

    if (error) {
      console.error('❌ Error guardando OAuth connection:', error);
      return false;
    }

    console.log(`✅ Conexión OAuth guardada exitosamente para ${data.platform}`);
    return true;
  } catch (error) {
    console.error('❌ Error en saveOAuthConnection:', error);
    return false;
  }
}

/**
 * Obtiene el access token desencriptado para una plataforma
 */
export async function getAccessToken(userId: string, platform: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('social_media')
      .select('access_token, token_expiry')
      .eq('user_id', userId)
      .eq('platform', platform)
      .eq('connected', true)
      .single();

    if (error || !data || !data.access_token) {
      return null;
    }

    // Verificar si el token expiró
    if (data.token_expiry) {
      const expiryDate = new Date(data.token_expiry);
      if (expiryDate < new Date()) {
        console.warn(`⚠️ Token expirado para ${platform}`);
        return null;
      }
    }

    // Desencriptar y retornar
    return decryptToken(data.access_token);
  } catch (error) {
    console.error('❌ Error obteniendo access token:', error);
    return null;
  }
}

/**
 * Obtiene el refresh token desencriptado para una plataforma
 */
export async function getRefreshToken(userId: string, platform: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('social_media')
      .select('refresh_token')
      .eq('user_id', userId)
      .eq('platform', platform)
      .eq('connected', true)
      .single();

    if (error || !data || !data.refresh_token) {
      return null;
    }

    return decryptToken(data.refresh_token);
  } catch (error) {
    console.error('❌ Error obteniendo refresh token:', error);
    return null;
  }
}

/**
 * Actualiza un access token (después de refresh)
 */
export async function updateAccessToken(
  userId: string,
  platform: string,
  newAccessToken: string,
  expiresAt?: Date
): Promise<boolean> {
  try {
    const encryptedToken = encryptToken(newAccessToken);

    const { error } = await supabase
      .from('social_media')
      .update({
        access_token: encryptedToken,
        token_expiry: expiresAt || null,
        last_sync: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('platform', platform);

    if (error) {
      console.error('❌ Error actualizando access token:', error);
      return false;
    }

    console.log(`✅ Access token actualizado para ${platform}`);
    return true;
  } catch (error) {
    console.error('❌ Error en updateAccessToken:', error);
    return false;
  }
}

/**
 * Desconecta una plataforma OAuth
 */
export async function disconnectOAuth(userId: string, platform: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('social_media')
      .update({
        connected: false,
        access_token: null,
        refresh_token: null,
        token_expiry: null
      })
      .eq('user_id', userId)
      .eq('platform', platform);

    if (error) {
      console.error('❌ Error desconectando OAuth:', error);
      return false;
    }

    console.log(`✅ OAuth desconectado para ${platform}`);
    return true;
  } catch (error) {
    console.error('❌ Error en disconnectOAuth:', error);
    return false;
  }
}

/**
 * Verifica si una plataforma está conectada y el token es válido
 */
export async function isConnected(userId: string, platform: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('social_media')
      .select('connected, token_expiry')
      .eq('user_id', userId)
      .eq('platform', platform)
      .single();

    if (error || !data || !data.connected) {
      return false;
    }

    // Verificar expiración
    if (data.token_expiry) {
      const expiryDate = new Date(data.token_expiry);
      if (expiryDate < new Date()) {
        return false;
      }
    }

    return true;
  } catch (error) {
    return false;
  }
}
