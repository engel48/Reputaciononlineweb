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
 * Guarda una conexión OAuth en Supabase con encriptación.
 *
 * El UNIQUE constraint (user_id, platform, username) permite que los planes
 * enterprise conecten múltiples cuentas de la misma red social. Para planes
 * con límite de 1 cuenta por red, la capa de validación (checkSocialAccountLimit)
 * bloquea la segunda conexión antes de llegar aquí.
 */
export async function saveOAuthConnection(data: OAuthConnectionData): Promise<boolean> {
  try {
    console.log(`🔐 Guardando conexión OAuth para ${data.platform} (usuario: ${data.userId})`);

    // Encriptar tokens antes de guardar
    const encryptedAccessToken = encryptToken(data.accessToken);
    const encryptedRefreshToken = data.refreshToken ? encryptToken(data.refreshToken) : null;

    const username = data.profile.username || data.profile.name || 'Usuario';

    const { error } = await supabase
      .from('social_media')
      .upsert({
        user_id: data.userId,
        platform: data.platform,
        username,
        display_name: data.profile.name || data.profile.username || 'Usuario',
        profile_image: data.profile.profileImage || null,
        profile_url: data.profile.username
          ? `https://${data.platform === 'x' ? 'x.com' : data.platform + '.com'}/${data.profile.username}`
          : null,
        followers: data.profile.followers || 0,
        following: 0,
        posts: 0,
        engagement: 0,
        connected: true,
        last_sync: new Date().toISOString(),
        access_token: encryptedAccessToken,
        refresh_token: encryptedRefreshToken,
        token_expiry: data.expiresAt || null
      }, {
        onConflict: 'user_id,platform,username'
      });

    if (error) {
      console.error('❌ Error guardando OAuth connection:', error);
      return false;
    }

    console.log(`✅ Conexión OAuth guardada exitosamente para ${data.platform} (@${username})`);
    return true;
  } catch (error) {
    console.error('❌ Error en saveOAuthConnection:', error);
    return false;
  }
}

/**
 * Lista todas las cuentas conectadas de un usuario, opcionalmente filtradas
 * por plataforma. Los planes enterprise pueden tener múltiples cuentas por
 * red, así que esta función retorna un array.
 */
export interface ConnectedAccount {
  id: string;
  platform: string;
  username: string;
  displayName: string | null;
  profileImage: string | null;
  profileUrl: string | null;
  followers: number;
  connected: boolean;
  lastSync: string | null;
  metrics: {
    posts: number;
    engagement: number;
  };
}

export async function listConnectedAccounts(
  userId: string,
  platform?: string
): Promise<ConnectedAccount[]> {
  try {
    let query = supabase
      .from('social_media')
      .select('id, platform, username, display_name, profile_image, profile_url, followers, connected, last_sync, posts, engagement')
      .eq('user_id', userId)
      .eq('connected', true);

    if (platform) {
      query = query.eq('platform', platform);
    }

    const { data, error } = await query.order('last_sync', { ascending: false, nullsFirst: false });

    if (error || !data) {
      console.error('❌ Error listando cuentas conectadas:', error);
      return [];
    }

    return data.map((row: any) => ({
      id: row.id,
      platform: row.platform,
      username: row.username,
      displayName: row.display_name,
      profileImage: row.profile_image,
      profileUrl: row.profile_url,
      followers: row.followers || 0,
      connected: row.connected,
      lastSync: row.last_sync,
      metrics: {
        posts: row.posts || 0,
        engagement: row.engagement || 0,
      },
    }));
  } catch (error) {
    console.error('❌ Error en listConnectedAccounts:', error);
    return [];
  }
}

/**
 * Desconecta una cuenta social específica por id (soporta múltiples cuentas
 * por red en planes enterprise).
 */
export async function disconnectAccountById(
  userId: string,
  accountId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('social_media')
      .update({
        connected: false,
        access_token: null,
        refresh_token: null,
        token_expiry: null
      })
      .eq('id', accountId)
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Error desconectando cuenta por id:', error);
      return false;
    }

    console.log(`✅ Cuenta ${accountId} desconectada`);
    return true;
  } catch (error) {
    console.error('❌ Error en disconnectAccountById:', error);
    return false;
  }
}

/**
 * Obtiene el access token desencriptado para una plataforma.
 * Si hay múltiples cuentas (enterprise), retorna la de `last_sync` más reciente
 * salvo que se especifique un username concreto.
 */
export async function getAccessToken(
  userId: string,
  platform: string,
  username?: string
): Promise<string | null> {
  try {
    let query = supabase
      .from('social_media')
      .select('access_token, token_expiry')
      .eq('user_id', userId)
      .eq('platform', platform)
      .eq('connected', true);

    if (username) {
      query = query.eq('username', username);
    }

    const { data, error } = await query
      .order('last_sync', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();

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
export async function getRefreshToken(
  userId: string,
  platform: string,
  username?: string
): Promise<string | null> {
  try {
    let query = supabase
      .from('social_media')
      .select('refresh_token')
      .eq('user_id', userId)
      .eq('platform', platform)
      .eq('connected', true);

    if (username) {
      query = query.eq('username', username);
    }

    const { data, error } = await query
      .order('last_sync', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();

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
 * Verifica si una plataforma está conectada y al menos un token es válido.
 * Con multi-cuenta enterprise, basta con que una de las cuentas esté activa.
 */
export async function isConnected(userId: string, platform: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('social_media')
      .select('connected, token_expiry')
      .eq('user_id', userId)
      .eq('platform', platform)
      .eq('connected', true);

    if (error || !data || data.length === 0) {
      return false;
    }

    // Al menos una cuenta debe tener token no expirado (o sin expiración)
    const now = new Date();
    return data.some((row: any) => {
      if (!row.connected) return false;
      if (!row.token_expiry) return true;
      return new Date(row.token_expiry) > now;
    });
  } catch (error) {
    return false;
  }
}
