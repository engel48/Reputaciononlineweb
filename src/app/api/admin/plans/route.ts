import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helper';
import { createClient } from '@supabase/supabase-js';
import { invalidatePlansCache } from '@/lib/plan-limits';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface PlanRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  price_cop: number;
  monthly_credits: number;
  max_social_accounts: number;
  multi_account_per_platform: boolean;
  features: Record<string, boolean>;
  is_active: boolean;
  is_popular: boolean;
  billing_cycle: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

function toApi(row: PlanRow) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description ?? '',
    priceCop: row.price_cop,
    monthlyCredits: row.monthly_credits,
    maxSocialAccounts: row.max_social_accounts,
    multiAccountPerPlatform: row.multi_account_per_platform,
    features: row.features ?? {},
    isActive: row.is_active,
    isPopular: row.is_popular,
    billingCycle: row.billing_cycle,
    displayOrder: row.display_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET(request: NextRequest) {
  const admin = await requireRole(request, 'admin');
  if (admin instanceof NextResponse) return admin;

  const { data, error } = await supabaseAdmin
    .from('plans')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('ADMIN PLANS GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Error consultando planes' },
      { status: 500 }
    );
  }

  // Conteos por plan: cuantos usuarios tienen cada plan + ingresos estimados mensuales
  const { data: usersCount } = await supabaseAdmin
    .from('users')
    .select('plan');

  const counts: Record<string, number> = {};
  for (const u of (usersCount || []) as Array<{ plan: string }>) {
    counts[u.plan] = (counts[u.plan] || 0) + 1;
  }

  const plans = (data || []).map((row) => {
    const api = toApi(row as PlanRow);
    const userCount = counts[api.code] || 0;
    return {
      ...api,
      stats: {
        userCount,
        monthlyRevenue: userCount * api.priceCop,
      },
    };
  });

  return NextResponse.json({ success: true, plans });
}

export async function POST(request: NextRequest) {
  const admin = await requireRole(request, 'admin');
  if (admin instanceof NextResponse) return admin;

  const body = await request.json().catch(() => ({}));
  const {
    code,
    name,
    description,
    priceCop,
    monthlyCredits,
    maxSocialAccounts,
    multiAccountPerPlatform,
    features,
    isActive,
    isPopular,
    billingCycle,
    displayOrder,
  } = body;

  if (!code || !name || typeof priceCop !== 'number' || typeof monthlyCredits !== 'number') {
    return NextResponse.json(
      { success: false, error: 'Campos requeridos: code, name, priceCop, monthlyCredits' },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from('plans')
    .insert({
      code: String(code).toLowerCase().trim(),
      name: String(name).trim(),
      description: description ?? null,
      price_cop: Math.max(0, Math.floor(priceCop)),
      monthly_credits: Math.max(0, Math.floor(monthlyCredits)),
      max_social_accounts: Math.max(0, Math.floor(maxSocialAccounts ?? 1)),
      multi_account_per_platform: !!multiAccountPerPlatform,
      features: features ?? {},
      is_active: isActive !== false,
      is_popular: !!isPopular,
      billing_cycle: billingCycle || 'monthly',
      display_order: Math.floor(displayOrder ?? 0),
    })
    .select('*')
    .single();

  if (error) {
    console.error('ADMIN PLANS POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }

  invalidatePlansCache();
  return NextResponse.json({ success: true, plan: toApi(data as PlanRow) }, { status: 201 });
}
