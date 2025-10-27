/**
 * Edge Function: refresh-oauth-tokens
 *
 * Propósito: Refrescar automáticamente tokens OAuth que están por expirar
 * Ejecución: Debe ejecutarse cada 30 minutos vía Supabase Cron
 *
 * IMPORTANTE: Esta función trabaja con datos REALES de OAuth,
 *             NO con simulaciones.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ============================================
// TIPOS Y CONFIGURACIONES
// ============================================

interface OAuthToken {
  id: string
  user_id: string
  platform: string
  refresh_token: string
  token_expiry: string
}

interface RefreshResult {
  platform: string
  success: boolean
  error?: string
}

// Configuración de refreshers por plataforma
const PLATFORM_CONFIGS = {
  facebook: {
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    expiresIn: 60 * 24 * 60 * 60 * 1000, // 60 días
  },
  instagram: {
    tokenUrl: 'https://graph.instagram.com/refresh_access_token',
    expiresIn: 60 * 24 * 60 * 60 * 1000, // 60 días
  },
  linkedin: {
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    expiresIn: 60 * 24 * 60 * 60 * 1000, // 60 días
  },
  google: {
    tokenUrl: 'https://oauth2.googleapis.com/token',
    expiresIn: 60 * 60 * 1000, // 1 hora
  },
  twitter: {
    // Twitter/X usa OAuth 2.0 con PKCE
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    expiresIn: 2 * 60 * 60 * 1000, // 2 horas
  },
}

// ============================================
// FUNCIONES DE REFRESH POR PLATAFORMA
// ============================================

async function refreshFacebookToken(refreshToken: string): Promise<{ access_token: string; expires_in: number } | null> {
  const appId = Deno.env.get('FACEBOOK_CLIENT_ID')
  const appSecret = Deno.env.get('FACEBOOK_CLIENT_SECRET')

  if (!appId || !appSecret) {
    console.error('Facebook credentials not configured')
    return null
  }

  try {
    const response = await fetch(
      `${PLATFORM_CONFIGS.facebook.tokenUrl}?` +
      `grant_type=fb_exchange_token&` +
      `client_id=${appId}&` +
      `client_secret=${appSecret}&` +
      `fb_exchange_token=${refreshToken}`
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('Facebook token refresh failed:', error)
      return null
    }

    const data = await response.json()
    return {
      access_token: data.access_token,
      expires_in: data.expires_in || 5184000, // 60 días por defecto
    }
  } catch (error) {
    console.error('Facebook token refresh error:', error)
    return null
  }
}

async function refreshInstagramToken(refreshToken: string): Promise<{ access_token: string; expires_in: number } | null> {
  try {
    const response = await fetch(
      `${PLATFORM_CONFIGS.instagram.tokenUrl}?` +
      `grant_type=ig_refresh_token&` +
      `access_token=${refreshToken}`
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('Instagram token refresh failed:', error)
      return null
    }

    const data = await response.json()
    return {
      access_token: data.access_token,
      expires_in: data.expires_in || 5184000, // 60 días por defecto
    }
  } catch (error) {
    console.error('Instagram token refresh error:', error)
    return null
  }
}

async function refreshLinkedInToken(refreshToken: string): Promise<{ access_token: string; expires_in: number } | null> {
  const clientId = Deno.env.get('LINKEDIN_CLIENT_ID')
  const clientSecret = Deno.env.get('LINKEDIN_CLIENT_SECRET')

  if (!clientId || !clientSecret) {
    console.error('LinkedIn credentials not configured')
    return null
  }

  try {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    })

    const response = await fetch(PLATFORM_CONFIGS.linkedin.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('LinkedIn token refresh failed:', error)
      return null
    }

    const data = await response.json()
    return {
      access_token: data.access_token,
      expires_in: data.expires_in || 5184000,
    }
  } catch (error) {
    console.error('LinkedIn token refresh error:', error)
    return null
  }
}

async function refreshGoogleToken(refreshToken: string): Promise<{ access_token: string; expires_in: number } | null> {
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')

  if (!clientId || !clientSecret) {
    console.error('Google credentials not configured')
    return null
  }

  try {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    })

    const response = await fetch(PLATFORM_CONFIGS.google.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Google token refresh failed:', error)
      return null
    }

    const data = await response.json()
    return {
      access_token: data.access_token,
      expires_in: data.expires_in || 3600,
    }
  } catch (error) {
    console.error('Google token refresh error:', error)
    return null
  }
}

async function refreshTwitterToken(refreshToken: string): Promise<{ access_token: string; expires_in: number } | null> {
  const clientId = Deno.env.get('TWITTER_CLIENT_ID')
  const clientSecret = Deno.env.get('TWITTER_CLIENT_SECRET')

  if (!clientId || !clientSecret) {
    console.error('Twitter credentials not configured')
    return null
  }

  try {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
    })

    // Twitter requiere Basic Auth
    const auth = btoa(`${clientId}:${clientSecret}`)

    const response = await fetch(PLATFORM_CONFIGS.twitter.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`,
      },
      body: params.toString(),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Twitter token refresh failed:', error)
      return null
    }

    const data = await response.json()
    return {
      access_token: data.access_token,
      expires_in: data.expires_in || 7200,
    }
  } catch (error) {
    console.error('Twitter token refresh error:', error)
    return null
  }
}

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================

serve(async (req: Request) => {
  try {
    // Verificar que sea una petición válida (puede ser de Supabase Cron o manual)
    const authHeader = req.headers.get('Authorization')
    const supabaseFunctionSecret = Deno.env.get('SUPABASE_FUNCTION_SECRET')

    // Si hay un secret configurado, verificarlo
    if (supabaseFunctionSecret && authHeader !== `Bearer ${supabaseFunctionSecret}`) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Crear cliente Supabase con service_role para acceso completo
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    console.log('🔄 Iniciando proceso de refresh de tokens OAuth...')

    // Obtener tokens que expiran en las próximas 24 horas
    const { data: expiringTokens, error: fetchError } = await supabase
      .rpc('get_expiring_oauth_tokens', { p_hours_ahead: 24 })

    if (fetchError) {
      console.error('Error al obtener tokens expirando:', fetchError)
      throw fetchError
    }

    if (!expiringTokens || expiringTokens.length === 0) {
      console.log('✅ No hay tokens por expirar')
      return new Response(
        JSON.stringify({
          message: 'No tokens expiring',
          refreshed: 0,
          total: 0
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📊 Encontrados ${expiringTokens.length} tokens por expirar`)

    const results: RefreshResult[] = []
    let successCount = 0
    let errorCount = 0

    // Procesar cada token
    for (const token of expiringTokens as OAuthToken[]) {
      console.log(`🔐 Procesando token de ${token.platform} para usuario ${token.user_id}`)

      let newTokenData: { access_token: string; expires_in: number } | null = null

      // Llamar al refresher apropiado según la plataforma
      switch (token.platform) {
        case 'facebook':
          newTokenData = await refreshFacebookToken(token.refresh_token)
          break
        case 'instagram':
          newTokenData = await refreshInstagramToken(token.refresh_token)
          break
        case 'linkedin':
          newTokenData = await refreshLinkedInToken(token.refresh_token)
          break
        case 'google':
        case 'youtube': // YouTube usa Google OAuth
          newTokenData = await refreshGoogleToken(token.refresh_token)
          break
        case 'twitter':
        case 'x':
          newTokenData = await refreshTwitterToken(token.refresh_token)
          break
        default:
          console.warn(`⚠️ Plataforma no soportada: ${token.platform}`)
          results.push({
            platform: token.platform,
            success: false,
            error: 'Platform not supported',
          })
          errorCount++
          continue
      }

      if (newTokenData) {
        // Actualizar token en la base de datos usando la función
        const newExpiry = new Date(Date.now() + newTokenData.expires_in * 1000)

        const { error: updateError } = await supabase
          .rpc('refresh_oauth_token', {
            p_user_id: token.user_id,
            p_platform: token.platform,
            p_new_access_token: newTokenData.access_token,
            p_new_token_expiry: newExpiry.toISOString(),
          })

        if (updateError) {
          console.error(`❌ Error al actualizar token de ${token.platform}:`, updateError)
          results.push({
            platform: token.platform,
            success: false,
            error: updateError.message,
          })
          errorCount++
        } else {
          console.log(`✅ Token de ${token.platform} actualizado exitosamente`)
          results.push({
            platform: token.platform,
            success: true,
          })
          successCount++
        }
      } else {
        console.error(`❌ No se pudo obtener nuevo token de ${token.platform}`)

        // Log del error en oauth_logs
        await supabase.from('oauth_logs').insert({
          user_id: token.user_id,
          platform: token.platform,
          action: 'refresh',
          success: false,
          error_message: 'Failed to obtain new token',
        })

        results.push({
          platform: token.platform,
          success: false,
          error: 'Failed to obtain new token',
        })
        errorCount++
      }
    }

    const summary = {
      message: 'Token refresh completed',
      total: expiringTokens.length,
      refreshed: successCount,
      failed: errorCount,
      results,
      timestamp: new Date().toISOString(),
    }

    console.log('📈 Resumen final:', summary)

    return new Response(
      JSON.stringify(summary),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('❌ Error crítico:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        stack: error.stack
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

/**
 * CONFIGURACIÓN DE CRON:
 *
 * Para ejecutar esta función cada 30 minutos, agregar en Supabase Dashboard:
 *
 * 1. Ir a Database > Cron Jobs (pg_cron)
 * 2. Crear nuevo job:
 *
 * SELECT cron.schedule(
 *   'refresh-oauth-tokens-every-30min',
 *   '*/30 * * * *', -- Cada 30 minutos
 *   $$
 *   SELECT
 *     net.http_post(
 *       url:='https://shiqwhbodviimvpxpszd.supabase.co/functions/v1/refresh-oauth-tokens',
 *       headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.supabase_service_role_key') || '"}'::jsonb
 *     ) as request_id;
 *   $$
 * );
 *
 * O configurar en supabase/CRON_SETUP.sql
 */
