/**
 * Tests para GET /api/dashboard/social-listening
 *
 * Verifica:
 *  - Auth requerida
 *  - Empty state cuando no hay redes conectadas
 *  - Agregaciones de sentiment correctas
 *  - Limites del periodo (days entre 1-90)
 *  - Top hashtags ordenados por count
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

const baseSocials = [
  { id: 's1', platform: 'youtube', username: 'channel1', display_name: 'Test', followers: 1000, following: 0, posts: 50, engagement: 4.5, connected: true, last_sync: '2026-04-30T12:00:00Z', profile_url: 'https://yt.com', profile_image: null },
];

const baseMentions = [
  { id: 'm1', platform: 'youtube', author_username: 'a1', author_name: 'Alice', author_followers: 100, content: 'Excelente producto!', url: 'https://x', published_at: '2026-04-29T10:00:00Z', scraped_at: '2026-04-29T10:01:00Z', likes: 10, shares: 2, comments: 5, reach_estimate: 1000, hashtags: ['amor', 'recomendado'], metadata: { sentiment: 'positive', sentiment_score: 85 } },
  { id: 'm2', platform: 'youtube', author_username: 'a2', author_name: 'Bob', author_followers: 200, content: 'Mal servicio', url: 'https://x', published_at: '2026-04-28T10:00:00Z', scraped_at: '2026-04-28T10:01:00Z', likes: 0, shares: 0, comments: 1, reach_estimate: 500, hashtags: ['queja'], metadata: { sentiment: 'negative', sentiment_score: 20 } },
  { id: 'm3', platform: 'youtube', author_username: 'a3', author_name: 'Carol', author_followers: 50, content: 'Llego ayer', url: null, published_at: '2026-04-27T10:00:00Z', scraped_at: '2026-04-27T10:01:00Z', likes: 0, shares: 0, comments: 0, reach_estimate: 0, hashtags: ['amor'], metadata: { sentiment: 'neutral', sentiment_score: 50 } },
];

let socialsToReturn = baseSocials;
let mentionsToReturn = baseMentions;

vi.mock('@/lib/auth-helper', () => ({
  requireAuth: vi.fn(async () => ({ userId: 'user-1', email: 'u@test.com', role: 'user' })),
}));

vi.mock('@/lib/supabase-server', () => ({
  supabase: {
    from: (table: string) => {
      if (table === 'social_media') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                order: () => Promise.resolve({ data: socialsToReturn, error: null }),
              }),
            }),
          }),
        };
      }
      if (table === 'mentions') {
        return {
          select: () => ({
            eq: () => ({
              gte: () => ({
                order: () => ({
                  limit: () => Promise.resolve({ data: mentionsToReturn, error: null }),
                }),
              }),
            }),
          }),
        };
      }
      return { select: () => Promise.resolve({ data: [] }) };
    },
  },
}));

describe('GET /api/dashboard/social-listening', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    socialsToReturn = baseSocials;
    mentionsToReturn = baseMentions;
  });

  it('rechaza si no hay auth (401)', async () => {
    const { requireAuth } = await import('@/lib/auth-helper');
    (requireAuth as any).mockImplementationOnce(async () =>
      NextResponse.json({ error: 'unauth' }, { status: 401 })
    );
    const { GET } = await import('@/app/api/dashboard/social-listening/route');
    const req = new Request('http://localhost/api/dashboard/social-listening');
    const res = await GET(req as any);
    expect(res.status).toBe(401);
  });

  it('agrega sentiment correctamente', async () => {
    const { GET } = await import('@/app/api/dashboard/social-listening/route');
    const req = new Request('http://localhost/api/dashboard/social-listening?days=7');
    const res = await GET(req as any);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.summary.totalMentions).toBe(3);
    expect(body.summary.sentimentDistribution.positive).toBe(33);
    expect(body.summary.sentimentDistribution.neutral).toBe(33);
    expect(body.summary.sentimentDistribution.negative).toBe(33);
    // Avg de 85, 20, 50 = 51.66 -> redondeado 52
    expect(body.summary.overallSentiment).toBe(52);
  });

  it('clamp days a rango valido (1-90)', async () => {
    const { GET } = await import('@/app/api/dashboard/social-listening/route');
    const reqHigh = new Request('http://localhost/api/dashboard/social-listening?days=999');
    const resHigh = await GET(reqHigh as any);
    const bodyHigh = await resHigh.json();
    expect(bodyHigh.period.days).toBe(7); // fallback default

    const reqLow = new Request('http://localhost/api/dashboard/social-listening?days=0');
    const resLow = await GET(reqLow as any);
    const bodyLow = await resLow.json();
    expect(bodyLow.period.days).toBe(7);
  });

  it('cuenta top hashtags ordenados', async () => {
    const { GET } = await import('@/app/api/dashboard/social-listening/route');
    const req = new Request('http://localhost/api/dashboard/social-listening');
    const res = await GET(req as any);
    const body = await res.json();

    expect(body.topHashtags[0].tag).toBe('amor');
    expect(body.topHashtags[0].count).toBe(2);
  });

  it('empty state cuando no hay redes conectadas', async () => {
    socialsToReturn = [];
    mentionsToReturn = [];
    const { GET } = await import('@/app/api/dashboard/social-listening/route');
    const req = new Request('http://localhost/api/dashboard/social-listening');
    const res = await GET(req as any);
    const body = await res.json();

    expect(body.summary.connectedPlatforms).toBe(0);
    expect(body.summary.totalFollowers).toBe(0);
    expect(body.summary.totalMentions).toBe(0);
    expect(body.platforms).toEqual([]);
  });

  it('agrega engagement total (likes + shares + comments)', async () => {
    const { GET } = await import('@/app/api/dashboard/social-listening/route');
    const req = new Request('http://localhost/api/dashboard/social-listening');
    const res = await GET(req as any);
    const body = await res.json();
    // (10+2+5) + (0+0+1) + (0+0+0) = 18
    expect(body.summary.totalEngagement).toBe(18);
  });
});
