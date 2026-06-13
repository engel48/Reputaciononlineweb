// =====================================================
// SENTIMENT ANALYZER - Análisis de sentimiento con Groq REAL
// Política "solo Groq, nada simulado": si Groq falla, se PROPAGA el error
// para que el job se reintente (no se usa matching de palabras).
// =====================================================

import { SentimentResult, RawItem } from './types.ts'
import { GROQ_CONFIG } from './config.ts'
import { callGroq, parseGroqJson } from '../_shared/groq.ts'

export class SentimentAnalyzer {
  private groqApiKey: string

  constructor(groqApiKey: string) {
    this.groqApiKey = groqApiKey
  }

  /**
   * Analizar sentimiento de un item con Groq. Si falla, lanza (el job se
   * reintentará); NUNCA cae a keywords.
   */
  async analyze(item: RawItem): Promise<SentimentResult> {
    return await this.analyzeWithGroq(item.content)
  }

  private async analyzeWithGroq(content: string): Promise<SentimentResult> {
    const text = await callGroq(
      [
        { role: 'system', content: this.systemPrompt() },
        { role: 'user', content: `Analiza el sentimiento de este texto:\n"${content}"` },
      ],
      {
        apiKey: this.groqApiKey,
        temperature: GROQ_CONFIG.temperature,
        maxTokens: GROQ_CONFIG.max_tokens,
        jsonMode: true,
      }
    )
    return this.parseResponse(text)
  }

  private systemPrompt(): string {
    return `Eres un experto en análisis de sentimiento para español colombiano (redes sociales y medios). Detectas jerga, emojis, ironía y sarcasmo (la ironía/sarcasmo cuentan como negativos). Es para monitoreo de reputación online.

RESPONDE SIEMPRE con un JSON válido en este formato exacto:
{
  "sentiment": "positive|negative|neutral",
  "score": 0.0,            // 0.0 = muy negativo, 0.5 = neutral, 1.0 = muy positivo
  "confidence": 0.0,       // 0.0 a 1.0
  "keywords": ["palabra1"],
  "explanation": "Breve explicación (máx 50 palabras)"
}`
  }

  private parseResponse(text: string): SentimentResult {
    const parsed = parseGroqJson(text)
    const sentiment = ['positive', 'negative', 'neutral'].includes(parsed.sentiment)
      ? parsed.sentiment
      : 'neutral'
    let score = typeof parsed.score === 'number' ? parsed.score : 0.5
    score = Math.max(0, Math.min(1, score))
    return {
      sentiment,
      score,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.8,
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 5) : [],
      explanation: parsed.explanation || '',
      method: 'groq',
    }
  }

  /**
   * Analizar batch de items en paralelo (lotes de 5).
   */
  async analyzeBatch(items: RawItem[]): Promise<SentimentResult[]> {
    const results: SentimentResult[] = []
    const batchSize = 5
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize)
      const batchResults = await Promise.all(batch.map(item => this.analyze(item)))
      results.push(...batchResults)
      if (i + batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
    return results
  }
}
