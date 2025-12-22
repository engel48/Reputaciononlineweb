'use client'

/**
 * Página 404 - Not Found
 * Se muestra cuando el usuario accede a una ruta que no existe
 */

import { FileQuestion, Home, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function NotFound() {
  const router = useRouter()
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center">
        {/* Ilustración 404 */}
        <div className="relative mb-8">
          <div className="text-[180px] font-bold text-gray-100 dark:text-gray-800 leading-none select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 bg-[#01257D]/10 rounded-full flex items-center justify-center">
              <FileQuestion className="w-12 h-12 text-[#01257D]" />
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Página no encontrada
          </h1>

          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Lo sentimos, la página que buscas no existe o ha sido movida a otra ubicación.
          </p>

          {/* Sugerencias */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Esto pudo haber pasado porque:
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#01257D] rounded-full"></span>
                La URL fue escrita incorrectamente
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#01257D] rounded-full"></span>
                La página fue eliminada o movida
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#01257D] rounded-full"></span>
                El enlace está desactualizado
              </li>
            </ul>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#01257D] hover:bg-[#01257D]/90 text-white font-medium rounded-lg transition-colors"
            >
              <Home className="w-4 h-4" />
              Ir al Dashboard
            </Link>

            <button
              onClick={() => router.back()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver atrás
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          ¿Necesitas ayuda?{' '}
          <Link href="/contacto" className="text-[#01257D] hover:underline">
            Contacta soporte
          </Link>
        </p>
      </div>
    </div>
  )
}
