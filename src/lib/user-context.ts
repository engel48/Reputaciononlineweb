/**
 * User Context Builder — recupera datos reales del usuario desde Supabase
 * para inyectar en prompts de IA. Permite que Julia/Amelia hablen al usuario
 * por su nombre y tengan contexto de su marca, plan, menciones y redes.
 */

export interface UserContext {
  userId: string;
  name: string;
  firstName: string;
  email: string;
  plan: string;
  credits: number;
  role: string;
  company?: string;
  profileType?: string;
  category?: string;
  brandName?: string;
  political?: {
    partido?: string;
    cargo?: string;
    propuestas?: string;
  };
  connectedNetworks: Array<{
    platform: string;
    username: string;
    followers: number;
    lastSync: string | null;
  }>;
  monitoredKeywords: string[];
  recentMentions: {
    total: number;
    positive: number;
    negative: number;
    neutral: number;
    topNegative: Array<{ source: string; content: string; published_at: string }>;
    topPositive: Array<{ source: string; content: string; published_at: string }>;
  };
}

function toFirstName(full: string | null | undefined, email: string): string {
  if (full && full.trim()) {
    return full.trim().split(/\s+/)[0];
  }
  // fallback: parte local del email, capitalizada
  const local = (email || '').split('@')[0] || 'Usuario';
  return local.charAt(0).toUpperCase() + local.slice(1);
}

/**
 * Construye el contexto completo del usuario desde Supabase.
 * Falla silenciosamente y retorna un contexto mínimo si hay error en cada query.
 */
export async function buildUserContext(userId: string): Promise<UserContext | null> {
  try {
    const { supabase } = await import('@/lib/supabase-server');

    const { data: user, error: userErr } = await supabase
      .from('users')
      .select(
        'id, email, name, role, plan, credits, company, profile_type, category, brand_name, partido_politico, cargo_actual, propuestas_principales'
      )
      .eq('id', userId)
      .maybeSingle();

    if (userErr || !user) return null;

    const [networksRes, keywordsRes, mentionsRes] = await Promise.all([
      supabase
        .from('social_media')
        .select('platform, username, followers, last_sync, connected')
        .eq('user_id', userId)
        .eq('connected', true),
      supabase
        .from('monitored_keywords')
        .select('keyword')
        .eq('user_id', userId)
        .eq('is_active', true),
      supabase
        .from('mentions')
        .select('platform, content, published_at, metadata')
        .eq('user_id', userId)
        .gte('scraped_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('published_at', { ascending: false })
        .limit(50),
    ]);

    const mentions = mentionsRes.data || [];
    let pos = 0;
    let neg = 0;
    let neu = 0;
    const topNegative: UserContext['recentMentions']['topNegative'] = [];
    const topPositive: UserContext['recentMentions']['topPositive'] = [];

    for (const m of mentions as any[]) {
      const s = (m.metadata?.sentiment || '').toLowerCase();
      if (s === 'positive') {
        pos++;
        if (topPositive.length < 3) {
          topPositive.push({
            source: m.platform,
            content: String(m.content || '').slice(0, 200),
            published_at: m.published_at,
          });
        }
      } else if (s === 'negative') {
        neg++;
        if (topNegative.length < 3) {
          topNegative.push({
            source: m.platform,
            content: String(m.content || '').slice(0, 200),
            published_at: m.published_at,
          });
        }
      } else {
        neu++;
      }
    }

    const u = user as any;
    const name = u.name || '';
    return {
      userId: u.id,
      name: name || u.email || 'Usuario',
      firstName: toFirstName(name, u.email),
      email: u.email,
      plan: u.plan || 'basic',
      credits: u.credits ?? 0,
      role: u.role || 'user',
      company: u.company || undefined,
      profileType: u.profile_type || undefined,
      category: u.category || undefined,
      brandName: u.brand_name || undefined,
      political: {
        partido: u.partido_politico || undefined,
        cargo: u.cargo_actual || undefined,
        propuestas: u.propuestas_principales || undefined,
      },
      connectedNetworks: (networksRes.data || []).map((n: any) => ({
        platform: n.platform,
        username: n.username || '',
        followers: n.followers || 0,
        lastSync: n.last_sync,
      })),
      monitoredKeywords: (keywordsRes.data || []).map((k: any) => k.keyword),
      recentMentions: {
        total: mentions.length,
        positive: pos,
        negative: neg,
        neutral: neu,
        topNegative,
        topPositive,
      },
    };
  } catch (error) {
    console.error('[buildUserContext] error:', error);
    return null;
  }
}

/**
 * Construye un bloque de texto "Datos del usuario" para inyectar en system prompts.
 * Respeta privacidad: NO incluye email ni datos sensibles, solo identidad pública.
 */
export function formatUserContextForPrompt(ctx: UserContext | null): string {
  if (!ctx) {
    return 'Sin contexto de usuario disponible. Trata al interlocutor con cortesía general.';
  }

  const lines: string[] = [];
  lines.push(`## Datos del usuario con el que conversas`);
  lines.push(`- Nombre: ${ctx.name}`);
  lines.push(`- Llamalo por su nombre: "${ctx.firstName}"`);
  lines.push(`- Plan: ${ctx.plan}`);

  if (ctx.brandName) lines.push(`- Marca/Organización: ${ctx.brandName}`);
  if (ctx.company) lines.push(`- Empresa: ${ctx.company}`);
  if (ctx.profileType) lines.push(`- Tipo de perfil: ${ctx.profileType}`);
  if (ctx.category) lines.push(`- Categoría: ${ctx.category}`);

  if (ctx.political?.cargo || ctx.political?.partido || ctx.political?.propuestas) {
    const partes = [
      ctx.political.cargo && `cargo actual: ${ctx.political.cargo}`,
      ctx.political.partido && `partido político: ${ctx.political.partido}`,
    ].filter(Boolean);
    if (partes.length) lines.push(`- Perfil político: ${partes.join(', ')}`);
    if (ctx.political.propuestas) {
      lines.push(`- Propuestas principales: ${ctx.political.propuestas.slice(0, 300)}`);
    }
  }

  if (ctx.connectedNetworks.length > 0) {
    lines.push(`- Redes conectadas:`);
    for (const n of ctx.connectedNetworks) {
      lines.push(
        `  • ${n.platform}${n.username ? ` (@${n.username})` : ''}${
          n.followers ? ` — ${n.followers.toLocaleString('es-CO')} seguidores` : ''
        }`
      );
    }
  } else {
    lines.push(`- Aún no tiene redes sociales conectadas`);
  }

  if (ctx.monitoredKeywords.length > 0) {
    lines.push(`- Palabras clave monitoreadas: ${ctx.monitoredKeywords.join(', ')}`);
  }

  const m = ctx.recentMentions;
  lines.push(
    `- Menciones últimos 7 días: ${m.total} (✅ ${m.positive} positivas, ❌ ${m.negative} negativas, ➖ ${m.neutral} neutras)`
  );

  if (m.topNegative.length > 0) {
    lines.push(`- Menciones negativas recientes a tener en cuenta:`);
    for (const mm of m.topNegative) {
      lines.push(`  • [${mm.source}] "${mm.content}"`);
    }
  }

  lines.push('');
  lines.push(
    `Instrucciones de personalización: saluda al usuario por su nombre "${ctx.firstName}" cuando corresponda, adapta el tono a su plan (${ctx.plan}) y cuando sea relevante referencia sus redes, keywords o menciones específicas. No inventes datos que no estén arriba.`
  );

  return lines.join('\n');
}
