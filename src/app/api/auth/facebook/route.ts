import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  const host = request.headers.get('host') || 'localhost:3000';
  const baseUrl = `${protocol}://${host}`;

  return NextResponse.redirect(`${baseUrl}/oauth-login?platform=facebook`);
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
    const redirectUri = process.env.NEXTAUTH_URL + '/api/auth/facebook/callback';

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

    // Obtener información del perfil
    const profileResponse = await fetch(
      `https://graph.facebook.com/v18.0/me?fields=id,name,email,picture&access_token=${tokenData.access_token}`
    );
    const profileData = await profileResponse.json();

    // Aquí podrías guardar el token y la información del usuario en tu base de datos
    
    return NextResponse.json({
      success: true,
      profile: {
        id: profileData.id,
        name: profileData.name,
        email: profileData.email,
        picture: profileData.picture?.data?.url,
        platform: 'facebook'
      },
      token: tokenData.access_token
    });

  } catch (error) {
    console.error('Error en OAuth de Facebook:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
