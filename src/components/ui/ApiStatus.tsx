'use client'

import { useEffect, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ApiHealth {
  supabase: boolean
  facebook: boolean
  twitter: boolean
  linkedin: boolean
  youtube: boolean
  instagram: boolean
}

interface ApiStatusProps {
  showWhenHealthy?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
}

export default function ApiStatus({
  showWhenHealthy = false,
  autoRefresh = true,
  refreshInterval = 60000 // 1 minuto
}: ApiStatusProps) {
  const [health, setHealth] = useState<ApiHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  useEffect(() => {
    checkApiHealth()

    if (autoRefresh) {
      const interval = setInterval(checkApiHealth, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval])

  const checkApiHealth = async () => {
    try {
      const response = await fetch('/api/health/check', {
        cache: 'no-store'
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      if (data.success && data.services) {
        setHealth(data.services)
        setLastCheck(new Date())
      } else {
        throw new Error('Respuesta inválida del servidor')
      }
    } catch (error) {
      console.error('Health check failed:', error)
      // Si falla el health check, asumir que todos están down
      setHealth({
        supabase: false,
        facebook: false,
        twitter: false,
        linkedin: false,
        youtube: false,
        instagram: false
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Alert className="mb-4 border-blue-200 bg-blue-50">
        <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
        <AlertDescription className="text-blue-700">
          Verificando estado de servicios...
        </AlertDescription>
      </Alert>
    )
  }

  if (!health) return null

  const allHealthy = Object.values(health).every(v => v === true)
  const someDown = Object.values(health).some(v => v === false)
  const criticalDown = !health.supabase // Supabase es crítico

  // No mostrar nada si todo está bien y no se configuró showWhenHealthy
  if (allHealthy && !showWhenHealthy) return null

  return (
    <Alert
      variant={criticalDown ? "destructive" : someDown ? "default" : "default"}
      className={`mb-4 ${
        criticalDown
          ? 'border-red-500 bg-red-50'
          : someDown
          ? 'border-yellow-500 bg-yellow-50'
          : 'border-green-500 bg-green-50'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2 flex-1">
          {criticalDown ? (
            <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
          ) : someDown ? (
            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
          )}

          <div className="flex-1">
            <AlertDescription
              className={
                criticalDown
                  ? 'text-red-700'
                  : someDown
                  ? 'text-yellow-700'
                  : 'text-green-700'
              }
            >
              {criticalDown ? (
                <>
                  <strong className="block mb-2">Sistema crítico no disponible</strong>
                  <p className="mb-2">
                    La base de datos no está respondiendo. Algunas funcionalidades no estarán disponibles.
                  </p>
                </>
              ) : someDown ? (
                <>
                  <strong className="block mb-2">Algunas APIs no están respondiendo</strong>
                  <ul className="mt-2 ml-4 list-disc space-y-1">
                    {!health.facebook && <li>Facebook - No disponible</li>}
                    {!health.twitter && <li>Twitter/X - No disponible</li>}
                    {!health.linkedin && <li>LinkedIn - No disponible</li>}
                    {!health.youtube && <li>YouTube - No disponible</li>}
                    {!health.instagram && <li>Instagram - No disponible</li>}
                  </ul>
                  <p className="mt-2 text-sm">
                    Algunas funcionalidades de redes sociales pueden estar limitadas.
                  </p>
                </>
              ) : (
                <>
                  <strong>Todos los servicios operando correctamente</strong>
                  <p className="text-sm mt-1">
                    Base de datos y APIs de redes sociales disponibles.
                  </p>
                </>
              )}
            </AlertDescription>

            {lastCheck && (
              <p className="text-xs text-gray-500 mt-2">
                Última verificación: {lastCheck.toLocaleTimeString('es-CO')}
              </p>
            )}
          </div>
        </div>

        <Button
          onClick={checkApiHealth}
          variant="ghost"
          size="sm"
          className="ml-2"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </Alert>
  )
}
