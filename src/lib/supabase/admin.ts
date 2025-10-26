/**
 * Supabase Admin Client
 *
 * Este cliente usa la service_role key y BYPASSA Row Level Security (RLS)
 *
 * ⚠️ ADVERTENCIA: Solo usar en el servidor, NUNCA exponer en el cliente
 *
 * Casos de uso:
 * - Crear usuarios programáticamente
 * - Operaciones administrativas que requieren acceso total
 * - Tareas de background que necesitan acceso completo
 * - Migraciones de datos
 *
 * IMPORTANTE: La service_role key debe estar en .env.local y NUNCA
 * en variables de entorno que empiecen con NEXT_PUBLIC_
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Verificar que las variables existan
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.warn('⚠️ NEXT_PUBLIC_SUPABASE_URL no está configurada (usando placeholder para build)')
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY no está configurada')
  console.warn('⚠️ El cliente admin no funcionará correctamente')
  console.warn('⚠️ Obtén la service_role key de: Settings > API > service_role key')
}

// Cliente admin singleton
let adminClient: any = null

export function getSupabaseAdmin() {
  if (!adminClient) {
    // Fallback values for build-time (SSG)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-service-role-key'

    adminClient = createClient<Database>(
      supabaseUrl,
      supabaseKey, // Fallback a anon key si no hay service_role
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )
  }

  return adminClient
}

// Helpers administrativos

/**
 * Crear usuario sin autenticación
 * Útil para migraciones o creación masiva de usuarios
 */
export async function createUserAdmin(userData: {
  email: string
  password: string
  emailConfirmed?: boolean
  metadata?: Record<string, any>
}) {
  const admin = getSupabaseAdmin()

  const { data, error } = await admin.auth.admin.createUser({
    email: userData.email,
    password: userData.password,
    email_confirm: userData.emailConfirmed ?? false,
    user_metadata: userData.metadata,
  })

  if (error) {
    console.error('Error creando usuario:', error)
    throw error
  }

  return data.user
}

/**
 * Actualizar usuario admin
 */
export async function updateUserAdmin(userId: string, updates: {
  email?: string
  password?: string
  emailConfirmed?: boolean
  metadata?: Record<string, any>
}) {
  const admin = getSupabaseAdmin()

  const { data, error } = await admin.auth.admin.updateUserById(userId, {
    email: updates.email,
    password: updates.password,
    email_confirm: updates.emailConfirmed,
    user_metadata: updates.metadata,
  })

  if (error) {
    console.error('Error actualizando usuario:', error)
    throw error
  }

  return data.user
}

/**
 * Eliminar usuario admin
 */
export async function deleteUserAdmin(userId: string) {
  const admin = getSupabaseAdmin()

  const { error } = await admin.auth.admin.deleteUser(userId)

  if (error) {
    console.error('Error eliminando usuario:', error)
    throw error
  }

  return true
}

/**
 * Listar todos los usuarios (con paginación)
 */
export async function listUsersAdmin(page = 1, perPage = 50) {
  const admin = getSupabaseAdmin()

  const { data, error } = await admin.auth.admin.listUsers({
    page,
    perPage,
  })

  if (error) {
    console.error('Error listando usuarios:', error)
    throw error
  }

  return data
}

/**
 * Obtener datos de cualquier tabla (bypassa RLS)
 */
export async function queryAsAdmin<T>(
  table: string,
  filters?: Record<string, any>
): Promise<T[]> {
  const admin = getSupabaseAdmin()

  let query = admin.from(table).select('*')

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value)
    })
  }

  const { data, error } = await query

  if (error) {
    console.error(`Error consultando ${table}:`, error)
    throw error
  }

  return data as T[]
}

/**
 * Migrar usuario de auth a tabla users
 */
export async function migrateAuthUserToUsersTable(authUser: {
  id: string
  email: string
  name?: string
  metadata?: Record<string, any>
}) {
  const admin = getSupabaseAdmin()

  // Insertar o actualizar en tabla users
  const { data, error } = await admin.from('users').upsert({
    id: authUser.id,
    email: authUser.email,
    name: authUser.name || authUser.metadata?.name || null,
    role: authUser.metadata?.role || 'user',
    plan: authUser.metadata?.plan || 'free',
    credits: authUser.metadata?.credits || 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).select().single()

  if (error) {
    console.error('Error migrando usuario:', error)
    throw error
  }

  return data
}
