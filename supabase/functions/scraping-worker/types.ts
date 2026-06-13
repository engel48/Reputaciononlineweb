// =====================================================
// TYPES PARA SCRAPING WORKER
// Fecha: 2025-10-29
// =====================================================

export interface ScrapingJob {
  id: string
  user_id: string
  platform: string
  status: 'pending' | 'processing' | 'running' | 'completed' | 'failed'
  priority: number // 1-5 (1=alta, 5=baja)
  config: JobConfig
  retry_count: number
  scheduled_at: string | null
  started_at: string | null
  completed_at: string | null
  worker_id: string | null
  result: JobResult | null
  error_message: string | null
  created_at: string
  updated_at: string
}

export interface JobConfig {
  lookback_hours: number
  keywords: string[]
  access_token?: string
  refresh_token?: string
  token_expiry?: string
}

export interface JobResult {
  success: boolean
  items_scraped: number
  items_saved: number
  alerts_created: number
  crisis_detected: boolean
}

export interface RawItem {
  id: string
  content: string
  author: string
  author_id: string
  platform: string
  type: 'post' | 'tweet' | 'comment' | 'article' | 'mention'
  url: string
  published_at: Date
  engagement: {
    likes: number
    comments: number
    shares: number
  }
  reach: number
  metadata: Record<string, any>
}

export interface ProcessedItem extends RawItem {
  user_id: string
  sentiment: SentimentResult
  entities: string[]
  relevance_score: number
  content_hash: string
  scraped_at: Date
  keywords_matched: string[]
}

export interface SentimentResult {
  sentiment: 'positive' | 'negative' | 'neutral'
  score: number // 0.0 - 1.0
  confidence: number // 0.0 - 1.0
  keywords: string[]
  explanation: string
  method: 'groq'
}

export interface User {
  id: string
  email: string
  name: string
  plan: 'free' | 'basico' | 'profesional' | 'empresarial' | 'politico'
  credits: number
  keywords: string[]
}

export interface SocialMedia {
  id: string
  user_id: string
  platform: string
  connected: boolean
  access_token: string
  refresh_token: string
  token_expiry: string
  username: string
}

export interface CrisisThresholds {
  negative_spike: number
  sentiment_drop: number
  influential_criticism: number
  trending_negative: number
  media_coverage: number
}

export interface CrisisCondition {
  type: 'negative_spike' | 'sentiment_drop' | 'influential_criticism' | 'trending_negative' | 'media_coverage'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  threshold: number
  actual: number
}

export interface CrisisResult {
  is_crisis: boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
  type: string
  description: string
  triggers: CrisisCondition[]
  recommended_actions: string[]
}

export interface WorkerConfig {
  max_jobs_per_execution: number
  job_timeout: number // milliseconds
  max_retries: number
  worker_id: string
}

export interface RateLimitConfig {
  requests_per_minute?: number
  requests_per_hour?: number
  requests_per_day?: number
}

export interface ScraperParams {
  access_token: string
  user_id: string
  platform: string
  config: JobConfig
  keywords: string[]
}
