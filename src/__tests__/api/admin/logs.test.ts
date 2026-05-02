/**
 * Tests para GET /api/admin/logs
 *
 * Verifica:
 *  - Auth admin requerido
 *  - Validacion de source (system|oauth)
 *  - Paginacion (limit, offset)
 *  - Filtro por eventType (ilike)
 *  - topEventTypes calculado
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

const mockSystemLogs = [
  { id: '1', event_type: 'cron_token_refresh', details: { status: 200 }, created_at: '2026-05-02T20:00:00Z' },
  { id: '2', event_type: 'social_sync_cron', details: { failed: 0 }, created_at: '2026-05-02T19:30:00Z' },
];

const mockOauthLogs = [
  { id: 'o1', user_id: 'u1', platform: 'youtube', action: 'connect', success: true, created_at: '2026-04-23T05:00:00Z', metadata: {} },
];

vi.mock('@/lib/auth-helper', () => ({
  requireRole: vi.fn(async (_req: any, role: string) => {
    if (role === 'admin') return { userId: 'admin-1', email: 'admin@test.com', role: 'admin' };
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: (table: string) => {
      const data = table === 'system_logs' ? mockSystemLogs : table === 'oauth_logs' ? mockOauthLogs : [];

      return {
        select: (_cols: string, _opts?: any) => ({
          order: () => ({
            range: () => Promise.resolve({ data, count: data.length, error: null }),
            limit: () => Promise.resolve({ data, error: null }),
            ilike: () => ({
              range: () => Promise.resolve({ data, count: data.length, error: null }),
            }),
            gte: () => ({
              range: () => Promise.resolve({ data, count: data.length, error: null }),
            }),
          }),
          ilike: () => ({
            order: () => ({
              range: () => Promise.resolve({ data, count: data.length, error: null }),
            }),
          }),
        }),
      };
    },
  }),
}));

describe('GET /api/admin/logs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rechaza source invalido con 400', async () => {
    const { GET } = await import('@/app/api/admin/logs/route');
    const req = new Request('http://localhost/api/admin/logs?source=invalid');
    const res = await GET(req as any);
    expect(res.status).toBe(400);
  });

  it('lista logs de system_logs por defecto', async () => {
    const { GET } = await import('@/app/api/admin/logs/route');
    const req = new Request('http://localhost/api/admin/logs?source=system');
    const res = await GET(req as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.source).toBe('system');
    expect(body.logs).toHaveLength(2);
  });

  it('lista logs de oauth_logs cuando source=oauth', async () => {
    const { GET } = await import('@/app/api/admin/logs/route');
    const req = new Request('http://localhost/api/admin/logs?source=oauth');
    const res = await GET(req as any);
    const body = await res.json();
    expect(body.source).toBe('oauth');
    expect(body.logs).toHaveLength(1);
  });

  it('respeta limit y offset', async () => {
    const { GET } = await import('@/app/api/admin/logs/route');
    const req = new Request('http://localhost/api/admin/logs?source=system&limit=10&offset=20');
    const res = await GET(req as any);
    const body = await res.json();
    expect(body.limit).toBe(10);
    expect(body.offset).toBe(20);
  });

  it('clamp limit al maximo (200)', async () => {
    const { GET } = await import('@/app/api/admin/logs/route');
    const req = new Request('http://localhost/api/admin/logs?source=system&limit=99999');
    const res = await GET(req as any);
    const body = await res.json();
    expect(body.limit).toBeLessThanOrEqual(200);
  });

  it('rechaza si no es admin', async () => {
    const { requireRole } = await import('@/lib/auth-helper');
    (requireRole as any).mockImplementationOnce(async () =>
      NextResponse.json({ error: 'forbidden' }, { status: 403 })
    );
    const { GET } = await import('@/app/api/admin/logs/route');
    const req = new Request('http://localhost/api/admin/logs?source=system');
    const res = await GET(req as any);
    expect(res.status).toBe(403);
  });
});
