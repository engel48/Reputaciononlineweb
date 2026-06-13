/**
 * Análisis de sentimiento de noticias con Groq REAL (vía aiService).
 *
 * Política "solo Groq, nada simulado": si Groq falla, sentiment/score quedan
 * null (la noticia queda PENDIENTE de análisis) en lugar de inventar un valor
 * por matching de palabras.
 */

import { aiService } from '@/lib/ai-service';

export type SentimentType = 'positive' | 'negative' | 'neutral';

export interface SentimentAnalysis {
  /** null = pendiente (Groq no disponible; se reanaliza luego). */
  sentiment: SentimentType | null;
  /** -1.00 a 1.00, null si pendiente. */
  score: number | null;
  /** 0 a 1 (0 = no analizado). */
  confidence: number;
  explanation: string | null;
}

/**
 * Analiza el sentimiento de un texto con Groq. `searchTerm` es opcional y solo
 * se usa para darle contexto al modelo (el tema de interés).
 */
export async function analyzeSentiment(
  text: string,
  searchTerm?: string
): Promise<SentimentAnalysis> {
  try {
    const input = searchTerm
      ? `Tema de interés: "${searchTerm}".\nTexto a analizar: ${text}`
      : text;
    const ai = await aiService.analyzeSentiment(input);
    return {
      sentiment: ai.sentiment,
      score: ai.score,
      confidence: 0.9,
      explanation: ai.explanation || null,
    };
  } catch {
    return { sentiment: null, score: null, confidence: 0, explanation: null };
  }
}

/**
 * Extrae el contexto alrededor de un término de búsqueda (texto puro, sin IA).
 */
export function extractContext(
  text: string,
  searchTerm: string,
  contextLength: number = 200
): string {
  const normalizedText = text.toLowerCase();
  const termIndex = normalizedText.indexOf(searchTerm.toLowerCase());

  if (termIndex === -1) {
    return text.substring(0, contextLength);
  }

  // Encontrar el inicio de la oración
  let start = termIndex;
  while (start > 0 && text[start] !== '.' && text[start] !== '!' && text[start] !== '?') {
    start--;
  }
  start = start === 0 ? 0 : start + 2; // +2 para saltar el punto y espacio

  // Encontrar el final de la oración
  let end = termIndex + searchTerm.length;
  while (end < text.length && text[end] !== '.' && text[end] !== '!' && text[end] !== '?') {
    end++;
  }
  end = Math.min(end + 1, text.length); // +1 para incluir el punto

  // Si la oración es muy corta, expandir el contexto
  if (end - start < contextLength) {
    const expansion = contextLength - (end - start);
    start = Math.max(0, start - expansion / 2);
    end = Math.min(text.length, end + expansion / 2);
  }

  return text.substring(start, end).trim();
}
