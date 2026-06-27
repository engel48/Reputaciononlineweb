import { NextRequest, NextResponse } from 'next/server';
import { encodeAppState, isAppRedirect, APP_SUCCESS_PATH } from '@/lib/oauth/app-flow';
import { getFacebookAppId } from '@/lib/oauth/meta-credentials';

// Usa cookies/redirecciones dinámicas
export const dynamic = 'force-dynamic';

/**
 * Facebook OAuth — inicio del flujo (GET)
 *
 * Arma la URL de autorización de Facebook server-side y redirige (lee las
 * credenciales en runtime, no en build). Lo usan tanto la web (popup) como la
 * app (WebView); el `state` distingue ambos flujos.
 */

const NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

/**
 * Scopes configurables por env. Default `public_profile` porque es lo único que
 * una app de Meta nueva (flujo de "casos de uso") tiene aprobado sin App Review.
 * Tras aprobar el App Review, setear en Coolify, ej:
 *   FACEBOOK_SCOPES=email,public_profile,pages_read_engagement,pages_show_list
 */
function getFacebookScopes(): string[] {
  return (process.env.FACEBOOK_SCOPES || 'public_profile')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const redirect = searchParams.get('redirect') || APP_SUCCESS_PATH;
  const appId = getFacebookAppId();
  const SCOPES = getFacebookScopes();

  // Si falta la credencial en el entorno, devolvemos un error "amigable":
  // redirigimos a la pantalla de retorno con ?error=config_missing en vez de un
  // 500 crudo, así el popup web (o el WebView) muestra un mensaje claro.
  if (!appId) {
    const dest = isAppRedirect(redirect)
      ? `${NEXTAUTH_URL}${redirect}?error=config_missing`
      : `${NEXTAUTH_URL}/oauth-callback?error=config_missing`;
    return NextResponse.redirect(dest);
  }

  // App (WebView) → state app:true (callback redirige a /oauth-app-success).
  // Web (popup) → state simple (callback usa el flujo postMessage de /oauth-callback).
  const state = isAppRedirect(redirect)
    ? encodeAppState(redirect)
    : Buffer.from(JSON.stringify({ redirect, timestamp: Date.now() })).toString('base64');

  const authUrl = new URL('https://www.facebook.com/v21.0/dialog/oauth');
  authUrl.searchParams.set('client_id', appId);
  authUrl.searchParams.set('redirect_uri', `${NEXTAUTH_URL}/api/auth/facebook/callback`);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', SCOPES.join(','));
  authUrl.searchParams.set('state', state);

  return NextResponse.redirect(authUrl.toString());
}
