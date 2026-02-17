'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const code = searchParams.get('code')
  const userId = searchParams.get('userId')

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!code || !userId) {
      setStatus('error')
      setMessage('Link de verificacion invalido. Faltan parametros.')
      return
    }

    async function verify() {
      try {
        const response = await fetch(`/api/auth/verify-email?code=${code}&userId=${userId}`)
        const data = await response.json()

        if (data.success) {
          setStatus('success')
          setMessage('Tu correo ha sido verificado exitosamente.')
          // Redirect to login after 3 seconds
          setTimeout(() => {
            window.location.href = '/login'
          }, 3000)
        } else {
          setStatus('error')
          setMessage(data.message || 'Error al verificar el correo.')
        }
      } catch {
        setStatus('error')
        setMessage('Error de conexion. Intenta nuevamente.')
      }
    }

    verify()
  }, [code, userId])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
          {status === 'verifying' && (
            <>
              <Loader2 className="mx-auto h-12 w-12 text-[#00E5FF] animate-spin" />
              <h1 className="mt-4 text-xl font-bold text-gray-900">Verificando tu correo...</h1>
              <p className="mt-2 text-sm text-gray-500">Esto solo tomara un momento.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h1 className="mt-4 text-xl font-bold text-gray-900">Correo verificado</h1>
              <p className="mt-2 text-sm text-gray-500">{message}</p>
              <p className="mt-1 text-xs text-gray-400">Redirigiendo al inicio de sesion...</p>
              <Link
                href="/login"
                className="mt-4 inline-block text-sm font-medium text-[#00E5FF] hover:text-[#00B8D4] transition-colors"
              >
                Ir a iniciar sesion ahora
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
              <h1 className="mt-4 text-xl font-bold text-gray-900">Error de verificacion</h1>
              <p className="mt-2 text-sm text-gray-500">{message}</p>
              <div className="mt-6 space-y-2">
                <Link
                  href="/login"
                  className="block text-sm font-medium text-[#00E5FF] hover:text-[#00B8D4] transition-colors"
                >
                  Ir a iniciar sesion
                </Link>
                <Link
                  href="/register"
                  className="block text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Registrarse de nuevo
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#00E5FF] border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Cargando...</p>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}
