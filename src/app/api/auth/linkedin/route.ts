import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  const host = request.headers.get('host') || 'localhost:3000';
  const baseUrl = `${protocol}://${host}`;

  return NextResponse.redirect(`${baseUrl}/oauth-login?platform=linkedin`);
}

export async function POST(request: NextRequest) {
  try {
    const { code, state } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Código de autorización requerido' }, { status: 400 });
    }

    // Intercambiar código por token de acceso
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    const redirectUri = process.env.NEXTAUTH_URL + '/api/auth/linkedin/callback';

    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
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

    // Obtener información del perfil del usuario
    const profileResponse = await fetch('https://api.linkedin.com/v2/people/~:(id,firstName,lastName,profilePicture(displayImage~:playableStreams))', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    const profileData = await profileResponse.json();

    if (profileData.status && profileData.status !== 200) {
      return NextResponse.json({ error: 'Error obteniendo perfil de LinkedIn' }, { status: 400 });
    }

    // Obtener email del usuario
    const emailResponse = await fetch('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    const emailData = await emailResponse.json();
    const email = emailData.elements?.[0]?.['handle~']?.emailAddress;

    // Obtener URL de imagen de perfil
    let profilePicture = null;
    if (profileData.profilePicture?.['displayImage~']?.elements?.length > 0) {
      profilePicture = profileData.profilePicture['displayImage~'].elements[0].identifiers[0].identifier;
    }

    return NextResponse.json({
      success: true,
      profile: {
        id: profileData.id,
        name: `${profileData.firstName?.localized?.en_US || ''} ${profileData.lastName?.localized?.en_US || ''}`.trim(),
        email: email,
        picture: profilePicture,
        platform: 'linkedin'
      },
      token: tokenData.access_token
    });

  } catch (error) {
    console.error('Error en OAuth de LinkedIn:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
