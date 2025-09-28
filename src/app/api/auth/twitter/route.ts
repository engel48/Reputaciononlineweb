import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  const host = request.headers.get('host') || 'localhost:3000';
  const baseUrl = `${protocol}://${host}`;

  return NextResponse.redirect(`${baseUrl}/oauth-login?platform=twitter`);
}

export async function POST(request: NextRequest) {
  try {
    const { code, state, codeVerifier } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Código de autorización requerido' }, { status: 400 });
    }

    // Intercambiar código por token de acceso
    const clientId = process.env.TWITTER_CLIENT_ID;
    const clientSecret = process.env.TWITTER_CLIENT_SECRET;
    const redirectUri = process.env.NEXTAUTH_URL + '/api/auth/twitter/callback';

    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier || '',
      }).toString(),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return NextResponse.json({ error: tokenData.error_description || tokenData.error }, { status: 400 });
    }

    // Obtener información del perfil del usuario
    const profileResponse = await fetch('https://api.twitter.com/2/users/me?user.fields=public_metrics,profile_image_url', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    const profileData = await profileResponse.json();

    if (profileData.errors) {
      return NextResponse.json({ error: 'Error obteniendo perfil de usuario' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      profile: {
        id: profileData.data.id,
        username: profileData.data.username,
        name: profileData.data.name,
        picture: profileData.data.profile_image_url,
        followers: profileData.data.public_metrics?.followers_count || 0,
        platform: 'twitter'
      },
      token: tokenData.access_token,
      refreshToken: tokenData.refresh_token
    });

  } catch (error) {
    console.error('Error en OAuth de Twitter:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
