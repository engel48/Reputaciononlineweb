import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { saveOAuthConnection } from '@/lib/oauth-storage';
import { checkSocialAccountLimit } from '@/lib/plan-limits';
import { youtubeOAuth } from '@/lib/oauth/youtube';
import { parseAppState, appResultUrl } from '@/lib/oauth/app-flow';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

/**
 * Flujo app (WebView): el `state` marca flujo app. Como el WebView no tiene
 * `window.opener`, hacemos el intercambio de código server-side y redirigimos
 * a `/oauth-app-success` (o con `?error=`). El flujo web (popup) sigue usando
 * el HTML con postMessage de más abajo.
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

  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token')?.value;
    if (!authToken) return fail('not_authenticated');

    const decoded = jwt.decode(authToken) as { userId: string } | null;
    if (!decoded || !decoded.userId) return fail('invalid_token');
    const userId = decoded.userId;

    // Intercambiar código por tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: `${BASE_URL}/api/auth/youtube/callback`,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      console.error('❌ Error intercambiando código YouTube (app):', await tokenResponse.text());
      return fail('token_exchange_failed');
    }

    const tokens = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokens;

    const channelProfile = await youtubeOAuth.getChannelProfile(access_token);
    if (!channelProfile) return fail('profile_fetch_failed');

    const limitCheck = await checkSocialAccountLimit(userId, 'youtube');
    if (!limitCheck.allowed) return fail('plan_limit');

    const expiresAt = new Date(Date.now() + expires_in * 1000);
    const saved = await saveOAuthConnection({
      userId,
      platform: 'youtube',
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt,
      profile: {
        id: channelProfile.id,
        name: channelProfile.snippet.title,
        username: channelProfile.snippet.customUrl || channelProfile.id,
        profileImage: channelProfile.snippet.thumbnails?.high?.url || '',
        followers: parseInt(channelProfile.statistics.subscriberCount) || 0,
      },
    });

    if (!saved) return fail('save_failed');

    console.log('✅ YouTube conectado (app)');
    return ok('youtube');
  } catch (e) {
    console.error('❌ Error en YouTube callback (app):', e);
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
      <title>YouTube OAuth Callback</title>
    </head>
    <body>
      <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
        <h2>Procesando autenticación de YouTube...</h2>
        <p>Esta ventana se cerrará automáticamente.</p>
      </div>
      <script>
        (function() {
          try {
            console.log('🎬 YouTube Callback: Procesando...');
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            const state = urlParams.get('state');
            const error = urlParams.get('error');
            const errorDescription = urlParams.get('error_description');

            console.log('📋 Params:', { code: !!code, state: !!state, error });

            if (error) {
              console.error('❌ OAuth error:', error);
              window.opener.postMessage({
                type: 'oauth_error',
                platform: 'youtube',
                error: errorDescription || error
              }, window.location.origin);
              setTimeout(() => window.close(), 1000);
            } else if (code) {
              // Intercambiar código por token
              console.log('🔄 Intercambiando código...');
              fetch('/api/auth/youtube', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code, state })
              })
              .then(response => {
                console.log('📥 Response status:', response.status);
                return response.json();
              })
              .then(data => {
                console.log('📦 Response data:', data);
                if (data.success) {
                  console.log('✅ OAuth exitoso!');
                  window.opener.postMessage({
                    type: 'oauth_success',
                    platform: 'youtube',
                    profile: data.profile
                  }, window.location.origin);
                  setTimeout(() => window.close(), 1000);
                } else {
                  console.error('❌ Error en respuesta:', data.error);
                  window.opener.postMessage({
                    type: 'oauth_error',
                    platform: 'youtube',
                    error: data.error || 'Error de autenticación'
                  }, window.location.origin);
                  setTimeout(() => window.close(), 2000);
                }
              })
              .catch(err => {
                console.error('❌ Fetch error:', err);
                window.opener.postMessage({
                  type: 'oauth_error',
                  platform: 'youtube',
                  error: 'Error procesando autenticación'
                }, window.location.origin);
                setTimeout(() => window.close(), 2000);
              });
            } else {
              console.error('❌ No code received');
              window.opener.postMessage({
                type: 'oauth_error',
                platform: 'youtube',
                error: 'No se recibió código de autorización'
              }, window.location.origin);
              setTimeout(() => window.close(), 1000);
            }
          } catch (e) {
            console.error('❌ Callback error:', e);
            window.opener.postMessage({
              type: 'oauth_error',
              platform: 'youtube',
              error: 'Error en callback'
            }, window.location.origin);
            setTimeout(() => window.close(), 1000);
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
