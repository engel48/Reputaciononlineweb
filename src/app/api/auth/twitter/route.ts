import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { encodeAppState, APP_SUCCESS_PATH } from '@/lib/oauth/app-flow';

export const dynamic = 'force-dynamic';

/**
 * Twitter/X OAuth 2.0 — inicio del flujo (GET)
 *
 * Para la app móvil (WebView). Genera el PKCE `code_verifier` server-side y lo
 * guarda en una cookie httpOnly que el callback lee para intercambiar el código.
 * El `state` marca el flujo "app" para terminar en `/oauth-app-success`.
 */

const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID || process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID;
const NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
const SCOPES = ['tweet.read', 'users.read', 'follows.read', 'offline.access'];

export async function GET(request: NextRequest) {
  if (!TWITTER_CLIENT_ID) {
    return NextResponse.json(
      { success: false, error: 'Twitter/X OAuth no está configurado' },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const redirect = searchParams.get('redirect') || APP_SUCCESS_PATH;
  const state = encodeAppState(redirect);

  // PKCE: usamos método "plain" (el callback lee el verifier de la cookie).
  // base64url de 32 bytes = 43 chars (dentro del rango 43–128 que exige X).
  const verifier = crypto.randomBytes(32).toString('base64url');

  const authUrl = new URL('https://twitter.com/i/oauth2/authorize');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', TWITTER_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', `${NEXTAUTH_URL}/api/auth/twitter/callback`);
  authUrl.searchParams.set('scope', SCOPES.join(' '));
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('code_challenge', verifier);
  authUrl.searchParams.set('code_challenge_method', 'plain');

  const res = NextResponse.redirect(authUrl.toString());
  res.cookies.set('pkce_verifier', verifier, {
    httpOnly: true,
    path: '/',
    maxAge: 600,
    sameSite: 'lax',
    secure: NEXTAUTH_URL.startsWith('https'),
  });
  return res;
}
