import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { saveOAuthConnection } from '@/lib/oauth-storage';
import { checkSocialAccountLimit } from '@/lib/plan-limits';
import { facebookOAuth } from '@/lib/oauth/facebook';
import { parseAppState, appResultUrl } from '@/lib/oauth/app-flow';

const FACEBOOK_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

/**
 * Flujo app (WebView): intercambio de código server-side (vía Facebook Graph),
 * busca la cuenta de Instagram Business y guarda. Redirige a `/oauth-app-success`.
 * El flujo web (popup) sigue usando el HTML con postMessage de abajo.
 */
async function handleAppFlow(
  code: string | null,
  error: string | null,
  redirect: string,
): Promise<NextResponse> {
  const ok = (platform: string) =>
    NextResponse.redirect(appResultUrl(BASE_URL, redirect, { platform }));
  const fail = (reason: string) =>
    NextResponse.redirect(appResultUrl(BASE_URL, redirect, { error: reason }));

  if (error) return fail(error);
  if (!code) return fail('no_code');
  if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) return fail('config_missing');

  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token')?.value;
    if (!authToken) return fail('not_authenticated');

    const decoded = jwt.decode(authToken) as { userId: string } | null;
    if (!decoded || !decoded.userId) return fail('invalid_token');
    const userId = decoded.userId;

    const redirectUri = `${BASE_URL}/api/auth/instagram/callback`;
    const tokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${FACEBOOK_APP_ID}&client_secret=${FACEBOOK_APP_SECRET}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`;

    const tokenResponse = await fetch(tokenUrl);
    if (!tokenResponse.ok) {
      console.error('❌ Error obteniendo token Instagram (app):', await tokenResponse.text());
      return fail('token_exchange_failed');
    }

    const { access_token, expires_in } = await tokenResponse.json();

    let instagramProfile: any = null;
    let instagramUsername = '';
    let instagramFollowers = 0;
    let profileImage = '';

    try {
      const pages = await facebookOAuth.getUserPages(access_token);
      for (const page of pages) {
        const igAccounts = await facebookOAuth.getInstagramAccounts(access_token, page.id);
        if (igAccounts && igAccounts.length > 0) {
          instagramProfile = igAccounts[0];
          instagramUsername = instagramProfile.username || page.name;
          instagramFollowers = instagramProfile.followers_count || 0;
          profileImage = instagramProfile.profile_picture_url || '';
          break;
        }
      }
    } catch (igError) {
      console.warn('No se pudo obtener cuenta de Instagram Business (app):', igError);
    }

    if (!instagramUsername) {
      const fbProfile = await facebookOAuth.getProfile(access_token);
      if (fbProfile) {
        instagramUsername = fbProfile.name || 'Instagram User';
        profileImage = fbProfile.picture?.data?.url || '';
      }
    }

    const limitCheck = await checkSocialAccountLimit(userId, 'instagram');
    if (!limitCheck.allowed) return fail('plan_limit');

    const expiresAt = new Date(Date.now() + (expires_in || 3600) * 1000);
    const saved = await saveOAuthConnection({
      userId,
      platform: 'instagram',
      accessToken: access_token,
      expiresAt,
      profile: {
        id: instagramProfile?.id || 'ig_user',
        name: instagramUsername,
        username: instagramUsername,
        profileImage,
        followers: instagramFollowers,
      },
    });

    if (!saved) return fail('save_failed');

    console.log('✅ Instagram conectado (app)');
    return ok('instagram');
  } catch (e) {
    console.error('❌ Error en Instagram callback (app):', e);
    return fail('oauth_failed');
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state');

  // Flujo app (WebView): resolver server-side y redirigir.
  const appState = parseAppState(state);
  if (appState) {
    return handleAppFlow(code, error, appState.redirect);
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Instagram OAuth Callback</title>
    </head>
    <body>
      <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
        <h2>Procesando autenticación de Instagram...</h2>
        <p>Esta ventana se cerrará automáticamente.</p>
      </div>
      <script>
        (function() {
          try {
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            const error = urlParams.get('error');
            const errorDescription = urlParams.get('error_description');
            
            if (error) {
              window.opener.postMessage({
                type: 'oauth_error',
                platform: 'instagram',
                error: errorDescription || error
              }, window.location.origin);
            } else if (code) {
              // Intercambiar código por token
              fetch('/api/auth/instagram', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code, state: '${state}' })
              })
              .then(response => response.json())
              .then(data => {
                if (data.success) {
                  window.opener.postMessage({
                    type: 'oauth_success',
                    platform: 'instagram',
                    profile: data.profile,
                    token: data.token
                  }, window.location.origin);
                } else {
                  window.opener.postMessage({
                    type: 'oauth_error',
                    platform: 'instagram',
                    error: data.error || 'Error de autenticación'
                  }, window.location.origin);
                }
              })
              .catch(err => {
                window.opener.postMessage({
                  type: 'oauth_error',
                  platform: 'instagram',
                  error: 'Error procesando autenticación'
                }, window.location.origin);
              });
            } else {
              window.opener.postMessage({
                type: 'oauth_error',
                platform: 'instagram',
                error: 'No se recibió código de autorización'
              }, window.location.origin);
            }
          } catch (e) {
            console.error('Error in callback:', e);
            window.opener.postMessage({
              type: 'oauth_error',
              platform: 'instagram',
              error: 'Error en callback'
            }, window.location.origin);
          }
        })();
      </script>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}
