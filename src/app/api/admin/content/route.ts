import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helper';
import { createClient } from '@supabase/supabase-js';
import { sanitizeSearch } from '@/lib/admin/search';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const MAX_LIMIT = 200;

/**
 * GET /api/admin/content?type=mentions|news&platform=&source=&sentiment=&search=&limit=&offset=
 *
 * Vista global de contenido: menciones (por usuario) o noticias scrapeadas (global).
 */
export async function GET(request: NextRequest) {
  const admin = await requireRole(request, 'admin');
  if (admin instanceof NextResponse) return admin;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'mentions';
  const platform = searchParams.get('platform') || '';
  const source = searchParams.get('source') || '';
  const sentiment = searchParams.get('sentiment') || '';
  const search = sanitizeSearch(searchParams.get('search'));
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
  const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));

  if (!['mentions', 'news'].includes(type)) {
    return NextResponse.json({ success: false, error: 'type debe ser mentions o news' }, { status: 400 });
  }

  if (type === 'news') {
    let query = supabaseAdmin
      .from('scraped_news')
      .select('id, title, summary, source, source_url, article_url, author, image_url, sentiment, sentiment_score, category, published_at, scraped_at', { count: 'exact' })
      .order('published_at', { ascending: false, nullsFirst: false });

    if (source) query = query.ilike('source', `%${source}%`);
    if (sentiment) query = query.eq('sentiment', sentiment);
    if (search) query = query.or(`title.ilike.%${search}%,summary.ilike.%${search}%`);

    const { data, count, error } = await query.range(offset, offset + limit - 1);
    if (error) {
      console.error('[GET /api/admin/content news] error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, type, total: count || 0, limit, offset, items: data || [] });
  }

  // type === 'mentions'
  let query = supabaseAdmin
    .from('mentions')
    .select('id, user_id, platform, author_username, author_name, content, url, likes, shares, comments, published_at, scraped_at, metadata', { count: 'exact' })
    .order('scraped_at', { ascending: false, nullsFirst: false });

  if (platform) query = query.eq('platform', platform);
  if (search) query = query.or(`content.ilike.%${search}%,author_username.ilike.%${search}%`);
  // El sentimiento de las menciones vive en metadata->>sentiment
  if (sentiment) query = query.eq('metadata->>sentiment', sentiment);

  const { data, count, error } = await query.range(offset, offset + limit - 1);
  if (error) {
    console.error('[GET /api/admin/content mentions] error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  const userIds = [...new Set((data || []).map((r: any) => r.user_id).filter(Boolean))];
  const usersById: Record<string, any> = {};
  if (userIds.length) {
    const { data: users } = await supabaseAdmin.from('users').select('id, name, email').in('id', userIds);
    for (const u of users || []) usersById[u.id] = u;
  }

  const items = (data || []).map((m: any) => ({
    id: m.id,
    userId: m.user_id,
    user: usersById[m.user_id] ? { name: usersById[m.user_id].name, email: usersById[m.user_id].email } : null,
    platform: m.platform,
    authorUsername: m.author_username,
    authorName: m.author_name,
    content: String(m.content || '').slice(0, 500),
    url: m.url,
    likes: m.likes || 0,
    shares: m.shares || 0,
    comments: m.comments || 0,
    sentiment: m.metadata?.sentiment || null,
    publishedAt: m.published_at,
    scrapedAt: m.scraped_at,
  }));

  return NextResponse.json({ success: true, type, total: count || 0, limit, offset, items });
}

/**
 * DELETE /api/admin/content?type=mentions|news&id=...
 * Borra una entrada errónea/duplicada.
 */
export async function DELETE(request: NextRequest) {
  const admin = await requireRole(request, 'admin');
  if (admin instanceof NextResponse) return admin;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || '';
  const id = searchParams.get('id') || '';

  if (!['mentions', 'news'].includes(type)) {
    return NextResponse.json({ success: false, error: 'type debe ser mentions o news' }, { status: 400 });
  }
  if (!id) return NextResponse.json({ success: false, error: 'id requerido' }, { status: 400 });

  const table = type === 'news' ? 'scraped_news' : 'mentions';
  const { error } = await supabaseAdmin.from(table).delete().eq('id', id);

  if (error) {
    console.error('[DELETE /api/admin/content] error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, deleted: id });
}
