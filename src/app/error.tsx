'use client'

/**
 * Página de Error - Maneja errores de runtime en la aplicación
 * Se muestra cuando ocurre un error no capturado en cualquier ruta
 */

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log del error para debugging
    console.error('Error capturado:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
        {/* Icono de error */}
        <div className="mx-auto w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
        </div>

        {/* Título */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Algo salió mal
        </h1>

        {/* Descripción */}
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Ha ocurrido un error inesperado. Nuestro equipo ha sido notificado y estamos trabajando para solucionarlo.
        </p>

        {/* Código de error (si existe) */}
        {error.digest && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-6 font-mono bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded">
            Código de error: {error.digest}
          </p>
        )}

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#01257D] hover:bg-[#01257D]/90 text-white font-medium rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Intentar de nuevo
          </button>

          <a
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors"
          >
            <Home className="w-4 h-4" />
            Ir al inicio
          </a>
        </div>

        {/* Link de soporte */}
        <p className="mt-8 text-sm text-gray-500 dark:text-gray-400">
          ¿El problema persiste?{' '}
          <a href="/contacto" className="text-[#01257D] hover:underline">
            Contacta soporte
          </a>
        </p>
      </div>
    </div>
  )
}
