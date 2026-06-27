/**
 * Tests de las rutas de INICIO de OAuth (GET) — una por red.
 *
 * Verifica que las 4 redes inician el OAuth del lado del SERVIDOR (leyendo las
 * credenciales en runtime), que redirigen a la URL de autorización correcta del
 * proveedor, y que el flujo WEB (redirect=/dashboard/...) NO marca el state como
 * "app" (para que el callback use el flujo de popup/postMessage). Esto es lo que
 * hace que Facebook/Instagram/X funcionen en producción igual que YouTube, sin
 * depender de variables NEXT_PUBLIC_* horneadas en build.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const WEB_REDIRECT = '/dashboard/redes-sociales';

function reqFor(provider: string, redirect = WEB_REDIRECT) {
  return new Request(`http://localhost/api/auth/${provider}?redirect=${encodeURIComponent(redirect)}`) as any;
}

function decodeState(loc: string): any {
  const state = new URL(loc).searchParams.get('state') || '';
  return JSON.parse(Buffer.from(state, 'base64').toString());
}

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('NEXTAUTH_URL', 'https://reputaciononline.com.co');
  // instagram/route.ts importa oauth-storage → supabase-server, que valida estas
  // env al cargar el módulo (se re-evalúa por vi.resetModules()).
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-key');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('GET /api/auth/youtube (inicio)', () => {
  it('redirige a Google con client_id y redirect_uri del callback', async () => {
    vi.stubEnv('GOOGLE_CLIENT_ID', 'GID-123');
    const { GET } = await import('@/app/api/auth/youtube/route');
    const res = await GET(reqFor('youtube'));
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);
    const loc = res.headers.get('location')!;
    expect(loc).toContain('accounts.google.com/o/oauth2/v2/auth');
    expect(loc).toContain('client_id=GID-123');
    expect(loc).toContain(encodeURIComponent('https://reputaciononline.com.co/api/auth/youtube/callback'));
  });
});

describe('GET /api/auth/facebook (inicio)', () => {
  it('redirige al diálogo de Facebook con client_id y scope por defecto public_profile', async () => {
    vi.stubEnv('NEXT_PUBLIC_FACEBOOK_APP_ID', 'FBID-123');
    const { GET } = await import('@/app/api/auth/facebook/route');
    const res = await GET(reqFor('facebook'));
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);
    const loc = res.headers.get('location')!;
    expect(loc).toContain('facebook.com');
    expect(loc).toContain('dialog/oauth');
    expect(loc).toContain('client_id=FBID-123');
    expect(loc).toContain(encodeURIComponent('https://reputaciononline.com.co/api/auth/facebook/callback'));
    // Default sin App Review: solo public_profile (evita "Invalid Scopes")
    expect(new URL(loc).searchParams.get('scope')).toBe('public_profile');
    // Flujo web: el state NO debe marcar app:true
    expect(decodeState(loc).app).toBeUndefined();
  });

  it('usa FACEBOOK_SCOPES cuando está definido (tras App Review)', async () => {
    vi.stubEnv('NEXT_PUBLIC_FACEBOOK_APP_ID', 'FBID-123');
    vi.stubEnv('FACEBOOK_SCOPES', 'email,public_profile,pages_show_list');
    const { GET } = await import('@/app/api/auth/facebook/route');
    const res = await GET(reqFor('facebook'));
    const scope = new URL(res.headers.get('location')!).searchParams.get('scope');
    expect(scope).toBe('email,public_profile,pages_show_list');
  });

  it('sin credenciales redirige a /oauth-callback?error=config_missing (no 500)', async () => {
    vi.stubEnv('NEXT_PUBLIC_FACEBOOK_APP_ID', '');
    vi.stubEnv('FACEBOOK_APP_ID', '');
    vi.stubEnv('FACEBOOK_CLIENT_ID', '');
    const { GET } = await import('@/app/api/auth/facebook/route');
    const res = await GET(reqFor('facebook'));
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);
    expect(res.headers.get('location')).toContain('/oauth-callback?error=config_missing');
  });

  it('flujo app (redirect=/oauth-app-success) marca state app:true', async () => {
    vi.stubEnv('NEXT_PUBLIC_FACEBOOK_APP_ID', 'FBID-123');
    const { GET } = await import('@/app/api/auth/facebook/route');
    const res = await GET(reqFor('facebook', '/oauth-app-success'));
    const loc = res.headers.get('location')!;
    expect(decodeState(loc).app).toBe(true);
  });
});

describe('GET /api/auth/instagram (inicio)', () => {
  it('redirige al diálogo de Facebook con el callback de Instagram (scope default public_profile)', async () => {
    vi.stubEnv('NEXT_PUBLIC_FACEBOOK_APP_ID', 'FBID-123');
    const { GET } = await import('@/app/api/auth/instagram/route');
    const res = await GET(reqFor('instagram'));
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);
    const loc = res.headers.get('location')!;
    expect(loc).toContain('facebook.com');
    expect(loc).toContain(encodeURIComponent('https://reputaciononline.com.co/api/auth/instagram/callback'));
    expect(new URL(loc).searchParams.get('scope')).toBe('public_profile');
    expect(decodeState(loc).app).toBeUndefined();
  });

  it('usa INSTAGRAM_SCOPES cuando está definido (tras App Review)', async () => {
    vi.stubEnv('NEXT_PUBLIC_FACEBOOK_APP_ID', 'FBID-123');
    vi.stubEnv('INSTAGRAM_SCOPES', 'public_profile,instagram_basic,instagram_manage_insights');
    const { GET } = await import('@/app/api/auth/instagram/route');
    const res = await GET(reqFor('instagram'));
    const scope = new URL(res.headers.get('location')!).searchParams.get('scope');
    expect(scope).toContain('instagram_basic');
  });

  it('sin credenciales redirige a config_missing (no 500)', async () => {
    vi.stubEnv('NEXT_PUBLIC_FACEBOOK_APP_ID', '');
    vi.stubEnv('FACEBOOK_APP_ID', '');
    vi.stubEnv('FACEBOOK_CLIENT_ID', '');
    const { GET } = await import('@/app/api/auth/instagram/route');
    const res = await GET(reqFor('instagram'));
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);
    expect(res.headers.get('location')).toContain('config_missing');
  });
});

describe('GET /api/auth/twitter (inicio)', () => {
  it('redirige a X con PKCE y setea cookie pkce_verifier', async () => {
    vi.stubEnv('TWITTER_CLIENT_ID', 'TWID-123');
    const { GET } = await import('@/app/api/auth/twitter/route');
    const res = await GET(reqFor('twitter'));
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);
    const loc = res.headers.get('location')!;
    expect(loc).toContain('twitter.com/i/oauth2/authorize');
    expect(loc).toContain('client_id=TWID-123');
    expect(loc).toContain('code_challenge_method=plain');
    expect(loc).toContain('code_challenge=');
    // Cookie PKCE para que el callback intercambie el código
    expect(res.cookies.get('pkce_verifier')?.value).toBeTruthy();
    expect(decodeState(loc).app).toBeUndefined();
  });

  it('sin credenciales redirige a config_missing (no 500)', async () => {
    vi.stubEnv('TWITTER_CLIENT_ID', '');
    vi.stubEnv('NEXT_PUBLIC_TWITTER_CLIENT_ID', '');
    const { GET } = await import('@/app/api/auth/twitter/route');
    const res = await GET(reqFor('twitter'));
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);
    expect(res.headers.get('location')).toContain('config_missing');
  });
});
