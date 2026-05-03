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

// Planes reales (mismo seed que public.plans en Supabase)
const PLANS = {
  free: { code: 'free', name: 'Plan Free', price_cop: 0, monthly_credits: 100, max_social_accounts: 1, multi_account_per_platform: false, features: {}, is_active: true },
  basic: { code: 'basic', name: 'Plan Basico', price_cop: 99000, monthly_credits: 500, max_social_accounts: 3, multi_account_per_platform: false, features: {}, is_active: true },
  pro: { code: 'pro', name: 'Plan Profesional', price_cop: 249000, monthly_credits: 5000, max_social_accounts: 4, multi_account_per_platform: false, features: {}, is_active: true },
  enterprise: { code: 'enterprise', name: 'Plan Enterprise', price_cop: 499000, monthly_credits: 50000, max_social_accounts: 8, multi_account_per_platform: true, features: {}, is_active: true },
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

  it('user PRO con 4 redes NO puede conectar la 5ta', async () => {
    userScenarios['user-pro-full'] = {
      plan: 'pro',
      connections: [
        { platform: 'youtube', connected: true },
        { platform: 'facebook', connected: true },
        { platform: 'instagram', connected: true },
        { platform: 'x', connected: true },
      ],
    };
    const { checkSocialAccountLimit } = await import('@/lib/plan-limits');
    const result = await checkSocialAccountLimit('user-pro-full', 'youtube');
    expect(result.allowed).toBe(false);
    expect(result.limit).toBe(4);
  });

  it('user ENTERPRISE con 1 facebook SI puede conectar segunda facebook (multi-cuenta)', async () => {
    userScenarios['user-ent-fb'] = {
      plan: 'enterprise',
      connections: [{ platform: 'facebook', connected: true }],
    };
    const { checkSocialAccountLimit } = await import('@/lib/plan-limits');
    const result = await checkSocialAccountLimit('user-ent-fb', 'facebook');
    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(8);
  });

  it('user ENTERPRISE con 8 cuentas NO puede conectar la 9na (max=8)', async () => {
    userScenarios['user-ent-full'] = {
      plan: 'enterprise',
      connections: Array.from({ length: 8 }, (_, i) => ({
        platform: i < 4 ? 'facebook' : 'youtube',
        connected: true,
      })),
    };
    const { checkSocialAccountLimit } = await import('@/lib/plan-limits');
    const result = await checkSocialAccountLimit('user-ent-full', 'instagram');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('limite de 8');
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
