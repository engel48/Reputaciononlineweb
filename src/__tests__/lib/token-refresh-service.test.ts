/**
 * Tests para src/lib/oauth/token-refresh-service.ts
 *
 * Verifica:
 *  - refreshExpiringTokens incluye tokens YA expirados (regresion bug fix)
 *  - refreshToken YouTube usa el endpoint correcto de Google
 *  - refreshToken NO toca last_sync (regresion bug fix)
 *  - Errores de Google se reportan con mensaje
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const updateCalls: any[] = [];
let connectionsToReturn: any[] = [];

vi.mock('@/lib/encryption', () => ({
  encryptToken: (t: string) => `ENC[${t}]`,
  decryptToken: (t: string) => t.replace(/^ENC\[|\]$/g, ''),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          not: () => ({
            lt: () => Promise.resolve({ data: connectionsToReturn, error: null }),
          }),
        }),
      }),
      update: (data: any) => {
        updateCalls.push(data);
        return {
          eq: () => ({
            eq: () => Promise.resolve({ error: null }),
          }),
        };
      },
    }),
  }),
}));

describe('TokenRefreshService.refreshExpiringTokens', () => {
  beforeEach(() => {
    updateCalls.length = 0;
    connectionsToReturn = [];
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://supa');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'srv');
    vi.stubEnv('GOOGLE_CLIENT_ID', 'gid');
    vi.stubEnv('GOOGLE_CLIENT_SECRET', 'gsec');
    global.fetch = vi.fn(async () => new Response(JSON.stringify({
      access_token: 'new-access',
      expires_in: 3600,
    }), { status: 200 })) as any;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('incluye tokens YA expirados (regresion del bug arreglado)', async () => {
    // Token expirado HACE 5 horas
    const expiredAgo = new Date(Date.now() - 5 * 3600 * 1000).toISOString();
    connectionsToReturn = [{
      user_id: 'u1',
      platform: 'youtube',
      username: 'ch1',
      access_token: 'ENC[old-token]',
      refresh_token: 'ENC[refresh-1]',
      token_expiry: expiredAgo,
    }];

    const { tokenRefreshService } = await import('@/lib/oauth/token-refresh-service');
    const results = await tokenRefreshService.refreshExpiringTokens(24);
    expect(results).toHaveLength(1);
    expect(results[0].success).toBe(true);
    expect(results[0].platform).toBe('youtube');
  });

  it('refreshToken YouTube llama oauth2.googleapis.com con grant_type=refresh_token', async () => {
    const { tokenRefreshService } = await import('@/lib/oauth/token-refresh-service');
    await tokenRefreshService.refreshToken('u1', 'youtube', 'ENC[refresh-tok]');

    expect(global.fetch).toHaveBeenCalled();
    const callArgs = (global.fetch as any).mock.calls[0];
    expect(callArgs[0]).toBe('https://oauth2.googleapis.com/token');
    const body = (callArgs[1].body as URLSearchParams).toString();
    expect(body).toContain('grant_type=refresh_token');
    expect(body).toContain('refresh_token=refresh-tok'); // desencriptado
    expect(body).toContain('client_id=gid');
  });

  it('refreshToken NO actualiza last_sync (regresion del bug)', async () => {
    const { tokenRefreshService } = await import('@/lib/oauth/token-refresh-service');
    const result = await tokenRefreshService.refreshToken('u1', 'youtube', 'ENC[refresh-2]');
    expect(result.success).toBe(true);
    // El update solo debe tocar access_token y token_expiry, NO last_sync
    expect(updateCalls).toHaveLength(1);
    expect(updateCalls[0]).toHaveProperty('access_token');
    expect(updateCalls[0]).toHaveProperty('token_expiry');
    expect(updateCalls[0]).not.toHaveProperty('last_sync');
  });

  it('refresh YouTube reporta error si Google retorna 400', async () => {
    global.fetch = vi.fn(async () => new Response('invalid_grant', { status: 400 })) as any;
    const { tokenRefreshService } = await import('@/lib/oauth/token-refresh-service');
    const result = await tokenRefreshService.refreshToken('u1', 'youtube', 'ENC[bad]');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Google refresh failed');
  });

  it('refresh con plataforma desconocida retorna success=false', async () => {
    const { tokenRefreshService } = await import('@/lib/oauth/token-refresh-service');
    const result = await tokenRefreshService.refreshToken('u1', 'unknown-platform', 'ENC[t]');
    expect(result.success).toBe(false);
  });

  it('refreshExpiringTokens con array vacio retorna []', async () => {
    connectionsToReturn = [];
    const { tokenRefreshService } = await import('@/lib/oauth/token-refresh-service');
    const results = await tokenRefreshService.refreshExpiringTokens(24);
    expect(results).toEqual([]);
  });
});
