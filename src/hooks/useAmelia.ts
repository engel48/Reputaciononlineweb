/**
 * useAmelia Hook - Hook personalizado para interactuar con Amelia (AI Assistant).
 *
 * Usa el endpoint interno /api/amelia/chat que corre sobre Groq llama-3.3-70b-versatile
 * con memoria conversacional (tablas amelia_conversations + amelia_messages) y
 * contexto personalizado del usuario (nombre, redes, keywords, menciones recientes).
 */

import { useState } from 'react'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { useUser } from '@/context/UserContext'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface Conversation {
  id: string
  title: string
  created_at: string
  updated_at: string
  user_id: string
}

export function useAmelia() {
  const { supabase } = useSupabase()
  const { user } = useUser()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Enviar mensaje a Amelia — llama /api/amelia/chat (Groq + memoria)
   */
  async function sendMessage(
    message: string,
    conversationId?: string
  ): Promise<{ response: string | null; conversationId: string | null }> {
    if (!user) {
      setError('Usuario no autenticado')
      return { response: null, conversationId: null }
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/amelia/chat', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          conversationId
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Error al enviar mensaje a Amelia')
      }

      return {
        response: result.response || null,
        conversationId: result.conversationId || null
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      console.error('Error en useAmelia.sendMessage:', err)
      return { response: null, conversationId: null }
    } finally {
      setLoading(false)
    }
  }

  /**
   * Crear una nueva conversación
   */
  async function createConversation(title: string): Promise<Conversation | null> {
    if (!user) {
      setError('Usuario no autenticado')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      // @ts-expect-error - Supabase type inference issue with Database types
      const { data, error } = await supabase.from('amelia_conversations').insert({
        user_id: user.id,
        title
      }).select().single()

      if (error) throw error

      return data as Conversation
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear conversación'
      setError(errorMessage)
      console.error('Error en useAmelia.createConversation:', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  /**
   * Obtener todas las conversaciones del usuario
   */
  async function getConversations(): Promise<Conversation[]> {
    if (!user) {
      setError('Usuario no autenticado')
      return []
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('amelia_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (error) throw error

      return data as Conversation[]
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener conversaciones'
      setError(errorMessage)
      console.error('Error en useAmelia.getConversations:', err)
      return []
    } finally {
      setLoading(false)
    }
  }

  /**
   * Obtener mensajes de una conversación
   */
  async function getConversationMessages(conversationId: string): Promise<Message[]> {
    if (!user) {
      setError('Usuario no autenticado')
      return []
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('amelia_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) throw error

      return (data as any[]).map((msg: any) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: new Date(msg.created_at)
      }))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener mensajes'
      setError(errorMessage)
      console.error('Error en useAmelia.getConversationMessages:', err)
      return []
    } finally {
      setLoading(false)
    }
  }

  /**
   * Eliminar una conversación
   */
  async function deleteConversation(conversationId: string): Promise<boolean> {
    if (!user) {
      setError('Usuario no autenticado')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('amelia_conversations')
        .delete()
        .eq('id', conversationId)
        .eq('user_id', user.id) // Seguridad: solo borrar conversaciones propias

      if (error) throw error

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar conversación'
      setError(errorMessage)
      console.error('Error en useAmelia.deleteConversation:', err)
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    sendMessage,
    createConversation,
    getConversations,
    getConversationMessages,
    deleteConversation,
    loading,
    error
  }
}
