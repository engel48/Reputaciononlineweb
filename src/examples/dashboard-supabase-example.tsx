/**
 * EJEMPLO: Cómo usar Supabase en el Dashboard
 *
 * Este archivo demuestra cómo integrar Supabase en los componentes del dashboard
 * NO es la página real del dashboard, solo un ejemplo de referencia
 */

'use client'

import { useEffect, useState } from 'react'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { useUserContext } from '@/contexts/UserContext'
import { useCredits } from '@/contexts/CreditsContext'
import type { Database } from '@/types/supabase'

type UserStats = Database['public']['Tables']['user_stats']['Row']
type Notification = Database['public']['Tables']['notifications']['Row']
type SocialMedia = Database['public']['Tables']['social_media']['Row']

export default function DashboardSupabaseExample() {
  const { supabase } = useSupabase()
  const { user, userData, loading: userLoading } = useUserContext()
  const { credits, plan } = useCredits()

  const [stats, setStats] = useState<UserStats | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [socialAccounts, setSocialAccounts] = useState<SocialMedia[]>([])
  const [loading, setLoading] = useState(true)

  // Cargar datos del dashboard
  useEffect(() => {
    if (!user) return

    async function loadDashboardData() {
      setLoading(true)

      try {
        // Cargar estadísticas del usuario
        const { data: statsData } = await supabase
          .from('user_stats')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (statsData) setStats(statsData)

        // Cargar notificaciones no leídas
        const { data: notificationsData } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_read', false)
          .order('created_at', { ascending: false })
          .limit(5)

        if (notificationsData) setNotifications(notificationsData)

        // Cargar cuentas de redes sociales conectadas
        const { data: socialData } = await supabase
          .from('social_media')
          .select('*')
          .eq('user_id', user.id)
          .eq('connected', true)

        if (socialData) setSocialAccounts(socialData)
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [user, supabase])

  // Suscripción en tiempo real a notificaciones
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification = payload.new as Notification
          setNotifications(prev => [newNotification, ...prev].slice(0, 5))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase])

  // Función para marcar notificación como leída
  async function markNotificationAsRead(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)

    if (!error) {
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
    }
  }

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">No estás autenticado</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Bienvenido, {userData?.name || user.email}
        </h1>
        <p className="text-gray-600 mt-1">
          Este es tu dashboard de Reputación Online
        </p>
      </div>

      {/* Tarjetas de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Créditos */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Créditos Disponibles</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {credits.toLocaleString()}
              </p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Plan: {plan.toUpperCase()}</p>
        </div>

        {/* Score de Sentimiento */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Score de Sentimiento</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats?.sentiment_score || 0}
              </p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {stats ? `${stats.positive_mentions} positivas, ${stats.negative_mentions} negativas` : 'Sin datos'}
          </p>
        </div>

        {/* Menciones Totales */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Menciones Totales</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats?.total_mentions || 0}
              </p>
            </div>
            <div className="bg-purple-100 rounded-full p-3">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Crecimiento mensual: {stats?.monthly_growth || 0}%
          </p>
        </div>
      </div>

      {/* Redes Sociales Conectadas */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Redes Sociales Conectadas
        </h2>

        {socialAccounts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {socialAccounts.map((account) => (
              <div key={account.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium capitalize">{account.platform}</span>
                  <span className="text-green-600 text-sm">Conectado</span>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Seguidores: {account.followers.toLocaleString()}</p>
                  <p>Siguiendo: {account.following.toLocaleString()}</p>
                  <p>Publicaciones: {account.posts.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            No tienes redes sociales conectadas
          </p>
        )}
      </div>

      {/* Notificaciones Recientes */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Notificaciones Recientes
        </h2>

        {notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{notification.title}</p>
                  <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(notification.created_at).toLocaleDateString('es-CO', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <button
                  onClick={() => markNotificationAsRead(notification.id)}
                  className="ml-4 text-sm text-blue-600 hover:text-blue-700"
                >
                  Marcar leída
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            No tienes notificaciones pendientes
          </p>
        )}
      </div>
    </div>
  )
}
