/**
 * Tests para /api/cron/refresh-tokens
 *
 * Verifica:
 *  - Falla con 500 si CRON_SECRET_KEY no esta configurada (sin fallback hardcoded)
 *  - Falla con 401 si Bearer no coincide
 *  - Acepta con 200 y llama tokenRefreshService cuando el bearer es correcto
 *  - GET expone status del endpoint
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/oauth/token-refresh-service', () => ({
  tokenRefreshService: {
    refreshExpiringTokens: vi.fn(async () => [
      { platform: 'youtube', success: true, new_expiry: '2030-01-01T00:00:00.000Z' },
    ]),
  },
}));

describe('POST /api/cron/refresh-tokens', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('responde 500 cuando CRON_SECRET_KEY no esta configurada', async () => {
    vi.stubEnv('CRON_SECRET_KEY', '');
    const { POST } = await import('@/app/api/cron/refresh-tokens/route');
    const req = new Request('http://localhost/api/cron/refresh-tokens', {
      method: 'POST',
      headers: { Authorization: 'Bearer cualquier-valor' },
    });
    const res = await POST(req as any);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain('CRON_SECRET_KEY');
  });

  it('responde 401 cuando el Bearer no coincide', async () => {
    vi.stubEnv('CRON_SECRET_KEY', 'secret-real-12345');
    const { POST } = await import('@/app/api/cron/refresh-tokens/route');
    const req = new Request('http://localhost/api/cron/refresh-tokens', {
      method: 'POST',
      headers: { Authorization: 'Bearer wrong' },
    });
    const res = await POST(req as any);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('No autorizado');
  });

  it('responde 200 y llama refreshExpiringTokens cuando bearer es correcto', async () => {
    vi.stubEnv('CRON_SECRET_KEY', 'secret-real-12345');
    const { POST } = await import('@/app/api/cron/refresh-tokens/route');
    const { tokenRefreshService } = await import('@/lib/oauth/token-refresh-service');

    const req = new Request('http://localhost/api/cron/refresh-tokens', {
      method: 'POST',
      headers: { Authorization: 'Bearer secret-real-12345' },
    });
    const res = await POST(req as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.summary.tokens_refreshed).toBe(1);
    expect(tokenRefreshService.refreshExpiringTokens).toHaveBeenCalledWith(24);
  });

  it('NO acepta el viejo fallback hardcoded "dev-cron-secret-key-2025"', async () => {
    vi.stubEnv('CRON_SECRET_KEY', 'secret-real-distinto');
    const { POST } = await import('@/app/api/cron/refresh-tokens/route');
    const req = new Request('http://localhost/api/cron/refresh-tokens', {
      method: 'POST',
      headers: { Authorization: 'Bearer dev-cron-secret-key-2025' },
    });
    const res = await POST(req as any);
    expect(res.status).toBe(401);
  });
});

describe('GET /api/cron/refresh-tokens', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it('responde 500 sin CRON_SECRET_KEY', async () => {
    vi.stubEnv('CRON_SECRET_KEY', '');
    const { GET } = await import('@/app/api/cron/refresh-tokens/route');
    const req = new Request('http://localhost/api/cron/refresh-tokens', {
      headers: { Authorization: 'Bearer x' },
    });
    const res = await GET(req as any);
    expect(res.status).toBe(500);
  });

  it('responde 200 con status active si el bearer coincide', async () => {
    vi.stubEnv('CRON_SECRET_KEY', 'secret');
    const { GET } = await import('@/app/api/cron/refresh-tokens/route');
    const req = new Request('http://localhost/api/cron/refresh-tokens', {
      headers: { Authorization: 'Bearer secret' },
    });
    const res = await GET(req as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('active');
  });
});
