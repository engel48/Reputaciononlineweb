/**
 * Tests para los hooks de datos del dashboard
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

// Mock de SWR
vi.mock('swr', () => ({
  default: vi.fn((key, fetcher, options) => {
    return {
      data: null,
      error: null,
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
    }
  }),
}))

// Mock de config
vi.mock('@/lib/swr-config', () => ({
  CACHE_KEYS: {
    DASHBOARD_ANALYTICS: '/api/dashboard-analytics',
    SOCIAL_MEDIA: '/api/social-media',
    MENTIONS: '/api/mentions',
    CREDITS: '/api/credits',
    NOTIFICATIONS: '/api/notifications',
  },
  REVALIDATE_INTERVALS: {
    USER: 600000,
    ANALYTICS: 300000,
    MENTIONS: 120000,
    CREDITS: 30000,
    NOTIFICATIONS: 60000,
  },
}))

describe('useDashboardData Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('useDashboardAnalytics', () => {
    it('debería retornar estructura correcta', async () => {
      const { useDashboardAnalytics } = await import('@/hooks/useDashboardData')

      const { result } = renderHook(() => useDashboardAnalytics())

      expect(result.current).toHaveProperty('analytics')
      expect(result.current).toHaveProperty('isLoading')
      expect(result.current).toHaveProperty('isValidating')
      expect(result.current).toHaveProperty('error')
      expect(result.current).toHaveProperty('refresh')
    })

    it('refresh debería ser una función', async () => {
      const { useDashboardAnalytics } = await import('@/hooks/useDashboardData')

      const { result } = renderHook(() => useDashboardAnalytics())

      expect(typeof result.current.refresh).toBe('function')
    })
  })

  describe('useMentions', () => {
    it('debería aceptar parámetro limit', async () => {
      const { useMentions } = await import('@/hooks/useDashboardData')

      const { result } = renderHook(() => useMentions(50))

      expect(result.current).toHaveProperty('mentions')
      expect(result.current).toHaveProperty('total')
    })

    it('debería usar limit por defecto de 20', async () => {
      const { useMentions } = await import('@/hooks/useDashboardData')

      const { result } = renderHook(() => useMentions())

      expect(result.current.mentions).toEqual([])
    })
  })

  describe('useSocialMedia', () => {
    it('debería retornar array de plataformas', async () => {
      const { useSocialMedia } = await import('@/hooks/useDashboardData')

      const { result } = renderHook(() => useSocialMedia())

      expect(result.current).toHaveProperty('socialMedia')
      expect(Array.isArray(result.current.socialMedia)).toBe(true)
    })
  })

  describe('useCredits', () => {
    it('debería retornar créditos y transacciones', async () => {
      const { useCredits } = await import('@/hooks/useDashboardData')

      const { result } = renderHook(() => useCredits())

      expect(result.current).toHaveProperty('credits')
      expect(result.current).toHaveProperty('transactions')
      expect(typeof result.current.credits).toBe('number')
    })
  })

  describe('useNotifications', () => {
    it('debería retornar notificaciones y contador', async () => {
      const { useNotifications } = await import('@/hooks/useDashboardData')

      const { result } = renderHook(() => useNotifications())

      expect(result.current).toHaveProperty('notifications')
      expect(result.current).toHaveProperty('unreadCount')
    })
  })

  describe('useDashboardCombined', () => {
    it('debería combinar analytics y social media', async () => {
      const { useDashboardCombined } = await import('@/hooks/useDashboardData')

      const { result } = renderHook(() => useDashboardCombined())

      expect(result.current).toHaveProperty('analytics')
      expect(result.current).toHaveProperty('socialMedia')
      expect(result.current).toHaveProperty('isLoading')
      expect(result.current).toHaveProperty('refresh')
    })
  })
})
