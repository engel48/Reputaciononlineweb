// =====================================================
// SCRAPING WORKER - Orquestador principal
// Fecha: 2025-10-29
// Edge Function para procesar jobs de scraping
// =====================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { FacebookScraper } from './scrapers/facebook-scraper.ts'
import { TwitterScraper } from './scrapers/twitter-scraper.ts'
import { SentimentAnalyzer } from './sentiment-analyzer.ts'
import { CrisisDetector } from './crisis-detector.ts'
import { WORKER_CONFIG, CREDIT_COSTS } from './config.ts'
import {
  ScrapingJob,
  RawItem,
  ProcessedItem,
  User,
  SocialMedia,
  JobResult
} from './types.ts'

// Configuración de Supabase
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const groqApiKey = Deno.env.get('GROQ_API_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  try {
    console.log('🚀 Scraping Worker iniciado')
    console.log(`Worker ID: ${WORKER_CONFIG.worker_id}`)

    // 1. Obtener jobs pendientes de la cola (ordenados por prioridad)
    const jobs = await fetchPendingJobs()

    if (jobs.length === 0) {
      console.log('ℹ️ No hay jobs pendientes')
      return new Response(
        JSON.stringify({ message: 'No pending jobs', processed: 0 }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📋 Encontrados ${jobs.length} jobs pendientes`)

    // 2. Procesar cada job
    const results = []
    for (const job of jobs) {
      try {
        const result = await processJob(job)
        results.push(result)
      } catch (error) {
        console.error(`❌ Error procesando job ${job.id}:`, error)
        await markJobAsFailed(job.id, error.message)
      }
    }

    // 3. Retornar resumen
    const summary = {
      worker_id: WORKER_CONFIG.worker_id,
      jobs_processed: results.length,
      jobs_succeeded: results.filter(r => r.success).length,
      jobs_failed: results.filter(r => !r.success).length,
      total_items_scraped: results.reduce((sum, r) => sum + (r.items_scraped || 0), 0),
      total_alerts_created: results.reduce((sum, r) => sum + (r.alerts_created || 0), 0),
      results
    }

    console.log('✅ Worker completado:', summary)

    return new Response(
      JSON.stringify(summary),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error fatal en worker:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

/**
 * Obtener jobs pendientes de la cola
 */
async function fetchPendingJobs(): Promise<ScrapingJob[]> {
  const { data, error } = await supabase
    .from('scraping_jobs')
    .select('*')
    .eq('status', 'pending')
    .or('scheduled_at.is.null,scheduled_at.lte.now()')
    .order('priority', { ascending: true }) // 1=máxima prioridad
    .order('created_at', { ascending: true })
    .limit(WORKER_CONFIG.max_jobs_per_execution)

  if (error) {
    console.error('Error fetching jobs:', error)
    return []
  }

  return data || []
}

/**
 * Procesar un job individual
 */
async function processJob(job: ScrapingJob): Promise<JobResult> {
  console.log(`\n🔄 Procesando job ${job.id} (${job.platform})`)

  // Marcar job como running
  await updateJobStatus(job.id, 'running')

  try {
    // 1. Obtener información del usuario
    const user = await getUser(job.user_id)
    if (!user) {
      throw new Error('Usuario no encontrado')
    }

    // 2. Verificar créditos (excepto plan político)
    if (user.plan !== 'politico' && user.credits < CREDIT_COSTS[`scrape_${job.platform}`]) {
      throw new Error('Créditos insuficientes')
    }

    // 3. Obtener token de acceso para la plataforma
    const socialMedia = await getSocialMediaToken(job.user_id, job.platform)
    if (!socialMedia) {
      throw new Error(`No hay conexión con ${job.platform}`)
    }

    // 4. Scraping
    const rawItems = await scrapeItems(job, socialMedia.access_token, user.keywords)
    console.log(`  📥 Scrapeados ${rawItems.length} items`)

    if (rawItems.length === 0) {
      await updateJobStatus(job.id, 'completed', {
        success: true,
        items_scraped: 0,
        items_saved: 0,
        alerts_created: 0,
        crisis_detected: false
      })
      return {
        success: true,
        items_scraped: 0,
        items_saved: 0,
        alerts_created: 0,
        crisis_detected: false
      }
    }

    // 5. Análisis de sentimiento
    const analyzer = new SentimentAnalyzer(groqApiKey)
    const sentiments = await analyzer.analyzeBatch(rawItems)
    console.log(`  🎯 Analizados ${sentiments.length} sentimientos`)

    // 6. Procesar items (agregar sentimiento y metadata)
    const processedItems: ProcessedItem[] = await Promise.all(
      rawItems.map(async (item, index) => ({
        ...item,
        user_id: job.user_id,
        sentiment: sentiments[index],
        entities: extractEntities(item.content, user.keywords),
        relevance_score: calculateRelevance(item, user.keywords, sentiments[index]),
        content_hash: await hashContent(item.content),
        scraped_at: new Date(),
        keywords_matched: user.keywords.filter(kw =>
          item.content.toLowerCase().includes(kw.toLowerCase())
        )
      }))
    )

    // 7. Guardar items en la base de datos (deduplicar por content_hash)
    const savedItems = await saveItems(processedItems)
    console.log(`  💾 Guardados ${savedItems} items (deduplicados)`)

    // 8. Detección de crisis
    const crisisDetector = new CrisisDetector()
    const crisisResult = await crisisDetector.detect(processedItems, user)

    let alertsCreated = 0
    if (crisisResult.is_crisis) {
      console.log(`  ⚠️ CRISIS DETECTADA: ${crisisResult.severity}`)
      await createCrisisAlert(user.id, crisisResult)
      alertsCreated = 1
    }

    // 9. Deducir créditos (solo si no es plan político)
    if (user.plan !== 'politico') {
      const creditCost = CREDIT_COSTS[`scrape_${job.platform}`] +
                        (CREDIT_COSTS.sentiment_analysis * rawItems.length)
      await deductCredits(user.id, creditCost, `Scraping ${job.platform}: ${rawItems.length} items`)
    }

    // 10. Marcar job como completado
    const result: JobResult = {
      success: true,
      items_scraped: rawItems.length,
      items_saved: savedItems,
      alerts_created: alertsCreated,
      crisis_detected: crisisResult.is_crisis
    }

    await updateJobStatus(job.id, 'completed', result)

    console.log(`  ✅ Job ${job.id} completado`)
    return result

  } catch (error) {
    console.error(`  ❌ Error en job ${job.id}:`, error)

    // Reintentar si no se alcanzó el máximo de reintentos
    if (job.retry_count < WORKER_CONFIG.max_retries) {
      await retryJob(job.id, job.retry_count + 1)
    } else {
      await markJobAsFailed(job.id, error.message)
    }

    return {
      success: false,
      items_scraped: 0,
      items_saved: 0,
      alerts_created: 0,
      crisis_detected: false
    }
  }
}

/**
 * Scraping de items según plataforma
 */
async function scrapeItems(
  job: ScrapingJob,
  accessToken: string,
  userKeywords: string[]
): Promise<RawItem[]> {
  const params = {
    access_token: accessToken,
    user_id: job.user_id,
    platform: job.platform,
    config: job.config,
    keywords: [...userKeywords, ...(job.config.keywords || [])]
  }

  switch (job.platform) {
    case 'facebook':
    case 'instagram': {
      const scraper = new FacebookScraper()
      return await scraper.scrape(params)
    }
    case 'twitter': {
      const scraper = new TwitterScraper()
      return await scraper.scrape(params)
    }
    default:
      throw new Error(`Plataforma no soportada: ${job.platform}`)
  }
}

/**
 * Obtener usuario
 */
async function getUser(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, name, plan, credits, keywords')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error getting user:', error)
    return null
  }

  return data
}

/**
 * Obtener token de social media
 */
async function getSocialMediaToken(
  userId: string,
  platform: string
): Promise<SocialMedia | null> {
  const { data, error } = await supabase
    .from('social_media')
    .select('*')
    .eq('user_id', userId)
    .eq('platform', platform)
    .eq('connected', true)
    .single()

  if (error) {
    console.error('Error getting social media token:', error)
    return null
  }

  return data
}

/**
 * Guardar items procesados (con deduplicación)
 */
async function saveItems(items: ProcessedItem[]): Promise<number> {
  if (items.length === 0) return 0

  // Mapear a formato de scraped_news
  const records = items.map(item => ({
    id: crypto.randomUUID(),
    user_id: item.user_id,
    platform: item.platform,
    url: item.url,
    title: item.content.substring(0, 200), // Primeros 200 chars como título
    content: item.content,
    author: item.author,
    published_at: item.published_at,
    sentiment: item.sentiment.sentiment,
    sentiment_score: item.sentiment.score,
    relevance_score: item.relevance_score,
    engagement_likes: item.engagement.likes,
    engagement_comments: item.engagement.comments,
    engagement_shares: item.engagement.shares,
    reach: item.reach,
    metadata: item.metadata,
    content_hash: item.content_hash,
    scraped_at: item.scraped_at,
    created_at: new Date()
  }))

  // Insertar con on_conflict para deduplicar por content_hash
  const { data, error } = await supabase
    .from('scraped_news')
    .upsert(records, {
      onConflict: 'content_hash',
      ignoreDuplicates: true
    })
    .select()

  if (error) {
    console.error('Error saving items:', error)
    return 0
  }

  return data?.length || 0
}

/**
 * Crear alerta de crisis
 */
async function createCrisisAlert(userId: string, crisis: any): Promise<void> {
  const { error } = await supabase
    .from('crisis_alerts')
    .insert({
      user_id: userId,
      type: crisis.type,
      severity: crisis.severity,
      description: crisis.description,
      trigger_data: {
        triggers: crisis.triggers,
        recommended_actions: crisis.recommended_actions
      },
      status: 'active',
      created_at: new Date()
    })

  if (error) {
    console.error('Error creating crisis alert:', error)
  }
}

/**
 * Deducir créditos del usuario
 */
async function deductCredits(
  userId: string,
  amount: number,
  description: string
): Promise<void> {
  const { error } = await supabase.rpc('deduct_user_credits', {
    p_user_id: userId,
    p_amount: amount,
    p_description: description
  })

  if (error) {
    console.error('Error deducting credits:', error)
  }
}

/**
 * Actualizar estado del job
 */
async function updateJobStatus(
  jobId: string,
  status: string,
  result?: JobResult
): Promise<void> {
  const updates: any = {
    status,
    worker_id: WORKER_CONFIG.worker_id,
    updated_at: new Date()
  }

  if (status === 'running') {
    updates.started_at = new Date()
  }

  if (status === 'completed') {
    updates.completed_at = new Date()
    if (result) {
      updates.result = result
    }
  }

  await supabase
    .from('scraping_jobs')
    .update(updates)
    .eq('id', jobId)
}

/**
 * Marcar job como fallido
 */
async function markJobAsFailed(jobId: string, errorMessage: string): Promise<void> {
  await supabase
    .from('scraping_jobs')
    .update({
      status: 'failed',
      error_message: errorMessage,
      completed_at: new Date(),
      updated_at: new Date()
    })
    .eq('id', jobId)
}

/**
 * Reintentar job
 */
async function retryJob(jobId: string, retryCount: number): Promise<void> {
  await supabase
    .from('scraping_jobs')
    .update({
      status: 'pending',
      retry_count: retryCount,
      scheduled_at: new Date(Date.now() + 60000 * retryCount), // Esperar 1min * retry_count
      updated_at: new Date()
    })
    .eq('id', jobId)

  console.log(`  🔄 Job ${jobId} marcado para reintento ${retryCount}/${WORKER_CONFIG.max_retries}`)
}

/**
 * Extraer entidades del contenido
 */
function extractEntities(content: string, keywords: string[]): string[] {
  const entities: string[] = []

  // Extraer menciones (@username)
  const mentions = content.match(/@\w+/g) || []
  entities.push(...mentions)

  // Extraer hashtags
  const hashtags = content.match(/#\w+/g) || []
  entities.push(...hashtags)

  // Agregar keywords encontrados
  for (const keyword of keywords) {
    if (content.toLowerCase().includes(keyword.toLowerCase())) {
      entities.push(keyword)
    }
  }

  return [...new Set(entities)] // Deduplicar
}

/**
 * Calcular relevancia del item
 */
function calculateRelevance(
  item: RawItem,
  keywords: string[],
  sentiment: any
): number {
  let score = 0.5 // Base

  // +0.2 si contiene keywords
  const containsKeywords = keywords.some(kw =>
    item.content.toLowerCase().includes(kw.toLowerCase())
  )
  if (containsKeywords) score += 0.2

  // +0.1 por engagement alto
  const totalEngagement = item.engagement.likes + item.engagement.comments + item.engagement.shares
  if (totalEngagement > 100) score += 0.1
  if (totalEngagement > 1000) score += 0.1

  // +0.1 si sentimiento es extremo (muy positivo o muy negativo)
  if (sentiment.score < 0.3 || sentiment.score > 0.7) score += 0.1

  return Math.min(score, 1.0)
}

/**
 * Hash del contenido para deduplicación
 */
async function hashContent(content: string): Promise<string> {
  try {
    // Usar crypto.subtle para SHA-256
    const encoder = new TextEncoder()
    const data = encoder.encode(content)
    const buffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(buffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  } catch (error) {
    // Fallback: simple hash
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return hash.toString(16)
  }
}
