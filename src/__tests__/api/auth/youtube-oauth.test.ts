/**
 * Tests para POST /api/auth/youtube (intercambio de codigo OAuth por token)
 *
 * Cubre:
 *  - Validaciones: code, state, CSRF expiry
 *  - Auth via cookie auth-token
 *  - Plan limit enforcement
 *  - Save encriptado de la conexion
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockGetChannelProfile = vi.fn();
const mockSaveOAuthConnection = vi.fn();
const mockCheckSocialAccountLimit = vi.fn();
const mockJwtVerify = vi.fn();

vi.mock('@/lib/oauth/youtube', () => ({
  youtubeOAuth: { getChannelProfile: mockGetChannelProfile },
}));
vi.mock('@/lib/oauth-storage', () => ({
  saveOAuthConnection: mockSaveOAuthConnection,
}));
vi.mock('@/lib/plan-limits', () => ({
  checkSocialAccountLimit: mockCheckSocialAccountLimit,
}));
vi.mock('jsonwebtoken', () => ({
  default: { verify: (...args: any[]) => mockJwtVerify(...args) },
  verify: (...args: any[]) => mockJwtVerify(...args),
}));
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => name === 'auth-token' ? { value: 'cookie-token' } : null,
  }),
}));

const validState = Buffer.from(JSON.stringify({ userId: 'u1', timestamp: Date.now() })).toString('base64');
const expiredState = Buffer.from(JSON.stringify({ userId: 'u1', timestamp: Date.now() - 11 * 60 * 1000 })).toString('base64');

describe('POST /api/auth/youtube', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('GOOGLE_CLIENT_ID', 'gid');
    vi.stubEnv('GOOGLE_CLIENT_SECRET', 'gsecret');
    vi.stubEnv('JWT_SECRET', 'jwt');
    vi.stubEnv('NEXTAUTH_URL', 'https://app.test');

    mockJwtVerify.mockReturnValue({ userId: 'u1', email: 'u@test.com' });
    mockGetChannelProfile.mockResolvedValue({
      id: 'UC123',
      snippet: { title: 'Test Channel', customUrl: '@testchan', thumbnails: { high: { url: 'http://img' } } },
      statistics: { subscriberCount: '1000' },
    });
    mockSaveOAuthConnection.mockResolvedValue(true);
    mockCheckSocialAccountLimit.mockResolvedValue({ allowed: true, current: 0, limit: 1, plan: 'free' });

    global.fetch = vi.fn(async () => new Response(JSON.stringify({
      access_token: 'goog-access',
      refresh_token: 'goog-refresh',
      expires_in: 3600,
    }), { status: 200 })) as any;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('rechaza sin code (400)', async () => {
    const { POST } = await import('@/app/api/auth/youtube/route');
    const req = new Request('http://localhost/api/auth/youtube', {
      method: 'POST',
      body: JSON.stringify({ state: validState }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Código');
  });

  it('rechaza sin state (400)', async () => {
    const { POST } = await import('@/app/api/auth/youtube/route');
    const req = new Request('http://localhost/api/auth/youtube', {
      method: 'POST',
      body: JSON.stringify({ code: 'abc' }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('State');
  });

  it('rechaza state expirado (CSRF protection)', async () => {
    const { POST } = await import('@/app/api/auth/youtube/route');
    const req = new Request('http://localhost/api/auth/youtube', {
      method: 'POST',
      body: JSON.stringify({ code: 'abc', state: expiredState }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('expirado');
  });

  it('rechaza state invalido (no base64 JSON)', async () => {
    const { POST } = await import('@/app/api/auth/youtube/route');
    const req = new Request('http://localhost/api/auth/youtube', {
      method: 'POST',
      body: JSON.stringify({ code: 'abc', state: 'garbage' }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(400);
  });

  it('flow exitoso: intercambia code, valida plan, guarda conexion', async () => {
    const { POST } = await import('@/app/api/auth/youtube/route');
    const req = new Request('http://localhost/api/auth/youtube', {
      method: 'POST',
      body: JSON.stringify({ code: 'auth-code', state: validState }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.profile.platform).toBe('youtube');
    expect(body.profile.followers).toBe(1000);

    expect(mockCheckSocialAccountLimit).toHaveBeenCalledWith('u1', 'youtube');
    expect(mockSaveOAuthConnection).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'u1',
      platform: 'youtube',
      accessToken: 'goog-access',
      refreshToken: 'goog-refresh',
    }));
  });

  it('rechaza con 403 si plan limit no permite', async () => {
    mockCheckSocialAccountLimit.mockResolvedValueOnce({
      allowed: false,
      current: 1,
      limit: 1,
      plan: 'free',
      reason: 'Alcanzaste el limite de 1 cuenta en el plan free',
    });
    const { POST } = await import('@/app/api/auth/youtube/route');
    const req = new Request('http://localhost/api/auth/youtube', {
      method: 'POST',
      body: JSON.stringify({ code: 'auth-code', state: validState }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('limite');
    expect(body.plan).toBe('free');
    // No debe haber guardado nada
    expect(mockSaveOAuthConnection).not.toHaveBeenCalled();
  });

  it('rechaza si Google retorna error en token exchange', async () => {
    global.fetch = vi.fn(async () => new Response(JSON.stringify({ error: 'invalid_grant' }), { status: 400 })) as any;
    const { POST } = await import('@/app/api/auth/youtube/route');
    const req = new Request('http://localhost/api/auth/youtube', {
      method: 'POST',
      body: JSON.stringify({ code: 'bad-code', state: validState }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain('token');
  });

  it('rechaza si saveOAuthConnection falla', async () => {
    mockSaveOAuthConnection.mockResolvedValueOnce(false);
    const { POST } = await import('@/app/api/auth/youtube/route');
    const req = new Request('http://localhost/api/auth/youtube', {
      method: 'POST',
      body: JSON.stringify({ code: 'auth-code', state: validState }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(500);
  });
});
