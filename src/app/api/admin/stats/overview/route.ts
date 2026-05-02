import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helper';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * GET /api/admin/stats/overview
 *
 * Stats agregados de toda la plataforma para el dashboard del admin.
 * TODO viene de queries reales contra Supabase, sin datos inventados.
 */
export async function GET(request: NextRequest) {
  const admin = await requireRole(request, 'admin');
  if (admin instanceof NextResponse) return admin;

  const now = Date.now();
  const since30d = new Date(now - 30 * 86_400_000).toISOString();
  const since7d = new Date(now - 7 * 86_400_000).toISOString();
  const since90d = new Date(now - 90 * 86_400_000).toISOString();
  const since24h = new Date(now - 86_400_000).toISOString();

  // ============================== Usuarios ==============================
  const { count: usersTotal } = await supabaseAdmin
    .from('users')
    .select('id', { count: 'exact', head: true });

  const { count: usersActive30d } = await supabaseAdmin
    .from('users')
    .select('id', { count: 'exact', head: true })
    .gte('last_login', since30d);

  const { data: usersByPlanRaw } = await supabaseAdmin
    .from('users')
    .select('plan, profile_type, credits');

  const usersByPlan: Record<string, number> = {};
  const usersByProfile: Record<string, number> = {};
  let creditsInCirculation = 0;
  for (const u of (usersByPlanRaw || []) as any[]) {
    usersByPlan[u.plan] = (usersByPlan[u.plan] || 0) + 1;
    const profile = u.profile_type || 'sin_definir';
    usersByProfile[profile] = (usersByProfile[profile] || 0) + 1;
    creditsInCirculation += u.credits || 0;
  }

  // ============================== Creditos ==============================
  const { data: tx30d } = await supabaseAdmin
    .from('credit_transactions')
    .select('amount, type, user_id')
    .gte('created_at', since30d);

  let creditsConsumed30d = 0;
  let creditsBonus30d = 0;
  let creditsPurchased30d = 0;
  const consumedByUser: Record<string, number> = {};
  for (const t of (tx30d || []) as any[]) {
    const amt = Math.abs(t.amount || 0);
    if (t.type === 'usage') {
      creditsConsumed30d += amt;
      consumedByUser[t.user_id] = (consumedByUser[t.user_id] || 0) + amt;
    } else if (t.type === 'bonus') {
      creditsBonus30d += amt;
    } else if (t.type === 'purchase') {
      creditsPurchased30d += amt;
    }
  }

  const topConsumers = Object.entries(consumedByUser)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  let topConsumersWithName: Array<{ userId: string; consumed: number; user: any }> = [];
  if (topConsumers.length > 0) {
    const ids = topConsumers.map(([id]) => id);
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, name, email, plan')
      .in('id', ids);
    const byId = new Map<string, any>();
    for (const u of (users || []) as any[]) byId.set(u.id, u);
    topConsumersWithName = topConsumers.map(([userId, consumed]) => ({
      userId,
      consumed,
      user: byId.get(userId) || null,
    }));
  }

  // ============================== Pagos ==============================
  const { data: paymentsAll } = await supabaseAdmin
    .from('payments')
    .select('amount, status, created_at');

  let revenueTotal = 0;
  let revenue30d = 0;
  const paymentsByStatus: Record<string, { count: number; amount: number }> = {};
  for (const p of (paymentsAll || []) as any[]) {
    const status = p.status || 'unknown';
    if (!paymentsByStatus[status]) paymentsByStatus[status] = { count: 0, amount: 0 };
    paymentsByStatus[status].count++;
    const amt = Number(p.amount || 0);
    paymentsByStatus[status].amount += amt;
    if (status === 'approved' || status === 'completed') {
      revenueTotal += amt;
      if (p.created_at >= since30d) revenue30d += amt;
    }
  }

  // ============================== Plataforma ==============================
  const { count: socialsConnected } = await supabaseAdmin
    .from('social_media')
    .select('id', { count: 'exact', head: true })
    .eq('connected', true);

  const { count: mentions7d } = await supabaseAdmin
    .from('mentions')
    .select('id', { count: 'exact', head: true })
    .gte('scraped_at', since7d);

  const { count: mentions30d } = await supabaseAdmin
    .from('mentions')
    .select('id', { count: 'exact', head: true })
    .gte('scraped_at', since30d);

  const { count: mentions90d } = await supabaseAdmin
    .from('mentions')
    .select('id', { count: 'exact', head: true })
    .gte('scraped_at', since90d);

  const { count: scrapedNews30d } = await supabaseAdmin
    .from('scraped_news')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', since30d);

  // ============================== Sentimiento global (30d) ==============================
  const { data: mentionsForSentiment } = await supabaseAdmin
    .from('mentions')
    .select('metadata')
    .gte('scraped_at', since30d)
    .limit(5000);

  let sPos = 0, sNeg = 0, sNeu = 0;
  let scoreSum = 0, scoreCount = 0;
  for (const m of (mentionsForSentiment || []) as any[]) {
    const sent = String(m.metadata?.sentiment || '').toLowerCase();
    if (sent === 'positive') sPos++;
    else if (sent === 'negative') sNeg++;
    else if (sent === 'neutral') sNeu++;
    const score = m.metadata?.sentiment_score;
    if (typeof score === 'number') {
      scoreSum += score;
      scoreCount++;
    }
  }
  const sTotal = sPos + sNeg + sNeu;
  const globalSentiment = {
    positive: sTotal > 0 ? Math.round((sPos / sTotal) * 100) : 0,
    neutral: sTotal > 0 ? Math.round((sNeu / sTotal) * 100) : 0,
    negative: sTotal > 0 ? Math.round((sNeg / sTotal) * 100) : 0,
    averageScore: scoreCount > 0 ? Math.round(scoreSum / scoreCount) : null,
    totalAnalyzed: sTotal,
  };

  // ============================== Salud del sistema ==============================
  const { data: lastTokenRefreshLog } = await supabaseAdmin
    .from('system_logs')
    .select('details, created_at')
    .eq('event_type', 'cron_token_refresh')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: lastSocialSyncLog } = await supabaseAdmin
    .from('system_logs')
    .select('details, created_at')
    .eq('event_type', 'social_sync_cron')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { count: errorsLast24h } = await supabaseAdmin
    .from('system_logs')
    .select('id', { count: 'exact', head: true })
    .ilike('event_type', '%error%')
    .gte('created_at', since24h);

  const { count: activeCrisisAlerts } = await supabaseAdmin
    .from('crisis_alerts')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active');

  return NextResponse.json({
    success: true,
    generatedAt: new Date().toISOString(),
    users: {
      total: usersTotal || 0,
      activeLast30d: usersActive30d || 0,
      byPlan: usersByPlan,
      byProfileType: usersByProfile,
    },
    credits: {
      inCirculation: creditsInCirculation,
      consumedLast30d: creditsConsumed30d,
      bonusLast30d: creditsBonus30d,
      purchasedLast30d: creditsPurchased30d,
      topConsumers: topConsumersWithName,
    },
    payments: {
      revenueTotal,
      revenueLast30d: revenue30d,
      byStatus: paymentsByStatus,
    },
    platform: {
      socialAccountsConnected: socialsConnected || 0,
      mentionsLast7d: mentions7d || 0,
      mentionsLast30d: mentions30d || 0,
      mentionsLast90d: mentions90d || 0,
      scrapedNewsLast30d: scrapedNews30d || 0,
    },
    sentiment: globalSentiment,
    health: {
      lastTokenRefresh: lastTokenRefreshLog
        ? { at: lastTokenRefreshLog.created_at, status: lastTokenRefreshLog.details?.status, summary: lastTokenRefreshLog.details }
        : null,
      lastSocialSync: lastSocialSyncLog
        ? { at: lastSocialSyncLog.created_at, summary: lastSocialSyncLog.details }
        : null,
      errorsLast24h: errorsLast24h || 0,
      activeCrisisAlerts: activeCrisisAlerts || 0,
    },
  });
}
