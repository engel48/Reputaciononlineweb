/**
 * TikTok OAuth Initiation Handler
 *
 * GET - Iniciar flujo OAuth de TikTok
 * Redirige al usuario a la página de autorización de TikTok
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY || process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY;
const NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

/**
 * GET - Redirigir a TikTok OAuth
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🎵 Iniciando flujo OAuth de TikTok');

    // Validar que tenemos las credenciales configuradas
    if (!TIKTOK_CLIENT_KEY) {
      console.error('❌ TIKTOK_CLIENT_KEY no configurado');
      return NextResponse.redirect(
        `${NEXTAUTH_URL}/dashboard/redes-sociales?error=tiktok_not_configured`
      );
    }

    // Generar state aleatorio para CSRF protection
    const state = Math.random().toString(36).substring(2, 15) +
                  Math.random().toString(36).substring(2, 15);

    // Scopes solicitados:
    // - user.info.basic: Información básica del usuario
    // - user.info.stats: Estadísticas (follower_count, following_count, likes_count, video_count)
    // - user.info.profile: Perfil detallado (bio_description, is_verified, profile_deep_link)
    // - video.list: Lista de videos del usuario
    const scopes = [
      'user.info.basic',
      'user.info.stats',
      'user.info.profile',
      'video.list'
    ].join(',');

    // Guardar state en cookie para validar en callback
    const cookieStore = await cookies();
    const response = NextResponse.redirect(
      `https://www.tiktok.com/v2/auth/authorize/?client_key=${TIKTOK_CLIENT_KEY}&redirect_uri=${encodeURIComponent(`${NEXTAUTH_URL}/api/auth/tiktok/callback`)}&scope=${scopes}&response_type=code&state=${state}`
    );

    response.cookies.set('tiktok_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutos
      path: '/'
    });

    console.log('🔗 Redirigiendo a TikTok OAuth');
    console.log(`   Client Key: ${TIKTOK_CLIENT_KEY.substring(0, 8)}...`);
    console.log(`   Redirect URI: ${NEXTAUTH_URL}/api/auth/tiktok/callback`);
    console.log(`   State: ${state.substring(0, 8)}...`);

    return response;

  } catch (error: any) {
    console.error('❌ Error iniciando OAuth de TikTok:', error);
    return NextResponse.redirect(
      `${NEXTAUTH_URL}/dashboard/redes-sociales?error=tiktok_init_failed`
    );
  }
}
