// =====================================================
// SENTIMENT ANALYZER - Análisis de sentimiento con Gemini
// Fecha: 2025-10-29
// =====================================================

import { SentimentResult, RawItem } from './types.ts'
import { GEMINI_CONFIG, POSITIVE_KEYWORDS, NEGATIVE_KEYWORDS } from './config.ts'

export class SentimentAnalyzer {
  private geminiApiKey: string

  constructor(geminiApiKey: string) {
    this.geminiApiKey = geminiApiKey
  }

  /**
   * Analizar sentimiento de un item
   */
  async analyze(item: RawItem): Promise<SentimentResult> {
    try {
      // Intentar análisis con Gemini primero
      return await this.analyzeWithGemini(item.content)
    } catch (error) {
      console.error('❌ Error en análisis Gemini, usando fallback:', error)
      // Fallback a análisis por keywords
      return this.analyzeWithKeywords(item.content)
    }
  }

  /**
   * Análisis con Gemini AI
   */
  private async analyzeWithGemini(content: string): Promise<SentimentResult> {
    const prompt = this.buildGeminiPrompt(content)

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_CONFIG.model}:generateContent?key=${this.geminiApiKey}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: GEMINI_CONFIG.temperature,
          maxOutputTokens: GEMINI_CONFIG.max_tokens
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`)
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) {
      throw new Error('No response from Gemini')
    }

    // Parsear respuesta JSON de Gemini
    return this.parseGeminiResponse(text)
  }

  /**
   * Construir prompt para Gemini
   */
  private buildGeminiPrompt(content: string): string {
    return `Analiza el sentimiento del siguiente texto en español (Colombia).

TEXTO:
"${content}"

INSTRUCCIONES:
1. Determina si el sentimiento es: positive, negative, o neutral
2. Asigna un score entre 0.0 y 1.0 (0.0 = muy negativo, 0.5 = neutral, 1.0 = muy positivo)
3. Asigna un nivel de confianza entre 0.0 y 1.0
4. Identifica las palabras clave que justifican tu análisis
5. Proporciona una explicación breve (máximo 50 palabras)

CONTEXTO:
- Estás analizando menciones en redes sociales
- Es para monitoreo de reputación online
- El texto puede contener jerga colombiana, emojis, o abreviaciones
- Considera ironía y sarcasmo como negativos

RESPONDE SOLO CON UN JSON EN ESTE FORMATO:
{
  "sentiment": "positive|negative|neutral",
  "score": 0.0-1.0,
  "confidence": 0.0-1.0,
  "keywords": ["palabra1", "palabra2"],
  "explanation": "Breve explicación"
}`
  }

  /**
   * Parsear respuesta de Gemini
   */
  private parseGeminiResponse(text: string): SentimentResult {
    try {
      // Extraer JSON de la respuesta (Gemini a veces envuelve en markdown)
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      const parsed = JSON.parse(jsonMatch[0])

      return {
        sentiment: parsed.sentiment,
        score: parsed.score,
        confidence: parsed.confidence,
        keywords: parsed.keywords || [],
        explanation: parsed.explanation || '',
        method: 'gemini'
      }
    } catch (error) {
      console.error('Error parsing Gemini response:', error)
      throw error
    }
  }

  /**
   * Análisis fallback por keywords
   */
  private analyzeWithKeywords(content: string): SentimentResult {
    const contentLower = content.toLowerCase()

    // Contar keywords positivos y negativos
    let positiveCount = 0
    let negativeCount = 0
    const foundKeywords: string[] = []

    for (const keyword of POSITIVE_KEYWORDS) {
      if (contentLower.includes(keyword.toLowerCase())) {
        positiveCount++
        foundKeywords.push(keyword)
      }
    }

    for (const keyword of NEGATIVE_KEYWORDS) {
      if (contentLower.includes(keyword.toLowerCase())) {
        negativeCount++
        foundKeywords.push(keyword)
      }
    }

    // Determinar sentimiento
    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral'
    let score = 0.5
    let confidence = 0.5

    if (positiveCount > negativeCount) {
      sentiment = 'positive'
      score = Math.min(0.5 + (positiveCount * 0.1), 1.0)
      confidence = Math.min(positiveCount * 0.2, 0.8)
    } else if (negativeCount > positiveCount) {
      sentiment = 'negative'
      score = Math.max(0.5 - (negativeCount * 0.1), 0.0)
      confidence = Math.min(negativeCount * 0.2, 0.8)
    } else if (positiveCount === 0 && negativeCount === 0) {
      // Sin keywords, baja confianza
      confidence = 0.3
    }

    return {
      sentiment,
      score,
      confidence,
      keywords: foundKeywords.slice(0, 5), // Máximo 5 keywords
      explanation: `Análisis basado en ${positiveCount} palabras positivas y ${negativeCount} negativas`,
      method: 'keyword'
    }
  }

  /**
   * Analizar batch de items en paralelo
   */
  async analyzeBatch(items: RawItem[]): Promise<SentimentResult[]> {
    const results: SentimentResult[] = []

    // Analizar en lotes de 5 para no saturar la API
    const batchSize = 5
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize)
      const batchResults = await Promise.all(
        batch.map(item => this.analyze(item))
      )
      results.push(...batchResults)

      // Pequeña pausa entre lotes
      if (i + batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    return results
  }
}
