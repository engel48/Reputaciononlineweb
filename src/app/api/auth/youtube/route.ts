import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  const host = request.headers.get('host') || 'localhost:3000';
  const baseUrl = `${protocol}://${host}`;

  return NextResponse.redirect(`${baseUrl}/oauth-login?platform=youtube`);
}

export async function POST(request: NextRequest) {
  try {
    const { code, state } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Código de autorización requerido' }, { status: 400 });
    }

    // Intercambiar código por token de acceso
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.NEXTAUTH_URL + '/api/auth/youtube/callback';

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        client_id: clientId!,
        client_secret: clientSecret!,
      }).toString(),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return NextResponse.json({ error: tokenData.error_description || tokenData.error }, { status: 400 });
    }

    // Obtener información del canal de YouTube
    const channelResponse = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    const channelData = await channelResponse.json();

    if (channelData.error) {
      return NextResponse.json({ error: 'Error obteniendo canal de YouTube' }, { status: 400 });
    }

    if (!channelData.items || channelData.items.length === 0) {
      return NextResponse.json({ error: 'No se encontró canal de YouTube asociado a esta cuenta' }, { status: 400 });
    }

    const channel = channelData.items[0];

    return NextResponse.json({
      success: true,
      profile: {
        id: channel.id,
        name: channel.snippet.title,
        username: channel.snippet.customUrl || channel.id,
        picture: channel.snippet.thumbnails?.high?.url || channel.snippet.thumbnails?.default?.url,
        subscribers: parseInt(channel.statistics?.subscriberCount) || 0,
        platform: 'youtube'
      },
      token: tokenData.access_token,
      refreshToken: tokenData.refresh_token
    });

  } catch (error) {
    console.error('Error en OAuth de YouTube:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
