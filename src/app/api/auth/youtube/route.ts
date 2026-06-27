import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { encodeAppState, isAppRedirect } from '@/lib/oauth/app-flow';

// Forzar renderizado dinámico porque usa cookies
export const dynamic = 'force-dynamic';

/**
 * YouTube OAuth Handler
 *
 * GET - Iniciar flujo OAuth
 * POST - Intercambiar código por token
 */

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

/**
 * GET - Redirigir a Google OAuth
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const redirectUrl = searchParams.get('redirect') || '/dashboard';

    // Generar state para CSRF protection. Si el redirect es el de la app
    // (WebView), marcamos el flujo "app" para que el callback resuelva
    // server-side en vez de devolver HTML con postMessage.
    const state = isAppRedirect(redirectUrl)
      ? encodeAppState(redirectUrl)
      : Buffer.from(JSON.stringify({
          redirect: redirectUrl,
          timestamp: Date.now()
        })).toString('base64');

    // Construir URL de autorización de Google
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', `${NEXTAUTH_URL}/api/auth/youtube/callback`);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/youtube.readonly');
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('state', state);

    console.log('🔗 Redirigiendo a Google OAuth para YouTube');
    console.log(`   Redirect URI: ${NEXTAUTH_URL}/api/auth/youtube/callback`);

    return NextResponse.redirect(authUrl.toString());

  } catch (error: any) {
    console.error('❌ Error iniciando OAuth de YouTube:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST - Intercambiar código por access token
 */
export async function POST(request: NextRequest) {
  try {
    const { code, state } = await request.json();

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Código de autorización no proporcionado' },
        { status: 400 }
      );
    }

    // Validar state parameter (CSRF protection)
    if (!state) {
      return NextResponse.json(
        { success: false, error: 'State parameter es requerido (CSRF protection)' },
        { status: 400 }
      );
    }

    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      const timestamp = stateData.timestamp;

      // Validar que el state no sea mayor a 10 minutos
      if (!timestamp || Date.now() - timestamp > 10 * 60 * 1000) {
        return NextResponse.json(
          { success: false, error: 'State parameter expirado (CSRF protection)' },
          { status: 400 }
        );
      }
    } catch (stateError) {
      console.error('❌ Error validando state parameter:', stateError);
      return NextResponse.json(
        { success: false, error: 'State parameter inválido (CSRF protection)' },
        { status: 400 }
      );
    }

    // Autenticar usuario
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token')?.value;

    if (!authToken) {
      return NextResponse.json(
        { success: false, error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(authToken, process.env.JWT_SECRET!) as any;
    const userId = decoded.userId;

    console.log('🔄 Intercambiando código OAuth de YouTube por token...');
    console.log(`   Usuario: ${userId}`);

    // Intercambiar código por tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: `${NEXTAUTH_URL}/api/auth/youtube/callback`,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('❌ Error intercambiando código:', errorData);
      return NextResponse.json(
        { success: false, error: 'Error obteniendo token de acceso' },
        { status: 500 }
      );
    }

    const tokens = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokens;

    console.log('✅ Tokens obtenidos de Google');

    // Obtener perfil del canal de YouTube
    const { youtubeOAuth } = await import('@/lib/oauth/youtube');
    const channelProfile = await youtubeOAuth.getChannelProfile(access_token);

    if (!channelProfile) {
      return NextResponse.json(
        { success: false, error: 'No se pudo obtener el perfil del canal' },
        { status: 500 }
      );
    }

    console.log(`✅ Perfil del canal obtenido: ${channelProfile.snippet.title}`);

    // Verificar límite del plan antes de conectar
    const { checkSocialAccountLimit } = await import('@/lib/plan-limits');
    const limitCheck = await checkSocialAccountLimit(userId, 'youtube');
    if (!limitCheck.allowed) {
      console.warn(`⚠️ YouTube conexión rechazada por límite de plan: ${limitCheck.reason}`);
      return NextResponse.json(
        { success: false, error: limitCheck.reason, plan: limitCheck.plan, limit: limitCheck.limit },
        { status: 403 }
      );
    }

    // Guardar en Supabase con encriptación via saveOAuthConnection
    const { saveOAuthConnection } = await import('@/lib/oauth-storage');
    const expiresAt = new Date(Date.now() + expires_in * 1000);

    const saved = await saveOAuthConnection({
      userId,
      platform: 'youtube',
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt,
      profile: {
        id: channelProfile.id,
        name: channelProfile.snippet.title,
        username: channelProfile.snippet.customUrl || channelProfile.id,
        profileImage: channelProfile.snippet.thumbnails?.high?.url || '',
        followers: parseInt(channelProfile.statistics.subscriberCount) || 0
      }
    });

    if (!saved) {
      return NextResponse.json(
        { success: false, error: 'Error guardando conexión' },
        { status: 500 }
      );
    }

    console.log('✅ YouTube conectado exitosamente');

    return NextResponse.json({
      success: true,
      profile: {
        id: channelProfile.id,
        name: channelProfile.snippet.title,
        username: channelProfile.snippet.customUrl,
        followers: parseInt(channelProfile.statistics.subscriberCount),
        avatar: channelProfile.snippet.thumbnails.high.url,
        platform: 'youtube'
      }
    });

  } catch (error: any) {
    console.error('❌ Error en POST /api/auth/youtube:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
