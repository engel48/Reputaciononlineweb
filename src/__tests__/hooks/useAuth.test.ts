/**
 * Tests para el hook useAuth
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'

// Mock de SWR
const mockMutate = vi.fn()
vi.mock('swr', () => ({
  default: vi.fn((key, fetcher, options) => {
    return {
      data: null,
      error: null,
      isLoading: false,
      isValidating: false,
      mutate: mockMutate,
    }
  }),
}))

// Mock de config
vi.mock('@/lib/swr-config', () => ({
  CACHE_KEYS: {
    USER: '/api/auth/verify',
  },
  REVALIDATE_INTERVALS: {
    USER: 600000,
  },
}))

describe('useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    // Reset fetch mock
    global.fetch = vi.fn()
  })

  describe('Estado inicial', () => {
    it('debería retornar estructura correcta', async () => {
      const { useAuth } = await import('@/hooks/useAuth')

      const { result } = renderHook(() => useAuth())

      expect(result.current).toHaveProperty('user')
      expect(result.current).toHaveProperty('isLoading')
      expect(result.current).toHaveProperty('isValidating')
      expect(result.current).toHaveProperty('isAuthenticated')
      expect(result.current).toHaveProperty('error')
      expect(result.current).toHaveProperty('logout')
      expect(result.current).toHaveProperty('updateUser')
      expect(result.current).toHaveProperty('refresh')
    })

    it('isAuthenticated debería ser false cuando no hay usuario', async () => {
      const { useAuth } = await import('@/hooks/useAuth')

      const { result } = renderHook(() => useAuth())

      expect(result.current.isAuthenticated).toBe(false)
    })
  })

  describe('logout', () => {
    it('debería ser una función', async () => {
      const { useAuth } = await import('@/hooks/useAuth')

      const { result } = renderHook(() => useAuth())

      expect(typeof result.current.logout).toBe('function')
    })

    it('debería limpiar localStorage al hacer logout', async () => {
      localStorage.setItem('auth-token', 'test-token')

      const { useAuth } = await import('@/hooks/useAuth')
      const { result } = renderHook(() => useAuth())

      // Mock de fetch para logout
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

      // Simular logout (evitar redirección)
      const originalLocation = window.location
      delete (window as any).location
      window.location = { href: '' } as any

      await act(async () => {
        await result.current.logout()
      })

      // localStorage mock returns undefined after clear
      expect(localStorage.getItem('auth-token')).toBeFalsy()

      // Restaurar
      window.location = originalLocation
    })
  })

  describe('updateUser', () => {
    it('debería ser una función', async () => {
      const { useAuth } = await import('@/hooks/useAuth')

      const { result } = renderHook(() => useAuth())

      expect(typeof result.current.updateUser).toBe('function')
    })
  })

  describe('refresh', () => {
    it('debería llamar a mutate de SWR', async () => {
      const { useAuth } = await import('@/hooks/useAuth')

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.refresh()
      })

      expect(mockMutate).toHaveBeenCalled()
    })
  })
})

describe('useIsAdmin Hook', () => {
  it('debería retornar false cuando no hay usuario', async () => {
    const { useIsAdmin } = await import('@/hooks/useAuth')

    const { result } = renderHook(() => useIsAdmin())

    expect(result.current).toBe(false)
  })
})

describe('useUserPlan Hook', () => {
  it('debería retornar plan free por defecto', async () => {
    const { useUserPlan } = await import('@/hooks/useAuth')

    const { result } = renderHook(() => useUserPlan())

    expect(result.current.plan).toBe('free')
    expect(result.current.isPro).toBe(false)
    expect(result.current.isEnterprise).toBe(false)
  })
})
