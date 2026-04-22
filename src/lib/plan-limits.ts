/**
 * Helpers server-side para validar límites por plan del usuario.
 * Se usa en OAuth callbacks para impedir que un usuario conecte más redes
 * de las permitidas por su plan.
 *
 * Debe coincidir con `PLAN_FEATURES` en src/context/PlanContext.tsx
 */

type PlanName = 'free' | 'basic' | 'pro' | 'enterprise' | string;

/** Máximo de cuentas sociales totales por plan */
export const MAX_SOCIAL_ACCOUNTS: Record<string, number> = {
  free: 1,
  basic: 3,
  pro: 4,
  enterprise: 8,
};

/** Créditos mensuales por plan (usado en renovación y en UI) */
export const MAX_MONTHLY_CREDITS: Record<string, number> = {
  free: 100,
  basic: 500,
  pro: 5000,
  enterprise: 50000,
};

export function getSocialAccountLimit(plan: PlanName): number {
  return MAX_SOCIAL_ACCOUNTS[plan as string] ?? MAX_SOCIAL_ACCOUNTS.free;
}

export function getMonthlyCreditLimit(plan: PlanName): number {
  return MAX_MONTHLY_CREDITS[plan as string] ?? MAX_MONTHLY_CREDITS.free;
}

/** Enterprise es el único plan que puede tener múltiples cuentas por red */
export function allowsMultiAccountPerPlatform(plan: PlanName): boolean {
  return plan === 'enterprise';
}

export interface SocialAccountCheckResult {
  allowed: boolean;
  current: number;
  limit: number;
  plan: PlanName;
  reason?: string;
}

/**
 * Verifica si el usuario puede conectar una nueva cuenta de red social.
 * Considera:
 *  - Máximo total de cuentas según plan
 *  - Si el plan permite múltiples cuentas por plataforma (solo enterprise)
 */
export async function checkSocialAccountLimit(
  userId: string,
  platform: string
): Promise<SocialAccountCheckResult> {
  const { supabase } = await import('@/lib/supabase-server');

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

  const plan = (user as any).plan as PlanName;
  const limit = getSocialAccountLimit(plan);

  const { data: connections } = await supabase
    .from('social_media')
    .select('id, platform, connected')
    .eq('user_id', userId);

  const all = connections || [];
  const connectedTotal = all.filter((c: any) => c.connected === true).length;
  const connectedSamePlatform = all.filter(
    (c: any) => c.connected === true && c.platform === platform
  ).length;

  // Regla 1: no exceder máximo total
  if (connectedTotal >= limit) {
    return {
      allowed: false,
      current: connectedTotal,
      limit,
      plan,
      reason: `Alcanzaste el límite de ${limit} cuenta${limit !== 1 ? 's' : ''} en el plan ${plan}. Actualiza tu plan para conectar más.`,
    };
  }

  // Regla 2: si el plan NO permite múltiples por plataforma y ya hay una en esa plataforma
  if (connectedSamePlatform >= 1 && !allowsMultiAccountPerPlatform(plan)) {
    return {
      allowed: false,
      current: connectedTotal,
      limit,
      plan,
      reason: `Tu plan ${plan} solo permite una cuenta de ${platform}. Actualiza a enterprise para conectar múltiples.`,
    };
  }

  return {
    allowed: true,
    current: connectedTotal,
    limit,
    plan,
  };
}
