/**
 * Tests para /api/admin/social (vista global de redes)
 *  - Auth: rechaza sin admin (403)
 *  - GET lista cuentas con stats
 *  - POST disconnect y refresh llaman a los helpers
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

const mockResults: Record<string, any> = {};

const disconnectMock = vi.fn(async () => true);
const refreshMock = vi.fn(async () => [{ platform: 'x', success: true }]);

vi.mock('@/lib/auth-helper', () => ({
  requireRole: vi.fn(async (_req: any, role: string) =>
    role === 'admin'
      ? { userId: 'admin-1', email: 'admin@test.com', role: 'admin' }
      : NextResponse.json({ success: false, error: 'denegado' }, { status: 403 })
  ),
}));

vi.mock('@/lib/oauth-storage', () => ({
  disconnectAccountById: (...a: any[]) => disconnectMock(...a),
}));

vi.mock('@/lib/oauth/token-refresh-service', () => ({
  tokenRefreshService: { refreshUserTokens: (...a: any[]) => refreshMock(...a) },
}));

function makeBuilder(table: string) {
  const b: any = {};
  const ret = () => b;
  ['select', 'order', 'eq', 'lt', 'gte', 'or', 'ilike', 'like', 'in', 'range', 'delete', 'limit', 'not', 'update'].forEach((m) => {
    b[m] = vi.fn(ret);
  });
  b.then = (resolve: any) => resolve(mockResults[table] ?? { data: [], count: 0, error: null });
  return b;
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ from: (t: string) => makeBuilder(t) }),
}));

describe('/api/admin/social', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const k of Object.keys(mockResults)) delete mockResults[k];
  });

  it('rechaza si no es admin (403)', async () => {
    const { requireRole } = await import('@/lib/auth-helper');
    (requireRole as any).mockImplementationOnce(async () =>
      NextResponse.json({ success: false }, { status: 403 })
    );
    const { GET } = await import('@/app/api/admin/social/route');
    const res = await GET(new Request('http://localhost/api/admin/social') as any);
    expect(res.status).toBe(403);
  });

  it('GET lista cuentas con stats y datos de usuario', async () => {
    mockResults['social_media'] = {
      data: [{ id: 's1', user_id: 'u1', platform: 'x', username: 'juan', connected: true, token_expiry: null, followers: 10 }],
      count: 1,
      error: null,
    };
    mockResults['users'] = { data: [{ id: 'u1', name: 'Juan', email: 'juan@x.com', plan: 'pro' }] };

    const { GET } = await import('@/app/api/admin/social/route');
    const res = await GET(new Request('http://localhost/api/admin/social') as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.accounts).toHaveLength(1);
    expect(body.accounts[0].user.email).toBe('juan@x.com');
    expect(body.stats).toBeDefined();
  });

  it('POST disconnect llama a disconnectAccountById', async () => {
    const { POST } = await import('@/app/api/admin/social/route');
    const req = new Request('http://localhost/api/admin/social', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'disconnect', id: 's1', userId: 'u1' }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(200);
    expect(disconnectMock).toHaveBeenCalledWith('u1', 's1');
  });

  it('POST refresh llama a refreshUserTokens', async () => {
    const { POST } = await import('@/app/api/admin/social/route');
    const req = new Request('http://localhost/api/admin/social', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'refresh', userId: 'u1' }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(200);
    expect(refreshMock).toHaveBeenCalledWith('u1');
  });

  it('POST delete elimina el registro', async () => {
    mockResults['social_media'] = { error: null };
    const { POST } = await import('@/app/api/admin/social/route');
    const req = new Request('http://localhost/api/admin/social', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id: 's1', userId: 'u1' }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.deleted).toBe('s1');
  });

  it('POST delete sin id devuelve 400', async () => {
    const { POST } = await import('@/app/api/admin/social/route');
    const req = new Request('http://localhost/api/admin/social', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', userId: 'u1' }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(400);
  });
});
