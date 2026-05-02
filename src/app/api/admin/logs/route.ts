import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helper';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const MAX_LIMIT = 200;

/**
 * GET /api/admin/logs?source=system|oauth&limit=50&offset=0&eventType=foo&since=ISO
 *
 * Devuelve logs paginados desde system_logs o oauth_logs.
 */
export async function GET(request: NextRequest) {
  const admin = await requireRole(request, 'admin');
  if (admin instanceof NextResponse) return admin;

  const { searchParams } = new URL(request.url);
  const source = searchParams.get('source') || 'system';
  const eventType = searchParams.get('eventType') || '';
  const since = searchParams.get('since') || '';
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
  const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));

  if (!['system', 'oauth'].includes(source)) {
    return NextResponse.json({ success: false, error: 'source debe ser system u oauth' }, { status: 400 });
  }

  const tableName = source === 'system' ? 'system_logs' : 'oauth_logs';

  // Construir query
  let query = supabaseAdmin
    .from(tableName)
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (eventType) {
    if (source === 'system') {
      query = query.ilike('event_type', `%${eventType}%`);
    } else {
      query = query.ilike('action', `%${eventType}%`);
    }
  }
  if (since) {
    query = query.gte('created_at', since);
  }

  const { data, count, error } = await query.range(offset, offset + limit - 1);

  if (error) {
    console.error(`[GET /api/admin/logs] error en ${tableName}:`, error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  // Tipos de evento mas frecuentes (para filtro UI)
  const distinctField = source === 'system' ? 'event_type' : 'action';
  const { data: distinctData } = await supabaseAdmin
    .from(tableName)
    .select(distinctField)
    .order('created_at', { ascending: false })
    .limit(500);

  const eventTypeCounts: Record<string, number> = {};
  for (const row of (distinctData || []) as any[]) {
    const v = row[distinctField];
    if (v) eventTypeCounts[v] = (eventTypeCounts[v] || 0) + 1;
  }
  const topEventTypes = Object.entries(eventTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([type, count]) => ({ type, count }));

  return NextResponse.json({
    success: true,
    source,
    total: count || 0,
    limit,
    offset,
    logs: data || [],
    topEventTypes,
  });
}
