// src/services/socialMediaServiceReal.ts
import { db } from '@/lib/db';

export interface SocialPlatformConfig {
  platform: string;
  name: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  authUrl: string;
  tokenUrl: string;
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
}

export interface SocialMediaProfile {
  platform: string;
  username: string;
  profileUrl: string;
  followers: number;
  following: number;
  posts: number;
  profileImage?: string;
  verified?: boolean;
}

// Configuraciones OAuth para cada plataforma
const SOCIAL_PLATFORMS: Record<string, SocialPlatformConfig> = {
  x: {
    platform: 'x',
    name: 'X (Twitter)',
    clientId: process.env.TWITTER_CLIENT_ID || '',
    clientSecret: process.env.TWITTER_CLIENT_SECRET || '',
    redirectUri: process.env.NEXT_PUBLIC_BASE_URL + '/api/auth/callback/twitter',
    scopes: ['tweet.read', 'users.read', 'follows.read'],
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    tokenUrl: 'https://api.twitter.com/2/oauth2/token'
  },
  facebook: {
    platform: 'facebook',
    name: 'Facebook',
    clientId: process.env.FACEBOOK_CLIENT_ID || '',
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
    redirectUri: process.env.NEXT_PUBLIC_BASE_URL + '/api/auth/callback/facebook',
    scopes: ['public_profile', 'pages_read_engagement', 'pages_show_list'],
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token'
  },
  instagram: {
    platform: 'instagram',
    name: 'Instagram',
    clientId: process.env.INSTAGRAM_CLIENT_ID || '',
    clientSecret: process.env.INSTAGRAM_CLIENT_SECRET || '',
    redirectUri: process.env.NEXT_PUBLIC_BASE_URL + '/api/auth/callback/instagram',
    scopes: ['user_profile', 'user_media'],
    authUrl: 'https://api.instagram.com/oauth/authorize',
    tokenUrl: 'https://api.instagram.com/oauth/access_token'
  },
  linkedin: {
    platform: 'linkedin',
    name: 'LinkedIn',
    clientId: process.env.LINKEDIN_CLIENT_ID || '',
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
    redirectUri: process.env.NEXT_PUBLIC_BASE_URL + '/api/auth/callback/linkedin',
    scopes: ['r_liteprofile', 'r_emailaddress', 'w_member_social'],
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken'
  },
  tiktok: {
    platform: 'tiktok',
    name: 'TikTok',
    clientId: process.env.TIKTOK_CLIENT_ID || '',
    clientSecret: process.env.TIKTOK_CLIENT_SECRET || '',
    redirectUri: process.env.NEXT_PUBLIC_BASE_URL + '/api/auth/callback/tiktok',
    scopes: ['user.info.basic', 'video.list'],
    authUrl: 'https://www.tiktok.com/auth/authorize/',
    tokenUrl: 'https://open-api.tiktok.com/oauth/access_token/'
  },
  threads: {
    platform: 'threads',
    name: 'Threads',
    clientId: process.env.THREADS_CLIENT_ID || '',
    clientSecret: process.env.THREADS_CLIENT_SECRET || '',
    redirectUri: process.env.NEXT_PUBLIC_BASE_URL + '/api/auth/callback/threads',
    scopes: ['threads_basic', 'threads_content_publish'],
    authUrl: 'https://threads.net/oauth/authorize',
    tokenUrl: 'https://graph.threads.net/oauth/access_token'
  }
};

// Generar URL de autorización OAuth
export const generateAuthUrl = (platform: string, userId: string): string => {
  const config = SOCIAL_PLATFORMS[platform];
  if (!config) {
    throw new Error(`Plataforma no soportada: ${platform}`);
  }

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scopes.join(' '),
    response_type: 'code',
    state: `${userId}_${platform}_${Date.now()}` // Para verificar la respuesta
  });

  return `${config.authUrl}?${params.toString()}`;
};

// Intercambiar código por tokens
export const exchangeCodeForTokens = async (
  platform: string,
  code: string,
  state: string
): Promise<OAuthTokens> => {
  const config = SOCIAL_PLATFORMS[platform];
  if (!config) {
    throw new Error(`Plataforma no soportada: ${platform}`);
  }

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: config.redirectUri
    })
  });

  if (!response.ok) {
    throw new Error(`Error obteniendo tokens: ${response.statusText}`);
  }

  const tokens = await response.json();
  
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresIn: tokens.expires_in,
    tokenType: tokens.token_type || 'Bearer'
  };
};

// Obtener perfil del usuario desde la API de la plataforma
export const fetchUserProfile = async (
  platform: string,
  accessToken: string
): Promise<SocialMediaProfile> => {
  switch (platform) {
    case 'x':
      return await fetchTwitterProfile(accessToken);
    case 'facebook':
      return await fetchFacebookProfile(accessToken);
    case 'instagram':
      return await fetchInstagramProfile(accessToken);
    case 'linkedin':
      return await fetchLinkedInProfile(accessToken);
    case 'tiktok':
      return await fetchTikTokProfile(accessToken);
    case 'threads':
      return await fetchThreadsProfile(accessToken);
    default:
      throw new Error(`Plataforma no soportada: ${platform}`);
  }
};

// Implementaciones específicas para cada plataforma
const fetchTwitterProfile = async (accessToken: string): Promise<SocialMediaProfile> => {
  const response = await fetch('https://api.twitter.com/2/users/me?user.fields=public_metrics,profile_image_url,verified', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Error obteniendo perfil de Twitter');
  }

  const data = await response.json();
  const user = data.data;

  return {
    platform: 'x',
    username: user.username,
    profileUrl: `https://x.com/${user.username}`,
    followers: user.public_metrics?.followers_count || 0,
    following: user.public_metrics?.following_count || 0,
    posts: user.public_metrics?.tweet_count || 0,
    profileImage: user.profile_image_url,
    verified: user.verified
  };
};

const fetchFacebookProfile = async (accessToken: string): Promise<SocialMediaProfile> => {
  const response = await fetch(`https://graph.facebook.com/v18.0/me?fields=id,name,picture,link&access_token=${accessToken}`);

  if (!response.ok) {
    throw new Error('Error obteniendo perfil de Facebook');
  }

  const data = await response.json();

  // Para páginas de Facebook, necesitamos obtener métricas adicionales
  const pagesResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`);
  const pagesData = await pagesResponse.json();

  return {
    platform: 'facebook',
    username: data.name,
    profileUrl: data.link || `https://facebook.com/${data.id}`,
    followers: 0, // Requiere permisos adicionales
    following: 0,
    posts: 0,
    profileImage: data.picture?.data?.url
  };
};

const fetchInstagramProfile = async (accessToken: string): Promise<SocialMediaProfile> => {
  const response = await fetch(`https://graph.instagram.com/me?fields=id,username,media_count&access_token=${accessToken}`);

  if (!response.ok) {
    throw new Error('Error obteniendo perfil de Instagram');
  }

  const data = await response.json();

  return {
    platform: 'instagram',
    username: data.username,
    profileUrl: `https://instagram.com/${data.username}`,
    followers: 0, // Instagram Basic Display API no proporciona followers
    following: 0,
    posts: data.media_count || 0
  };
};

const fetchLinkedInProfile = async (accessToken: string): Promise<SocialMediaProfile> => {
  const response = await fetch('https://api.linkedin.com/v2/people/~:(id,firstName,lastName,profilePicture(displayImage~:playableStreams))', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Error obteniendo perfil de LinkedIn');
  }

  const data = await response.json();
  const fullName = `${data.firstName.localized.en_US} ${data.lastName.localized.en_US}`;

  return {
    platform: 'linkedin',
    username: fullName,
    profileUrl: `https://linkedin.com/in/${data.id}`,
    followers: 0, // Requiere permisos adicionales
    following: 0,
    posts: 0,
    profileImage: data.profilePicture?.displayImage?.elements?.[0]?.identifiers?.[0]?.identifier
  };
};

const fetchTikTokProfile = async (accessToken: string): Promise<SocialMediaProfile> => {
  const response = await fetch('https://open-api.tiktok.com/user/info/', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Error obteniendo perfil de TikTok');
  }

  const data = await response.json();
  const user = data.data.user;

  return {
    platform: 'tiktok',
    username: user.display_name,
    profileUrl: `https://tiktok.com/@${user.username}`,
    followers: user.follower_count || 0,
    following: user.following_count || 0,
    posts: user.video_count || 0,
    profileImage: user.avatar_url
  };
};

const fetchThreadsProfile = async (accessToken: string): Promise<SocialMediaProfile> => {
  const response = await fetch(`https://graph.threads.net/me?fields=id,username,threads_profile_picture_url&access_token=${accessToken}`);

  if (!response.ok) {
    throw new Error('Error obteniendo perfil de Threads');
  }

  const data = await response.json();

  return {
    platform: 'threads',
    username: data.username,
    profileUrl: `https://threads.net/@${data.username}`,
    followers: 0, // Threads API aún limitada
    following: 0,
    posts: 0,
    profileImage: data.threads_profile_picture_url
  };
};

// Conectar cuenta de red social
export const connectSocialAccount = async (
  userId: string,
  platform: string,
  code: string,
  state: string
): Promise<{ success: boolean; message?: string }> => {
  try {
    // Verificar estado para prevenir CSRF
    const [stateUserId, statePlatform] = state.split('_');
    if (stateUserId !== userId || statePlatform !== platform) {
      return { success: false, message: 'Estado inválido' };
    }

    // Intercambiar código por tokens
    const tokens = await exchangeCodeForTokens(platform, code, state);
    
    // Obtener perfil del usuario
    const profile = await fetchUserProfile(platform, tokens.accessToken);
    
    // Calcular fecha de expiración del token
    const tokenExpiry = tokens.expiresIn 
      ? new Date(Date.now() + tokens.expiresIn * 1000)
      : null;

    // Guardar o actualizar en la base de datos
    await db.socialMedia.upsert({
      where: {
        userId_platform: {
          userId,
          platform
        }
      },
      update: {
        username: profile.username,
        profileUrl: profile.profileUrl,
        followers: profile.followers,
        following: profile.following || 0,
        posts: profile.posts || 0,
        connected: true,
        lastSync: new Date(),
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiry
      },
      create: {
        userId,
        platform,
        username: profile.username,
        profileUrl: profile.profileUrl,
        followers: profile.followers,
        following: profile.following || 0,
        posts: profile.posts || 0,
        connected: true,
        lastSync: new Date(),
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiry
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Error conectando cuenta social:', error);
    return { success: false, message: 'Error conectando la cuenta' };
  }
};

// Desconectar cuenta de red social
export const disconnectSocialAccount = async (
  userId: string,
  platform: string
): Promise<{ success: boolean; message?: string }> => {
  try {
    await db.socialMedia.updateMany({
      where: {
        userId,
        platform
      },
      data: {
        connected: false,
        accessToken: null,
        refreshToken: null,
        tokenExpiry: null
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Error desconectando cuenta social:', error);
    return { success: false, message: 'Error desconectando la cuenta' };
  }
};

// Obtener cuentas sociales del usuario
export const getUserSocialAccounts = async (userId: string) => {
  try {
    const accounts = await db.socialMedia.findMany({
      where: { userId },
      orderBy: { platform: 'asc' }
    });

    return accounts.map(account => ({
      platform: account.platform,
      username: account.username,
      profileUrl: account.profileUrl,
      followers: account.followers,
      following: account.following || 0,
      posts: account.posts || 0,
      connected: account.connected,
      lastSync: account.lastSync?.toISOString()
    }));
  } catch (error) {
    console.error('Error obteniendo cuentas sociales:', error);
    return [];
  }
};

// Refrescar tokens expirados
export const refreshTokens = async (userId: string, platform: string): Promise<boolean> => {
  try {
    const socialAccount = await db.socialMedia.findUnique({
      where: {
        userId_platform: {
          userId,
          platform
        }
      }
    });

    if (!socialAccount || !socialAccount.refreshToken) {
      return false;
    }

    const config = SOCIAL_PLATFORMS[platform];
    if (!config) {
      return false;
    }

    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: socialAccount.refreshToken,
        grant_type: 'refresh_token'
      })
    });

    if (!response.ok) {
      return false;
    }

    const tokens = await response.json();
    
    const tokenExpiry = tokens.expires_in 
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : null;

    await db.socialMedia.update({
      where: {
        userId_platform: {
          userId,
          platform
        }
      },
      data: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || socialAccount.refreshToken,
        tokenExpiry
      }
    });

    return true;
  } catch (error) {
    console.error('Error refrescando tokens:', error);
    return false;
  }
};
