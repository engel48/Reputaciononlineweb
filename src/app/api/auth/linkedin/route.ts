import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'connect') {
    // Iniciar flujo OAuth de LinkedIn
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const redirectUri = process.env.NEXTAUTH_URL + '/api/auth/linkedin/callback';
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'LinkedIn Client ID no configurado' },
        { status: 500 }
      );
    }

    const scopes = [
      'r_liteprofile',
      'r_emailaddress',
      'w_member_social',
      'rw_organization_admin'
    ].join(' ');

    // Generar state aleatorio para seguridad
    const state = Math.random().toString(36).substring(2);

    const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('state', state);

    return NextResponse.json({ 
      authUrl: authUrl.toString(),
      state 
    });
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
