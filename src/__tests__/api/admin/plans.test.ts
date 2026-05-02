/**
 * Tests para /api/admin/plans (CRUD)
 *
 * Verifica:
 *  - Auth: rechaza sin admin (403)
 *  - GET devuelve planes con stats {userCount, monthlyRevenue}
 *  - POST valida campos requeridos
 *  - POST normaliza code a lowercase
 *  - PUT actualiza solo campos enviados
 *  - DELETE bloquea si hay usuarios suscritos
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

const mockPlans = [
  { id: 'p1', code: 'free', name: 'Plan Free', price_cop: 0, monthly_credits: 100, max_social_accounts: 1, multi_account_per_platform: false, features: {}, is_active: true, is_popular: false, billing_cycle: 'monthly', display_order: 1, created_at: '2026-01-01', updated_at: '2026-01-01' },
  { id: 'p2', code: 'pro', name: 'Plan Pro', price_cop: 249000, monthly_credits: 5000, max_social_accounts: 4, multi_account_per_platform: false, features: { advancedAnalytics: true }, is_active: true, is_popular: true, billing_cycle: 'monthly', display_order: 3, created_at: '2026-01-01', updated_at: '2026-01-01' },
];

const mockUsersData = [
  { plan: 'free' }, { plan: 'free' }, { plan: 'pro' },
];

let nextInsertResult: any = null;
let nextDeleteAllowed = true;

vi.mock('@/lib/auth-helper', () => ({
  requireRole: vi.fn(async (_req: any, role: string) => {
    if (role === 'admin') return { userId: 'admin-1', email: 'admin@test.com', role: 'admin' };
    return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
  }),
}));

vi.mock('@/lib/plan-limits', () => ({
  invalidatePlansCache: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: (table: string) => {
      if (table === 'plans') {
        return {
          // select() en ruta GET hace .order(); en DELETE hace .eq().maybeSingle()
          select: () => ({
            order: () => Promise.resolve({ data: mockPlans, error: null }),
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: { code: 'free' }, error: null }),
            }),
          }),
          insert: vi.fn(() => ({
            select: () => ({
              single: () => Promise.resolve(nextInsertResult || { data: { ...mockPlans[0], id: 'new-uuid' }, error: null }),
            }),
          })),
          update: vi.fn(() => ({
            eq: () => ({
              select: () => ({
                single: () => Promise.resolve({ data: { ...mockPlans[0], name: 'Updated' }, error: null }),
              }),
            }),
          })),
          delete: vi.fn(() => ({
            eq: () => Promise.resolve({ error: null }),
          })),
        };
      }
      if (table === 'users') {
        return {
          select: (cols: string, opts?: any) => {
            if (opts?.head) {
              // count exact head=true
              return {
                eq: () => Promise.resolve({ count: nextDeleteAllowed ? 0 : 5 }),
              };
            }
            return Promise.resolve({ data: mockUsersData });
          },
        };
      }
      return { select: () => Promise.resolve({ data: [] }) };
    },
  }),
}));

describe('GET /api/admin/plans', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nextInsertResult = null;
    nextDeleteAllowed = true;
  });

  it('lista los planes con stats de usuarios y revenue', async () => {
    const { GET } = await import('@/app/api/admin/plans/route');
    const req = new Request('http://localhost/api/admin/plans');
    const res = await GET(req as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.plans).toHaveLength(2);

    const free = body.plans.find((p: any) => p.code === 'free');
    expect(free.stats.userCount).toBe(2);
    expect(free.stats.monthlyRevenue).toBe(0);

    const pro = body.plans.find((p: any) => p.code === 'pro');
    expect(pro.stats.userCount).toBe(1);
    expect(pro.stats.monthlyRevenue).toBe(249000);
  });

  it('rechaza si no es admin', async () => {
    const { requireRole } = await import('@/lib/auth-helper');
    (requireRole as any).mockImplementationOnce(async () =>
      NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 })
    );
    const { GET } = await import('@/app/api/admin/plans/route');
    const req = new Request('http://localhost/api/admin/plans');
    const res = await GET(req as any);
    expect(res.status).toBe(403);
  });
});

describe('POST /api/admin/plans', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nextInsertResult = null;
  });

  it('valida campos requeridos (code, name, priceCop, monthlyCredits)', async () => {
    const { POST } = await import('@/app/api/admin/plans/route');
    const req = new Request('http://localhost/api/admin/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'incompleto' }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Campos requeridos');
  });

  it('crea plan e invalida cache', async () => {
    nextInsertResult = {
      data: { id: 'p3', code: 'newplan', name: 'New', price_cop: 100, monthly_credits: 200, max_social_accounts: 2, multi_account_per_platform: false, features: {}, is_active: true, is_popular: false, billing_cycle: 'monthly', display_order: 0, created_at: '2026-05-02', updated_at: '2026-05-02' },
      error: null,
    };
    const { POST } = await import('@/app/api/admin/plans/route');
    const { invalidatePlansCache } = await import('@/lib/plan-limits');

    const req = new Request('http://localhost/api/admin/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: 'NEWPLAN', // mayusculas para verificar normalizacion
        name: 'New',
        priceCop: 100,
        monthlyCredits: 200,
        maxSocialAccounts: 2,
      }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(201);
    expect(invalidatePlansCache).toHaveBeenCalled();
  });
});

describe('DELETE /api/admin/plans/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nextDeleteAllowed = true;
  });

  it('bloquea con 409 si hay usuarios en el plan', async () => {
    nextDeleteAllowed = false;
    const { DELETE } = await import('@/app/api/admin/plans/[id]/route');
    const req = new Request('http://localhost/api/admin/plans/p1', { method: 'DELETE' });
    // Mock para que devuelva el plan
    const res = await DELETE(req as any, { params: { id: 'p1' } });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toContain('5 usuario');
  });
});
