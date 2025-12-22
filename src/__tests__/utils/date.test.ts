/**
 * Tests para utilidades de fechas y tiempo
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('Utilidades de Fecha', () => {
  describe('Cálculo de rangos de fecha', () => {
    beforeEach(() => {
      // Mock de fecha actual: 2024-01-15
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('debería calcular correctamente 7 días atrás', () => {
      const now = new Date()
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      expect(sevenDaysAgo.toISOString().split('T')[0]).toBe('2024-01-08')
    })

    it('debería calcular correctamente 14 días atrás', () => {
      const now = new Date()
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

      expect(fourteenDaysAgo.toISOString().split('T')[0]).toBe('2024-01-01')
    })

    it('debería calcular correctamente 30 días atrás', () => {
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      expect(thirtyDaysAgo.toISOString().split('T')[0]).toBe('2023-12-16')
    })
  })

  describe('Generación de time series', () => {
    it('debería generar 7 días de serie temporal', () => {
      const now = new Date('2024-01-15T12:00:00Z')
      const timeSeries: Array<{ date: string; value: number }> = []

      for (let i = 6; i >= 0; i--) {
        const dayDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const dayStr = dayDate.toISOString().split('T')[0]
        timeSeries.push({ date: dayStr, value: 0 })
      }

      expect(timeSeries).toHaveLength(7)
      expect(timeSeries[0].date).toBe('2024-01-09')
      expect(timeSeries[6].date).toBe('2024-01-15')
    })

    it('debería mantener orden cronológico', () => {
      const now = new Date('2024-01-15T12:00:00Z')
      const timeSeries: Array<{ date: string; value: number }> = []

      for (let i = 6; i >= 0; i--) {
        const dayDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const dayStr = dayDate.toISOString().split('T')[0]
        timeSeries.push({ date: dayStr, value: 0 })
      }

      for (let i = 1; i < timeSeries.length; i++) {
        const prevDate = new Date(timeSeries[i - 1].date)
        const currDate = new Date(timeSeries[i].date)
        expect(currDate.getTime()).toBeGreaterThan(prevDate.getTime())
      }
    })
  })

  describe('Cálculo de horas hasta expiración', () => {
    it('debería calcular horas correctamente para token por expirar', () => {
      const now = new Date('2024-01-15T12:00:00Z')
      const expiryDate = new Date('2024-01-16T12:00:00Z')

      const hoursUntilExpiry = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60)

      expect(hoursUntilExpiry).toBe(24)
    })

    it('debería retornar número negativo si ya expiró', () => {
      const now = new Date('2024-01-15T12:00:00Z')
      const expiryDate = new Date('2024-01-14T12:00:00Z')

      const hoursUntilExpiry = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60)

      expect(hoursUntilExpiry).toBe(-24)
    })

    it('debería detectar token que expira en menos de 24 horas', () => {
      const now = new Date('2024-01-15T12:00:00Z')
      const expiryDate = new Date('2024-01-16T06:00:00Z') // 18 horas

      const hoursUntilExpiry = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60)

      expect(hoursUntilExpiry).toBeLessThan(24)
      expect(hoursUntilExpiry).toBeGreaterThan(0)
    })
  })

  describe('Formateo de fechas para API', () => {
    it('debería generar formato ISO para Supabase', () => {
      const date = new Date('2024-01-15T12:00:00Z')
      const isoString = date.toISOString()

      expect(isoString).toBe('2024-01-15T12:00:00.000Z')
      expect(isoString).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    })

    it('debería extraer solo la fecha (YYYY-MM-DD)', () => {
      const date = new Date('2024-01-15T12:00:00Z')
      const dateOnly = date.toISOString().split('T')[0]

      expect(dateOnly).toBe('2024-01-15')
    })
  })
})

describe('Cálculo de tendencias', () => {
  it('debería calcular tendencia positiva', () => {
    const timeSeries = [
      { date: '2024-01-09', value: 10 },
      { date: '2024-01-10', value: 12 },
      { date: '2024-01-11', value: 8 },
      { date: '2024-01-12', value: 11 },
      { date: '2024-01-13', value: 20 },
      { date: '2024-01-14', value: 25 },
      { date: '2024-01-15', value: 30 },
    ]

    const recentDays = timeSeries.slice(-3)
    const olderDays = timeSeries.slice(0, 4)

    const recentAvg = recentDays.reduce((sum, d) => sum + d.value, 0) / recentDays.length
    const olderAvg = olderDays.reduce((sum, d) => sum + d.value, 0) / olderDays.length

    const percentChange = ((recentAvg - olderAvg) / olderAvg) * 100

    expect(percentChange).toBeGreaterThan(10) // Tendencia "up"
  })

  it('debería calcular tendencia negativa', () => {
    const timeSeries = [
      { date: '2024-01-09', value: 30 },
      { date: '2024-01-10', value: 28 },
      { date: '2024-01-11', value: 25 },
      { date: '2024-01-12', value: 22 },
      { date: '2024-01-13', value: 10 },
      { date: '2024-01-14', value: 8 },
      { date: '2024-01-15', value: 5 },
    ]

    const recentDays = timeSeries.slice(-3)
    const olderDays = timeSeries.slice(0, 4)

    const recentAvg = recentDays.reduce((sum, d) => sum + d.value, 0) / recentDays.length
    const olderAvg = olderDays.reduce((sum, d) => sum + d.value, 0) / olderDays.length

    const percentChange = ((recentAvg - olderAvg) / olderAvg) * 100

    expect(percentChange).toBeLessThan(-10) // Tendencia "down"
  })

  it('debería calcular tendencia estable', () => {
    const timeSeries = [
      { date: '2024-01-09', value: 10 },
      { date: '2024-01-10', value: 11 },
      { date: '2024-01-11', value: 10 },
      { date: '2024-01-12', value: 10 },
      { date: '2024-01-13', value: 11 },
      { date: '2024-01-14', value: 10 },
      { date: '2024-01-15', value: 10 },
    ]

    const recentDays = timeSeries.slice(-3)
    const olderDays = timeSeries.slice(0, 4)

    const recentAvg = recentDays.reduce((sum, d) => sum + d.value, 0) / recentDays.length
    const olderAvg = olderDays.reduce((sum, d) => sum + d.value, 0) / olderDays.length

    const percentChange = ((recentAvg - olderAvg) / olderAvg) * 100

    expect(Math.abs(percentChange)).toBeLessThanOrEqual(10) // Tendencia "stable"
  })
})
