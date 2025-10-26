// Sentiment Analysis Edge Function
// Análisis de sentimientos de texto usando IA

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  text: string
  texts?: string[] // Para análisis en batch
}

interface SentimentResult {
  sentiment: 'positive' | 'negative' | 'neutral'
  score: number // 0-1
  explanation: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Parse body
    const body: RequestBody = await req.json()
    const { text, texts } = body

    if (!text && !texts) {
      throw new Error('text or texts is required')
    }

    // Si es batch, procesar múltiples textos
    if (texts && texts.length > 0) {
      const results = await analyzeSentimentBatch(texts)
      return new Response(
        JSON.stringify({ results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Análisis de un solo texto
    const result = await analyzeSentiment(text)

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error en sentiment analysis:', error)

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// ================================================
// FUNCIONES HELPER
// ================================================

async function analyzeSentiment(text: string): Promise<SentimentResult> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY')
  const deepseekKey = Deno.env.get('DEEPSEEK_API_KEY')

  if (!openaiKey && !deepseekKey) {
    return keywordBasedSentiment(text)
  }

  try {
    // Intentar con OpenAI
    if (openaiKey) {
      const messages = [
        {
          role: 'system',
          content: 'Eres un experto en análisis de sentimientos. Analiza el texto y devuelve SOLO un JSON válido con el formato: {"sentiment": "positive|negative|neutral", "score": 0.0-1.0, "explanation": "breve explicación"}'
        },
        {
          role: 'user',
          content: `Analiza el sentimiento de este texto: "${text}"`
        }
      ]

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages,
          temperature: 0.3,
          max_tokens: 200
        })
      })

      if (response.ok) {
        const data = await response.json()
        const content = data.choices[0].message.content
        return JSON.parse(content)
      }
    }

    // Fallback a DeepSeek
    if (deepseekKey) {
      const messages = [
        {
          role: 'system',
          content: 'Analiza sentimientos y devuelve JSON con formato: {"sentiment": "positive|negative|neutral", "score": 0.0-1.0, "explanation": "texto"}'
        },
        {
          role: 'user',
          content: `Analiza: "${text}"`
        }
      ]

      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${deepseekKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages,
          temperature: 0.3
        })
      })

      if (response.ok) {
        const data = await response.json()
        const content = data.choices[0].message.content
        return JSON.parse(content)
      }
    }

  } catch (error) {
    console.error('IA sentiment analysis failed, using keyword-based:', error)
  }

  // Fallback a análisis basado en keywords
  return keywordBasedSentiment(text)
}

async function analyzeSentimentBatch(texts: string[]): Promise<SentimentResult[]> {
  // Procesar en paralelo
  const results = await Promise.all(
    texts.map(text => analyzeSentiment(text))
  )
  return results
}

function keywordBasedSentiment(text: string): SentimentResult {
  const lowerText = text.toLowerCase()

  const positiveWords = [
    'excelente', 'bueno', 'genial', 'increíble', 'fantástico',
    'maravilloso', 'perfecto', 'mejor', 'éxito', 'feliz',
    'alegre', 'positivo', 'favorable', 'bien', 'gran'
  ]

  const negativeWords = [
    'malo', 'terrible', 'horrible', 'pésimo', 'desastre',
    'fracaso', 'problema', 'error', 'negativo', 'triste',
    'mal', 'peor', 'crítica', 'queja', 'deficiente'
  ]

  let positiveCount = 0
  let negativeCount = 0

  positiveWords.forEach(word => {
    if (lowerText.includes(word)) positiveCount++
  })

  negativeWords.forEach(word => {
    if (lowerText.includes(word)) negativeCount++
  })

  if (positiveCount > negativeCount) {
    return {
      sentiment: 'positive',
      score: Math.min(0.5 + (positiveCount * 0.1), 0.95),
      explanation: 'Análisis basado en palabras clave positivas detectadas'
    }
  }

  if (negativeCount > positiveCount) {
    return {
      sentiment: 'negative',
      score: Math.max(0.5 - (negativeCount * 0.1), 0.05),
      explanation: 'Análisis basado en palabras clave negativas detectadas'
    }
  }

  return {
    sentiment: 'neutral',
    score: 0.5,
    explanation: 'No se detectaron indicadores claros de sentimiento'
  }
}

/* Uso desde el cliente:

const response = await fetch(
  'https://fxyfzktnwugdfwclevdz.supabase.co/functions/v1/sentiment-analysis',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: 'Este producto es excelente'
    })
  }
)

const result = await response.json()
console.log(result) // { sentiment: 'positive', score: 0.85, explanation: '...' }

*/
