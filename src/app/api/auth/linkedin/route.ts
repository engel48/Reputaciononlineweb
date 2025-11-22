/**
 * LinkedIn OAuth Token Exchange - Sistema REAL
 *
 * Endpoint POST que intercambia el código de autorización por access token
 * y guarda la conexión en Supabase con encriptación.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { saveOAuthConnection } from '@/lib/oauth-storage';
import jwt from 'jsonwebtoken';

const LINKEDIN_CLIENT_ID = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const REDIRECT_URI = process.env.NEXTAUTH_URL
  ? `${process.env.NEXTAUTH_URL}/api/auth/linkedin/callback`
  : 'http://localhost:3000/api/auth/linkedin/callback';

export async function POST(request: NextRequest) {
  try {
    const { code, state } = await request.json();

    console.log('💼 LinkedIn OAuth - POST endpoint recibido');

    // Validar que tenemos el código
    if (!code) {
      console.error('❌ No se recibió código de autorización');
      return NextResponse.json(
        { success: false, error: 'No se recibió código de autorización' },
        { status: 400 }
      );
    }

    // Validar configuración
    if (!LINKEDIN_CLIENT_ID || !LINKEDIN_CLIENT_SECRET) {
      console.error('❌ LinkedIn credentials no configuradas en .env');
      return NextResponse.json(
        { success: false, error: 'Credenciales de LinkedIn no configuradas' },
        { status: 500 }
      );
    }

    // Obtener usuario actual desde cookie JWT
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token')?.value;

    if (!authToken) {
      console.error('❌ Usuario no autenticado');
      return NextResponse.json(
        { success: false, error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }

    // Decodificar JWT para obtener userId
    const decoded = jwt.decode(authToken) as { userId: string } | null;
    if (!decoded || !decoded.userId) {
      console.error('❌ Token JWT inválido');
      return NextResponse.json(
        { success: false, error: 'Token JWT inválido' },
        { status: 401 }
      );
    }

    const userId = decoded.userId;
    console.log(`🔐 Usuario autenticado: ${userId}`);

    // PASO 1: Intercambiar código por access token
    console.log('🔄 Intercambiando código por access token...');
    const tokenUrl = 'https://www.linkedin.com/oauth/v2/accessToken';

    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: REDIRECT_URI,
      client_id: LINKEDIN_CLIENT_ID,
      client_secret: LINKEDIN_CLIENT_SECRET
    });

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams.toString()
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('❌ Error obteniendo access token:', errorData);
      return NextResponse.json(
        { success: false, error: 'Error obteniendo access token de LinkedIn' },
        { status: tokenResponse.status }
      );
    }

    const tokenData = await tokenResponse.json();
    const { access_token, expires_in } = tokenData;

    console.log('✅ Access token obtenido, válido por:', expires_in, 'segundos');

    // PASO 2: Obtener perfil del usuario usando LinkedIn v2 API
    console.log('🔄 Obteniendo perfil del usuario...');

    // Obtener información básica del perfil
    const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      }
    });

    if (!profileResponse.ok) {
      console.error('❌ Error obteniendo perfil de LinkedIn');
      return NextResponse.json(
        { success: false, error: 'Error obteniendo perfil de LinkedIn' },
        { status: profileResponse.status }
      );
    }

    const profile = await profileResponse.json();
    console.log('✅ Perfil obtenido:', profile.name);

    // PASO 3: Guardar en Supabase con encriptación
    const expiresAt = new Date(Date.now() + expires_in * 1000);

    const saved = await saveOAuthConnection({
      userId,
      platform: 'linkedin',
      accessToken: access_token,
      expiresAt,
      profile: {
        id: profile.sub || profile.id,
        name: profile.name || `${profile.given_name || ''} ${profile.family_name || ''}`.trim(),
        email: profile.email,
        username: profile.name || 'Usuario LinkedIn',
        profileImage: profile.picture,
        followers: 0 // Se actualizará después con los datos de la organización
      }
    });

    if (!saved) {
      console.error('❌ Error guardando conexión en Supabase');
      return NextResponse.json(
        { success: false, error: 'Error guardando conexión en base de datos' },
        { status: 500 }
      );
    }

    console.log('✅ LinkedIn conectado exitosamente');

    return NextResponse.json({
      success: true,
      profile: {
        id: profile.sub || profile.id,
        name: profile.name,
        email: profile.email,
        picture: profile.picture
      },
      token: access_token
    });

  } catch (error) {
    console.error('❌ Error en LinkedIn OAuth POST:', error);
    return NextResponse.json(
      { success: false, error: 'Error procesando autenticación de LinkedIn' },
      { status: 500 }
    );
  }
}
