/**
 * Twitter/X OAuth Callback - Sistema REAL
 *
 * Procesa el callback de autenticación de Twitter/X usando OAuth 2.0
 * y guarda los tokens de forma segura en Supabase.
 *
 * Soporta flujo web (popup → `/oauth-callback`) y flujo app (WebView →
 * `/oauth-app-success`), según el `state`.
 *
 * Documentación: https://developer.twitter.com/en/docs/authentication/oauth-2-0
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { saveOAuthConnection } from '@/lib/oauth-storage';
import { checkSocialAccountLimit } from '@/lib/plan-limits';
import { parseAppState, appResultUrl } from '@/lib/oauth/app-flow';
import jwt from 'jsonwebtoken';

const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID || process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID;
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET;
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
const REDIRECT_URI = `${BASE_URL}/api/auth/twitter/callback`;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const appState = parseAppState(searchParams.get('state'));

  const ok = (platform: string) =>
    appState
      ? NextResponse.redirect(appResultUrl(BASE_URL, appState.redirect, { platform }))
      : NextResponse.redirect(`${BASE_URL}/oauth-callback?success=${platform}`);
  const fail = (reason: string, extra = '') =>
    appState
      ? NextResponse.redirect(appResultUrl(BASE_URL, appState.redirect, { error: reason }))
      : NextResponse.redirect(`${BASE_URL}/oauth-callback?error=${reason}${extra}`);

  console.log('🐦 Twitter OAuth Callback recibido', appState ? '(app)' : '(web)');

  if (error) {
    console.error('❌ Twitter OAuth error:', error, errorDescription);
    return fail(error, `&description=${encodeURIComponent(errorDescription || '')}`);
  }

  if (!code) {
    console.error('❌ No se recibió código de autorización');
    return fail('no_code');
  }

  if (!TWITTER_CLIENT_ID || !TWITTER_CLIENT_SECRET) {
    console.error('❌ Twitter credentials no configuradas en .env');
    return fail('config_missing');
  }

  try {
    // Obtener usuario actual
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token')?.value;

    if (!authToken) {
      console.error('❌ Usuario no autenticado');
      return appState ? fail('not_authenticated') : NextResponse.redirect(`${BASE_URL}/login?error=not_authenticated`);
    }

    const decoded = jwt.decode(authToken) as { userId: string } | null;
    if (!decoded || !decoded.userId) {
      console.error('❌ Token JWT inválido');
      return appState ? fail('invalid_token') : NextResponse.redirect(`${BASE_URL}/login?error=invalid_token`);
    }

    const userId = decoded.userId;
    console.log(`🔐 Usuario autenticado: ${userId}`);

    // PASO 1: Intercambiar código por access token
    console.log('🔄 Intercambiando código por access token...');

    // Twitter OAuth 2.0 requiere Basic Auth con client_id:client_secret en Base64
    const basicAuth = Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString('base64');

    // Leer PKCE code_verifier de cookie (la pone la ruta de inicio o la página oauth-login)
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
      return fail('token_exchange_failed');
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
      return fail('profile_fetch_failed');
    }

    const profileData = await profileResponse.json();
    const profile = profileData.data;
    console.log('✅ Perfil obtenido:', profile.username);

    // PASO 3: Verificar límite del plan antes de conectar
    const limitCheck = await checkSocialAccountLimit(userId, 'x');
    if (!limitCheck.allowed) {
      console.warn(`⚠️ X conexión rechazada por límite de plan: ${limitCheck.reason}`);
      return fail('plan_limit', `&plan=${limitCheck.plan}&reason=${encodeURIComponent(limitCheck.reason || 'Límite alcanzado')}`);
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
      return fail('save_failed');
    }

    console.log('✅ Twitter conectado exitosamente');
    return ok('twitter');

  } catch (error) {
    console.error('❌ Error en Twitter OAuth callback:', error);
    return fail('oauth_failed');
  }
}
