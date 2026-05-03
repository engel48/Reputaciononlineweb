/**
 * Tests para POST /api/auth/instagram (intercambio de codigo)
 *
 * Cubre:
 *  - Validacion de code
 *  - Auth via cookie
 *  - Plan limit enforcement
 *  - Manejo de error de FB Graph API
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockSaveOAuthConnection = vi.fn();
const mockCheckSocialAccountLimit = vi.fn();
const mockJwtVerify = vi.fn();
const mockGetUserPages = vi.fn();
const mockGetInstagramAccounts = vi.fn();
const mockGetProfile = vi.fn();

vi.mock('@/lib/oauth-storage', () => ({
  saveOAuthConnection: mockSaveOAuthConnection,
}));
vi.mock('@/lib/plan-limits', () => ({
  checkSocialAccountLimit: mockCheckSocialAccountLimit,
}));
vi.mock('@/lib/oauth/facebook', () => ({
  facebookOAuth: {
    getUserPages: mockGetUserPages,
    getInstagramAccounts: mockGetInstagramAccounts,
    getProfile: mockGetProfile,
  },
}));
vi.mock('jsonwebtoken', () => ({
  default: {
    verify: (...args: any[]) => mockJwtVerify(...args),
    decode: (...args: any[]) => mockJwtVerify(...args),
  },
  verify: (...args: any[]) => mockJwtVerify(...args),
  decode: (...args: any[]) => mockJwtVerify(...args),
}));
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => name === 'auth-token' ? { value: 'token' } : null,
  }),
}));

describe('POST /api/auth/instagram', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NEXT_PUBLIC_FACEBOOK_APP_ID', 'fbid');
    vi.stubEnv('FACEBOOK_APP_SECRET', 'fbsecret');
    vi.stubEnv('JWT_SECRET', 'jwt');
    vi.stubEnv('NEXTAUTH_URL', 'https://app.test');

    mockJwtVerify.mockReturnValue({ userId: 'u1' });
    mockSaveOAuthConnection.mockResolvedValue(true);
    mockCheckSocialAccountLimit.mockResolvedValue({ allowed: true, current: 0, limit: 3, plan: 'basic' });
    mockGetUserPages.mockResolvedValue([{ id: 'page1', name: 'My Page' }]);
    mockGetInstagramAccounts.mockResolvedValue([
      { id: 'ig123', username: 'mybusiness', name: 'My Business', profile_picture_url: 'http://img', followers_count: 500 },
    ]);
    mockGetProfile.mockResolvedValue({ id: 'fb1', name: 'Test User', picture: { data: { url: 'http://avatar' } } });

    global.fetch = vi.fn(async (url: any) => {
      if (typeof url === 'string' && url.includes('graph.facebook.com')) {
        if (url.includes('oauth/access_token')) {
          return new Response(JSON.stringify({ access_token: 'fb-access', expires_in: 5184000 }), { status: 200 });
        }
      }
      return new Response(JSON.stringify({}), { status: 200 });
    }) as any;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('rechaza sin code (400)', async () => {
    const { POST } = await import('@/app/api/auth/instagram/route');
    const req = new Request('http://localhost/api/auth/instagram', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(400);
  });

  it('redirige con error=plan_limit si checkSocialAccountLimit no permite', async () => {
    mockCheckSocialAccountLimit.mockResolvedValueOnce({
      allowed: false,
      current: 3,
      limit: 3,
      plan: 'basic',
      reason: 'Alcanzaste el limite',
    });
    const { POST } = await import('@/app/api/auth/instagram/route');
    const req = new Request('http://localhost/api/auth/instagram', {
      method: 'POST',
      body: JSON.stringify({ code: 'auth-code' }),
    });
    const res = await POST(req as any);
    // Instagram redirige (NO devuelve JSON 403 como YouTube)
    expect([302, 307]).toContain(res.status);
    expect(res.headers.get('location')).toContain('plan_limit');
    expect(mockSaveOAuthConnection).not.toHaveBeenCalled();
  });

  it('flow exitoso guarda conexion encriptada', async () => {
    const { POST } = await import('@/app/api/auth/instagram/route');
    const req = new Request('http://localhost/api/auth/instagram', {
      method: 'POST',
      body: JSON.stringify({ code: 'auth-code' }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(200);
    expect(mockSaveOAuthConnection).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'u1',
      platform: 'instagram',
      accessToken: 'fb-access',
    }));
  });
});
