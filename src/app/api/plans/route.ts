import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-server';

/**
 * Endpoint publico (sin auth) para mostrar planes en /planes y otras
 * paginas publicas de pricing. Solo devuelve planes activos, ordenados.
 */
export async function GET() {
  const { data, error } = await supabase
    .from('plans')
    .select('code, name, description, price_cop, monthly_credits, max_social_accounts, multi_account_per_platform, max_accounts_per_platform, features, is_popular, display_order')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('[GET /api/plans] error:', error);
    return NextResponse.json({ plans: [] }, { status: 500 });
  }

  const plans = (data || []).map((row: any) => ({
    code: row.code,
    name: row.name,
    description: row.description ?? '',
    priceCop: row.price_cop ?? 0,
    monthlyCredits: row.monthly_credits ?? 0,
    maxSocialAccounts: row.max_social_accounts ?? 0,
    multiAccountPerPlatform: !!row.multi_account_per_platform,
    maxAccountsPerPlatform:
      row.max_accounts_per_platform != null
        ? row.max_accounts_per_platform
        : row.multi_account_per_platform
        ? (row.max_social_accounts ?? 1)
        : 1,
    features: (row.features ?? {}) as Record<string, boolean>,
    isPopular: !!row.is_popular,
    displayOrder: row.display_order ?? 0,
  }));

  return NextResponse.json(
    { plans },
    {
      headers: {
        // Cache CDN 60s, revalidacion 5 min
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    }
  );
}
