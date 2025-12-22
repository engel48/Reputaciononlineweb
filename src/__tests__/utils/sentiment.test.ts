/**
 * Tests para utilidades de análisis de sentimiento
 */

import { describe, it, expect } from 'vitest'

// Función de análisis de sentimiento (simulando la lógica del dashboard-analytics)
function determineSentiment(mention: { content?: string; metadata?: any }): 'positive' | 'negative' | 'neutral' {
  // Check if there's a sentiment field in metadata
  if (mention.metadata?.sentiment) {
    return mention.metadata.sentiment
  }

  // Check for sentiment_score in metadata
  if (mention.metadata?.sentiment_score !== undefined) {
    const score = mention.metadata.sentiment_score
    if (score > 0.3) return 'positive'
    if (score < -0.3) return 'negative'
    return 'neutral'
  }

  // Simple keyword-based analysis as fallback
  const content = (mention.content || '').toLowerCase()
  const positiveWords = ['excelente', 'bueno', 'genial', 'increíble', 'feliz', 'gracias', 'great', 'good', 'excellent', 'happy', 'love']
  const negativeWords = ['malo', 'terrible', 'horrible', 'peor', 'odio', 'bad', 'terrible', 'hate', 'worst', 'awful']

  const hasPositive = positiveWords.some(w => content.includes(w))
  const hasNegative = negativeWords.some(w => content.includes(w))

  if (hasPositive && !hasNegative) return 'positive'
  if (hasNegative && !hasPositive) return 'negative'
  return 'neutral'
}

describe('Análisis de Sentimiento', () => {
  describe('determineSentiment', () => {
    describe('Con metadata.sentiment', () => {
      it('debería retornar positive si metadata indica positive', () => {
        const mention = { metadata: { sentiment: 'positive' } }
        expect(determineSentiment(mention)).toBe('positive')
      })

      it('debería retornar negative si metadata indica negative', () => {
        const mention = { metadata: { sentiment: 'negative' } }
        expect(determineSentiment(mention)).toBe('negative')
      })

      it('debería retornar neutral si metadata indica neutral', () => {
        const mention = { metadata: { sentiment: 'neutral' } }
        expect(determineSentiment(mention)).toBe('neutral')
      })
    })

    describe('Con metadata.sentiment_score', () => {
      it('debería retornar positive si score > 0.3', () => {
        const mention = { metadata: { sentiment_score: 0.5 } }
        expect(determineSentiment(mention)).toBe('positive')
      })

      it('debería retornar negative si score < -0.3', () => {
        const mention = { metadata: { sentiment_score: -0.5 } }
        expect(determineSentiment(mention)).toBe('negative')
      })

      it('debería retornar neutral si score está entre -0.3 y 0.3', () => {
        const mention = { metadata: { sentiment_score: 0.1 } }
        expect(determineSentiment(mention)).toBe('neutral')
      })

      it('debería retornar neutral si score es exactamente 0', () => {
        const mention = { metadata: { sentiment_score: 0 } }
        expect(determineSentiment(mention)).toBe('neutral')
      })
    })

    describe('Análisis por palabras clave', () => {
      it('debería detectar sentimiento positivo en español', () => {
        const mention = { content: 'Este producto es excelente y me hace muy feliz' }
        expect(determineSentiment(mention)).toBe('positive')
      })

      it('debería detectar sentimiento negativo en español', () => {
        const mention = { content: 'Esto es terrible, el peor servicio' }
        expect(determineSentiment(mention)).toBe('negative')
      })

      it('debería detectar sentimiento positivo en inglés', () => {
        const mention = { content: 'I love this, it is excellent!' }
        expect(determineSentiment(mention)).toBe('positive')
      })

      it('debería detectar sentimiento negativo en inglés', () => {
        const mention = { content: 'This is the worst, I hate it' }
        expect(determineSentiment(mention)).toBe('negative')
      })

      it('debería retornar neutral si no hay palabras clave', () => {
        const mention = { content: 'El producto llegó ayer a las 3pm' }
        expect(determineSentiment(mention)).toBe('neutral')
      })

      it('debería retornar neutral si hay mezcla de positivo y negativo', () => {
        const mention = { content: 'Es bueno pero también un poco malo' }
        expect(determineSentiment(mention)).toBe('neutral')
      })

      it('debería manejar contenido vacío', () => {
        const mention = { content: '' }
        expect(determineSentiment(mention)).toBe('neutral')
      })

      it('debería manejar contenido undefined', () => {
        const mention = {}
        expect(determineSentiment(mention)).toBe('neutral')
      })

      it('debería ser case-insensitive', () => {
        const mention = { content: 'EXCELENTE PRODUCTO' }
        expect(determineSentiment(mention)).toBe('positive')
      })
    })
  })
})

describe('Cálculo de Reputation Score', () => {
  function calculateReputationScore(
    positive: number,
    neutral: number,
    negative: number
  ): number {
    const total = positive + neutral + negative
    if (total === 0) return 50 // Default score
    return Math.round(((positive * 100 + neutral * 50 + negative * 0) / total))
  }

  it('debería retornar 100 si todas son positivas', () => {
    expect(calculateReputationScore(10, 0, 0)).toBe(100)
  })

  it('debería retornar 0 si todas son negativas', () => {
    expect(calculateReputationScore(0, 0, 10)).toBe(0)
  })

  it('debería retornar 50 si todas son neutrales', () => {
    expect(calculateReputationScore(0, 10, 0)).toBe(50)
  })

  it('debería retornar 50 si no hay menciones', () => {
    expect(calculateReputationScore(0, 0, 0)).toBe(50)
  })

  it('debería calcular correctamente mix de menciones', () => {
    // 5 positivas (500) + 3 neutrales (150) + 2 negativas (0) = 650 / 10 = 65
    expect(calculateReputationScore(5, 3, 2)).toBe(65)
  })

  it('debería retornar número entero', () => {
    const result = calculateReputationScore(3, 3, 3)
    expect(Number.isInteger(result)).toBe(true)
  })
})
