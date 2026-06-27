/**
 * Tests para /api/admin/communications (notificaciones/alertas/suscripciones)
 *  - Auth 403
 *  - GET notifications adjunta usuario
 *  - POST purge limpia notificaciones leídas
 *  - DELETE rechaza type inválido (subscriptions no borrable)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

const mockResults: Record<string, any> = {};

vi.mock('@/lib/auth-helper', () => ({
  requireRole: vi.fn(async (_req: any, role: string) =>
    role === 'admin'
      ? { userId: 'admin-1', email: 'admin@test.com', role: 'admin' }
      : NextResponse.json({ success: false }, { status: 403 })
  ),
}));

function makeBuilder(table: string) {
  const b: any = {};
  const ret = () => b;
  ['select', 'order', 'eq', 'lt', 'gte', 'or', 'ilike', 'like', 'in', 'range', 'delete', 'limit', 'not'].forEach((m) => {
    b[m] = vi.fn(ret);
  });
  b.then = (resolve: any) => resolve(mockResults[table] ?? { data: [], count: 0, error: null });
  return b;
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ from: (t: string) => makeBuilder(t) }),
}));

describe('/api/admin/communications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const k of Object.keys(mockResults)) delete mockResults[k];
  });

  it('rechaza si no es admin (403)', async () => {
    const { requireRole } = await import('@/lib/auth-helper');
    (requireRole as any).mockImplementationOnce(async () => NextResponse.json({ success: false }, { status: 403 }));
    const { GET } = await import('@/app/api/admin/communications/route');
    const res = await GET(new Request('http://localhost/api/admin/communications?type=notifications') as any);
    expect(res.status).toBe(403);
  });

  it('GET notifications adjunta datos de usuario', async () => {
    mockResults['notifications'] = {
      data: [{ id: 'n1', user_id: 'u1', title: 'Hola', message: 'msg', is_read: false, created_at: '2026-06-01' }],
      count: 1,
      error: null,
    };
    mockResults['users'] = { data: [{ id: 'u1', name: 'Juan', email: 'juan@x.com' }] };

    const { GET } = await import('@/app/api/admin/communications/route');
    const res = await GET(new Request('http://localhost/api/admin/communications?type=notifications') as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items).toHaveLength(1);
    expect(body.items[0].user.email).toBe('juan@x.com');
  });

  it('POST purge limpia notificaciones leídas', async () => {
    mockResults['notifications'] = { error: null, count: 7 };
    const { POST } = await import('@/app/api/admin/communications/route');
    const req = new Request('http://localhost/api/admin/communications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'purge', olderThanDays: 30 }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.purged).toBe(7);
  });

  it('DELETE rechaza subscriptions (no borrable)', async () => {
    const { DELETE } = await import('@/app/api/admin/communications/route');
    const res = await DELETE(new Request('http://localhost/api/admin/communications?type=subscriptions&id=1', { method: 'DELETE' }) as any);
    expect(res.status).toBe(400);
  });
});
