/**
 * Loading - Estado de carga global
 * Se muestra mientras se cargan las páginas
 */

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        {/* Logo animado */}
        <div className="relative mb-6">
          <div className="w-16 h-16 mx-auto">
            {/* Círculo exterior girando */}
            <div className="absolute inset-0 border-4 border-[#01257D]/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-[#01257D] rounded-full animate-spin"></div>

            {/* Icono central */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-[#01257D]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Texto */}
        <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
          Cargando...
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Preparando tu experiencia
        </p>

        {/* Barra de progreso animada */}
        <div className="mt-6 w-48 mx-auto">
          <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full w-1/2 bg-[#01257D] rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
