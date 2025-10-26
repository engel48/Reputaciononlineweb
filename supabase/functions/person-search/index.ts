// Person Search Edge Function
// Búsqueda de información de personas usando IA

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PersonInfo {
  bio: string
  highlights: string[]
  socialPresence: string[]
  reputationInsights: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Auth
    const authHeader = req.headers.get('Authorization')
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader! } } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Parse request
    const { name, context } = await req.json()
    if (!name) throw new Error('name is required')

    // Call AI
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    const deepseekKey = Deno.env.get('DEEPSEEK_API_KEY')

    const messages = [
      {
        role: 'system',
        content: 'Eres un experto en investigación de perfiles públicos. Proporciona información profesional en formato JSON.'
      },
      {
        role: 'user',
        content: `Busca información sobre: ${name}${context ? `. Contexto: ${context}` : ''}

Devuelve JSON con:
{
  "bio": "biografía breve",
  "highlights": ["logro 1", "logro 2"],
  "socialPresence": ["red social 1", "red social 2"],
  "reputationInsights": "análisis de reputación"
}`
      }
    ]

    const apiUrl = openaiKey
      ? 'https://api.openai.com/v1/chat/completions'
      : 'https://api.deepseek.com/v1/chat/completions'

    const apiKey = openaiKey || deepseekKey

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: openaiKey ? 'gpt-3.5-turbo' : 'deepseek-chat',
        messages,
        temperature: 0.5
      })
    })

    const data = await response.json()
    const content = data.choices[0].message.content

    let result: PersonInfo
    try {
      result = JSON.parse(content)
    } catch {
      result = {
        bio: content,
        highlights: [],
        socialPresence: [],
        reputationInsights: 'No disponible'
      }
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
