import NextAuth from 'next-auth';
import { AuthOptions } from 'next-auth';
import FacebookProvider from 'next-auth/providers/facebook';
import GoogleProvider from 'next-auth/providers/google';
import LinkedInProvider from 'next-auth/providers/linkedin';
import TwitterProvider from 'next-auth/providers/twitter';

const authOptions: AuthOptions = {
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
      profile(profile) {
        return {
          id: profile.id,
          name: profile.name,
          email: profile.email || '',
          image: profile.threads_profile_picture_url,
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
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
