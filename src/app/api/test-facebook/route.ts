/**
 * Test endpoint para verificar configuración de Facebook OAuth
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const config = {
    // Variables públicas (accesibles en cliente)
    publicVars: {
      NEXT_PUBLIC_FACEBOOK_APP_ID: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Definida' : '✗ No definida',
      NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? '✓ Definida' : '✗ No definida',
    },

    // Variables privadas (solo servidor)
    serverVars: {
      FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET ? '✓ Definida (' + process.env.FACEBOOK_APP_SECRET.substring(0, 10) + '...)' : '✗ No definida',
      FACEBOOK_CLIENT_ID: process.env.FACEBOOK_CLIENT_ID || '✗ No definida',
      FACEBOOK_CLIENT_SECRET: process.env.FACEBOOK_CLIENT_SECRET ? '✓ Definida' : '✗ No definida',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '✓ Definida' : '✗ No definida',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || '✗ No definida',
    },

    // URLs calculadas
    calculatedUrls: {
      callbackUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/facebook/callback`,
      oauthUrl: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID
        ? `https://www.facebook.com/v21.0/dialog/oauth?client_id=${process.env.NEXT_PUBLIC_FACEBOOK_APP_ID}`
        : '✗ No se puede generar (falta APP_ID)',
    },

    // Test de credenciales
    credentialsTest: {
      appId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || 'NO DEFINIDO',
      appIdFromClientId: process.env.FACEBOOK_CLIENT_ID || 'NO DEFINIDO',
      secretPresent: !!process.env.FACEBOOK_APP_SECRET || !!process.env.FACEBOOK_CLIENT_SECRET,
    }
  };

  // Probar credenciales con Facebook API
  let apiTest = null;
  if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${process.env.FACEBOOK_CLIENT_ID}&client_secret=${process.env.FACEBOOK_CLIENT_SECRET}&grant_type=client_credentials`
      );

      if (response.ok) {
        const data = await response.json();
        apiTest = {
          status: '✅ CREDENCIALES VÁLIDAS',
          tokenReceived: !!data.access_token,
          appName: 'Probando...'
        };

        // Obtener nombre de la app
        if (data.access_token) {
          const appResponse = await fetch(
            `https://graph.facebook.com/v21.0/${process.env.FACEBOOK_CLIENT_ID}?fields=name&access_token=${data.access_token}`
          );
          if (appResponse.ok) {
            const appData = await appResponse.json();
            apiTest.appName = appData.name;
          }
        }
      } else {
        apiTest = {
          status: '❌ CREDENCIALES INVÁLIDAS',
          error: await response.text()
        };
      }
    } catch (error) {
      apiTest = {
        status: '❌ ERROR EN REQUEST',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  } else {
    apiTest = {
      status: '⚠️ NO SE PUEDE PROBAR',
      reason: 'Faltan credenciales en variables de entorno'
    };
  }

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    config,
    apiTest
  }, {
    headers: {
      'Cache-Control': 'no-store'
    }
  });
}
