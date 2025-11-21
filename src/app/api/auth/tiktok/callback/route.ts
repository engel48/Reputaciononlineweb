/**
 * TikTok OAuth Callback - Sistema REAL
 *
 * Procesa el callback de autenticación de TikTok y guarda
 * los tokens de forma segura en Supabase.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { saveOAuthConnection } from '@/lib/oauth-storage';
import { tiktokOAuth } from '@/lib/oauth/tiktok';
import jwt from 'jsonwebtoken';

const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY || process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY;
const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET;
const REDIRECT_URI = process.env.NEXTAUTH_URL
  ? `${process.env.NEXTAUTH_URL}/api/auth/tiktok/callback`
  : 'http://localhost:3000/api/auth/tiktok/callback';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const state = searchParams.get('state');

  console.log('🎵 TikTok OAuth Callback recibido');

  // Manejar errores de OAuth
  if (error) {
    console.error('❌ TikTok OAuth error:', error, errorDescription);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/redes-sociales?error=${error}&description=${encodeURIComponent(errorDescription || '')}`
    );
  }

  // Validar que tenemos el código de autorización
  if (!code) {
    console.error('❌ No se recibió código de autorización');
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/redes-sociales?error=no_code`
    );
  }

  // Validar state para CSRF protection
  const cookieStore = await cookies();
  const storedState = cookieStore.get('tiktok_oauth_state')?.value;

  if (!state || state !== storedState) {
    console.error('❌ State de OAuth inválido (posible ataque CSRF)');
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/redes-sociales?error=invalid_state`
    );
  }

  // Validar configuración
  if (!TIKTOK_CLIENT_KEY || !TIKTOK_CLIENT_SECRET) {
    console.error('❌ TikTok credentials no configuradas en .env');
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/redes-sociales?error=config_missing`
    );
  }

  try {
    // Obtener usuario actual desde cookie JWT
    const authToken = cookieStore.get('auth-token')?.value;

    if (!authToken) {
      console.error('❌ Usuario no autenticado');
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login?error=not_authenticated`
      );
    }

    // Decodificar JWT para obtener userId
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
    const tokenData = await tiktokOAuth.exchangeCodeForToken(code, REDIRECT_URI);

    if (!tokenData) {
      console.error('❌ Error obteniendo access token');
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/redes-sociales?error=token_exchange_failed`
      );
    }

    console.log('✅ Access token obtenido, válido por:', tokenData.expires_in, 'segundos');

    // PASO 2: Obtener perfil del usuario
    console.log('🔄 Obteniendo perfil del usuario...');
    const profile = await tiktokOAuth.getProfile(tokenData.access_token);

    if (!profile) {
      console.error('❌ Error obteniendo perfil de TikTok');
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/redes-sociales?error=profile_fetch_failed`
      );
    }

    console.log('✅ Perfil obtenido:', profile.display_name, '(@', profile.open_id, ')');

    // PASO 3: Guardar en Supabase con encriptación
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    const saved = await saveOAuthConnection({
      userId,
      platform: 'tiktok',
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt,
      profile: {
        id: profile.open_id,
        name: profile.display_name,
        email: '', // TikTok no proporciona email
        username: profile.display_name,
        profileImage: profile.avatar_url_100 || profile.avatar_url,
        followers: profile.follower_count || 0
      }
    });

    if (!saved) {
      console.error('❌ Error guardando conexión en Supabase');
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/redes-sociales?error=save_failed`
      );
    }

    // Limpiar cookie de state
    const response = NextResponse.redirect(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/redes-sociales?success=tiktok`
    );

    response.cookies.delete('tiktok_oauth_state');

    console.log('✅ TikTok conectado exitosamente');
    return response;

  } catch (error) {
    console.error('❌ Error en TikTok OAuth callback:', error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/redes-sociales?error=oauth_failed`
    );
  }
}
