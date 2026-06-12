/**
 * Tests para /api/social-connect (POST + GET)
 *
 * Cubre actions: connect, disconnect, disconnect_account, sync, validate
 *                summary (GET), list_accounts (GET)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

const mockSaveOAuthConnection = vi.fn(async () => true);
const mockListConnectedAccounts = vi.fn(async () => [
  { id: 'a1', platform: 'youtube', username: 'channel1', displayName: 'C1', profileImage: null, profileUrl: null, followers: 100, connected: true, lastSync: null, metrics: { posts: 10, engagement: 4 } },
]);
const mockDisconnectAccountById = vi.fn(async () => true);
const mockCheckSocialAccountLimit = vi.fn(async () => ({
  allowed: true,
  current: 0,
  limit: 12,
  plan: 'pro',
}));

vi.mock('@/lib/oauth-storage', () => ({
  saveOAuthConnection: mockSaveOAuthConnection,
  listConnectedAccounts: mockListConnectedAccounts,
  disconnectAccountById: mockDisconnectAccountById,
}));

vi.mock('@/lib/plan-limits', () => ({
  checkSocialAccountLimit: mockCheckSocialAccountLimit,
}));

vi.mock('@/lib/oauth/manager', () => ({
  socialOAuthManager: {
    disconnectSocialNetwork: vi.fn(async () => true),
    syncAllConnections: vi.fn(async () => true),
    validateUserTokens: vi.fn(async () => ({ youtube: true })),
    getConnectionSummary: vi.fn(async () => ({ totalConnected: 1, platforms: ['youtube'] })),
    getUserConnections: vi.fn(async () => ({
      youtube: { connected: true, username: 'channel1', displayName: 'C1', followers: 100, profileImage: '', lastSync: null, metrics: { posts: 10, engagement: 4, reach: 0 } },
      facebook: { connected: false, username: '', displayName: '', followers: 0, profileImage: '', lastSync: null, metrics: { posts: 0, engagement: 0, reach: 0 } },
      instagram: { connected: false, username: '', displayName: '', followers: 0, profileImage: '', lastSync: null, metrics: { posts: 0, engagement: 0, reach: 0 } },
      x: { connected: false, username: '', displayName: '', followers: 0, profileImage: '', lastSync: null, metrics: { posts: 0, engagement: 0, reach: 0 } },
    })),
  },
  SocialPlatform: {},
}));

vi.mock('@/lib/auth-helper', () => ({
  requireAuth: vi.fn(async () => ({ userId: 'u1', email: 'u@test.com', role: 'user' })),
}));

describe('POST /api/social-connect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSaveOAuthConnection.mockResolvedValue(true);
    mockDisconnectAccountById.mockResolvedValue(true);
    mockCheckSocialAccountLimit.mockResolvedValue({
      allowed: true,
      current: 0,
      limit: 12,
      plan: 'pro',
    });
  });

  it('rechaza request sin auth (401)', async () => {
    const { requireAuth } = await import('@/lib/auth-helper');
    (requireAuth as any).mockImplementationOnce(async () =>
      NextResponse.json({ error: 'unauth' }, { status: 401 })
    );
    const { POST } = await import('@/app/api/social-connect/route');
    const req = new Request('http://localhost/api/social-connect', {
      method: 'POST',
      body: JSON.stringify({ platform: 'youtube', action: 'connect' }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(401);
  });

  it('rechaza plataforma invalida con 400', async () => {
    const { POST } = await import('@/app/api/social-connect/route');
    const req = new Request('http://localhost/api/social-connect', {
      method: 'POST',
      body: JSON.stringify({ platform: 'tiktok', action: 'connect' }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('no v');
  });

  it('action=connect con accessToken guarda conexion', async () => {
    const { POST } = await import('@/app/api/social-connect/route');
    const req = new Request('http://localhost/api/social-connect', {
      method: 'POST',
      body: JSON.stringify({
        platform: 'youtube',
        action: 'connect',
        accessToken: 'token-123',
        refreshToken: 'refresh-456',
      }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(200);
    expect(mockSaveOAuthConnection).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'u1',
      platform: 'youtube',
      accessToken: 'token-123',
      refreshToken: 'refresh-456',
    }));
  });

  it('action=connect con accessToken respeta el limite del plan (403)', async () => {
    mockCheckSocialAccountLimit.mockResolvedValueOnce({
      allowed: false,
      current: 3,
      limit: 3,
      plan: 'pro',
      reason: 'Tu plan Plan Profesional permite hasta 3 cuentas de youtube y ya alcanzaste ese limite.',
    } as any);
    const { POST } = await import('@/app/api/social-connect/route');
    const req = new Request('http://localhost/api/social-connect', {
      method: 'POST',
      body: JSON.stringify({
        platform: 'youtube',
        action: 'connect',
        accessToken: 'token-123',
      }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(403);
    expect(mockSaveOAuthConnection).not.toHaveBeenCalled();
  });

  it('action=connect sin accessToken devuelve authUrl', async () => {
    const { POST } = await import('@/app/api/social-connect/route');
    const req = new Request('http://localhost/api/social-connect', {
      method: 'POST',
      body: JSON.stringify({ platform: 'facebook', action: 'connect' }),
    });
    const res = await POST(req as any);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.authUrl).toContain('facebook');
  });

  it('action=connect retorna error si saveOAuthConnection falla', async () => {
    mockSaveOAuthConnection.mockResolvedValueOnce(false);
    const { POST } = await import('@/app/api/social-connect/route');
    const req = new Request('http://localhost/api/social-connect', {
      method: 'POST',
      body: JSON.stringify({
        platform: 'youtube',
        action: 'connect',
        accessToken: 'token-123',
      }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(500);
  });

  it('action=disconnect llama disconnectSocialNetwork', async () => {
    const { POST } = await import('@/app/api/social-connect/route');
    const { socialOAuthManager } = await import('@/lib/oauth/manager');
    const req = new Request('http://localhost/api/social-connect', {
      method: 'POST',
      body: JSON.stringify({ platform: 'youtube', action: 'disconnect' }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(200);
    expect(socialOAuthManager.disconnectSocialNetwork).toHaveBeenCalledWith('u1', 'youtube');
  });

  it('action=disconnect_account sin accountId rechaza con 400', async () => {
    const { POST } = await import('@/app/api/social-connect/route');
    const req = new Request('http://localhost/api/social-connect', {
      method: 'POST',
      body: JSON.stringify({ action: 'disconnect_account' }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(400);
  });

  it('action=disconnect_account con accountId desconecta solo esa cuenta', async () => {
    const { POST } = await import('@/app/api/social-connect/route');
    const req = new Request('http://localhost/api/social-connect', {
      method: 'POST',
      body: JSON.stringify({ action: 'disconnect_account', accountId: 'acc-uuid-123' }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(200);
    expect(mockDisconnectAccountById).toHaveBeenCalledWith('u1', 'acc-uuid-123');
  });

  it('action=sync llama syncAllConnections', async () => {
    const { POST } = await import('@/app/api/social-connect/route');
    const { socialOAuthManager } = await import('@/lib/oauth/manager');
    const req = new Request('http://localhost/api/social-connect', {
      method: 'POST',
      body: JSON.stringify({ platform: 'youtube', action: 'sync' }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(200);
    expect(socialOAuthManager.syncAllConnections).toHaveBeenCalledWith('u1');
  });

  it('action=validate llama validateUserTokens', async () => {
    const { POST } = await import('@/app/api/social-connect/route');
    const { socialOAuthManager } = await import('@/lib/oauth/manager');
    const req = new Request('http://localhost/api/social-connect', {
      method: 'POST',
      body: JSON.stringify({ platform: 'youtube', action: 'validate' }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(200);
    expect(socialOAuthManager.validateUserTokens).toHaveBeenCalledWith('u1');
  });
});

describe('GET /api/social-connect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rechaza sin auth (401)', async () => {
    const { requireAuth } = await import('@/lib/auth-helper');
    (requireAuth as any).mockImplementationOnce(async () =>
      NextResponse.json({ error: 'unauth' }, { status: 401 })
    );
    const { GET } = await import('@/app/api/social-connect/route');
    const req = new Request('http://localhost/api/social-connect');
    const res = await GET(req as any);
    expect(res.status).toBe(401);
  });

  it('GET sin action devuelve socialConnections agrupado por plataforma', async () => {
    const { GET } = await import('@/app/api/social-connect/route');
    const req = new Request('http://localhost/api/social-connect');
    const res = await GET(req as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.socialConnections).toBeTruthy();
    expect(body.socialConnections.youtube.connected).toBe(true);
  });

  it('action=summary devuelve resumen', async () => {
    const { GET } = await import('@/app/api/social-connect/route');
    const req = new Request('http://localhost/api/social-connect?action=summary');
    const res = await GET(req as any);
    const body = await res.json();
    expect(body.summary.totalConnected).toBe(1);
  });

  it('action=list_accounts devuelve array de cuentas', async () => {
    const { GET } = await import('@/app/api/social-connect/route');
    const req = new Request('http://localhost/api/social-connect?action=list_accounts');
    const res = await GET(req as any);
    const body = await res.json();
    expect(Array.isArray(body.accounts)).toBe(true);
    expect(body.accounts).toHaveLength(1);
    expect(mockListConnectedAccounts).toHaveBeenCalledWith('u1', undefined);
  });

  it('action=list_accounts&platform=youtube filtra por plataforma', async () => {
    const { GET } = await import('@/app/api/social-connect/route');
    const req = new Request('http://localhost/api/social-connect?action=list_accounts&platform=youtube');
    await GET(req as any);
    expect(mockListConnectedAccounts).toHaveBeenCalledWith('u1', 'youtube');
  });
});
