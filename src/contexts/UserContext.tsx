/**
 * UserContext - Contexto de usuario con SWR para caché
 *
 * Características:
 * - Caché de datos de usuario con SWR
 * - No desloguea por errores de red temporales
 * - Revalidación inteligente en segundo plano
 * - Persistencia entre navegaciones
 */

'use client'

import { createContext, useContext, useCallback, useMemo } from 'react'
import useSWR from 'swr'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import type { User } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { REVALIDATE_INTERVALS } from '@/lib/swr-config'

type UserData = Database['public']['Tables']['users']['Row']

interface UserContextType {
  user: User | null
  userData: UserData | null
  loading: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
  updateUserData: (updates: Partial<UserData>) => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

// Fetcher para SWR
const createUserDataFetcher = (supabase: any, userId: string | undefined) => async () => {
  if (!userId) return null

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error loading user data:', error)
    // No lanzar error para mantener datos previos
    return null
  }

  return data
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { supabase, user } = useSupabase()

  // Usar SWR para cachear datos del usuario
  const {
    data: userData,
    error,
    isLoading,
    mutate
  } = useSWR<UserData | null>(
    user?.id ? `user-data-${user.id}` : null,
    createUserDataFetcher(supabase, user?.id),
    {
      // Revalidar cada 10 minutos
      refreshInterval: REVALIDATE_INTERVALS.USER,
      // No revalidar al enfocar ventana
      revalidateOnFocus: false,
      // Mantener datos previos mientras revalida
      keepPreviousData: true,
      // No reintentar en errores (mantener datos en caché)
      shouldRetryOnError: false,
      // Fallback a null si no hay datos
      fallbackData: null,
      // Deduplicar requests
      dedupingInterval: 60000, // 1 minuto
    }
  )

  // Sign out con limpieza de caché
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut()
      // Limpiar caché de SWR
      await mutate(null, false)
      // Limpiar localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-token')
        sessionStorage.removeItem('app-swr-cache')
      }
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }, [supabase, mutate])

  // Refrescar datos del usuario
  const refreshUser = useCallback(async () => {
    await mutate()
  }, [mutate])

  // Actualizar datos del usuario
  const updateUserData = useCallback(async (updates: Partial<UserData>) => {
    if (!user?.id) return

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating user:', error)
        return
      }

      // Actualizar caché inmediatamente
      await mutate(data, false)
    } catch (error) {
      console.error('Error updating user:', error)
    }
  }, [supabase, user?.id, mutate])

  // Memoizar el valor del contexto
  const contextValue = useMemo(() => ({
    user,
    userData: userData ?? null,
    loading: isLoading,
    signOut,
    refreshUser,
    updateUserData
  }), [user, userData, isLoading, signOut, refreshUser, updateUserData])

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  )
}

export function useUserContext() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUserContext must be used within UserProvider')
  }
  return context
}

// Hook de conveniencia para obtener solo el usuario
export function useUser() {
  const { user } = useUserContext()
  return user
}

// Hook de conveniencia para obtener solo los datos del usuario
export function useUserData() {
  const { userData } = useUserContext()
  return userData
}

// Hook para verificar si el usuario está autenticado
export function useIsAuthenticated() {
  const { user, loading } = useUserContext()
  return {
    isAuthenticated: !!user,
    loading
  }
}

// Hook para obtener el plan del usuario
export function useUserPlan() {
  const { userData } = useUserContext()
  return {
    plan: userData?.plan || 'free',
    isPro: userData?.plan === 'profesional' || userData?.plan === 'empresarial' || userData?.plan === 'politico',
    isEnterprise: userData?.plan === 'empresarial',
    isPolitical: userData?.plan === 'politico'
  }
}

// Hook para obtener créditos del usuario
export function useUserCredits() {
  const { userData, refreshUser } = useUserContext()
  return {
    credits: userData?.credits || 0,
    refresh: refreshUser
  }
}
