'use client'

/**
 * Global Error - Maneja errores críticos a nivel de root
 * Se muestra cuando falla el layout principal o hay errores críticos
 * Este componente debe incluir su propio <html> y <body>
 */

import { useEffect } from 'react'
import { AlertOctagon, RefreshCw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log del error crítico
    console.error('Error crítico global:', error)
  }, [error])

  return (
    <html lang="es">
      <body className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800 rounded-2xl shadow-2xl p-8 text-center border border-gray-700">
          {/* Icono de error crítico */}
          <div className="mx-auto w-24 h-24 bg-red-900/50 rounded-full flex items-center justify-center mb-6 animate-pulse">
            <AlertOctagon className="w-12 h-12 text-red-500" />
          </div>

          {/* Título */}
          <h1 className="text-2xl font-bold text-white mb-2">
            Error Crítico
          </h1>

          {/* Descripción */}
          <p className="text-gray-400 mb-6">
            Ha ocurrido un error grave en la aplicación. Por favor, intenta recargar la página.
          </p>

          {/* Código de error */}
          {error.digest && (
            <div className="mb-6 p-3 bg-gray-900 rounded-lg border border-gray-700">
              <p className="text-xs text-gray-500 font-mono">
                Error ID: {error.digest}
              </p>
            </div>
          )}

          {/* Botón de reinicio */}
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 w-full px-6 py-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Recargar aplicación
          </button>

          {/* Información adicional */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <p className="text-sm text-gray-500">
              Si el problema persiste, contacta a soporte técnico
            </p>
            <a
              href="mailto:soporte@reputaciononline.com"
              className="text-sm text-blue-400 hover:underline"
            >
              soporte@reputaciononline.com
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
