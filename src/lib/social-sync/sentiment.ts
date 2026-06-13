import { aiService } from '@/lib/ai-service';

export interface AISentiment {
  /** null = pendiente (Groq no pudo analizar; se reanaliza luego, NO se simula). */
  label: 'positive' | 'negative' | 'neutral' | null;
  /** -100..100, null si pendiente. */
  score: number | null;
  explanation: string | null;
}

/**
 * Análisis de sentimiento con Groq REAL (vía aiService.analyzeSentiment).
 *
 * Política "solo Groq, nada simulado": si Groq falla (rate-limit, caída, etc.)
 * devuelve label/score null para que la mención quede PENDIENTE y se reanalice
 * con /api/mentions/analyze-batch. Nunca se inventan valores por keywords.
 */
export async function analyzeSentimentAI(text: string): Promise<AISentiment> {
  try {
    const ai = await aiService.analyzeSentiment(text || '');
    return {
      label: ai.sentiment,
      score: Math.round(ai.score * 100),
      explanation: ai.explanation || null,
    };
  } catch {
    return { label: null, score: null, explanation: null };
  }
}
