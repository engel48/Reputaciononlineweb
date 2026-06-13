// Julia Chat Edge Function
// Chat con Julia AI con streaming de respuestas
// Sin límites de timeout (vs 60s de Next.js API Routes)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { callGroqStream, GroqMessage } from '../_shared/groq.ts'

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

    // SOLO Groq (IA real, con streaming)
    const groqKey = Deno.env.get('GROQ_API_KEY')
    if (!groqKey) {
      throw new Error('GROQ_API_KEY no configurada')
    }

    const systemPrompt = `Eres Julia, una asistente de IA especializada en análisis de reputación online y monitoreo de redes sociales.

Eres amigable, profesional y experta en:
- Análisis de sentimientos
- Monitoreo de redes sociales
- Gestión de reputación online
- Estrategias de comunicación digital
- Análisis de tendencias

${context ? `\nContexto adicional: ${context}` : ''}`

    const messages: GroqMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ]

    console.log('🤖 Usando Groq para respuesta...')
    const response = await callGroqStream(messages, { apiKey: groqKey, temperature: 0.8, maxTokens: 2000 })

    if (!response.ok) {
      console.error('Groq error:', await response.text())
      throw new Error('Groq API error')
    }

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    })

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
