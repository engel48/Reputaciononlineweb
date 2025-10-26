/**
 * Supabase Realtime Helper
 *
 * Funciones y hooks para subscripciones en tiempo real
 * Casos de uso:
 * - Notificaciones en vivo
 * - Menciones nuevas
 * - Dashboard actualizado automáticamente
 * - Chat con Julia AI en streaming
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { getSupabaseBrowserClient } from './client'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

// ================================================
// TYPES
// ================================================

export type DatabaseEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*'

export interface RealtimeSubscriptionConfig {
  table: string
  event?: DatabaseEvent
  filter?: string
  schema?: string
}

export interface NotificationPayload {
  id: string
  user_id: string
  title: string
  message: string
  type: string
  is_read: boolean
  priority: string
  created_at: string
}

export interface MentionPayload {
  id: string
  user_id: string
  content: string
  source: string
  author: string
  sentiment: string
  created_at: string
}

// ================================================
// HOOK: useRealtimeSubscription
// ================================================

/**
 * Hook genérico para subscripciones en tiempo real
 */
export function useRealtimeSubscription<T extends Record<string, any> = any>(
  config: RealtimeSubscriptionConfig,
  callback: (payload: RealtimePostgresChangesPayload<T>) => void
) {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()

    const channelName = `${config.table}-${config.event || 'all'}-${Date.now()}`

    const newChannel = supabase
      .channel(channelName)
      .on<T>(
        'postgres_changes',
        {
          event: config.event || '*',
          schema: config.schema || 'public',
          table: config.table,
          filter: config.filter,
        } as any,
        (payload) => {
          console.log(`🔔 Realtime event on ${config.table}:`, payload)
          callback(payload as RealtimePostgresChangesPayload<T>)
        }
      )
      .subscribe((status) => {
        console.log(`📡 Subscription status for ${config.table}:`, status)
        setIsConnected(status === 'SUBSCRIBED')
        if (status === 'CHANNEL_ERROR') {
          setError(new Error('Channel subscription error'))
        }
      })

    setChannel(newChannel)

    // Cleanup
    return () => {
      console.log(`🔌 Unsubscribing from ${config.table}`)
      supabase.removeChannel(newChannel)
    }
  }, [config.table, config.event, config.filter, config.schema])

  return { channel, isConnected, error }
}

// ================================================
// HOOK: useNotifications (Realtime)
// ================================================

/**
 * Hook para recibir notificaciones en tiempo real
 */
export function useRealtimeNotifications(userId: string) {
  const [notifications, setNotifications] = useState<NotificationPayload[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const handleNewNotification = useCallback((payload: RealtimePostgresChangesPayload<NotificationPayload>) => {
    if (payload.eventType === 'INSERT') {
      const newNotification = payload.new
      setNotifications(prev => [newNotification, ...prev])

      if (!newNotification.is_read) {
        setUnreadCount(prev => prev + 1)
      }

      // Mostrar notificación del navegador (si tiene permiso)
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(newNotification.title, {
          body: newNotification.message,
          icon: '/favicon.ico',
          tag: newNotification.id
        })
      }
    }

    if (payload.eventType === 'UPDATE') {
      const updatedNotification = payload.new
      setNotifications(prev =>
        prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
      )

      // Actualizar contador de no leídos
      if (updatedNotification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    }

    if (payload.eventType === 'DELETE') {
      const deletedId = payload.old.id
      setNotifications(prev => prev.filter(n => n.id !== deletedId))
    }
  }, [])

  const { isConnected, error } = useRealtimeSubscription<NotificationPayload>(
    {
      table: 'notifications',
      filter: `user_id=eq.${userId}`,
    },
    handleNewNotification
  )

  // Cargar notificaciones iniciales
  useEffect(() => {
    const loadNotifications = async () => {
      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (data && !error) {
        setNotifications(data as any)
        setUnreadCount((data as any).filter((n: any) => !n.is_read).length)
      }
    }

    loadNotifications()
  }, [userId])

  // Marcar como leída
  const markAsRead = async (notificationId: string) => {
    const supabase = getSupabaseBrowserClient()
    // @ts-expect-error - Supabase type inference issue with Database types
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId)

    if (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  // Marcar todas como leídas
  const markAllAsRead = async () => {
    const supabase = getSupabaseBrowserClient()
    // @ts-expect-error - Supabase type inference issue with Database types
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false)

    if (error) {
      console.error('Error marking all notifications as read:', error)
    } else {
      setUnreadCount(0)
    }
  }

  return {
    notifications,
    unreadCount,
    isConnected,
    error,
    markAsRead,
    markAllAsRead,
  }
}

// ================================================
// HOOK: useMentions (Realtime)
// ================================================

/**
 * Hook para recibir menciones en tiempo real
 */
export function useRealtimeMentions(userId: string) {
  const [mentions, setMentions] = useState<MentionPayload[]>([])
  const [newMentionsCount, setNewMentionsCount] = useState(0)

  const handleNewMention = useCallback((payload: RealtimePostgresChangesPayload<MentionPayload>) => {
    if (payload.eventType === 'INSERT') {
      const newMention = payload.new
      setMentions(prev => [newMention, ...prev])
      setNewMentionsCount(prev => prev + 1)

      // Notificación del navegador
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Nueva Mención', {
          body: `${newMention.author}: ${newMention.content.substring(0, 100)}...`,
          icon: '/favicon.ico',
        })
      }
    }
  }, [])

  const { isConnected, error } = useRealtimeSubscription<MentionPayload>(
    {
      table: 'mentions',
      event: 'INSERT',
      filter: `user_id=eq.${userId}`,
    },
    handleNewMention
  )

  // Resetear contador
  const resetNewCount = () => setNewMentionsCount(0)

  return {
    mentions,
    newMentionsCount,
    isConnected,
    error,
    resetNewCount,
  }
}

// ================================================
// HOOK: usePresence (Online/Offline)
// ================================================

/**
 * Hook para presencia de usuario (online/offline)
 */
export function usePresence(userId: string, roomId: string = 'global') {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()

    const presenceChannel = supabase.channel(`presence-${roomId}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    })

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState()
        const users = Object.keys(state)
        setOnlineUsers(users)
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        console.log('User joined:', key)
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        console.log('User left:', key)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ online_at: new Date().toISOString() })
        }
      })

    setChannel(presenceChannel)

    return () => {
      supabase.removeChannel(presenceChannel)
    }
  }, [userId, roomId])

  return {
    onlineUsers,
    isOnline: onlineUsers.includes(userId),
    channel,
  }
}

// ================================================
// HOOK: useBroadcast (Mensajes en tiempo real)
// ================================================

/**
 * Hook para broadcast de mensajes (ej: chat)
 */
export function useBroadcast(channelName: string) {
  const [messages, setMessages] = useState<any[]>([])
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()

    const broadcastChannel = supabase.channel(channelName)
      .on('broadcast', { event: 'message' }, (payload) => {
        console.log('Broadcast message received:', payload)
        setMessages(prev => [...prev, payload.payload])
      })
      .subscribe()

    setChannel(broadcastChannel)

    return () => {
      supabase.removeChannel(broadcastChannel)
    }
  }, [channelName])

  const sendMessage = async (message: any) => {
    if (!channel) return

    await channel.send({
      type: 'broadcast',
      event: 'message',
      payload: message,
    })
  }

  return {
    messages,
    sendMessage,
    channel,
  }
}

// ================================================
// FUNCIÓN: requestNotificationPermission
// ================================================

/**
 * Solicitar permiso para notificaciones del navegador
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('Este navegador no soporta notificaciones')
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  return false
}

// ================================================
// EJEMPLO DE USO
// ================================================

/**
 * Componente de ejemplo
 *
 * NOTA: Este código está comentado porque el archivo es .ts, no .tsx
 * Para usar este ejemplo, crea un componente .tsx separado
 */
/*
export function ExampleRealtimeComponent() {
  const userId = 'user-123' // Obtener del contexto

  // Notificaciones en tiempo real
  const {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
  } = useRealtimeNotifications(userId)

  // Menciones en tiempo real
  const {
    mentions,
    newMentionsCount,
    resetNewCount,
  } = useRealtimeMentions(userId)

  // Presencia
  const { onlineUsers, isOnline } = usePresence(userId)

  return (
    <div>
      <h2>Realtime Dashboard</h2>
      <p>Conexión: {isConnected ? '🟢 Conectado' : '🔴 Desconectado'}</p>
      <p>Notificaciones no leídas: {unreadCount}</p>
      <p>Nuevas menciones: {newMentionsCount}</p>
      <p>Usuarios online: {onlineUsers.length}</p>
    </div>
  )
}
*/
