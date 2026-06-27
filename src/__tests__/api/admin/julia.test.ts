/**
 * Tests para /api/admin/julia (uso de IA)
 *  - Auth 403
 *  - GET agrega consumo de créditos julia_* y lista conversaciones
 *  - DELETE requiere id
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

describe('/api/admin/julia', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const k of Object.keys(mockResults)) delete mockResults[k];
  });

  it('rechaza si no es admin (403)', async () => {
    const { requireRole } = await import('@/lib/auth-helper');
    (requireRole as any).mockImplementationOnce(async () => NextResponse.json({ success: false }, { status: 403 }));
    const { GET } = await import('@/app/api/admin/julia/route');
    const res = await GET(new Request('http://localhost/api/admin/julia') as any);
    expect(res.status).toBe(403);
  });

  it('GET suma consumo de IA y lista conversaciones', async () => {
    mockResults['amelia_conversations'] = {
      data: [{ id: 'c1', user_id: 'u1', title: 'Análisis', created_at: '2026-06-01', updated_at: '2026-06-02' }],
      count: 1,
      error: null,
    };
    mockResults['credit_transactions'] = {
      data: [
        { user_id: 'u1', amount: -3, related_entity: 'julia_chat' },
        { user_id: 'u1', amount: -10, related_entity: 'julia_reputation' },
      ],
    };
    mockResults['users'] = { data: [{ id: 'u1', name: 'Juan', email: 'juan@x.com', plan: 'pro' }] };

    const { GET } = await import('@/app/api/admin/julia/route');
    const res = await GET(new Request('http://localhost/api/admin/julia') as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.stats.creditsConsumed).toBe(13);
    expect(body.conversations).toHaveLength(1);
    expect(body.stats.topUsers[0].creditsConsumed).toBe(13);
  });

  it('DELETE requiere id', async () => {
    const { DELETE } = await import('@/app/api/admin/julia/route');
    const res = await DELETE(new Request('http://localhost/api/admin/julia', { method: 'DELETE' }) as any);
    expect(res.status).toBe(400);
  });
});
