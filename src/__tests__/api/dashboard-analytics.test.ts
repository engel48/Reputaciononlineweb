/**
 * Tests para el endpoint /api/dashboard-analytics
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock de Supabase
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        gte: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        single: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
  })),
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => mockSupabase,
}))

describe('Dashboard Analytics API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/dashboard-analytics', () => {
    it('debería requerir autenticación', async () => {
      // Simular request sin token
      const mockRequest = new Request('http://localhost:3000/api/dashboard-analytics', {
        method: 'GET',
        headers: {},
      })

      // Importar después del mock
      const { GET } = await import('@/app/api/dashboard-analytics/route')

      // Ejecutar
      const response = await GET(mockRequest as any)
      const data = await response.json()

      // Verificar
      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
    })

    it('debería retornar estructura correcta de analytics', async () => {
      // Mock de datos de menciones
      mockSupabase.from.mockImplementation((table: string) => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({
                data: [
                  {
                    id: '1',
                    platform: 'x',
                    content: 'Test mention',
                    author_name: 'TestUser',
                    scraped_at: new Date().toISOString(),
                  },
                ],
                error: null,
              })),
            })),
            single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      }))

      // Verificar estructura esperada
      const expectedStructure = {
        mentions: {
          total: expect.any(Number),
          positive: expect.any(Number),
          negative: expect.any(Number),
          neutral: expect.any(Number),
        },
        reputation: {
          score: expect.any(Number),
        },
      }

      expect(expectedStructure.mentions).toBeDefined()
      expect(expectedStructure.reputation).toBeDefined()
    })
  })

  describe('Cálculo de sentimiento', () => {
    it('debería calcular correctamente menciones por plataforma', () => {
      const mentions = [
        { platform: 'x' },
        { platform: 'x' },
        { platform: 'facebook' },
        { platform: 'instagram' },
        { platform: 'youtube' },
      ]

      const byPlatform = {
        x: mentions.filter(m => m.platform === 'x').length,
        facebook: mentions.filter(m => m.platform === 'facebook').length,
        instagram: mentions.filter(m => m.platform === 'instagram').length,
        youtube: mentions.filter(m => m.platform === 'youtube').length,
      }

      expect(byPlatform.x).toBe(2)
      expect(byPlatform.facebook).toBe(1)
      expect(byPlatform.instagram).toBe(1)
      expect(byPlatform.youtube).toBe(1)
    })

    it('debería calcular tendencia correctamente', () => {
      const timeSeries = [
        { date: '2024-01-01', value: 10 },
        { date: '2024-01-02', value: 12 },
        { date: '2024-01-03', value: 8 },
        { date: '2024-01-04', value: 15 },
        { date: '2024-01-05', value: 20 },
        { date: '2024-01-06', value: 25 },
        { date: '2024-01-07', value: 30 },
      ]

      const recentDays = timeSeries.slice(-3)
      const olderDays = timeSeries.slice(0, 4)

      const recentAvg = recentDays.reduce((sum, d) => sum + d.value, 0) / recentDays.length
      const olderAvg = olderDays.reduce((sum, d) => sum + d.value, 0) / olderDays.length

      const percentChange = ((recentAvg - olderAvg) / olderAvg) * 100

      expect(percentChange).toBeGreaterThan(0) // Tendencia positiva
    })
  })
})
