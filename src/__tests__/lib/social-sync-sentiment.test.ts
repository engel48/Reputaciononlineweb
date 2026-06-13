/**
 * Verifica que el sentimiento social use SOLO Groq (aiService.analyzeSentiment)
 * y que NO simule con keywords: si Groq falla, queda pendiente (label/score null).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockAnalyze = vi.fn();
vi.mock('@/lib/ai-service', () => ({
  aiService: { analyzeSentiment: (t: string) => mockAnalyze(t) },
}));

describe('social-sync/sentiment analyzeSentimentAI', () => {
  beforeEach(() => vi.clearAllMocks());

  it('usa Groq y mapea score -1..1 a -100..100', async () => {
    mockAnalyze.mockResolvedValueOnce({ sentiment: 'positive', score: 0.8, explanation: 'muy positivo' });
    const { analyzeSentimentAI } = await import('@/lib/social-sync/sentiment');
    const r = await analyzeSentimentAI('me encanta');
    expect(mockAnalyze).toHaveBeenCalledWith('me encanta');
    expect(r).toEqual({ label: 'positive', score: 80, explanation: 'muy positivo' });
  });

  it('si Groq falla, queda PENDIENTE (null) — nunca keyword', async () => {
    mockAnalyze.mockRejectedValueOnce(new Error('groq 429'));
    const { analyzeSentimentAI } = await import('@/lib/social-sync/sentiment');
    const r = await analyzeSentimentAI('texto cualquiera');
    expect(r).toEqual({ label: null, score: null, explanation: null });
  });
});
