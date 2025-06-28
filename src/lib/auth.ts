import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { db as prisma } from "./db"

// Importar proveedores OAuth
import FacebookProvider from "next-auth/providers/facebook"
import TwitterProvider from "next-auth/providers/twitter"
import GoogleProvider from "next-auth/providers/google"
import LinkedInProvider from "next-auth/providers/linkedin"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "pages_read_engagement,pages_show_list,email"
        }
      }
    }),
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: "2.0", // Use Twitter API v2
      authorization: {
        params: {
          scope: "tweet.read users.read follows.read offline.access"
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email"
        }
      }
    }),
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "r_liteprofile r_emailaddress w_member_social"
        }
      }
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider && account.access_token) {
        // Almacenar tokens OAuth en la tabla SocialMedia
        await saveSocialMediaConnection(user.id!, account, profile)
      }
      return true
    },
    async session({ session, user }) {
      session.user.id = user.id
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  session: {
    strategy: "database"
  }
}

// Función para guardar la conexión de red social
async function saveSocialMediaConnection(
  userId: string, 
  account: any, 
  profile: any
) {
  try {
    const platformMap: { [key: string]: string } = {
      'facebook': 'facebook',
      'twitter': 'x',
      'google': 'youtube', // Google se usa para YouTube
      'linkedin': 'linkedin'
    }

    const platform = platformMap[account.provider]
    if (!platform) return

    // Extraer información específica del perfil según la plataforma
    let username = ''
    let profileUrl = ''
    let followers = 0

    switch (account.provider) {
      case 'facebook':
        username = profile?.name || ''
        profileUrl = profile?.link || ''
        break
      case 'twitter':
        username = profile?.data?.username || profile?.screen_name || ''
        profileUrl = `https://x.com/${username}`
        followers = profile?.data?.public_metrics?.followers_count || 0
        break
      case 'google':
        username = profile?.name || ''
        profileUrl = profile?.picture || ''
        break
      case 'linkedin':
        username = profile?.localizedFirstName + ' ' + profile?.localizedLastName || ''
        profileUrl = profile?.publicProfileUrl || ''
        break
    }

    // Upsert la conexión de red social
    await prisma.socialMedia.upsert({
      where: {
        userId_platform: {
          userId,
          platform
        }
      },
      update: {
        username,
        profileUrl,
        followers,
        connected: true,
        accessToken: account.access_token,
        refreshToken: account.refresh_token,
        tokenExpiry: account.expires_at ? new Date(account.expires_at * 1000) : null,
        lastSync: new Date()
      },
      create: {
        userId,
        platform,
        username,
        profileUrl,
        followers,
        connected: true,
        accessToken: account.access_token,
        refreshToken: account.refresh_token,
        tokenExpiry: account.expires_at ? new Date(account.expires_at * 1000) : null,
        lastSync: new Date()
      }
    })

    console.log(`✅ Conexión ${platform} guardada para usuario ${userId}`)
  } catch (error) {
    console.error('Error guardando conexión de red social:', error)
  }
}
