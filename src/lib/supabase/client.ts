/**
 * Supabase Client para uso en el navegador (Client Components)
 *
 * Este cliente se usa en:
 * - Client Components
 * - Interacciones del usuario en el navegador
 * - Realtime subscriptions
 * - Storage uploads desde el cliente
 *
 * Características:
 * - Usa anon key (segura para el navegador)
 * - Auth persistido en cookies
 * - Actualiza automáticamente el session
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

export function createClient() {
  // Fallback values for build-time (SSG)
  // Real values will be used at runtime from environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey
  )
}

// Cliente singleton para reutilización
let client: ReturnType<typeof createClient> | null = null

export function getSupabaseBrowserClient() {
  if (!client) {
    client = createClient()
  }
  return client
}

// Helpers para operaciones comunes

/**
 * Obtener usuario actual
 */
export async function getCurrentUser() {
  const supabase = getSupabaseBrowserClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error) {
    console.error('Error obteniendo usuario:', error)
    return null
  }

  return user
}

/**
 * Obtener sesión actual
 */
export async function getCurrentSession() {
  const supabase = getSupabaseBrowserClient()
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error) {
    console.error('Error obteniendo sesión:', error)
    return null
  }

  return session
}

/**
 * Sign out
 */
export async function signOut() {
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Error cerrando sesión:', error)
    throw error
  }
}

/**
 * Verificar si el usuario está autenticado
 */
export async function isAuthenticated() {
  const user = await getCurrentUser()
  return !!user
}
