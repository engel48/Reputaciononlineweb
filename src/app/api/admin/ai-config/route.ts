import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helper';
import { getAiConfig, saveAiConfig } from '@/lib/ai-config';

/**
 * GET  /api/admin/ai-config  → config actual de la IA Julia.
 * POST /api/admin/ai-config  → guarda la config (body: { config } o el objeto plano).
 * Solo admin.
 */
export async function GET(request: NextRequest) {
  const admin = await requireRole(request, 'admin');
  if (admin instanceof NextResponse) return admin;

  const config = await getAiConfig();
  return NextResponse.json({ success: true, config });
}

export async function POST(request: NextRequest) {
  const admin = await requireRole(request, 'admin');
  if (admin instanceof NextResponse) return admin;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'JSON inválido' }, { status: 400 });
  }

  const config = await saveAiConfig(body?.config ?? body, (admin as any).userId);
  return NextResponse.json({ success: true, config });
}
