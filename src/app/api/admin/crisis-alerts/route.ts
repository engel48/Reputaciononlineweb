import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helper';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const MAX_LIMIT = 100;

/**
 * GET /api/admin/crisis-alerts
 *   ?status=active|acknowledged|resolved
 *   ?severity=low|medium|high|critical
 *   ?since=ISO
 *   ?limit=20&offset=0
 *
 * Lista alertas de crisis con filtros y paginacion.
 * Adjunta nombre/email del usuario afectado para cada alerta.
 */
export async function GET(request: NextRequest) {
  const admin = await requireRole(request, 'admin');
  if (admin instanceof NextResponse) return admin;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const severity = searchParams.get('severity');
  const since = searchParams.get('since');
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
  const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));

  let query = supabaseAdmin
    .from('crisis_alerts')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);
  if (severity) query = query.eq('severity', severity);
  if (since) query = query.gte('created_at', since);

  const { data, count, error } = await query.range(offset, offset + limit - 1);

  if (error) {
    console.error('[GET /api/admin/crisis-alerts] error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  // Adjuntar info del usuario afectado en una sola query
  const alerts = data || [];
  const userIds = Array.from(new Set(alerts.map((a: any) => a.user_id).filter(Boolean)));
  const usersById = new Map<string, { id: string; name: string | null; email: string }>();

  if (userIds.length > 0) {
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, name, email')
      .in('id', userIds);
    for (const u of (users || []) as any[]) {
      usersById.set(u.id, u);
    }
  }

  // Stats por severity y status (para dashboard de la pagina)
  const { data: severityCounts } = await supabaseAdmin
    .from('crisis_alerts')
    .select('severity, status');

  const stats = {
    total: count || 0,
    bySeverity: { low: 0, medium: 0, high: 0, critical: 0 } as Record<string, number>,
    byStatus: { active: 0, acknowledged: 0, resolved: 0 } as Record<string, number>,
  };
  for (const row of (severityCounts || []) as any[]) {
    if (row.severity in stats.bySeverity) stats.bySeverity[row.severity]++;
    if (row.status in stats.byStatus) stats.byStatus[row.status]++;
  }

  return NextResponse.json({
    success: true,
    total: count || 0,
    limit,
    offset,
    stats,
    alerts: alerts.map((a: any) => ({
      id: a.id,
      type: a.type,
      severity: a.severity,
      status: a.status,
      description: a.description,
      triggerData: a.trigger_data,
      acknowledgedAt: a.acknowledged_at,
      resolvedAt: a.resolved_at,
      createdAt: a.created_at,
      updatedAt: a.updated_at,
      user: usersById.get(a.user_id) || null,
    })),
  });
}
