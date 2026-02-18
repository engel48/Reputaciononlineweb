/**
 * Facebook OAuth Callback - Sistema REAL
 *
 * Procesa el callback de autenticación de Facebook y guarda
 * los tokens de forma segura en Supabase.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { saveOAuthConnection } from '@/lib/oauth-storage';
import jwt from 'jsonwebtoken';

const FACEBOOK_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
const REDIRECT_URI = process.env.NEXTAUTH_URL
  ? `${process.env.NEXTAUTH_URL}/api/auth/facebook/callback`
  : 'http://localhost:3000/api/auth/facebook/callback';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  console.log('📱 Facebook OAuth Callback recibido');

  // Manejar errores de OAuth
  if (error) {
    console.error('❌ Facebook OAuth error:', error, errorDescription);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/oauth-callback?error=${error}&description=${encodeURIComponent(errorDescription || '')}`
    );
  }

  // Validar que tenemos el código de autorización
  if (!code) {
    console.error('❌ No se recibió código de autorización');
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/oauth-callback?error=no_code`
    );
  }

  // Validar configuración
  if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
    console.error('❌ Facebook credentials no configuradas en .env');
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/oauth-callback?error=config_missing`
    );
  }

  try {
    // Obtener usuario actual desde cookie JWT
    const cookieStore = await cookies();
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
    const tokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${FACEBOOK_APP_ID}&client_secret=${FACEBOOK_APP_SECRET}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&code=${code}`;

    const tokenResponse = await fetch(tokenUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('❌ Error obteniendo access token:', errorData);
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/oauth-callback?error=token_exchange_failed`
      );
    }

    const tokenData = await tokenResponse.json();
    const { access_token, expires_in } = tokenData;

    console.log('✅ Access token obtenido, válido por:', expires_in, 'segundos');

    // PASO 2: Obtener perfil del usuario
    console.log('🔄 Obteniendo perfil del usuario...');
    const profileUrl = `https://graph.facebook.com/v21.0/me?fields=id,name,email,picture.type(large)&access_token=${access_token}`;

    const profileResponse = await fetch(profileUrl);
    if (!profileResponse.ok) {
      console.error('❌ Error obteniendo perfil de Facebook');
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/oauth-callback?error=profile_fetch_failed`
      );
    }

    const profile = await profileResponse.json();
    console.log('✅ Perfil obtenido:', profile.name);

    // PASO 3: Guardar en Supabase con encriptación
    const expiresAt = new Date(Date.now() + expires_in * 1000);

    const saved = await saveOAuthConnection({
      userId,
      platform: 'facebook',
      accessToken: access_token,
      expiresAt,
      profile: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        username: profile.name,
        profileImage: profile.picture?.data?.url,
        followers: 0 // Se actualizará después con los datos de la página
      }
    });

    if (!saved) {
      console.error('❌ Error guardando conexión en Supabase');
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/oauth-callback?error=save_failed`
      );
    }

    console.log('✅ Facebook conectado exitosamente');
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/oauth-callback?success=facebook`
    );

  } catch (error) {
    console.error('❌ Error en Facebook OAuth callback:', error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/oauth-callback?error=oauth_failed`
    );
  }
}
