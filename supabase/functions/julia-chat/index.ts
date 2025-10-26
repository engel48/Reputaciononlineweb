// Julia Chat Edge Function
// Chat con Julia AI con streaming de respuestas
// Sin límites de timeout (vs 60s de Next.js API Routes)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  message: string
  context?: string
  userId?: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verificar autenticación
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Verificar usuario
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    console.log('✅ Usuario autenticado:', user.id)

    // Parsear body
    const body: RequestBody = await req.json()
    const { message, context, userId } = body

    if (!message) {
      throw new Error('Message is required')
    }

    // Determinar qué API usar (OpenAI o DeepSeek)
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    const deepseekKey = Deno.env.get('DEEPSEEK_API_KEY')

    if (!openaiKey && !deepseekKey) {
      throw new Error('No AI API keys configured')
    }

    // Preparar mensajes para la AI
    const systemPrompt = `Eres Julia, una asistente de IA especializada en análisis de reputación online y monitoreo de redes sociales.

Eres amigable, profesional y experta en:
- Análisis de sentimientos
- Monitoreo de redes sociales
- Gestión de reputación online
- Estrategias de comunicación digital
- Análisis de tendencias

${context ? `\nContexto adicional: ${context}` : ''}`

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ]

    // Intentar con OpenAI primero (con streaming)
    if (openaiKey) {
      console.log('🤖 Usando OpenAI para respuesta...')

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages,
          temperature: 0.8,
          max_tokens: 2000,
          stream: true // Habilitar streaming
        })
      })

      if (!response.ok) {
        console.error('OpenAI error:', await response.text())
        throw new Error('OpenAI API error')
      }

      // Retornar stream de respuestas
      return new Response(response.body, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        }
      })
    }

    // Fallback a DeepSeek (con streaming)
    if (deepseekKey) {
      console.log('🤖 Usando DeepSeek para respuesta...')

      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${deepseekKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages,
          temperature: 0.8,
          max_tokens: 2000,
          stream: true
        })
      })

      if (!response.ok) {
        console.error('DeepSeek error:', await response.text())
        throw new Error('DeepSeek API error')
      }

      return new Response(response.body, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        }
      })
    }

    throw new Error('No AI service available')

  } catch (error) {
    console.error('❌ Error en Julia Chat:', error)

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

/* Edge Function Deployment:
 *
 * Para deployar esta función:
 * 1. Instalar Supabase CLI: npm install -g supabase
 * 2. Login: supabase login
 * 3. Link proyecto: supabase link --project-ref fxyfzktnwugdfwclevdz
 * 4. Deploy: supabase functions deploy julia-chat
 *
 * Para testear localmente:
 * supabase functions serve julia-chat --env-file ./supabase/.env.local
 *
 * URL de invocación:
 * https://fxyfzktnwugdfwclevdz.supabase.co/functions/v1/julia-chat
 */
