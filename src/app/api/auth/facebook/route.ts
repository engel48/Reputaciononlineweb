import { NextRequest, NextResponse } from 'next/server';
import { encodeAppState, isAppRedirect, APP_SUCCESS_PATH } from '@/lib/oauth/app-flow';

// Usa cookies/redirecciones dinámicas
export const dynamic = 'force-dynamic';

/**
 * Facebook OAuth — inicio del flujo (GET)
 *
 * Pensado para la app móvil (WebView): arma la URL de autorización de Facebook
 * server-side y redirige. El `state` marca el flujo como "app" para que el
 * callback termine en `/oauth-app-success` en vez de usar `window.opener`.
 *
 * El flujo web sigue iniciándose desde `src/app/oauth-login/page.tsx`.
 */

const FACEBOOK_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
const NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
const SCOPES = ['email', 'public_profile', 'pages_read_engagement', 'pages_show_list'];

export async function GET(request: NextRequest) {
  if (!FACEBOOK_APP_ID) {
    return NextResponse.json(
      { success: false, error: 'Facebook OAuth no está configurado' },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const redirect = searchParams.get('redirect') || APP_SUCCESS_PATH;
  // App (WebView) → state app:true (callback redirige a /oauth-app-success).
  // Web (popup) → state simple (callback usa el flujo postMessage de /oauth-callback).
  const state = isAppRedirect(redirect)
    ? encodeAppState(redirect)
    : Buffer.from(JSON.stringify({ redirect, timestamp: Date.now() })).toString('base64');

  const authUrl = new URL('https://www.facebook.com/v21.0/dialog/oauth');
  authUrl.searchParams.set('client_id', FACEBOOK_APP_ID);
  authUrl.searchParams.set('redirect_uri', `${NEXTAUTH_URL}/api/auth/facebook/callback`);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', SCOPES.join(','));
  authUrl.searchParams.set('state', state);

  return NextResponse.redirect(authUrl.toString());
}
