/**
 * Tests para /api/admin/content (menciones + noticias)
 *  - Auth 403
 *  - GET mentions devuelve items con usuario y sentimiento desde metadata
 *  - DELETE valida type e id
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

describe('/api/admin/content', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const k of Object.keys(mockResults)) delete mockResults[k];
  });

  it('rechaza si no es admin (403)', async () => {
    const { requireRole } = await import('@/lib/auth-helper');
    (requireRole as any).mockImplementationOnce(async () => NextResponse.json({ success: false }, { status: 403 }));
    const { GET } = await import('@/app/api/admin/content/route');
    const res = await GET(new Request('http://localhost/api/admin/content?type=mentions') as any);
    expect(res.status).toBe(403);
  });

  it('GET mentions mapea usuario y sentimiento desde metadata', async () => {
    mockResults['mentions'] = {
      data: [{ id: 'm1', user_id: 'u1', platform: 'x', content: 'hola', metadata: { sentiment: 'positive' } }],
      count: 1,
      error: null,
    };
    mockResults['users'] = { data: [{ id: 'u1', name: 'Juan', email: 'juan@x.com' }] };

    const { GET } = await import('@/app/api/admin/content/route');
    const res = await GET(new Request('http://localhost/api/admin/content?type=mentions') as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.items).toHaveLength(1);
    expect(body.items[0].sentiment).toBe('positive');
    expect(body.items[0].user.email).toBe('juan@x.com');
  });

  it('DELETE rechaza type inválido', async () => {
    const { DELETE } = await import('@/app/api/admin/content/route');
    const res = await DELETE(new Request('http://localhost/api/admin/content?type=foo&id=1', { method: 'DELETE' }) as any);
    expect(res.status).toBe(400);
  });

  it('DELETE borra una mención válida', async () => {
    mockResults['mentions'] = { error: null };
    const { DELETE } = await import('@/app/api/admin/content/route');
    const res = await DELETE(new Request('http://localhost/api/admin/content?type=mentions&id=m1', { method: 'DELETE' }) as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe('m1');
  });
});
