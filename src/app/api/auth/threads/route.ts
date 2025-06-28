import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'connect') {
    // Threads usa el mismo OAuth que Instagram/Facebook
    const clientId = process.env.FACEBOOK_CLIENT_ID;
    const redirectUri = process.env.NEXTAUTH_URL + '/api/auth/threads/callback';
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Threads Client ID no configurado' },
        { status: 500 }
      );
    }

    const scopes = [
      'threads_basic',
      'threads_content_publish',
      'threads_manage_insights',
      'threads_manage_replies',
      'threads_read_replies'
    ].join(',');

    const authUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('state', 'threads-oauth-state');

    return NextResponse.json({ authUrl: authUrl.toString() });
  }

  return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
}

export async function POST(request: NextRequest) {
  try {
    const { code, state } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Código de autorización requerido' }, { status: 400 });
    }

    // Intercambiar código por token de acceso
    const clientId = process.env.FACEBOOK_CLIENT_ID;
    const clientSecret = process.env.FACEBOOK_CLIENT_SECRET;
    const redirectUri = process.env.NEXTAUTH_URL + '/api/auth/threads/callback';

    const tokenResponse = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        redirect_uri: redirectUri,
        code: code,
      }).toString(),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return NextResponse.json({ error: tokenData.error.message }, { status: 400 });
    }

    // Obtener información del perfil de Threads
    const profileResponse = await fetch(
      `https://graph.threads.net/v1.0/me?fields=id,username,name,threads_profile_picture_url,threads_biography&access_token=${tokenData.access_token}`
    );
    const profileData = await profileResponse.json();

    if (profileData.error) {
      // Si la API específica de Threads no está disponible, usar el perfil básico
      const basicProfileResponse = await fetch(
        `https://graph.facebook.com/v18.0/me?fields=id,name&access_token=${tokenData.access_token}`
      );
      const basicProfileData = await basicProfileResponse.json();

      return NextResponse.json({
        success: true,
        profile: {
          id: basicProfileData.id,
          username: `threads_${basicProfileData.id}`,
          name: basicProfileData.name,
          picture: null,
          platform: 'threads',
          note: 'Conexión establecida. La API completa de Threads está en desarrollo.'
        },
        token: tokenData.access_token
      });
    }

    return NextResponse.json({
      success: true,
      profile: {
        id: profileData.id,
        username: profileData.username,
        name: profileData.name,
        picture: profileData.threads_profile_picture_url,
        bio: profileData.threads_biography,
        platform: 'threads'
      },
      token: tokenData.access_token
    });

  } catch (error) {
    console.error('Error en OAuth de Threads:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
