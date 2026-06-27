/**
 * /api/admin/app/config — gestión de la configuración remota de la app.
 *   GET  → devuelve la config actual.
 *   POST → actualiza versión/mantenimiento/flags/anuncios (requireRole admin).
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helper';
import { supabase } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const admin = await requireRole(request, 'admin');
  if (admin instanceof NextResponse) return admin;

  const { data, error } = await supabase
    .from('app_config')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true, data });
}

const ALLOWED_FIELDS = [
  'min_supported_version',
  'latest_version',
  'force_update',
  'maintenance_mode',
  'maintenance_message',
  'update_url_android',
  'update_url_ios',
  'feature_flags',
  'announcements',
] as const;

export async function POST(request: NextRequest) {
  const admin = await requireRole(request, 'admin');
  if (admin instanceof NextResponse) return admin;

  const body = await request.json().catch(() => ({}));
  const update: Record<string, any> = {};
  for (const field of ALLOWED_FIELDS) {
    if (field in body) update[field] = body[field];
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ success: false, error: 'Nada para actualizar' }, { status: 400 });
  }

  update.updated_at = new Date().toISOString();
  update.updated_by = admin.userId;

  const { data, error } = await supabase
    .from('app_config')
    .update(update)
    .eq('id', 1)
    .select('*')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true, data });
}
