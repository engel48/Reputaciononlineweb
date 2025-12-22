'use client'

/**
 * Error del Dashboard - Maneja errores específicos del dashboard
 * Permite al usuario continuar navegando sin perder su sesión
 */

import { useEffect } from 'react'
import { AlertCircle, RefreshCw, Home, HelpCircle } from 'lucide-react'
import Link from 'next/link'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Error en dashboard:', error)
  }, [error])

  // Determinar el tipo de error para mostrar mensaje apropiado
  const getErrorMessage = () => {
    const message = error.message?.toLowerCase() || ''

    if (message.includes('network') || message.includes('fetch')) {
      return {
        title: 'Error de conexión',
        description: 'No pudimos conectar con el servidor. Verifica tu conexión a internet.',
        icon: 'network'
      }
    }

    if (message.includes('auth') || message.includes('token') || message.includes('401')) {
      return {
        title: 'Sesión expirada',
        description: 'Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.',
        icon: 'auth'
      }
    }

    if (message.includes('permission') || message.includes('403')) {
      return {
        title: 'Sin permisos',
        description: 'No tienes permisos para acceder a este recurso.',
        icon: 'permission'
      }
    }

    return {
      title: 'Error inesperado',
      description: 'Ha ocurrido un error al cargar esta sección del dashboard.',
      icon: 'default'
    }
  }

  const errorInfo = getErrorMessage()

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        {/* Header con icono */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {errorInfo.title}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {errorInfo.description}
            </p>
          </div>
        </div>

        {/* Detalles técnicos (colapsable) */}
        {error.digest && (
          <details className="mb-4 text-xs">
            <summary className="cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              Ver detalles técnicos
            </summary>
            <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded font-mono text-gray-600 dark:text-gray-300">
              <p>Código: {error.digest}</p>
              <p className="truncate">Mensaje: {error.message}</p>
            </div>
          </details>
        )}

        {/* Acciones */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={reset}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#01257D] hover:bg-[#01257D]/90 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </button>

          <Link
            href="/dashboard"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
          >
            <Home className="w-4 h-4" />
            Inicio
          </Link>
        </div>

        {/* Ayuda */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Link
            href="/contacto"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#01257D] dark:text-gray-400 dark:hover:text-blue-400"
          >
            <HelpCircle className="w-4 h-4" />
            ¿Necesitas ayuda?
          </Link>
        </div>
      </div>
    </div>
  )
}
