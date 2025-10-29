// =====================================================
// CONFIGURACIÓN PARA SCRAPING WORKER
// Fecha: 2025-10-29
// =====================================================

import { CrisisThresholds, RateLimitConfig, WorkerConfig } from './types.ts'

// Configuración del Worker
export const WORKER_CONFIG: WorkerConfig = {
  max_jobs_per_execution: 5, // Límite Edge Function
  job_timeout: 45000, // 45 segundos (Edge Functions timeout a 50s)
  max_retries: 3,
  worker_id: `worker-${crypto.randomUUID().split('-')[0]}`
}

// Rate Limits por Plataforma
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  facebook: {
    requests_per_hour: 200
  },
  instagram: {
    requests_per_hour: 200
  },
  twitter: {
    requests_per_minute: 20 // 300 per 15min = 20 per min
  },
  linkedin: {
    requests_per_hour: 100
  },
  youtube: {
    requests_per_day: 10000
  },
  threads: {
    requests_per_hour: 200
  },
  tiktok: {
    requests_per_day: 1000
  }
}

// Thresholds de Crisis por Plan
export const CRISIS_THRESHOLDS: Record<string, CrisisThresholds> = {
  politico: {
    negative_spike: 50,        // 50 menciones negativas en 1 hora
    sentiment_drop: 0.3,       // 30% caída en sentimiento
    influential_criticism: 1,   // 1 crítica de cuenta >10K followers
    trending_negative: 10,      // Hashtag con >10 usos
    media_coverage: 5          // 5 artículos de medios
  },
  empresarial: {
    negative_spike: 100,
    sentiment_drop: 0.4,
    influential_criticism: 2,
    trending_negative: 20,
    media_coverage: 10
  },
  profesional: {
    negative_spike: 200,
    sentiment_drop: 0.5,
    influential_criticism: 3,
    trending_negative: 30,
    media_coverage: 15
  },
  basico: {
    negative_spike: 500,
    sentiment_drop: 0.6,
    influential_criticism: 5,
    trending_negative: 50,
    media_coverage: 20
  },
  free: {
    negative_spike: 1000,
    sentiment_drop: 0.7,
    influential_criticism: 10,
    trending_negative: 100,
    media_coverage: 30
  }
}

// Costos de Créditos por Operación
export const CREDIT_COSTS = {
  scrape_facebook: 2,
  scrape_twitter: 2,
  scrape_linkedin: 3,
  scrape_instagram: 2,
  scrape_youtube: 3,
  scrape_threads: 2,
  sentiment_analysis: 1,
  entity_extraction: 1,
  crisis_detection: 0 // No cuesta créditos extra
}

// Keywords Positivas (para análisis de sentimiento fallback)
export const POSITIVE_KEYWORDS = [
  'excelente', 'increíble', 'genial', 'fantástico', 'bueno', 'bien',
  'me gusta', 'love', 'great', 'awesome', 'amazing', 'felicitaciones',
  'éxito', 'logro', 'admirar', 'respeto', 'apoyo', 'gracias',
  'maravilloso', 'perfecto', 'espectacular', 'brillante', 'sobresaliente'
]

// Keywords Negativas (para análisis de sentimiento fallback)
export const NEGATIVE_KEYWORDS = [
  'malo', 'terrible', 'horrible', 'odio', 'disgusto', 'bad', 'hate',
  'awful', 'worst', 'pésimo', 'desastre', 'fracaso', 'corrupto',
  'mentiroso', 'incompetente', 'inútil', 'vergüenza', 'escándalo',
  'decepción', 'lamentable', 'inaceptable', 'indignante', 'repudiable'
]

// URLs de APIs
export const API_URLS = {
  facebook: 'https://graph.facebook.com/v21.0',
  twitter: 'https://api.twitter.com/2',
  linkedin: 'https://api.linkedin.com/v2',
  youtube: 'https://www.googleapis.com/youtube/v3',
  threads: 'https://graph.threads.net/v1.0'
}

// Configuración de Gemini
export const GEMINI_CONFIG = {
  model: 'gemini-1.5-flash',
  temperature: 0.3, // Determinístico para análisis
  max_tokens: 1024
}
