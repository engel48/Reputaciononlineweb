import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helper';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface RouteCtx {
  params: { id: string };
}

/**
 * Detalle completo de un usuario para vista admin de soporte:
 *  - Perfil basico (sin password)
 *  - Redes sociales conectadas (sin tokens)
 *  - Resumen de creditos y ultimas transacciones
 *  - Resumen de menciones agregadas
 *  - Conversaciones con Julia
 *  - Pagos
 */
export async function GET(request: NextRequest, { params }: RouteCtx) {
  const admin = await requireRole(request, 'admin');
  if (admin instanceof NextResponse) return admin;

  const userId = params.id;
  if (!userId) {
    return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 });
  }

  // 1. Perfil del usuario
  const { data: user, error: userErr } = await supabaseAdmin
    .from('users')
    .select(
      'id, email, name, role, plan, credits, company, phone, profile_type, category, brand_name, partido_politico, cargo_actual, propuestas_principales, is_active, created_at, last_login, updated_at, onboarding_completed'
    )
    .eq('id', userId)
    .maybeSingle();

  if (userErr || !user) {
    return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });
  }

  // 2. Redes conectadas (omite tokens)
  const { data: socials } = await supabaseAdmin
    .from('social_media')
    .select('id, platform, username, display_name, profile_url, profile_image, followers, following, posts, engagement, connected, last_sync, token_expiry, created_at')
    .eq('user_id', userId)
    .order('platform', { ascending: true });

  const socialAccounts = (socials || []).map((s: any) => ({
    id: s.id,
    platform: s.platform,
    username: s.username,
    displayName: s.display_name,
    profileUrl: s.profile_url,
    profileImage: s.profile_image,
    followers: s.followers || 0,
    following: s.following || 0,
    posts: s.posts || 0,
    engagement: s.engagement || 0,
    connected: !!s.connected,
    lastSync: s.last_sync,
    tokenExpiresAt: s.token_expiry,
    tokenStatus:
      !s.token_expiry ? 'unknown' :
      new Date(s.token_expiry) < new Date() ? 'expired' :
      'valid',
    createdAt: s.created_at,
  }));

  // 3. Transacciones de creditos (ultimas 20)
  const { data: txs } = await supabaseAdmin
    .from('credit_transactions')
    .select('id, type, amount, balance_after, description, related_entity, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  const { count: txCount } = await supabaseAdmin
    .from('credit_transactions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  // 4. Menciones (resumen)
  const { count: mentionsTotal } = await supabaseAdmin
    .from('mentions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  const { data: lastMentions } = await supabaseAdmin
    .from('mentions')
    .select('id, platform, content, url, published_at, scraped_at, likes, shares, comments, metadata')
    .eq('user_id', userId)
    .order('scraped_at', { ascending: false })
    .limit(5);

  // 5. Conversaciones con Julia
  const { count: conversationsCount } = await supabaseAdmin
    .from('amelia_conversations')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  const { data: lastConversation } = await supabaseAdmin
    .from('amelia_conversations')
    .select('id, title, created_at, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // 6. Pagos
  const { data: payments } = await supabaseAdmin
    .from('payments')
    .select('id, amount, currency, status, payment_method, transaction_id, created_at, metadata')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  const { count: paymentsCount } = await supabaseAdmin
    .from('payments')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      plan: user.plan,
      credits: user.credits,
      company: user.company,
      phone: user.phone,
      profileType: user.profile_type,
      category: user.category,
      brandName: user.brand_name,
      political: {
        partido: user.partido_politico,
        cargo: user.cargo_actual,
        propuestas: user.propuestas_principales,
      },
      isActive: user.is_active,
      onboardingCompleted: user.onboarding_completed,
      createdAt: user.created_at,
      lastLogin: user.last_login,
      updatedAt: user.updated_at,
    },
    socialAccounts,
    credits: {
      currentBalance: user.credits,
      transactionsCount: txCount || 0,
      recentTransactions: (txs || []).map((t: any) => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        balanceAfter: t.balance_after,
        description: t.description,
        relatedEntity: t.related_entity,
        createdAt: t.created_at,
      })),
    },
    mentions: {
      total: mentionsTotal || 0,
      recent: (lastMentions || []).map((m: any) => ({
        id: m.id,
        platform: m.platform,
        content: String(m.content || '').slice(0, 280),
        url: m.url,
        publishedAt: m.published_at,
        scrapedAt: m.scraped_at,
        likes: m.likes || 0,
        shares: m.shares || 0,
        comments: m.comments || 0,
        sentiment: m.metadata?.sentiment || null,
      })),
    },
    julia: {
      conversationsCount: conversationsCount || 0,
      lastConversation: lastConversation
        ? {
            id: lastConversation.id,
            title: lastConversation.title,
            createdAt: lastConversation.created_at,
            updatedAt: lastConversation.updated_at,
          }
        : null,
    },
    payments: {
      total: paymentsCount || 0,
      recent: (payments || []).map((p: any) => ({
        id: p.id,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        paymentMethod: p.payment_method,
        transactionId: p.transaction_id,
        createdAt: p.created_at,
      })),
    },
  });
}
