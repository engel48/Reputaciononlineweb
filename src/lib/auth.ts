import { NextAuthOptions } from "next-auth"
import FacebookProvider from "next-auth/providers/facebook"
import TwitterProvider from "next-auth/providers/twitter"
import GoogleProvider from "next-auth/providers/google"
import LinkedInProvider from "next-auth/providers/linkedin"

export const authOptions: NextAuthOptions = {
  providers: [
    // Provider principal para login de la aplicación
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    // YouTube OAuth (via Google con scopes específicos)
    GoogleProvider({
      id: "youtube",
      name: "YouTube",
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.force-ssl https://www.googleapis.com/auth/youtubepartner',
        },
      },
    }),
    // Proveedores para conexión de redes sociales
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || '',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
      authorization: {
        params: {
          scope: 'email,public_profile,pages_read_engagement,pages_read_user_content,pages_show_list,instagram_basic',
        },
      },
    }),
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID || '',
      clientSecret: process.env.TWITTER_CLIENT_SECRET || '',
      version: "2.0",
      authorization: {
        params: {
          scope: 'tweet.read users.read follows.read offline.access',
        },
      },
    }),
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID || '',
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
      authorization: {
        params: {
          scope: 'r_liteprofile r_emailaddress r_organization_social',
        },
      },
    }),
    // Threads OAuth (via Facebook API)
    {
      id: "threads",
      name: "Threads",
      type: "oauth",
      authorization: {
        url: "https://www.facebook.com/v18.0/dialog/oauth",
        params: {
          scope: "threads_basic,threads_content_publish,threads_manage_insights",
          response_type: "code",
        },
      },
      token: "https://graph.facebook.com/v18.0/oauth/access_token",
      userinfo: "https://graph.threads.net/v1.0/me?fields=id,username,name,threads_profile_picture_url",
      clientId: process.env.FACEBOOK_CLIENT_ID || '',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
      profile(profile: any) {
        return {
          id: profile.id,
          name: profile.name,
          email: profile.email || '',
          image: profile.threads_profile_picture_url,
        };
      },
    },
    // TikTok OAuth
    {
      id: "tiktok",
      name: "TikTok",
      type: "oauth",
      authorization: {
        url: "https://www.tiktok.com/v2/auth/authorize/",
        params: {
          client_key: process.env.TIKTOK_CLIENT_KEY || process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY || '',
          scope: "user.info.basic,video.list",
          response_type: "code",
          state: "",
        },
      },
      token: {
        url: "https://open.tiktokapis.com/v2/oauth/token/",
        async request({ params, provider }) {
          const tokenUrl = "https://open.tiktokapis.com/v2/oauth/token/";
          const response = await fetch(tokenUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              client_key: provider.clientId || '',
              client_secret: provider.clientSecret || '',
              code: params.code || '',
              grant_type: "authorization_code",
              redirect_uri: String(params.redirect_uri || ''),
            }),
          });
          const tokens = await response.json();
          return { tokens };
        },
      },
      userinfo: {
        url: "https://open.tiktokapis.com/v2/user/info/",
        params: {
          fields: "open_id,union_id,avatar_url,display_name,follower_count,following_count,likes_count,video_count"
        },
        async request({ tokens, provider }) {
          const userinfoUrl = "https://open.tiktokapis.com/v2/user/info/";
          const response = await fetch(
            `${userinfoUrl}?fields=open_id,union_id,avatar_url,display_name,follower_count,following_count,likes_count,video_count`,
            {
              headers: {
                Authorization: `Bearer ${tokens.access_token}`,
              },
            }
          );
          const data = await response.json();
          return data.data?.user || {};
        },
      },
      clientId: process.env.TIKTOK_CLIENT_KEY || process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY || '',
      clientSecret: process.env.TIKTOK_CLIENT_SECRET || '',
      profile(profile: any) {
        return {
          id: profile.open_id,
          name: profile.display_name,
          email: '', // TikTok no proporciona email
          image: profile.avatar_url,
        };
      },
    },
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Persistir el token de acceso OAuth y datos del perfil
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.provider = account.provider;
        token.providerAccountId = account.providerAccountId;

        // Guardar conexión en Supabase
        if (token.email) {
          await saveSocialMediaConnection(token.email, account, profile);
        }
      }
      if (profile) {
        token.profile = profile;
      }
      return token;
    },
    async session({ session, token }) {
      // Enviar propiedades al cliente
      session.accessToken = token.accessToken as string;
      session.provider = token.provider as string;
      session.providerAccountId = token.providerAccountId as string;
      session.profile = token.profile;
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
}

// Función para guardar la conexión de red social en Supabase
async function saveSocialMediaConnection(
  userEmail: string,
  account: any,
  profile: any
) {
  try {
    const { saveOAuthConnection } = await import('@/lib/oauth-storage');
    const { userService } = await import('@/lib/database-adapter');

    // Buscar usuario por email
    const user = await userService.findByEmail(userEmail);
    if (!user) {
      console.error(`❌ Usuario no encontrado: ${userEmail}`);
      return;
    }

    const platformMap: { [key: string]: string } = {
      'facebook': 'facebook',
      'twitter': 'x',
      'google': 'youtube', // Google se usa para YouTube
      'linkedin': 'linkedin',
      'threads': 'threads',
      'youtube': 'youtube',
      'tiktok': 'tiktok'
    };

    const platform = platformMap[account.provider];
    if (!platform) {
      console.log(`⚠️ Plataforma no soportada: ${account.provider}`);
      return;
    }

    // Extraer información específica del perfil según la plataforma
    let username = '';
    let profileUrl = '';
    let followers = 0;
    let profileImage = '';

    switch (account.provider) {
      case 'facebook':
        username = profile?.name || '';
        profileUrl = profile?.link || '';
        profileImage = profile?.picture?.data?.url || '';
        break;
      case 'twitter':
        username = profile?.data?.username || profile?.screen_name || '';
        profileUrl = `https://x.com/${username}`;
        followers = profile?.data?.public_metrics?.followers_count || 0;
        profileImage = profile?.data?.profile_image_url || '';
        break;
      case 'google':
      case 'youtube':
        username = profile?.name || '';
        profileUrl = profile?.picture || '';
        profileImage = profile?.picture || '';
        break;
      case 'linkedin':
        username = (profile?.localizedFirstName || '') + ' ' + (profile?.localizedLastName || '');
        profileUrl = profile?.publicProfileUrl || '';
        break;
      case 'threads':
        username = profile?.username || '';
        profileUrl = `https://threads.net/@${username}`;
        profileImage = profile?.threads_profile_picture_url || '';
        break;
      case 'tiktok':
        username = profile?.display_name || '';
        profileUrl = profile?.profile_deep_link || `https://www.tiktok.com/@${profile?.open_id}`;
        followers = profile?.follower_count || 0;
        profileImage = profile?.avatar_url || '';
        break;
    }

    // Calcular fecha de expiración
    const expiresAt = account.expires_at
      ? new Date(account.expires_at * 1000)
      : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 días por defecto

    // Guardar usando el sistema de OAuth storage
    await saveOAuthConnection({
      userId: user.id,
      platform: platform as any,
      accessToken: account.access_token || '',
      refreshToken: account.refresh_token,
      expiresAt,
      profile: {
        id: profile?.id || account.providerAccountId,
        name: profile?.name || username,
        email: profile?.email || userEmail,
        username,
        profileImage,
        followers
      }
    });

    console.log(`✅ Conexión ${platform} guardada para usuario ${user.id} (${userEmail})`);
  } catch (error) {
    console.error('Error guardando conexión de red social:', error);
  }
}
