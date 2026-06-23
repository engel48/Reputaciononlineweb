/**
 * Setup de pruebas con Vitest
 * Este archivo se ejecuta antes de cada suite de tests
 */

import '@testing-library/jest-dom'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Secretos de prueba: los módulos de auth hacen fail-fast si JWT_SECRET/NEXTAUTH_SECRET
// no están definidos (comportamiento de seguridad en prod). En tests los proveemos aquí.
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-not-for-production'
process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'test-nextauth-secret-not-for-production'

// Limpiar después de cada test
afterEach(() => {
  cleanup()
})

// Mock de Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock de localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock de sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock })

// Mock de fetch global
global.fetch = vi.fn()

// Mock de ResizeObserver (usado por algunos componentes UI)
class MockResizeObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}
global.ResizeObserver = MockResizeObserver as any

// Mock de IntersectionObserver (requerido por Next.js Link)
class MockIntersectionObserver {
  root = null
  rootMargin = ''
  thresholds = []

  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    // Store for potential use
  }

  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  takeRecords = vi.fn(() => [])
}
global.IntersectionObserver = MockIntersectionObserver as any

// Suprimir warnings de console en tests (opcional)
// vi.spyOn(console, 'warn').mockImplementation(() => {})
// vi.spyOn(console, 'error').mockImplementation(() => {})
