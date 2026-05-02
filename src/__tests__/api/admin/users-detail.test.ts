/**
 * Tests para GET /api/admin/users/[id]
 *
 * Verifica:
 *  - Auth admin requerido
 *  - 404 si user no existe
 *  - Estructura completa de la respuesta
 *  - NO devuelve password ni access_token
 *  - tokenStatus calculado correctamente
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

const mockUser = {
  id: 'u1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'user',
  plan: 'pro',
  credits: 5000,
  company: 'Acme',
  phone: '+57 300',
  profile_type: 'business',
  category: null,
  brand_name: 'Acme Brand',
  partido_politico: null,
  cargo_actual: null,
  propuestas_principales: null,
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
  last_login: '2026-04-30T12:00:00Z',
  updated_at: '2026-04-30T12:00:00Z',
  onboarding_completed: true,
};

const mockSocials = [
  {
    id: 's1',
    platform: 'youtube',
    username: 'testchannel',
    display_name: 'Test',
    profile_url: 'https://youtube.com/testchannel',
    profile_image: null,
    followers: 1000,
    following: 0,
    posts: 50,
    engagement: 4.5,
    connected: true,
    last_sync: '2026-04-30T12:00:00Z',
    token_expiry: '2030-01-01T00:00:00Z', // futuro -> valid
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 's2',
    platform: 'facebook',
    username: 'testfb',
    display_name: 'Test',
    profile_url: null,
    profile_image: null,
    followers: 500,
    following: 0,
    posts: 30,
    engagement: 0,
    connected: false,
    last_sync: null,
    token_expiry: '2025-01-01T00:00:00Z', // pasado -> expired
    created_at: '2025-12-01T00:00:00Z',
  },
];

const mockTxs = [
  { id: 't1', type: 'bonus', amount: 5000, balance_after: 5000, description: 'Renovacion mensual', related_entity: 'monthly_renewal', created_at: '2026-05-01T00:00:00Z' },
];

const mockMentions = [
  { id: 'm1', platform: 'youtube', content: 'Mencion de prueba', url: 'https://x', published_at: '2026-04-29T10:00:00Z', scraped_at: '2026-04-29T10:01:00Z', likes: 10, shares: 2, comments: 5, metadata: { sentiment: 'positive' } },
];

const mockConversation = { id: 'c1', title: 'Conversacion con Julia', created_at: '2026-04-01', updated_at: '2026-04-30' };

const mockPayments = [
  { id: 'p1', amount: 249000, currency: 'COP', status: 'approved', payment_method: 'PSE', transaction_id: 'wompi-123', created_at: '2026-04-01T00:00:00Z', metadata: {} },
];

vi.mock('@/lib/auth-helper', () => ({
  requireRole: vi.fn(async (_req: any, role: string) => {
    if (role === 'admin') return { userId: 'admin-1', email: 'admin@test.com', role: 'admin' };
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }),
}));

let userExists = true;

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: (table: string) => {
      switch (table) {
        case 'users':
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: () => Promise.resolve({
                  data: userExists ? mockUser : null,
                  error: userExists ? null : { code: 'PGRST116' },
                }),
              }),
            }),
          };
        case 'social_media':
          return {
            select: () => ({
              eq: () => ({
                order: () => Promise.resolve({ data: mockSocials, error: null }),
              }),
            }),
          };
        case 'credit_transactions':
          return {
            select: (cols: string, opts?: any) => {
              if (opts?.head) {
                return { eq: () => Promise.resolve({ count: 1 }) };
              }
              return {
                eq: () => ({
                  order: () => ({
                    limit: () => Promise.resolve({ data: mockTxs, error: null }),
                  }),
                }),
              };
            },
          };
        case 'mentions':
          return {
            select: (cols: string, opts?: any) => {
              if (opts?.head) {
                return { eq: () => Promise.resolve({ count: 5 }) };
              }
              return {
                eq: () => ({
                  order: () => ({
                    limit: () => Promise.resolve({ data: mockMentions, error: null }),
                  }),
                }),
              };
            },
          };
        case 'amelia_conversations':
          return {
            select: (cols: string, opts?: any) => {
              if (opts?.head) {
                return { eq: () => Promise.resolve({ count: 3 }) };
              }
              return {
                eq: () => ({
                  order: () => ({
                    limit: () => ({
                      maybeSingle: () => Promise.resolve({ data: mockConversation, error: null }),
                    }),
                  }),
                }),
              };
            },
          };
        case 'payments':
          return {
            select: (cols: string, opts?: any) => {
              if (opts?.head) {
                return { eq: () => Promise.resolve({ count: 1 }) };
              }
              return {
                eq: () => ({
                  order: () => ({
                    limit: () => Promise.resolve({ data: mockPayments, error: null }),
                  }),
                }),
              };
            },
          };
        default:
          return { select: () => Promise.resolve({ data: [] }) };
      }
    },
  }),
}));

describe('GET /api/admin/users/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userExists = true;
  });

  it('devuelve estructura completa del usuario', async () => {
    const { GET } = await import('@/app/api/admin/users/[id]/route');
    const req = new Request('http://localhost/api/admin/users/u1');
    const res = await GET(req as any, { params: { id: 'u1' } });
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.user.id).toBe('u1');
    expect(body.user.email).toBe('test@example.com');
    expect(body.user.plan).toBe('pro');
    expect(body.socialAccounts).toHaveLength(2);
    expect(body.credits.recentTransactions).toHaveLength(1);
    expect(body.mentions.total).toBe(5);
    expect(body.mentions.recent).toHaveLength(1);
    expect(body.julia.conversationsCount).toBe(3);
    expect(body.julia.lastConversation.id).toBe('c1');
    expect(body.payments.total).toBe(1);
    expect(body.payments.recent).toHaveLength(1);
  });

  it('NO devuelve password ni access_token en la respuesta', async () => {
    const { GET } = await import('@/app/api/admin/users/[id]/route');
    const req = new Request('http://localhost/api/admin/users/u1');
    const res = await GET(req as any, { params: { id: 'u1' } });
    const body = await res.json();
    const serialized = JSON.stringify(body);
    expect(serialized).not.toContain('password');
    expect(serialized).not.toContain('access_token');
    expect(serialized).not.toContain('refresh_token');
  });

  it('devuelve 404 si user no existe', async () => {
    userExists = false;
    const { GET } = await import('@/app/api/admin/users/[id]/route');
    const req = new Request('http://localhost/api/admin/users/no-such');
    const res = await GET(req as any, { params: { id: 'no-such' } });
    expect(res.status).toBe(404);
  });

  it('rechaza request sin admin (403)', async () => {
    const { requireRole } = await import('@/lib/auth-helper');
    (requireRole as any).mockImplementationOnce(async () =>
      NextResponse.json({ error: 'forbidden' }, { status: 403 })
    );
    const { GET } = await import('@/app/api/admin/users/[id]/route');
    const req = new Request('http://localhost/api/admin/users/u1');
    const res = await GET(req as any, { params: { id: 'u1' } });
    expect(res.status).toBe(403);
  });

  it('clasifica correctamente el tokenStatus de cada social account', async () => {
    const { GET } = await import('@/app/api/admin/users/[id]/route');
    const req = new Request('http://localhost/api/admin/users/u1');
    const res = await GET(req as any, { params: { id: 'u1' } });
    const body = await res.json();

    const yt = body.socialAccounts.find((s: any) => s.platform === 'youtube');
    const fb = body.socialAccounts.find((s: any) => s.platform === 'facebook');
    expect(yt.tokenStatus).toBe('valid');
    expect(fb.tokenStatus).toBe('expired');
  });
});
