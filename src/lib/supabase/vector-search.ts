/**
 * Vector Search Helper con pgvector
 *
 * Búsqueda semántica usando embeddings de OpenAI
 * Casos de uso:
 * - Búsqueda inteligente de menciones
 * - Encontrar noticias similares
 * - Agrupar menciones por tema
 * - Detección de tendencias
 */

import { createClient } from './server'

// ================================================
// CONFIGURACIÓN
// ================================================

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY

// Modelo de embeddings (OpenAI)
const EMBEDDING_MODEL = 'text-embedding-3-small' // 1536 dimensiones
const EMBEDDING_DIMENSIONS = 1536

// ================================================
// GENERACIÓN DE EMBEDDINGS
// ================================================

/**
 * Generar embedding usando OpenAI
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!OPENAI_API_KEY && !DEEPSEEK_API_KEY) {
    throw new Error('No hay API key configurada para embeddings')
  }

  try {
    // Intentar con OpenAI primero
    if (OPENAI_API_KEY) {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: EMBEDDING_MODEL,
          input: text,
        })
      })

      if (response.ok) {
        const data = await response.json()
        return data.data[0].embedding
      }
    }

    // Fallback a DeepSeek (si tiene soporte para embeddings)
    // Por ahora, lanzar error si OpenAI falla
    throw new Error('No se pudo generar embedding')

  } catch (error) {
    console.error('Error generando embedding:', error)
    throw error
  }
}

/**
 * Generar embeddings para múltiples textos (batch)
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key no configurada')
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: texts,
    })
  })

  if (!response.ok) {
    throw new Error('Error generando embeddings')
  }

  const data = await response.json()
  return data.data.map((item: any) => item.embedding)
}

// ================================================
// BÚSQUEDA SEMÁNTICA DE MENCIONES
// ================================================

export interface SimilarMention {
  id: string
  content: string
  source: string
  author: string
  published_at: string | null
  sentiment: string | null
  similarity: number
}

/**
 * Buscar menciones similares usando búsqueda semántica
 */
export async function searchSimilarMentions(
  query: string,
  userId?: string,
  options: {
    threshold?: number
    limit?: number
  } = {}
): Promise<SimilarMention[]> {
  const {
    threshold = 0.78,
    limit = 10
  } = options

  // Generar embedding del query
  const queryEmbedding = await generateEmbedding(query)

  // Buscar en la base de datos
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('search_similar_mentions', {
    query_embedding: queryEmbedding,
    user_id_filter: userId || null,
    match_threshold: threshold,
    match_count: limit
  })

  if (error) {
    console.error('Error en búsqueda semántica:', error)
    throw error
  }

  return data as SimilarMention[]
}

// ================================================
// BÚSQUEDA SEMÁNTICA DE NOTICIAS
// ================================================

export interface SimilarNews {
  id: string
  title: string
  content: string
  source: string
  published_at: string | null
  similarity: number
}

/**
 * Buscar noticias similares
 */
export async function searchSimilarNews(
  query: string,
  options: {
    threshold?: number
    limit?: number
  } = {}
): Promise<SimilarNews[]> {
  const {
    threshold = 0.78,
    limit = 10
  } = options

  const queryEmbedding = await generateEmbedding(query)

  const supabase = await createClient()

  const { data, error } = await supabase.rpc('search_similar_news', {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: limit
  })

  if (error) {
    console.error('Error en búsqueda de noticias:', error)
    throw error
  }

  return data as SimilarNews[]
}

// ================================================
// CLUSTERING DE MENCIONES
// ================================================

export interface MentionCluster {
  mention_id: string
  similar_mention_ids: string[]
  cluster_size: number
}

/**
 * Agrupar menciones similares (detección de tendencias)
 */
export async function clusterMentions(
  userId: string,
  options: {
    similarityThreshold?: number
    maxResults?: number
  } = {}
): Promise<MentionCluster[]> {
  const {
    similarityThreshold = 0.85,
    maxResults = 50
  } = options

  const supabase = await createClient()

  const { data, error } = await supabase.rpc('cluster_mentions_by_similarity', {
    user_id_filter: userId,
    similarity_threshold: similarityThreshold,
    max_results: maxResults
  })

  if (error) {
    console.error('Error agrupando menciones:', error)
    throw error
  }

  return data as MentionCluster[]
}

// ================================================
// GUARDAR MENCIÓN CON EMBEDDING
// ================================================

/**
 * Crear mención con embedding automático
 */
export async function createMentionWithEmbedding(mention: {
  user_id: string
  content: string
  source: string
  source_url?: string
  author?: string
  author_url?: string
  published_at?: Date
  sentiment?: 'positive' | 'negative' | 'neutral'
  sentiment_score?: number
  metadata?: Record<string, any>
}) {
  // Generar embedding del contenido
  const embedding = await generateEmbedding(mention.content)

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('mentions')
    .insert({
      id: `mention_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      user_id: mention.user_id,
      content: mention.content,
      source: mention.source,
      source_url: mention.source_url,
      author: mention.author,
      author_url: mention.author_url,
      published_at: mention.published_at?.toISOString(),
      sentiment: mention.sentiment,
      sentiment_score: mention.sentiment_score,
      embedding: embedding,
      metadata: mention.metadata ? JSON.stringify(mention.metadata) : null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creando mención:', error)
    throw error
  }

  return data
}

// ================================================
// ACTUALIZAR EMBEDDING DE MENCIÓN EXISTENTE
// ================================================

/**
 * Actualizar el embedding de una mención existente
 * Útil si cambias el contenido o para re-indexar
 */
export async function updateMentionEmbedding(mentionId: string) {
  const supabase = await createClient()

  // Obtener el contenido de la mención
  const { data: mention, error: fetchError } = await supabase
    .from('mentions')
    .select('content')
    .eq('id', mentionId)
    .single()

  if (fetchError || !mention) {
    throw new Error('Mención no encontrada')
  }

  // Generar nuevo embedding
  const embedding = await generateEmbedding(mention.content)

  // Actualizar
  const { error: updateError } = await supabase
    .from('mentions')
    .update({ embedding })
    .eq('id', mentionId)

  if (updateError) {
    throw updateError
  }

  return true
}

// ================================================
// RE-INDEXAR TODAS LAS MENCIONES
// ================================================

/**
 * Re-indexar todas las menciones de un usuario
 * Útil para migración inicial o cambio de modelo
 */
export async function reindexAllMentions(userId: string) {
  const supabase = await createClient()

  // Obtener todas las menciones sin embedding
  const { data: mentions, error } = await supabase
    .from('mentions')
    .select('id, content')
    .eq('user_id', userId)
    .is('embedding', null)

  if (error || !mentions) {
    console.error('Error obteniendo menciones:', error)
    return 0
  }

  console.log(`🔄 Re-indexando ${mentions.length} menciones...`)

  let indexed = 0

  // Procesar en batches de 10
  for (let i = 0; i < mentions.length; i += 10) {
    const batch = mentions.slice(i, i + 10)

    try {
      // Generar embeddings en batch
      const texts = batch.map(m => m.content)
      const embeddings = await generateEmbeddings(texts)

      // Actualizar cada mención
      for (let j = 0; j < batch.length; j++) {
        await supabase
          .from('mentions')
          .update({ embedding: embeddings[j] })
          .eq('id', batch[j].id)

        indexed++
      }

      console.log(`✅ Indexadas ${indexed}/${mentions.length}`)

      // Pequeña pausa para no sobrecargar la API
      await new Promise(resolve => setTimeout(resolve, 1000))

    } catch (error) {
      console.error(`Error indexando batch ${i}:`, error)
    }
  }

  console.log(`🎉 Re-indexación completada: ${indexed} menciones`)
  return indexed
}

// ================================================
// ESTADÍSTICAS DE BÚSQUEDA
// ================================================

/**
 * Obtener estadísticas sobre el índice vectorial
 */
export async function getVectorIndexStats(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('mentions')
    .select('id, embedding')
    .eq('user_id', userId)

  if (error) {
    throw error
  }

  const total = data.length
  const indexed = data.filter(m => m.embedding !== null).length
  const notIndexed = total - indexed

  return {
    total,
    indexed,
    notIndexed,
    indexedPercentage: total > 0 ? (indexed / total) * 100 : 0
  }
}

// ================================================
// EJEMPLO DE USO
// ================================================

/**
 * Ejemplo de búsqueda semántica
 */
export async function exampleSemanticSearch() {
  const userId = 'user-123'

  // Crear mención con embedding
  await createMentionWithEmbedding({
    user_id: userId,
    content: 'El alcalde inauguró un nuevo parque en la ciudad',
    source: 'twitter',
    author: '@ciudadano',
    sentiment: 'positive'
  })

  // Buscar menciones similares
  const similar = await searchSimilarMentions(
    'nuevo parque en la ciudad',
    userId,
    { threshold: 0.75, limit: 5 }
  )

  console.log('Menciones similares:', similar)

  // Detectar clusters/tendencias
  const clusters = await clusterMentions(userId, {
    similarityThreshold: 0.85
  })

  console.log('Tendencias detectadas:', clusters)

  // Estadísticas
  const stats = await getVectorIndexStats(userId)
  console.log('Estadísticas del índice:', stats)
}
