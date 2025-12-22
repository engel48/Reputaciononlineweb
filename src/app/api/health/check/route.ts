import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Timeout para health checks (5 segundos)
const HEALTH_CHECK_TIMEOUT = 5000

// Helper para hacer fetch con timeout
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = HEALTH_CHECK_TIMEOUT): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

async function checkSupabase(): Promise<boolean> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase credentials not configured')
      return false
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Verificar conexión con una query simple
    const { error } = await supabase
      .from('users')
      .select('id')
      .limit(1)
      .single()

    // Si hay error pero no es "no rows", significa que la DB está up
    if (error && !error.message.includes('multiple (or no) rows')) {
      console.error('Supabase health check error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Supabase check failed:', error)
    return false
  }
}

async function checkFacebookApi(): Promise<boolean> {
  try {
    const clientId = process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID

    if (!clientId) {
      // Si no está configurado, no lo consideramos "down", solo "no configurado"
      return true
    }

    // Verificar que el Graph API responde
    const response = await fetchWithTimeout('https://graph.facebook.com/v18.0/')

    return response.ok
  } catch (error) {
    console.error('Facebook API check failed:', error)
    return false
  }
}

async function checkTwitterApi(): Promise<boolean> {
  try {
    const clientId = process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID

    if (!clientId) {
      return true
    }

    // Twitter API v2 health check es más complejo, por ahora solo verificar conectividad básica
    const response = await fetchWithTimeout('https://api.twitter.com/2/', {
      method: 'GET'
    })

    // 401 es esperado sin auth, significa que la API está up
    return response.status === 401 || response.ok
  } catch (error) {
    console.error('Twitter API check failed:', error)
    return false
  }
}

async function checkYouTubeApi(): Promise<boolean> {
  try {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

    if (!clientId) {
      return true
    }

    // Google OAuth endpoint
    const response = await fetchWithTimeout('https://www.googleapis.com/youtube/v3/', {
      method: 'HEAD'
    })

    return response.ok || response.status === 401 || response.status === 403
  } catch (error) {
    console.error('YouTube API check failed:', error)
    return false
  }
}

async function checkInstagramApi(): Promise<boolean> {
  try {
    const clientId = process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID

    if (!clientId) {
      return true
    }

    // Instagram Basic Display API
    const response = await fetchWithTimeout('https://api.instagram.com/oauth/authorize', {
      method: 'HEAD'
    })

    return response.ok || response.status === 400 // 400 es esperado sin parámetros
  } catch (error) {
    console.error('Instagram API check failed:', error)
    return false
  }
}

export async function GET() {
  try {
    // Ejecutar todos los health checks en paralelo
    const [
      supabaseHealth,
      facebookHealth,
      twitterHealth,
      youtubeHealth,
      instagramHealth
    ] = await Promise.all([
      checkSupabase(),
      checkFacebookApi(),
      checkTwitterApi(),
      checkYouTubeApi(),
      checkInstagramApi()
    ])

    const services = {
      supabase: supabaseHealth,
      facebook: facebookHealth,
      twitter: twitterHealth,
      youtube: youtubeHealth,
      instagram: instagramHealth
    }

    // Determinar el estado general
    const allHealthy = Object.values(services).every(v => v === true)
    const criticalDown = !supabaseHealth

    return NextResponse.json({
      success: true,
      services,
      status: criticalDown ? 'critical' : allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString()
    }, {
      status: criticalDown ? 503 : 200
    })

  } catch (error) {
    console.error('Health check error:', error)

    return NextResponse.json({
      success: false,
      error: 'Error al verificar estado de servicios',
      timestamp: new Date().toISOString()
    }, {
      status: 500
    })
  }
}
