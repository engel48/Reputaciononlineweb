/**
 * Tests de integracion: reglas de plan + OAuth de redes sociales.
 *
 * Caso real de produccion: cada plan tiene limite distinto de cuentas
 * sociales y reglas distintas para multi-cuenta. Estos tests validan
 * que checkSocialAccountLimit aplica las reglas correctas en cada
 * combinacion (plan x cantidad x intentar misma red).
 *
 * Replica el flujo: usuario tiene plan X, ya tiene N cuentas conectadas,
 * intenta conectar una nueva en plataforma Y → permitido o rechazado.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Planes reales (mismo seed que public.plans en Supabase).
// max_accounts_per_platform = cuantas cuentas de la MISMA red permite el plan.
const PLANS = {
  free: { code: 'free', name: 'Plan Free', price_cop: 0, monthly_credits: 100, max_social_accounts: 1, multi_account_per_platform: false, max_accounts_per_platform: 1, features: {}, is_active: true },
  basic: { code: 'basic', name: 'Plan Basico', price_cop: 99000, monthly_credits: 500, max_social_accounts: 3, multi_account_per_platform: false, max_accounts_per_platform: 1, features: {}, is_active: true },
  pro: { code: 'pro', name: 'Plan Profesional', price_cop: 249000, monthly_credits: 5000, max_social_accounts: 12, multi_account_per_platform: true, max_accounts_per_platform: 3, features: {}, is_active: true },
  enterprise: { code: 'enterprise', name: 'Plan Enterprise', price_cop: 499000, monthly_credits: 50000, max_social_accounts: 20, multi_account_per_platform: true, max_accounts_per_platform: 5, features: {}, is_active: true },
};

// Estado de cada usuario test (plan + cuentas conectadas)
const userScenarios: Record<string, { plan: string; connections: Array<{ platform: string; connected: boolean }> }> = {};

vi.mock('@/lib/supabase-server', () => ({
  supabase: {
    from: (table: string) => {
      if (table === 'plans') {
        return {
          select: () => Promise.resolve({ data: Object.values(PLANS), error: null }),
        };
      }
      if (table === 'users') {
        return {
          select: () => ({
            eq: (_col: string, val: string) => ({
              maybeSingle: () => Promise.resolve({
                data: userScenarios[val] ? { plan: userScenarios[val].plan } : null,
                error: userScenarios[val] ? null : { code: 'PGRST116' },
              }),
            }),
          }),
        };
      }
      if (table === 'social_media') {
        return {
          select: () => ({
            eq: (_col: string, val: string) => Promise.resolve({
              data: userScenarios[val]?.connections.map((c, i) => ({ id: `c${i}`, ...c })) || [],
              error: null,
            }),
          }),
        };
      }
      return { select: () => Promise.resolve({ data: [] }) };
    },
  },
}));

describe('Integration: planes + OAuth limit enforcement', () => {
  beforeEach(async () => {
    // Reset cache de plans en cada test
    const mod = await import('@/lib/plan-limits');
    mod.invalidatePlansCache();
    Object.keys(userScenarios).forEach((k) => delete userScenarios[k]);
  });

  it('user FREE recien creado puede conectar SU PRIMERA red', async () => {
    userScenarios['user-free-new'] = { plan: 'free', connections: [] };
    const { checkSocialAccountLimit } = await import('@/lib/plan-limits');
    const result = await checkSocialAccountLimit('user-free-new', 'youtube');
    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(1);
  });

  it('user FREE con 1 cuenta NO puede conectar segunda red (limite=1)', async () => {
    userScenarios['user-free-full'] = {
      plan: 'free',
      connections: [{ platform: 'youtube', connected: true }],
    };
    const { checkSocialAccountLimit } = await import('@/lib/plan-limits');
    const result = await checkSocialAccountLimit('user-free-full', 'facebook');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('limite de 1');
  });

  it('user BASIC con 3 redes NO puede conectar la 4ta (limite=3)', async () => {
    userScenarios['user-basic-full'] = {
      plan: 'basic',
      connections: [
        { platform: 'youtube', connected: true },
        { platform: 'facebook', connected: true },
        { platform: 'instagram', connected: true },
      ],
    };
    const { checkSocialAccountLimit } = await import('@/lib/plan-limits');
    const result = await checkSocialAccountLimit('user-basic-full', 'x');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('limite de 3');
  });

  it('user BASIC con 1 facebook NO puede conectar segunda facebook (no multi-cuenta)', async () => {
    userScenarios['user-basic-fb'] = {
      plan: 'basic',
      connections: [{ platform: 'facebook', connected: true }],
    };
    const { checkSocialAccountLimit } = await import('@/lib/plan-limits');
    const result = await checkSocialAccountLimit('user-basic-fb', 'facebook');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('una cuenta de facebook');
  });

  it('user PRO con 2 cuentas de facebook SI puede conectar la 3ra (3 por red)', async () => {
    userScenarios['user-pro-fb2'] = {
      plan: 'pro',
      connections: [
        { platform: 'facebook', connected: true },
        { platform: 'facebook', connected: true },
      ],
    };
    const { checkSocialAccountLimit } = await import('@/lib/plan-limits');
    const result = await checkSocialAccountLimit('user-pro-fb2', 'facebook');
    expect(result.allowed).toBe(true);
    expect(result.current).toBe(2);
  });

  it('user PRO con 3 cuentas de facebook NO puede conectar la 4ta (max 3 por red)', async () => {
    userScenarios['user-pro-fb3'] = {
      plan: 'pro',
      connections: [
        { platform: 'facebook', connected: true },
        { platform: 'facebook', connected: true },
        { platform: 'facebook', connected: true },
      ],
    };
    const { checkSocialAccountLimit } = await import('@/lib/plan-limits');
    const result = await checkSocialAccountLimit('user-pro-fb3', 'facebook');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('hasta 3 cuentas de facebook');
  });

  it('user PRO con 12 cuentas NO puede conectar mas (tope total=12)', async () => {
    userScenarios['user-pro-full'] = {
      plan: 'pro',
      connections: Array.from({ length: 12 }, (_, i) => ({
        platform: ['facebook', 'instagram', 'x', 'youtube'][i % 4],
        connected: true,
      })),
    };
    const { checkSocialAccountLimit } = await import('@/lib/plan-limits');
    const result = await checkSocialAccountLimit('user-pro-full', 'youtube');
    expect(result.allowed).toBe(false);
    expect(result.limit).toBe(12);
  });

  it('user ENTERPRISE con 1 facebook SI puede conectar segunda facebook (multi-cuenta)', async () => {
    userScenarios['user-ent-fb'] = {
      plan: 'enterprise',
      connections: [{ platform: 'facebook', connected: true }],
    };
    const { checkSocialAccountLimit } = await import('@/lib/plan-limits');
    const result = await checkSocialAccountLimit('user-ent-fb', 'facebook');
    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(20);
  });

  it('user ENTERPRISE con 20 cuentas NO puede conectar la 21va (tope total=20)', async () => {
    userScenarios['user-ent-full'] = {
      plan: 'enterprise',
      connections: Array.from({ length: 20 }, (_, i) => ({
        platform: ['facebook', 'instagram', 'x', 'youtube'][i % 4],
        connected: true,
      })),
    };
    const { checkSocialAccountLimit } = await import('@/lib/plan-limits');
    const result = await checkSocialAccountLimit('user-ent-full', 'instagram');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('limite de 20');
  });

  it('user ENTERPRISE con 5 cuentas (mix) puede seguir conectando', async () => {
    userScenarios['user-ent-mix'] = {
      plan: 'enterprise',
      connections: [
        { platform: 'facebook', connected: true },
        { platform: 'facebook', connected: true },
        { platform: 'instagram', connected: true },
        { platform: 'youtube', connected: true },
        { platform: 'x', connected: true },
      ],
    };
    const { checkSocialAccountLimit } = await import('@/lib/plan-limits');
    const result = await checkSocialAccountLimit('user-ent-mix', 'youtube');
    expect(result.allowed).toBe(true);
    expect(result.current).toBe(5);
  });

  it('user con plan inexistente recibe error explicito', async () => {
    userScenarios['user-phantom'] = { plan: 'phantom-plan', connections: [] };
    const { checkSocialAccountLimit } = await import('@/lib/plan-limits');
    const result = await checkSocialAccountLimit('user-phantom', 'youtube');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Plan');
  });

  it('user inexistente recibe error explicito', async () => {
    const { checkSocialAccountLimit } = await import('@/lib/plan-limits');
    const result = await checkSocialAccountLimit('user-no-existe', 'youtube');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('no encontrado');
  });

  it('cuentas DESCONECTADAS no cuentan para el limite', async () => {
    userScenarios['user-with-disconnected'] = {
      plan: 'free',
      connections: [
        { platform: 'youtube', connected: false }, // desconectada, no cuenta
        { platform: 'facebook', connected: false }, // desconectada, no cuenta
      ],
    };
    const { checkSocialAccountLimit } = await import('@/lib/plan-limits');
    const result = await checkSocialAccountLimit('user-with-disconnected', 'instagram');
    expect(result.allowed).toBe(true);
    expect(result.current).toBe(0);
  });
});
