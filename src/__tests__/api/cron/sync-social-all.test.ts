/**
 * Tests para /api/cron/sync-social-all
 *
 * Verifica:
 *  - Auth: 500 si falta CRON_SECRET_KEY, 401 si Bearer mal, 200 si correcto
 *  - Filtro de elegibilidad: ignora rows con last_sync < 25 minutos
 *  - Procesa rows con last_sync NULL o > 25 minutos
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockSyncFn = vi.fn(async () => ({
  platform: 'youtube',
  successful: true,
  mentions_created: 1,
  external_mentions_created: 0,
}));

vi.mock('@/lib/social-sync', () => ({
  syncPlatformMentions: mockSyncFn,
}));

const mockSocialMediaSelect = vi.fn();

vi.mock('@/lib/supabase-server', () => ({
  supabase: {
    from: (table: string) => {
      if (table === 'social_media') {
        return mockSocialMediaSelect();
      }
      if (table === 'system_logs') {
        return {
          insert: vi.fn(async () => ({ error: null })),
        };
      }
      return { select: () => Promise.resolve({ data: [], error: null }) };
    },
  },
}));

describe('POST /api/cron/sync-social-all', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('responde 500 cuando CRON_SECRET_KEY no esta configurada', async () => {
    vi.stubEnv('CRON_SECRET_KEY', '');
    const { POST } = await import('@/app/api/cron/sync-social-all/route');
    const req = new Request('http://localhost/api/cron/sync-social-all', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer x',
      },
      body: JSON.stringify({ trigger: 'test' }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(500);
  });

  it('responde 401 con Bearer incorrecto', async () => {
    vi.stubEnv('CRON_SECRET_KEY', 'secret');
    const { POST } = await import('@/app/api/cron/sync-social-all/route');
    const req = new Request('http://localhost/api/cron/sync-social-all', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer wrong',
      },
      body: JSON.stringify({ trigger: 'test' }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(401);
  });

  it('NO acepta el viejo "12345678" hardcoded como bearer si CRON_SECRET_KEY es otro', async () => {
    vi.stubEnv('CRON_SECRET_KEY', 'super-secret-real');
    const { POST } = await import('@/app/api/cron/sync-social-all/route');
    const req = new Request('http://localhost/api/cron/sync-social-all', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer 12345678',
      },
      body: JSON.stringify({ trigger: 'test' }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(401);
  });

  it('procesa solo rows con last_sync NULL o > 25 minutos', async () => {
    vi.stubEnv('CRON_SECRET_KEY', 'secret');
    const now = Date.now();
    const recentSync = new Date(now - 10 * 60 * 1000).toISOString(); // 10 min atras
    const oldSync = new Date(now - 60 * 60 * 1000).toISOString(); // 1h atras

    mockSocialMediaSelect.mockReturnValue({
      select: () => ({
        eq: () => ({
          not: () => ({
            limit: () => Promise.resolve({
              data: [
                { id: '1', user_id: 'u1', platform: 'youtube', access_token: 'tok-old', last_sync: oldSync },
                { id: '2', user_id: 'u2', platform: 'youtube', access_token: 'tok-recent', last_sync: recentSync },
                { id: '3', user_id: 'u3', platform: 'youtube', access_token: 'tok-new', last_sync: null },
              ],
              error: null,
            }),
          }),
        }),
      }),
    });

    const { POST } = await import('@/app/api/cron/sync-social-all/route');
    const req = new Request('http://localhost/api/cron/sync-social-all', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer secret',
      },
      body: JSON.stringify({ trigger: 'test' }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(200);

    // Solo deben procesarse 2 (oldSync + null), no el recentSync de 10 min
    expect(mockSyncFn).toHaveBeenCalledTimes(2);
    const callsForUsers = mockSyncFn.mock.calls.map((c: any) => c[1]);
    expect(callsForUsers).toContain('u1');
    expect(callsForUsers).toContain('u3');
    expect(callsForUsers).not.toContain('u2');
  });
});
