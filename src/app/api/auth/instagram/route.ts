import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'connect') {
    // Instagram usa el mismo OAuth que Facebook
    const clientId = process.env.FACEBOOK_CLIENT_ID;
    const redirectUri = process.env.NEXTAUTH_URL + '/api/auth/instagram/callback';
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Instagram Client ID no configurado' },
        { status: 500 }
      );
    }

    const scopes = [
      'instagram_basic',
      'instagram_content_publish',
      'instagram_manage_insights',
      'pages_show_list',
      'pages_read_engagement'
    ].join(',');

    const authUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('state', 'instagram-oauth-state');

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
    const redirectUri = process.env.NEXTAUTH_URL + '/api/auth/instagram/callback';

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

    // Obtener páginas de Facebook para encontrar cuentas de Instagram
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${tokenData.access_token}`
    );
    const pagesData = await pagesResponse.json();

    let instagramAccount = null;

    // Buscar cuenta de Instagram conectada
    if (pagesData.data && pagesData.data.length > 0) {
      for (const page of pagesData.data) {
        const igResponse = await fetch(
          `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${tokenData.access_token}`
        );
        const igData = await igResponse.json();
        
        if (igData.instagram_business_account) {
          // Obtener datos del perfil de Instagram
          const profileResponse = await fetch(
            `https://graph.facebook.com/v18.0/${igData.instagram_business_account.id}?fields=id,username,name,profile_picture_url,followers_count&access_token=${tokenData.access_token}`
          );
          const profileData = await profileResponse.json();
          
          instagramAccount = {
            id: profileData.id,
            username: profileData.username,
            name: profileData.name,
            picture: profileData.profile_picture_url,
            followers: profileData.followers_count || 0,
            platform: 'instagram'
          };
          break;
        }
      }
    }

    if (!instagramAccount) {
      return NextResponse.json({ 
        error: 'No se encontró cuenta de Instagram Business conectada a esta cuenta de Facebook' 
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      profile: instagramAccount,
      token: tokenData.access_token
    });

  } catch (error) {
    console.error('Error en OAuth de Instagram:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
