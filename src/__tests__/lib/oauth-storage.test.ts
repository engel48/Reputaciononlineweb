/**
 * Tests para src/lib/oauth-storage.ts
 *
 * Verifica:
 *  - saveOAuthConnection encripta tokens y persiste con upsert
 *  - listConnectedAccounts retorna ConnectedAccount[]
 *  - listConnectedAccounts NO expone access_token al caller
 *  - disconnectAccountById limpia tokens y marca connected=false
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const upsertCalls: any[] = [];
const updateCalls: any[] = [];
let listResult: any = { data: [], error: null };
let updateResult: any = { error: null };

vi.mock('@/lib/encryption', () => ({
  encryptToken: (t: string) => `ENC[${t}]`,
  decryptToken: (t: string) => t.replace(/^ENC\[|\]$/g, ''),
}));

vi.mock('@/lib/supabase-server', () => ({
  supabase: {
    from: (table: string) => {
      if (table === 'social_media') {
        return {
          upsert: (data: any, opts: any) => {
            upsertCalls.push({ data, opts });
            return Promise.resolve({ error: upsertCalls[upsertCalls.length - 1].forceError ? { message: 'fail' } : null });
          },
          select: () => ({
            eq: () => ({
              eq: () => ({
                order: () => Promise.resolve(listResult),
                eq: () => ({
                  order: () => Promise.resolve(listResult),
                }),
              }),
            }),
          }),
          update: (data: any) => {
            updateCalls.push(data);
            return {
              eq: () => ({
                eq: () => Promise.resolve(updateResult),
              }),
            };
          },
        };
      }
      return { select: () => Promise.resolve({ data: [] }) };
    },
  },
}));

describe('saveOAuthConnection', () => {
  beforeEach(() => {
    upsertCalls.length = 0;
    vi.clearAllMocks();
  });

  it('encripta access_token y refresh_token antes de guardar', async () => {
    const { saveOAuthConnection } = await import('@/lib/oauth-storage');
    await saveOAuthConnection({
      userId: 'u1',
      platform: 'youtube',
      accessToken: 'plain-access',
      refreshToken: 'plain-refresh',
      profile: { id: 'ch1', name: 'Channel', username: 'ch1' },
    });
    expect(upsertCalls).toHaveLength(1);
    expect(upsertCalls[0].data.access_token).toBe('ENC[plain-access]');
    expect(upsertCalls[0].data.refresh_token).toBe('ENC[plain-refresh]');
  });

  it('usa onConflict=user_id,platform,username para soportar multi-cuenta', async () => {
    const { saveOAuthConnection } = await import('@/lib/oauth-storage');
    await saveOAuthConnection({
      userId: 'u1',
      platform: 'facebook',
      accessToken: 'tok',
      profile: { id: 'fb1', username: 'pageA' },
    });
    expect(upsertCalls[0].opts.onConflict).toBe('user_id,platform,username');
  });

  it('retorna true en exito y connected=true', async () => {
    const { saveOAuthConnection } = await import('@/lib/oauth-storage');
    const ok = await saveOAuthConnection({
      userId: 'u1',
      platform: 'youtube',
      accessToken: 'tok',
      profile: { id: 'ch1', username: 'channel1' },
    });
    expect(ok).toBe(true);
    expect(upsertCalls[0].data.connected).toBe(true);
  });

  it('refresh_token null si no se proporciona', async () => {
    const { saveOAuthConnection } = await import('@/lib/oauth-storage');
    await saveOAuthConnection({
      userId: 'u1',
      platform: 'instagram',
      accessToken: 'tok',
      profile: { id: 'ig1', username: 'ig_user' },
    });
    expect(upsertCalls[0].data.refresh_token).toBeNull();
  });
});

describe('listConnectedAccounts', () => {
  beforeEach(() => {
    listResult = {
      data: [
        { id: 'a1', platform: 'youtube', username: 'ch1', display_name: 'C1', profile_image: null, profile_url: null, followers: 1000, connected: true, last_sync: null, posts: 10, engagement: 5 },
        { id: 'a2', platform: 'youtube', username: 'ch2', display_name: 'C2', profile_image: null, profile_url: null, followers: 500, connected: true, last_sync: null, posts: 5, engagement: 3 },
      ],
      error: null,
    };
  });

  it('retorna ConnectedAccount[] con campos correctos', async () => {
    const { listConnectedAccounts } = await import('@/lib/oauth-storage');
    const accs = await listConnectedAccounts('u1');
    expect(accs).toHaveLength(2);
    expect(accs[0]).toMatchObject({
      id: 'a1',
      platform: 'youtube',
      username: 'ch1',
      followers: 1000,
      metrics: { posts: 10, engagement: 5 },
    });
  });

  it('NO expone access_token en el resultado', async () => {
    const { listConnectedAccounts } = await import('@/lib/oauth-storage');
    const accs = await listConnectedAccounts('u1');
    const serialized = JSON.stringify(accs);
    expect(serialized).not.toContain('access_token');
    expect(serialized).not.toContain('refresh_token');
  });

  it('retorna [] si Supabase falla', async () => {
    listResult = { data: null, error: { message: 'db error' } };
    const { listConnectedAccounts } = await import('@/lib/oauth-storage');
    const accs = await listConnectedAccounts('u1');
    expect(accs).toEqual([]);
  });
});

describe('disconnectAccountById', () => {
  beforeEach(() => {
    updateCalls.length = 0;
    updateResult = { error: null };
  });

  it('marca connected=false y limpia tokens', async () => {
    const { disconnectAccountById } = await import('@/lib/oauth-storage');
    const ok = await disconnectAccountById('u1', 'acc-id-123');
    expect(ok).toBe(true);
    expect(updateCalls[0]).toMatchObject({
      connected: false,
      access_token: null,
      refresh_token: null,
      token_expiry: null,
    });
  });

  it('retorna false si Supabase falla', async () => {
    updateResult = { error: { message: 'fail' } };
    const { disconnectAccountById } = await import('@/lib/oauth-storage');
    const ok = await disconnectAccountById('u1', 'acc-id-456');
    expect(ok).toBe(false);
  });
});
