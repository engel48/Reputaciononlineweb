/**
 * Tests para src/lib/plan-limits.ts
 *
 * Verifica:
 *  - Cache de planes (60s) y su invalidacion
 *  - getPlanByCode con fallback a 'free'
 *  - checkSocialAccountLimit con regla "1 cuenta por red salvo enterprise"
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock de Supabase: cadena from().select().eq()
const mockPlansData = [
  {
    code: 'free',
    name: 'Plan Free',
    price_cop: 0,
    monthly_credits: 100,
    max_social_accounts: 1,
    multi_account_per_platform: false,
    features: { sentimentAnalysis: true },
    is_active: true,
  },
  {
    code: 'basic',
    name: 'Plan Basico',
    price_cop: 99000,
    monthly_credits: 500,
    max_social_accounts: 3,
    multi_account_per_platform: false,
    features: { sentimentAnalysis: true, realTimeMonitoring: true },
    is_active: true,
  },
  {
    code: 'enterprise',
    name: 'Plan Enterprise',
    price_cop: 499000,
    monthly_credits: 50000,
    max_social_accounts: 8,
    multi_account_per_platform: true,
    features: { sentimentAnalysis: true, advancedAnalytics: true, whiteLabeling: true },
    is_active: true,
  },
];

const mockUsers: Record<string, { plan: string }> = {
  'user-free': { plan: 'free' },
  'user-basic': { plan: 'basic' },
  'user-enterprise': { plan: 'enterprise' },
  'user-unknown-plan': { plan: 'phantom-plan' },
};

const mockConnections: Record<string, Array<{ id: string; platform: string; connected: boolean }>> = {
  'user-free': [],
  'user-basic': [
    { id: 'a', platform: 'facebook', connected: true },
    { id: 'b', platform: 'youtube', connected: true },
  ],
  'user-enterprise': [
    { id: 'c', platform: 'facebook', connected: true },
    { id: 'd', platform: 'facebook', connected: true }, // multi-cuenta
  ],
  'user-unknown-plan': [],
};

vi.mock('@/lib/supabase-server', () => ({
  supabase: {
    from: (table: string) => {
      if (table === 'plans') {
        return {
          select: () => Promise.resolve({ data: mockPlansData, error: null }),
        };
      }
      if (table === 'users') {
        return {
          select: () => ({
            eq: (_col: string, val: string) => ({
              maybeSingle: () => Promise.resolve({
                data: mockUsers[val] || null,
                error: mockUsers[val] ? null : { code: 'PGRST116' },
              }),
            }),
          }),
        };
      }
      if (table === 'social_media') {
        return {
          select: () => ({
            eq: (_col: string, val: string) => Promise.resolve({
              data: mockConnections[val] || [],
              error: null,
            }),
          }),
        };
      }
      return { select: () => Promise.resolve({ data: [], error: null }) };
    },
  },
}));

describe('plan-limits', () => {
  beforeEach(async () => {
    // Invalidar cache antes de cada test para no contaminar
    const mod = await import('@/lib/plan-limits');
    mod.invalidatePlansCache();
  });

  describe('getAllPlans', () => {
    it('devuelve los planes desde DB', async () => {
      const { getAllPlans } = await import('@/lib/plan-limits');
      const plans = await getAllPlans();
      expect(plans).toHaveLength(3);
      expect(plans.map((p) => p.code).sort()).toEqual(['basic', 'enterprise', 'free']);
    });

    it('mapea snake_case a camelCase', async () => {
      const { getAllPlans } = await import('@/lib/plan-limits');
      const plans = await getAllPlans();
      const enterprise = plans.find((p) => p.code === 'enterprise')!;
      expect(enterprise.priceCop).toBe(499000);
      expect(enterprise.monthlyCredits).toBe(50000);
      expect(enterprise.maxSocialAccounts).toBe(8);
      expect(enterprise.multiAccountPerPlatform).toBe(true);
    });
  });

  describe('getPlanByCode', () => {
    it('devuelve el plan por su code', async () => {
      const { getPlanByCode } = await import('@/lib/plan-limits');
      const basic = await getPlanByCode('basic');
      expect(basic?.code).toBe('basic');
      expect(basic?.priceCop).toBe(99000);
    });

    it('devuelve null para code inexistente', async () => {
      const { getPlanByCode } = await import('@/lib/plan-limits');
      const phantom = await getPlanByCode('phantom-plan');
      expect(phantom).toBeNull();
    });
  });

  describe('getMonthlyCreditLimit', () => {
    it('devuelve creditos del plan', async () => {
      const { getMonthlyCreditLimit } = await import('@/lib/plan-limits');
      expect(await getMonthlyCreditLimit('basic')).toBe(500);
      expect(await getMonthlyCreditLimit('enterprise')).toBe(50000);
    });

    it('hace fallback a free para plan inexistente', async () => {
      const { getMonthlyCreditLimit } = await import('@/lib/plan-limits');
      expect(await getMonthlyCreditLimit('phantom')).toBe(100);
    });
  });

  describe('getSocialAccountLimit', () => {
    it('devuelve max accounts del plan', async () => {
      const { getSocialAccountLimit } = await import('@/lib/plan-limits');
      expect(await getSocialAccountLimit('free')).toBe(1);
      expect(await getSocialAccountLimit('basic')).toBe(3);
      expect(await getSocialAccountLimit('enterprise')).toBe(8);
    });
  });

  describe('allowsMultiAccountPerPlatform', () => {
    it('solo enterprise permite multi-cuenta por red', async () => {
      const { allowsMultiAccountPerPlatform } = await import('@/lib/plan-limits');
      expect(await allowsMultiAccountPerPlatform('free')).toBe(false);
      expect(await allowsMultiAccountPerPlatform('basic')).toBe(false);
      expect(await allowsMultiAccountPerPlatform('enterprise')).toBe(true);
    });

    it('plan inexistente devuelve false', async () => {
      const { allowsMultiAccountPerPlatform } = await import('@/lib/plan-limits');
      expect(await allowsMultiAccountPerPlatform('phantom')).toBe(false);
    });
  });

  describe('checkSocialAccountLimit', () => {
    it('user free sin redes puede conectar la primera', async () => {
      const { checkSocialAccountLimit } = await import('@/lib/plan-limits');
      const result = await checkSocialAccountLimit('user-free', 'facebook');
      expect(result.allowed).toBe(true);
      expect(result.current).toBe(0);
      expect(result.limit).toBe(1);
    });

    it('user basic con 2 redes puede conectar la 3ra (limit=3)', async () => {
      const { checkSocialAccountLimit } = await import('@/lib/plan-limits');
      const result = await checkSocialAccountLimit('user-basic', 'instagram');
      expect(result.allowed).toBe(true);
      expect(result.current).toBe(2);
      expect(result.limit).toBe(3);
    });

    it('user basic NO puede conectar otra cuenta de facebook (1 por plataforma)', async () => {
      const { checkSocialAccountLimit } = await import('@/lib/plan-limits');
      const result = await checkSocialAccountLimit('user-basic', 'facebook');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('una cuenta de facebook');
    });

    it('user enterprise SI puede conectar segunda cuenta de la misma red', async () => {
      const { checkSocialAccountLimit } = await import('@/lib/plan-limits');
      const result = await checkSocialAccountLimit('user-enterprise', 'facebook');
      expect(result.allowed).toBe(true);
      expect(result.current).toBe(2);
      expect(result.limit).toBe(8);
    });

    it('rechaza usuario inexistente', async () => {
      const { checkSocialAccountLimit } = await import('@/lib/plan-limits');
      const result = await checkSocialAccountLimit('user-inexistente', 'facebook');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Usuario no encontrado');
    });

    it('rechaza si plan del usuario no existe en plans table', async () => {
      const { checkSocialAccountLimit } = await import('@/lib/plan-limits');
      const result = await checkSocialAccountLimit('user-unknown-plan', 'facebook');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Plan');
    });
  });

  describe('cache', () => {
    it('invalidatePlansCache fuerza re-fetch', async () => {
      const { getAllPlans, invalidatePlansCache } = await import('@/lib/plan-limits');
      // Primera llamada: hidrata cache
      await getAllPlans();
      // Invalidar
      invalidatePlansCache();
      // Segunda llamada: debe re-consultar (no rompe)
      const plans = await getAllPlans();
      expect(plans).toHaveLength(3);
    });
  });
});
