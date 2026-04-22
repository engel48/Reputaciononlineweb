/**
 * Instagram OAuth Token Exchange
 *
 * POST - Receives authorization code from Instagram callback popup,
 * exchanges for access token via Facebook Graph API,
 * fetches Instagram Business profile, and saves to Supabase.
 *
 * Instagram uses Facebook OAuth system - the code is exchanged
 * through Facebook's Graph API, then Instagram accounts are
 * fetched via the connected Facebook Pages.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { saveOAuthConnection } from '@/lib/oauth-storage';
import { checkSocialAccountLimit } from '@/lib/plan-limits';
import { facebookOAuth } from '@/lib/oauth/facebook';
import jwt from 'jsonwebtoken';

const FACEBOOK_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Codigo de autorizacion no proporcionado' },
        { status: 400 }
      );
    }

    if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
      console.error('Instagram/Facebook credentials no configuradas');
      return NextResponse.json(
        { success: false, error: 'Instagram OAuth no esta configurado' },
        { status: 500 }
      );
    }

    // Authenticate user via JWT cookie
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token')?.value;

    if (!authToken) {
      return NextResponse.json(
        { success: false, error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }

    const decoded = jwt.decode(authToken) as { userId: string } | null;
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, error: 'Token JWT invalido' },
        { status: 401 }
      );
    }

    const userId = decoded.userId;
    console.log(`📸 Instagram OAuth: Usuario ${userId}`);

    // Step 1: Exchange code for access token via Facebook Graph API
    const redirectUri = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/instagram/callback`;
    const tokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${FACEBOOK_APP_ID}&client_secret=${FACEBOOK_APP_SECRET}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`;

    console.log('🔄 Intercambiando codigo por access token...');
    const tokenResponse = await fetch(tokenUrl);

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Error obteniendo access token:', errorData);
      return NextResponse.json(
        { success: false, error: 'Error obteniendo token de acceso' },
        { status: 500 }
      );
    }

    const tokenData = await tokenResponse.json();
    const { access_token, expires_in } = tokenData;
    console.log('Access token obtenido');

    // Step 2: Get Facebook pages to find Instagram Business accounts
    let instagramProfile: any = null;
    let instagramUsername = '';
    let instagramFollowers = 0;
    let profileImage = '';

    try {
      const pages = await facebookOAuth.getUserPages(access_token);
      console.log(`📄 ${pages.length} paginas de Facebook encontradas`);

      for (const page of pages) {
        const igAccounts = await facebookOAuth.getInstagramAccounts(access_token, page.id);
        if (igAccounts && igAccounts.length > 0) {
          instagramProfile = igAccounts[0];
          instagramUsername = instagramProfile.username || page.name;
          instagramFollowers = instagramProfile.followers_count || 0;
          profileImage = instagramProfile.profile_picture_url || '';
          console.log(`📸 Instagram Business encontrado: @${instagramUsername}`);
          break;
        }
      }
    } catch (igError) {
      console.warn('No se pudo obtener cuenta de Instagram Business, usando perfil de Facebook:', igError);
    }

    // Fallback: use Facebook profile if no Instagram Business found
    if (!instagramUsername) {
      const fbProfile = await facebookOAuth.getProfile(access_token);
      if (fbProfile) {
        instagramUsername = fbProfile.name || 'Instagram User';
        profileImage = fbProfile.picture?.data?.url || '';
        console.log('Usando perfil de Facebook como fallback');
      }
    }

    // Step 3: Verificar límite del plan antes de conectar
    const limitCheck = await checkSocialAccountLimit(userId, 'instagram');
    if (!limitCheck.allowed) {
      console.warn(`⚠️ Instagram conexión rechazada por límite de plan: ${limitCheck.reason}`);
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/oauth-callback?error=plan_limit&plan=${limitCheck.plan}&reason=${encodeURIComponent(limitCheck.reason || 'Límite alcanzado')}`
      );
    }

    // Step 4: Save to Supabase
    const expiresAt = new Date(Date.now() + (expires_in || 3600) * 1000);

    const saved = await saveOAuthConnection({
      userId,
      platform: 'instagram',
      accessToken: access_token,
      expiresAt,
      profile: {
        id: instagramProfile?.id || 'ig_user',
        name: instagramUsername,
        username: instagramUsername,
        profileImage,
        followers: instagramFollowers
      }
    });

    if (!saved) {
      return NextResponse.json(
        { success: false, error: 'Error guardando conexion' },
        { status: 500 }
      );
    }

    console.log('Instagram conectado exitosamente');

    return NextResponse.json({
      success: true,
      profile: {
        id: instagramProfile?.id || 'ig_user',
        name: instagramUsername,
        username: instagramUsername,
        followers: instagramFollowers,
        avatar: profileImage,
        platform: 'instagram'
      }
    });

  } catch (error: any) {
    console.error('Error en POST /api/auth/instagram:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno' },
      { status: 500 }
    );
  }
}
