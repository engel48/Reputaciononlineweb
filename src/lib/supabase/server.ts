/**
 * Supabase Client para uso en el servidor (Server Components y API Routes)
 *
 * Este cliente se usa en:
 * - Server Components
 * - API Routes
 * - Server Actions
 * - Cualquier código que corra en el servidor
 *
 * Características:
 * - Lee y escribe cookies de forma segura
 * - Maneja la sesión del lado del servidor
 * - Refresca tokens automáticamente
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'

export async function createClient() {
  const cookieStore = await cookies()

  // Fallback values for build-time (SSG)
  // Real values will be used at runtime from environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // La función `set` se llama desde un Server Component.
            // Esto puede ser ignorado si tienes middleware para refrescar
            // las cookies del usuario.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // La función `remove` se llama desde un Server Component.
            // Esto puede ser ignorado si tienes middleware para refrescar
            // las cookies del usuario.
          }
        },
      },
    }
  )
}

// Helpers para operaciones comunes en el servidor

/**
 * Obtener usuario actual (servidor)
 */
export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error) {
    console.error('Error obteniendo usuario:', error)
    return null
  }

  return user
}

/**
 * Obtener sesión actual (servidor)
 */
export async function getCurrentSession() {
  const supabase = await createClient()
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error) {
    console.error('Error obteniendo sesión:', error)
    return null
  }

  return session
}

/**
 * Verificar si el usuario está autenticado (servidor)
 */
export async function isAuthenticated() {
  const user = await getCurrentUser()
  return !!user
}

/**
 * Obtener datos del perfil del usuario
 * Combina auth.users con tu tabla users personalizada
 */
export async function getUserProfile(userId?: string) {
  const supabase = await createClient()

  // Si no se proporciona userId, obtener el del usuario actual
  if (!userId) {
    const user = await getCurrentUser()
    if (!user) return null
    userId = user.id
  }

  // Obtener perfil de la tabla users
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error obteniendo perfil:', error)
    return null
  }

  return data
}

/**
 * Requerir autenticación (lanza error si no está autenticado)
 */
export async function requireAuth() {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Authentication required')
  }

  return user
}
