// Sentiment Analysis Edge Function
// Análisis de sentimientos de texto usando IA

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { callGroq, parseGroqJson } from '../_shared/groq.ts'

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

// Análisis SOLO con Groq (IA real). Si falla, lanza (no se simula con keywords).
async function analyzeSentiment(text: string): Promise<SentimentResult> {
  const content = await callGroq(
    [
      {
        role: 'system',
        content: 'Eres un experto en análisis de sentimientos en español colombiano (detectas ironía, sarcasmo y emojis). Devuelve SOLO un JSON válido: {"sentiment": "positive|negative|neutral", "score": 0.0-1.0, "explanation": "breve explicación"} donde 0.0=muy negativo, 0.5=neutral, 1.0=muy positivo.'
      },
      { role: 'user', content: `Analiza el sentimiento de este texto: "${text}"` }
    ],
    { temperature: 0.3, maxTokens: 300, jsonMode: true }
  )
  const parsed = parseGroqJson(content)
  return {
    sentiment: ['positive', 'negative', 'neutral'].includes(parsed.sentiment) ? parsed.sentiment : 'neutral',
    score: typeof parsed.score === 'number' ? Math.max(0, Math.min(1, parsed.score)) : 0.5,
    explanation: parsed.explanation || '',
  }
}

async function analyzeSentimentBatch(texts: string[]): Promise<SentimentResult[]> {
  // Procesar en paralelo
  const results = await Promise.all(
    texts.map(text => analyzeSentiment(text))
  )
  return results
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
