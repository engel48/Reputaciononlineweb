/**
 * Tests para las páginas de error
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ErrorPage from '@/app/error'
import NotFound from '@/app/not-found'
import Loading from '@/app/loading'
import GlobalError from '@/app/global-error'

describe('Páginas de Error', () => {
  describe('Error Page (error.tsx)', () => {
    const mockReset = vi.fn()
    const mockError = new Error('Test error message') as Error & { digest?: string }
    mockError.digest = 'test-digest-123'

    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('debería renderizar el mensaje de error', () => {
      render(<ErrorPage error={mockError} reset={mockReset} />)

      expect(screen.getByText('Algo salió mal')).toBeInTheDocument()
    })

    it('debería mostrar el código de error si existe digest', () => {
      render(<ErrorPage error={mockError} reset={mockReset} />)

      expect(screen.getByText(/test-digest-123/)).toBeInTheDocument()
    })

    it('debería llamar a reset al hacer clic en reintentar', () => {
      render(<ErrorPage error={mockError} reset={mockReset} />)

      const retryButton = screen.getByText('Intentar de nuevo')
      fireEvent.click(retryButton)

      expect(mockReset).toHaveBeenCalledTimes(1)
    })

    it('debería tener un enlace al inicio', () => {
      render(<ErrorPage error={mockError} reset={mockReset} />)

      const homeLink = screen.getByText('Ir al inicio')
      expect(homeLink).toHaveAttribute('href', '/dashboard')
    })

    it('debería tener un enlace de soporte', () => {
      render(<ErrorPage error={mockError} reset={mockReset} />)

      const supportLink = screen.getByText('Contacta soporte')
      expect(supportLink).toHaveAttribute('href', '/contacto')
    })
  })

  describe('Not Found Page (not-found.tsx)', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('debería renderizar el mensaje 404', () => {
      render(<NotFound />)

      expect(screen.getByText('404')).toBeInTheDocument()
      expect(screen.getByText('Página no encontrada')).toBeInTheDocument()
    })

    it('debería tener un enlace al dashboard', () => {
      render(<NotFound />)

      const dashboardLink = screen.getByText('Ir al Dashboard')
      expect(dashboardLink).toHaveAttribute('href', '/dashboard')
    })

    it('debería mostrar sugerencias de por qué ocurrió', () => {
      render(<NotFound />)

      expect(screen.getByText(/URL fue escrita incorrectamente/)).toBeInTheDocument()
      expect(screen.getByText(/página fue eliminada o movida/)).toBeInTheDocument()
    })

    it('debería tener botón para volver atrás', () => {
      render(<NotFound />)

      const backButton = screen.getByText('Volver atrás')
      expect(backButton).toBeInTheDocument()
    })
  })

  describe('Loading Page (loading.tsx)', () => {
    it('debería renderizar el indicador de carga', () => {
      render(<Loading />)

      expect(screen.getByText('Cargando...')).toBeInTheDocument()
      expect(screen.getByText('Preparando tu experiencia')).toBeInTheDocument()
    })

    it('debería tener animación de spinner', () => {
      const { container } = render(<Loading />)

      const spinner = container.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })
  })

  describe('Global Error Page (global-error.tsx)', () => {
    const mockReset = vi.fn()
    const mockError = new Error('Critical error') as Error & { digest?: string }
    mockError.digest = 'critical-123'

    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('debería renderizar mensaje de error crítico', () => {
      render(<GlobalError error={mockError} reset={mockReset} />)

      expect(screen.getByText('Error Crítico')).toBeInTheDocument()
    })

    it('debería mostrar el ID del error', () => {
      render(<GlobalError error={mockError} reset={mockReset} />)

      expect(screen.getByText(/critical-123/)).toBeInTheDocument()
    })

    it('debería llamar a reset al hacer clic en recargar', () => {
      render(<GlobalError error={mockError} reset={mockReset} />)

      const reloadButton = screen.getByText('Recargar aplicación')
      fireEvent.click(reloadButton)

      expect(mockReset).toHaveBeenCalledTimes(1)
    })

    it('debería tener email de soporte', () => {
      render(<GlobalError error={mockError} reset={mockReset} />)

      const emailLink = screen.getByText('soporte@reputaciononline.com')
      expect(emailLink).toHaveAttribute('href', 'mailto:soporte@reputaciononline.com')
    })
  })
})
