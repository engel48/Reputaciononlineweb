// =====================================================
// CRISIS DETECTOR - Detección automática de crisis de reputación
// Fecha: 2025-10-29
// =====================================================

import { ProcessedItem, CrisisResult, CrisisCondition, User } from './types.ts'
import { CRISIS_THRESHOLDS } from './config.ts'

export class CrisisDetector {
  /**
   * Detectar crisis en items procesados
   */
  detect(items: ProcessedItem[], user: User, historicalData?: any): CrisisResult {
    const thresholds = CRISIS_THRESHOLDS[user.plan] || CRISIS_THRESHOLDS.free
    const triggers: CrisisCondition[] = []

    console.log(`[CRISIS DETECTOR] Analizando ${items.length} items para usuario plan ${user.plan}`)

    // 1. NEGATIVE SPIKE: Detectar pico de menciones negativas
    const negativeSpikeCondition = this.detectNegativeSpike(items, thresholds)
    if (negativeSpikeCondition) {
      triggers.push(negativeSpikeCondition)
    }

    // 2. SENTIMENT DROP: Detectar caída brusca en sentimiento
    const sentimentDropCondition = this.detectSentimentDrop(items, thresholds, historicalData)
    if (sentimentDropCondition) {
      triggers.push(sentimentDropCondition)
    }

    // 3. INFLUENTIAL CRITICISM: Detectar críticas de cuentas influyentes
    const influentialCriticismCondition = this.detectInfluentialCriticism(items, thresholds)
    if (influentialCriticismCondition) {
      triggers.push(influentialCriticismCondition)
    }

    // 4. TRENDING NEGATIVE: Detectar hashtags negativos trending
    const trendingNegativeCondition = this.detectTrendingNegative(items, thresholds)
    if (trendingNegativeCondition) {
      triggers.push(trendingNegativeCondition)
    }

    // 5. MEDIA COVERAGE: Detectar cobertura de medios
    const mediaCoverageCondition = this.detectMediaCoverage(items, thresholds)
    if (mediaCoverageCondition) {
      triggers.push(mediaCoverageCondition)
    }

    // Determinar si hay crisis y su severidad
    if (triggers.length === 0) {
      return {
        is_crisis: false,
        severity: 'low',
        type: 'none',
        description: 'No se detectaron condiciones de crisis',
        triggers: [],
        recommended_actions: []
      }
    }

    // Calcular severidad global
    const severity = this.calculateOverallSeverity(triggers)
    const type = triggers[0].type // Tipo principal de crisis
    const description = this.buildCrisisDescription(triggers)
    const recommended_actions = this.getRecommendedActions(triggers, severity)

    console.log(`[CRISIS DETECTOR] ⚠️ CRISIS DETECTADA - Severidad: ${severity}`)

    return {
      is_crisis: true,
      severity,
      type,
      description,
      triggers,
      recommended_actions
    }
  }

  /**
   * Detectar pico de menciones negativas
   */
  private detectNegativeSpike(
    items: ProcessedItem[],
    thresholds: any
  ): CrisisCondition | null {
    const negativeItems = items.filter(item => item.sentiment.sentiment === 'negative')
    const count = negativeItems.length

    if (count >= thresholds.negative_spike) {
      const severity = this.calculateSeverity(count, thresholds.negative_spike)

      return {
        type: 'negative_spike',
        severity,
        description: `Pico de ${count} menciones negativas en la última hora`,
        threshold: thresholds.negative_spike,
        actual: count
      }
    }

    return null
  }

  /**
   * Detectar caída en sentimiento
   */
  private detectSentimentDrop(
    items: ProcessedItem[],
    thresholds: any,
    historicalData?: any
  ): CrisisCondition | null {
    if (items.length === 0) return null

    // Calcular sentimiento promedio actual
    const avgSentiment = items.reduce((sum, item) => sum + item.sentiment.score, 0) / items.length

    // Comparar con histórico (si existe)
    const historicalAvg = historicalData?.avgSentiment || 0.7 // Asumir 0.7 como baseline

    const drop = historicalAvg - avgSentiment

    if (drop >= thresholds.sentiment_drop) {
      const severity = drop >= thresholds.sentiment_drop * 2 ? 'critical' :
                      drop >= thresholds.sentiment_drop * 1.5 ? 'high' :
                      drop >= thresholds.sentiment_drop * 1.2 ? 'medium' : 'low'

      return {
        type: 'sentiment_drop',
        severity,
        description: `Caída de ${(drop * 100).toFixed(1)}% en sentimiento general`,
        threshold: thresholds.sentiment_drop,
        actual: drop
      }
    }

    return null
  }

  /**
   * Detectar críticas de cuentas influyentes
   */
  private detectInfluentialCriticism(
    items: ProcessedItem[],
    thresholds: any
  ): CrisisCondition | null {
    // Filtrar menciones negativas de cuentas con >10K seguidores
    const influentialCriticism = items.filter(item => {
      const isNegative = item.sentiment.sentiment === 'negative'
      const followers = item.metadata?.author_followers || 0
      return isNegative && followers > 10000
    })

    const count = influentialCriticism.length

    if (count >= thresholds.influential_criticism) {
      const severity = count >= thresholds.influential_criticism * 3 ? 'critical' :
                      count >= thresholds.influential_criticism * 2 ? 'high' :
                      count >= thresholds.influential_criticism * 1.5 ? 'medium' : 'low'

      const topInfluencer = influentialCriticism.reduce((max, item) => {
        const followers = item.metadata?.author_followers || 0
        return followers > (max.metadata?.author_followers || 0) ? item : max
      }, influentialCriticism[0])

      return {
        type: 'influential_criticism',
        severity,
        description: `${count} críticas de cuentas influyentes (mayor: ${topInfluencer.author} con ${topInfluencer.metadata?.author_followers?.toLocaleString()} seguidores)`,
        threshold: thresholds.influential_criticism,
        actual: count
      }
    }

    return null
  }

  /**
   * Detectar hashtags negativos trending
   */
  private detectTrendingNegative(
    items: ProcessedItem[],
    thresholds: any
  ): CrisisCondition | null {
    // Extraer hashtags de items negativos
    const negativeItems = items.filter(item => item.sentiment.sentiment === 'negative')
    const hashtagCounts = new Map<string, number>()

    for (const item of negativeItems) {
      const hashtags = this.extractHashtags(item.content)
      for (const hashtag of hashtags) {
        hashtagCounts.set(hashtag, (hashtagCounts.get(hashtag) || 0) + 1)
      }
    }

    // Encontrar hashtag más usado
    let maxHashtag = ''
    let maxCount = 0
    for (const [hashtag, count] of hashtagCounts.entries()) {
      if (count > maxCount) {
        maxHashtag = hashtag
        maxCount = count
      }
    }

    if (maxCount >= thresholds.trending_negative) {
      const severity = maxCount >= thresholds.trending_negative * 3 ? 'critical' :
                      maxCount >= thresholds.trending_negative * 2 ? 'high' :
                      maxCount >= thresholds.trending_negative * 1.5 ? 'medium' : 'low'

      return {
        type: 'trending_negative',
        severity,
        description: `Hashtag negativo trending: #${maxHashtag} (${maxCount} usos)`,
        threshold: thresholds.trending_negative,
        actual: maxCount
      }
    }

    return null
  }

  /**
   * Detectar cobertura de medios
   */
  private detectMediaCoverage(
    items: ProcessedItem[],
    thresholds: any
  ): CrisisCondition | null {
    // Filtrar artículos de medios (type: 'article')
    const mediaArticles = items.filter(item => item.type === 'article')
    const negativeArticles = mediaArticles.filter(item => item.sentiment.sentiment === 'negative')
    const count = negativeArticles.length

    if (count >= thresholds.media_coverage) {
      const severity = count >= thresholds.media_coverage * 2 ? 'critical' :
                      count >= thresholds.media_coverage * 1.5 ? 'high' : 'medium'

      return {
        type: 'media_coverage',
        severity,
        description: `${count} artículos negativos en medios de comunicación`,
        threshold: thresholds.media_coverage,
        actual: count
      }
    }

    return null
  }

  /**
   * Calcular severidad individual basada en threshold
   */
  private calculateSeverity(
    actual: number,
    threshold: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    const ratio = actual / threshold

    if (ratio >= 3) return 'critical'
    if (ratio >= 2) return 'high'
    if (ratio >= 1.5) return 'medium'
    return 'low'
  }

  /**
   * Calcular severidad global de la crisis
   */
  private calculateOverallSeverity(
    triggers: CrisisCondition[]
  ): 'low' | 'medium' | 'high' | 'critical' {
    const severityScores = {
      low: 1,
      medium: 2,
      high: 3,
      critical: 4
    }

    const maxScore = Math.max(...triggers.map(t => severityScores[t.severity]))

    if (maxScore >= 4 || triggers.length >= 3) return 'critical'
    if (maxScore >= 3 || triggers.length >= 2) return 'high'
    if (maxScore >= 2) return 'medium'
    return 'low'
  }

  /**
   * Construir descripción de la crisis
   */
  private buildCrisisDescription(triggers: CrisisCondition[]): string {
    if (triggers.length === 1) {
      return triggers[0].description
    }

    const types = triggers.map(t => {
      switch (t.type) {
        case 'negative_spike': return 'pico de menciones negativas'
        case 'sentiment_drop': return 'caída en sentimiento'
        case 'influential_criticism': return 'críticas influyentes'
        case 'trending_negative': return 'hashtags negativos trending'
        case 'media_coverage': return 'cobertura mediática negativa'
        default: return t.type
      }
    })

    return `Crisis múltiple detectada: ${types.join(', ')}`
  }

  /**
   * Obtener acciones recomendadas
   */
  private getRecommendedActions(
    triggers: CrisisCondition[],
    severity: 'low' | 'medium' | 'high' | 'critical'
  ): string[] {
    const actions: string[] = []

    if (severity === 'critical') {
      actions.push('🚨 ACCIÓN INMEDIATA: Activar protocolo de crisis')
      actions.push('📞 Convocar war room de comunicación')
      actions.push('📝 Preparar comunicado oficial')
    }

    if (triggers.some(t => t.type === 'influential_criticism')) {
      actions.push('👥 Contactar directamente con influencers clave')
      actions.push('🤝 Ofrecer diálogo constructivo')
    }

    if (triggers.some(t => t.type === 'trending_negative')) {
      actions.push('📱 Monitorear trending topics en tiempo real')
      actions.push('💬 Preparar estrategia de contra-narrativa')
    }

    if (triggers.some(t => t.type === 'media_coverage')) {
      actions.push('📰 Ejercer derecho a réplica en medios')
      actions.push('🎤 Preparar vocero oficial')
    }

    if (triggers.some(t => t.type === 'negative_spike')) {
      actions.push('🔍 Identificar fuente del pico de negatividad')
      actions.push('✅ Responder rápidamente con hechos')
    }

    // Acciones generales
    actions.push('📊 Monitorear métricas cada 15 minutos')
    actions.push('🎯 Activar canales oficiales de comunicación')

    return actions
  }

  /**
   * Extraer hashtags de un texto
   */
  private extractHashtags(content: string): string[] {
    const hashtagRegex = /#(\w+)/g
    const matches = content.match(hashtagRegex) || []
    return matches.map(h => h.substring(1).toLowerCase()) // Remover # y normalizar
  }
}
