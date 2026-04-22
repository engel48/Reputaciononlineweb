/**
 * Twitter/X OAuth Callback - Sistema REAL
 *
 * Procesa el callback de autenticación de Twitter/X usando OAuth 2.0
 * y guarda los tokens de forma segura en Supabase.
 *
 * Documentación: https://developer.twitter.com/en/docs/authentication/oauth-2-0
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { saveOAuthConnection } from '@/lib/oauth-storage';
import { checkSocialAccountLimit } from '@/lib/plan-limits';
import jwt from 'jsonwebtoken';

const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID || process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID;
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET;
const REDIRECT_URI = process.env.NEXTAUTH_URL
  ? `${process.env.NEXTAUTH_URL}/api/auth/twitter/callback`
  : 'http://localhost:3000/api/auth/twitter/callback';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const state = searchParams.get('state');

  console.log('🐦 Twitter OAuth Callback recibido');

  if (error) {
    console.error('❌ Twitter OAuth error:', error, errorDescription);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/oauth-callback?error=${error}&description=${encodeURIComponent(errorDescription || '')}`
    );
  }

  if (!code) {
    console.error('❌ No se recibió código de autorización');
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/oauth-callback?error=no_code`
    );
  }

  if (!TWITTER_CLIENT_ID || !TWITTER_CLIENT_SECRET) {
    console.error('❌ Twitter credentials no configuradas en .env');
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/oauth-callback?error=config_missing`
    );
  }

  try {
    // Obtener usuario actual
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token')?.value;

    if (!authToken) {
      console.error('❌ Usuario no autenticado');
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login?error=not_authenticated`
      );
    }

    const decoded = jwt.decode(authToken) as { userId: string } | null;
    if (!decoded || !decoded.userId) {
      console.error('❌ Token JWT inválido');
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login?error=invalid_token`
      );
    }

    const userId = decoded.userId;
    console.log(`🔐 Usuario autenticado: ${userId}`);

    // PASO 1: Intercambiar código por access token
    console.log('🔄 Intercambiando código por access token...');

    // Twitter OAuth 2.0 requiere Basic Auth con client_id:client_secret en Base64
    const basicAuth = Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString('base64');

    // Leer PKCE code_verifier de cookie (puesta por oauth-login page)
    const pkceVerifier = cookieStore.get('pkce_verifier')?.value || 'challenge';
    console.log(`🔐 PKCE verifier: ${pkceVerifier.substring(0, 10)}...`);

    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
        code_verifier: pkceVerifier
      })
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('❌ Error obteniendo access token:', errorData);
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/oauth-callback?error=token_exchange_failed`
      );
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    console.log('✅ Access token obtenido, válido por:', expires_in, 'segundos');

    // PASO 2: Obtener perfil del usuario
    console.log('🔄 Obteniendo perfil del usuario...');
    const profileResponse = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url,public_metrics,username,name', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    if (!profileResponse.ok) {
      console.error('❌ Error obteniendo perfil de Twitter');
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/oauth-callback?error=profile_fetch_failed`
      );
    }

    const profileData = await profileResponse.json();
    const profile = profileData.data;
    console.log('✅ Perfil obtenido:', profile.username);

    // PASO 3: Verificar límite del plan antes de conectar
    const limitCheck = await checkSocialAccountLimit(userId, 'x');
    if (!limitCheck.allowed) {
      console.warn(`⚠️ X conexión rechazada por límite de plan: ${limitCheck.reason}`);
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/oauth-callback?error=plan_limit&plan=${limitCheck.plan}&reason=${encodeURIComponent(limitCheck.reason || 'Límite alcanzado')}`
      );
    }

    // PASO 4: Guardar en Supabase con encriptación
    const expiresAt = new Date(Date.now() + expires_in * 1000);

    const saved = await saveOAuthConnection({
      userId,
      platform: 'x', // Usamos 'x' como platform identifier
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt,
      profile: {
        id: profile.id,
        name: profile.name,
        username: profile.username,
        profileImage: profile.profile_image_url,
        followers: profile.public_metrics?.followers_count || 0
      }
    });

    if (!saved) {
      console.error('❌ Error guardando conexión en Supabase');
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/oauth-callback?error=save_failed`
      );
    }

    console.log('✅ Twitter conectado exitosamente');
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/oauth-callback?success=twitter`
    );

  } catch (error) {
    console.error('❌ Error en Twitter OAuth callback:', error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/oauth-callback?error=oauth_failed`
    );
  }
}
