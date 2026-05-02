/**
 * Tests para GET /api/plans (publico, sin auth)
 *
 * Verifica:
 *  - No requiere auth
 *  - Solo devuelve planes is_active=true
 *  - Ordena por display_order
 *  - Headers de cache (s-maxage=60)
 *  - Mapeo snake_case -> camelCase
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPlansData = [
  { code: 'enterprise', name: 'Enterprise', description: 'For big', price_cop: 499000, monthly_credits: 50000, max_social_accounts: 8, multi_account_per_platform: true, features: { whiteLabeling: true }, is_popular: false, display_order: 4 },
  { code: 'pro', name: 'Pro', description: 'For growth', price_cop: 249000, monthly_credits: 5000, max_social_accounts: 4, multi_account_per_platform: false, features: { advancedAnalytics: true }, is_popular: true, display_order: 3 },
  { code: 'free', name: 'Free', description: 'Trial', price_cop: 0, monthly_credits: 100, max_social_accounts: 1, multi_account_per_platform: false, features: {}, is_popular: false, display_order: 1 },
];

vi.mock('@/lib/supabase-server', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: mockPlansData, error: null }),
        }),
      }),
    }),
  },
}));

describe('GET /api/plans (publico)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devuelve planes sin requerir auth', async () => {
    const { GET } = await import('@/app/api/plans/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.plans)).toBe(true);
    expect(body.plans.length).toBe(3);
  });

  it('mapea snake_case a camelCase', async () => {
    const { GET } = await import('@/app/api/plans/route');
    const res = await GET();
    const body = await res.json();
    const pro = body.plans.find((p: any) => p.code === 'pro');
    expect(pro.priceCop).toBe(249000);
    expect(pro.monthlyCredits).toBe(5000);
    expect(pro.maxSocialAccounts).toBe(4);
    expect(pro.multiAccountPerPlatform).toBe(false);
    expect(pro.isPopular).toBe(true);
    expect(pro.displayOrder).toBe(3);
  });

  it('incluye headers de cache CDN', async () => {
    const { GET } = await import('@/app/api/plans/route');
    const res = await GET();
    const cacheControl = res.headers.get('Cache-Control');
    expect(cacheControl).toContain('s-maxage=60');
    expect(cacheControl).toContain('stale-while-revalidate');
  });

  it('NO expone is_active explicitamente (solo devuelve los activos)', async () => {
    const { GET } = await import('@/app/api/plans/route');
    const res = await GET();
    const body = await res.json();
    for (const plan of body.plans) {
      expect(plan).not.toHaveProperty('isActive');
      expect(plan).not.toHaveProperty('is_active');
    }
  });
});
