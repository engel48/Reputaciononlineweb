/**
 * CreditsContext - Contexto de créditos con Supabase Realtime
 *
 * Proporciona acceso a los créditos del usuario y se actualiza
 * en tiempo real cuando cambian en la base de datos
 */

'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { useUserData } from './UserContext'
import type { Database } from '@/types/supabase'

type UserUpdate = Database['public']['Tables']['users']['Update']
type ActivityInsert = Database['public']['Tables']['activities']['Insert']

interface CreditsContextType {
  credits: number
  plan: string
  refreshCredits: () => Promise<void>
  deductCredits: (amount: number, description: string) => Promise<boolean>
}

const CreditsContext = createContext<CreditsContextType | undefined>(undefined)

export function CreditsProvider({ children }: { children: React.ReactNode }) {
  const { supabase, user } = useSupabase()
  const userData = useUserData()
  const [credits, setCredits] = useState(0)
  const [plan, setPlan] = useState('free')

  // Sincronizar créditos desde userData
  useEffect(() => {
    if (userData) {
      setCredits(userData.credits || 0)
      setPlan(userData.plan || 'free')
    }
  }, [userData])

  // Suscripción en tiempo real a cambios de créditos
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`credits-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${user.id}`
        },
        (payload: any) => {
          console.log('Cambio de créditos detectado:', payload)
          const newData = payload.new
          if (newData) {
            setCredits(newData.credits || 0)
            setPlan(newData.plan || 'free')
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase])

  async function refreshCredits() {
    if (!user) return

    const { data } = await supabase
      .from('users')
      .select('credits, plan')
      .eq('id', user.id)
      .single()

    if (data) {
      setCredits((data as any).credits || 0)
      setPlan((data as any).plan || 'free')
    }
  }

  async function deductCredits(amount: number, description: string): Promise<boolean> {
    if (!user) {
      console.error('No hay usuario autenticado')
      return false
    }

    if (credits < amount) {
      console.error('Créditos insuficientes')
      return false
    }

    // Usar Edge Function de credit-manager si existe
    // Por ahora, actualizar directamente
    const newCredits = credits - amount

    // @ts-expect-error - Supabase type inference issue with Database types
    const { error } = await supabase.from('users').update({ credits: newCredits }).eq('id', user.id)

    if (error) {
      console.error('Error deduciendo créditos:', error)
      return false
    }

    // Registrar actividad
    // @ts-expect-error - Supabase type inference issue with Database types
    await supabase.from('activities').insert({
      user_id: user.id,
      action: 'credit_deduction',
      description: `${description} (-${amount} créditos)`
    })

    // El realtime actualizará el estado automáticamente
    return true
  }

  return (
    <CreditsContext.Provider
      value={{
        credits,
        plan,
        refreshCredits,
        deductCredits
      }}
    >
      {children}
    </CreditsContext.Provider>
  )
}

export function useCredits() {
  const context = useContext(CreditsContext)
  if (context === undefined) {
    throw new Error('useCredits must be used within CreditsProvider')
  }
  return context
}
