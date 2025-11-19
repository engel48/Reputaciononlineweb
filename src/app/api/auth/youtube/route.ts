import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

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

    // Generar state para CSRF protection
    const state = Buffer.from(JSON.stringify({
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

    // Autenticar usuario
    const cookieStore = cookies();
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

    // Guardar en base de datos
    const { supabase } = await import('@/lib/supabase-server');

    const { data: existingConnection } = await supabase
      .from('social_media')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', 'youtube')
      .single();

    const socialMediaData = {
      user_id: userId,
      platform: 'youtube',
      username: channelProfile.id,
      profile_url: `https://www.youtube.com/channel/${channelProfile.id}`,
      followers: parseInt(channelProfile.statistics.subscriberCount) || 0,
      posts: parseInt(channelProfile.statistics.videoCount) || 0,
      engagement: 0,
      connected: true,
      access_token,
      refresh_token: refresh_token || existingConnection?.refresh_token || null,
      token_expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
      last_sync: new Date().toISOString(),
      metadata: {
        channel_name: channelProfile.snippet.title,
        channel_description: channelProfile.snippet.description,
        thumbnail: channelProfile.snippet.thumbnails.high.url,
        total_views: channelProfile.statistics.viewCount,
        country: channelProfile.snippet.country || null
      }
    };

    if (existingConnection) {
      // Actualizar conexión existente
      const { error: updateError } = await supabase
        .from('social_media')
        .update(socialMediaData)
        .eq('user_id', userId)
        .eq('platform', 'youtube');

      if (updateError) throw updateError;
      console.log('✅ Conexión de YouTube actualizada');
    } else {
      // Crear nueva conexión
      const { error: insertError } = await supabase
        .from('social_media')
        .insert(socialMediaData);

      if (insertError) throw insertError;
      console.log('✅ Nueva conexión de YouTube creada');
    }

    // Retornar perfil
    return NextResponse.json({
      success: true,
      profile: {
        id: channelProfile.id,
        name: channelProfile.snippet.title,
        username: channelProfile.snippet.customUrl,
        followers: parseInt(channelProfile.statistics.subscriberCount),
        avatar: channelProfile.snippet.thumbnails.high.url,
        platform: 'youtube'
      },
      token: access_token
    });

  } catch (error: any) {
    console.error('❌ Error en POST /api/auth/youtube:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
