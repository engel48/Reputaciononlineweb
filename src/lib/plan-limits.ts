/**
 * Helpers server-side para validar limites por plan del usuario.
 * Lee la definicion de cada plan desde la tabla `public.plans` en Supabase
 * (fuente unica de verdad). El admin puede modificar precios, creditos y
 * limites desde /admin/planes y los cambios toman efecto inmediato.
 *
 * Hay un cache en memoria de 60 segundos para evitar consultar la DB en
 * cada llamada (los planes cambian raramente).
 */

import { supabase } from '@/lib/supabase-server';

export interface PlanDefinition {
  code: string;
  name: string;
  priceCop: number;
  monthlyCredits: number;
  maxSocialAccounts: number;
  multiAccountPerPlatform: boolean;
  features: Record<string, boolean>;
  isActive: boolean;
}

interface PlansCache {
  byCode: Map<string, PlanDefinition>;
  expiresAt: number;
}

const CACHE_TTL_MS = 60 * 1000;
let cache: PlansCache | null = null;

/**
 * Lee todos los planes desde DB (con cache de 60s).
 */
export async function getAllPlans(): Promise<PlanDefinition[]> {
  if (cache && cache.expiresAt > Date.now()) {
    return Array.from(cache.byCode.values());
  }

  const { data, error } = await supabase
    .from('plans')
    .select('code, name, price_cop, monthly_credits, max_social_accounts, multi_account_per_platform, features, is_active');

  if (error) {
    console.error('[plan-limits] Error consultando plans:', error);
    return [];
  }

  const byCode = new Map<string, PlanDefinition>();
  for (const row of (data || []) as any[]) {
    byCode.set(row.code, {
      code: row.code,
      name: row.name,
      priceCop: row.price_cop ?? 0,
      monthlyCredits: row.monthly_credits ?? 0,
      maxSocialAccounts: row.max_social_accounts ?? 1,
      multiAccountPerPlatform: !!row.multi_account_per_platform,
      features: (row.features ?? {}) as Record<string, boolean>,
      isActive: !!row.is_active,
    });
  }

  cache = { byCode, expiresAt: Date.now() + CACHE_TTL_MS };
  return Array.from(byCode.values());
}

/**
 * Lee un plan especifico por su code.
 */
export async function getPlanByCode(code: string): Promise<PlanDefinition | null> {
  await getAllPlans(); // hidrata cache si hace falta
  return cache?.byCode.get(code) || null;
}

/** Invalida el cache. Usar despues de cambios admin. */
export function invalidatePlansCache(): void {
  cache = null;
}

/** Maximo de cuentas sociales totales para el plan dado. */
export async function getSocialAccountLimit(planCode: string): Promise<number> {
  const plan = await getPlanByCode(planCode);
  if (plan) return plan.maxSocialAccounts;
  // Fallback a free si el plan no existe en DB
  const free = await getPlanByCode('free');
  return free?.maxSocialAccounts ?? 1;
}

/** Creditos mensuales del plan (renovacion). */
export async function getMonthlyCreditLimit(planCode: string): Promise<number> {
  const plan = await getPlanByCode(planCode);
  if (plan) return plan.monthlyCredits;
  const free = await getPlanByCode('free');
  return free?.monthlyCredits ?? 100;
}

/** Si el plan permite multiples cuentas de la misma red social. */
export async function allowsMultiAccountPerPlatform(planCode: string): Promise<boolean> {
  const plan = await getPlanByCode(planCode);
  return plan?.multiAccountPerPlatform ?? false;
}

export interface SocialAccountCheckResult {
  allowed: boolean;
  current: number;
  limit: number;
  plan: string;
  reason?: string;
}

/**
 * Verifica si el usuario puede conectar una nueva cuenta de red social.
 * Considera:
 *  - Maximo total de cuentas segun plan (de DB)
 *  - Si el plan permite multiples cuentas por plataforma (de DB)
 */
export async function checkSocialAccountLimit(
  userId: string,
  platform: string
): Promise<SocialAccountCheckResult> {
  const { data: user, error: userErr } = await supabase
    .from('users')
    .select('plan')
    .eq('id', userId)
    .maybeSingle();

  if (userErr || !user) {
    return {
      allowed: false,
      current: 0,
      limit: 0,
      plan: 'free',
      reason: 'Usuario no encontrado',
    };
  }

  const planCode = (user as any).plan as string;
  const plan = await getPlanByCode(planCode);

  if (!plan) {
    return {
      allowed: false,
      current: 0,
      limit: 0,
      plan: planCode,
      reason: `Plan "${planCode}" no encontrado en la tabla plans`,
    };
  }

  const limit = plan.maxSocialAccounts;

  const { data: connections } = await supabase
    .from('social_media')
    .select('id, platform, connected')
    .eq('user_id', userId);

  const all = connections || [];
  const connectedTotal = all.filter((c: any) => c.connected === true).length;
  const connectedSamePlatform = all.filter(
    (c: any) => c.connected === true && c.platform === platform
  ).length;

  // Regla 1: no exceder maximo total
  if (connectedTotal >= limit) {
    return {
      allowed: false,
      current: connectedTotal,
      limit,
      plan: planCode,
      reason: `Alcanzaste el limite de ${limit} cuenta${limit !== 1 ? 's' : ''} en el plan ${plan.name}. Actualiza tu plan para conectar mas.`,
    };
  }

  // Regla 2: si el plan NO permite multiples por plataforma y ya hay una en esa plataforma
  if (connectedSamePlatform >= 1 && !plan.multiAccountPerPlatform) {
    return {
      allowed: false,
      current: connectedTotal,
      limit,
      plan: planCode,
      reason: `Tu plan ${plan.name} solo permite una cuenta de ${platform}. Actualiza a Enterprise para conectar multiples.`,
    };
  }

  return {
    allowed: true,
    current: connectedTotal,
    limit,
    plan: planCode,
  };
}
