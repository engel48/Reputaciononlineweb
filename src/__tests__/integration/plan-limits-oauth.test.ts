/**
 * Tests de integracion: reglas de plan + OAuth de redes sociales.
 *
 * Caso real de produccion: cada plan tiene limite distinto de cuentas
 * sociales y reglas distintas para multi-cuenta. Estos tests validan
 * que checkSocialAccountLimit aplica las reglas correctas en cada
 * combinacion (plan x cantidad x intentar misma red).
 *
 * Modelo vigente (seed de public.plans):
 *   - free:       1 cuenta total (1 por red)
 *   - basic:      1 por red  -> hasta 4 en total
 *   - pro:        1 por red  -> hasta 4 en total   (mono-cuenta, la mayoria de usuarios)
 *   - enterprise: 2 por red  -> hasta 8 en total   (UNICO con multi-cuenta por red)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Planes reales (mismo seed que public.plans en Supabase).
// max_accounts_per_platform = cuantas cuentas de la MISMA red permite el plan.
const PLANS = {
  free: { code: 'free', name: 'Plan Free', price_cop: 0, monthly_credits: 100, max_social_accounts: 1, multi_account_per_platform: false, max_accounts_per_platform: 1, features: {}, is_active: true },
  basic: { code: 'basic', name: 'Plan Basico', price_cop: 99000, monthly_credits: 500, max_social_accounts: 4, multi_account_per_platform: false, max_accounts_per_platform: 1, features: {}, is_active: true },
  pro: { code: 'pro', name: 'Plan Profesional', price_cop: 249000, monthly_credits: 5000, max_social_accounts: 4, multi_account_per_platform: false, max_accounts_per_platform: 1, features: {}, is_active: true },
  enterprise: { code: 'enterprise', name: 'Plan Enterprise', price_cop: 499000, monthly_credits: 50000, max_social_accounts: 8, multi_account_per_platform: true, max_accounts_per_platform: 2, features: {}, is_active: true },
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

// Helper: arma N conexiones repartidas en las 4 redes (round-robin).
function mix(n: number): Array<{ platform: string; connected: boolean }> {
  const nets = ['facebook', 'instagram', 'x', 'youtube'];
  return Array.from({ length: n }, (_, i) => ({ platform: nets[i % 4], connected: true }));
}

describe('Integration: planes + OAuth limit enforcement', () => {
  beforeEach(async () => {
    // Reset cache de plans en cada test
    const mod = await import('@/lib/plan-limits');
    mod.invalidatePlansCache();
    Object.keys(userScenarios).forEach((k) => delete userScenarios[k]);
  });

  // ─────────────────────────────── FREE (1 total) ───────────────────────────────
  it('FREE recien creado puede conectar SU PRIMERA red', async () => {
    userScenarios['u'] = { plan: 'free', connections: [] };
    const { checkSocialAccountLimit } = await import('@/lib/plan-limits');
    const result = await checkSocialAccountLimit('u', 'youtube');
    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(1);
  });

  it('FREE con 1 cuenta NO puede conectar una segunda (tope total = 1)', async () => {
    userScenarios['u'] = { plan: 'free', connections: [{ platform: 'youtube', connected: true }] };
    const { checkSocialAccountLimit } = await import('@/lib/plan-limits');
    const result = await checkSocialAccountLimit('u', 'facebook');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('limite de 1');
  });

  // ─────────────────────────────── BASIC (1/red, 4 total) ───────────────────────
  it('BASIC NO puede conectar una segunda cuenta de la misma red (1 por red)', async () => {
    userScenarios['u'] = { plan: 'basic', connections: [{ platform: 'facebook', connected: true }] };
    const { checkSocialAccountLimit } = await import('@/lib/plan-limits');
    const result = await checkSocialAccountLimit('u', 'facebook');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('una cuenta de facebook');
  });

  it('BASIC con 3 redes distintas puede conectar la 4ta (distinta red)', async () => {
    userScenarios['u'] = { plan: 'basic', connections: mix(3) }; // fb, ig, x
    const { checkSocialAccountLimit } = await import('@/lib/plan-limits');
    const result = await checkSocialAccountLimit('u', 'youtube');
    expect(result.allowed).toBe(true);
    expect(result.current).toBe(3);
  });

  it('BASIC con 4 cuentas NO puede conectar mas (tope total = 4)', async () => {
    userScenarios['u'] = { plan: 'basic', connections: mix(4) }; // 1 por cada red
    const { checkSocialAccountLimit } = await import('@/lib/plan-limits');
    const result = await checkSocialAccountLimit('u', 'facebook');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('limite de 4');
  });

  // ─────────────────────────────── PRO (1/red, 4 total — mono) ──────────────────
  it('PRO NO puede conectar una segunda cuenta de la misma red (mono-cuenta)', async () => {
    userScenarios['u'] = { plan: 'pro', connections: [{ platform: 'facebook', connected: true }] };
    const { checkSocialAccountLimit } = await import('@/lib/plan-limits');
    const result = await checkSocialAccountLimit('u', 'facebook');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('una cuenta de facebook');
  });

  it('PRO con 4 cuentas NO puede conectar mas (tope total = 4)', async () => {
    userScenarios['u'] = { plan: 'pro', connections: mix(4) };
    const { checkSocialAccountLimit } = await import('@/lib/plan-limits');
    const result = await checkSocialAccountLimit('u', 'instagram');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('limite de 4');
  });

  // ─────────────────────────── ENTERPRISE (2/red, 8 total — multi) ──────────────
  it('ENTERPRISE con 1 facebook SI puede conectar una segunda facebook (multi-cuenta)', async () => {
    userScenarios['u'] = { plan: 'enterprise', connections: [{ platform: 'facebook', connected: true }] };
    const { checkSocialAccountLimit } = await import('@/lib/plan-limits');
    const result = await checkSocialAccountLimit('u', 'facebook');
    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(8);
  });

  it('ENTERPRISE con 2 facebook NO puede conectar la 3ra de esa red (max 2 por red)', async () => {
    userScenarios['u'] = {
      plan: 'enterprise',
      connections: [
        { platform: 'facebook', connected: true },
        { platform: 'facebook', connected: true },
      ],
    };
    const { checkSocialAccountLimit } = await import('@/lib/plan-limits');
    const result = await checkSocialAccountLimit('u', 'facebook');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('hasta 2 cuentas de facebook');
  });

  it('ENTERPRISE con 8 cuentas (2 por red) NO puede conectar mas (tope total = 8)', async () => {
    userScenarios['u'] = { plan: 'enterprise', connections: mix(8) }; // 2 por cada red
    const { checkSocialAccountLimit } = await import('@/lib/plan-limits');
    const result = await checkSocialAccountLimit('u', 'instagram');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('limite de 8');
  });

  it('ENTERPRISE con 5 cuentas (mix) puede seguir conectando una red no saturada', async () => {
    userScenarios['u'] = {
      plan: 'enterprise',
      connections: [
        { platform: 'facebook', connected: true },
        { platform: 'facebook', connected: true },
        { platform: 'instagram', connected: true },
        { platform: 'x', connected: true },
        { platform: 'youtube', connected: true },
      ],
    };
    const { checkSocialAccountLimit } = await import('@/lib/plan-limits');
    const result = await checkSocialAccountLimit('u', 'youtube'); // youtube tiene 1 (<2)
    expect(result.allowed).toBe(true);
    expect(result.current).toBe(5);
  });

  // ─────────────────────────────── Casos borde ──────────────────────────────────
  it('plan inexistente recibe error explicito', async () => {
    userScenarios['u'] = { plan: 'phantom-plan', connections: [] };
    const { checkSocialAccountLimit } = await import('@/lib/plan-limits');
    const result = await checkSocialAccountLimit('u', 'youtube');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Plan');
  });

  it('usuario inexistente recibe error explicito', async () => {
    const { checkSocialAccountLimit } = await import('@/lib/plan-limits');
    const result = await checkSocialAccountLimit('user-no-existe', 'youtube');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('no encontrado');
  });

  it('cuentas DESCONECTADAS no cuentan para el limite', async () => {
    userScenarios['u'] = {
      plan: 'free',
      connections: [
        { platform: 'youtube', connected: false },
        { platform: 'facebook', connected: false },
      ],
    };
    const { checkSocialAccountLimit } = await import('@/lib/plan-limits');
    const result = await checkSocialAccountLimit('u', 'instagram');
    expect(result.allowed).toBe(true);
    expect(result.current).toBe(0);
  });
});
