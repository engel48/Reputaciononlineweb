/**
 * UserContext - Contexto de usuario con Supabase Auth
 *
 * Proporciona acceso al usuario actual y sus datos del perfil
 * desde la tabla `users` de la base de datos
 */

'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import type { User } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

type UserData = Database['public']['Tables']['users']['Row']

interface UserContextType {
  user: User | null
  userData: UserData | null
  loading: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { supabase, user } = useSupabase()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadUserData() {
    if (!user) {
      setUserData(null)
      setLoading(false)
      return
    }

    setLoading(true)

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error loading user data:', error)
      setUserData(null)
    } else {
      setUserData(data)
    }

    setLoading(false)
  }

  useEffect(() => {
    loadUserData()
  }, [user])

  async function signOut() {
    await supabase.auth.signOut()
    setUserData(null)
  }

  async function refreshUser() {
    await loadUserData()
  }

  return (
    <UserContext.Provider
      value={{
        user,
        userData,
        loading,
        signOut,
        refreshUser
      }}
    >
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
