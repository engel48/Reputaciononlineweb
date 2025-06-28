import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'connect') {
    // Iniciar flujo OAuth de Twitter/X
    const clientId = process.env.TWITTER_CLIENT_ID;
    const redirectUri = process.env.NEXTAUTH_URL + '/api/auth/twitter/callback';
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Twitter Client ID no configurado' },
        { status: 500 }
      );
    }

    const scopes = [
      'tweet.read',
      'users.read',
      'follows.read',
      'like.read',
      'offline.access'
    ].join(' ');

    // Generar state aleatorio para seguridad
    const state = Math.random().toString(36).substring(2);
    const codeChallenge = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);

    const authUrl = new URL('https://twitter.com/i/oauth2/authorize');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'plain');

    return NextResponse.json({ 
      authUrl: authUrl.toString(),
      state,
      codeChallenge 
    });
  }

  return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
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
