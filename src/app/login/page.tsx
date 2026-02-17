/**
 * Pagina de Login
 *
 * Soporta:
 * - Autenticacion con email/password
 * - Redireccion automatica despues del login
 */

'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { Eye, EyeOff, Mail, Lock, Check } from 'lucide-react'
import Link from 'next/link'
import gsap from 'gsap'
import { createTimeline, staggerFadeIn } from '@/lib/gsap-animations'
import AnimatedBackground from '@/components/ui/AnimatedBackground'

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/dashboard'
  const justRegistered = searchParams.get('registered') === 'true'
  const { supabase } = useSupabase()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Referencias para animaciones
  const titleRef = useRef<HTMLDivElement>(null)
  const subtitleRef = useRef<HTMLHeadingElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLDivElement>(null)

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Error al iniciar sesión')
        setLoading(false)
        return
      }

      // Login exitoso, forzar recarga y redirigir
      router.refresh()

      // Usar window.location para redirección más confiable
      window.location.href = redirectTo
    } catch (error) {
      console.error('Error en login:', error)
      setError('Error de conexión. Por favor, intenta de nuevo.')
      setLoading(false)
    }
  }

  // Inicializar animaciones
  useEffect(() => {
    if (typeof window === 'undefined') return

    const tl = createTimeline({ defaults: { ease: 'power3.out' } })

    // Animar título y logo con efecto "inteligente"
    if (titleRef.current) {
      tl.from(titleRef.current, {
        opacity: 0,
        y: -20,
        duration: 0.6,
        clearProps: 'all'
      })
    }

    // Animar subtítulo con efecto de aparición gradual
    if (subtitleRef.current) {
      tl.from(subtitleRef.current, {
        opacity: 0,
        filter: 'blur(5px)',
        duration: 0.7,
        clearProps: 'all'
      }, '-=0.3')
    }

    // Animar características con un efecto de análisis de datos de IA
    if (featuresRef.current && featuresRef.current.children.length > 0) {
      const features = Array.from(featuresRef.current.children)
      staggerFadeIn(features, 0.1, {
        delay: 0.2
      })
    }

    // Animar formulario con efecto básico
    if (formRef.current) {
      tl.from(formRef.current, {
        opacity: 0,
        y: 15,
        duration: 0.4,
        clearProps: 'all'
      })
    }

    return () => {
      tl.kill()
    }
  }, [])

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Panel lateral - Solo visible en pantallas medianas y grandes */}
      <div className="relative hidden w-1/2 bg-gradient-to-br from-[#0B1120] to-[#151C2E] md:block">
        <AnimatedBackground
          className="opacity-40"
          particleColor="rgba(0, 229, 255, 0.4)"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-white">
          <div
            ref={titleRef}
            className="mb-8 flex items-center"
          >
            <div className="mr-3">
              <img
                src="/reputacion-online-logo.png"
                alt="ROL - Reputación Online"
                className="h-12 w-auto"
              />
            </div>
            <h1 className="text-3xl font-bold">Reputación Online</h1>
          </div>

          <h2
            ref={subtitleRef}
            className="mb-6 text-center text-2xl font-light"
          >
            Bienvenido de vuelta. Inicia sesión para acceder a tu dashboard
          </h2>

          <div
            ref={featuresRef}
            className="mt-4 space-y-4"
          >
            <div className="rounded-xl bg-white/5 border border-[#00E5FF]/20 p-4 backdrop-blur-sm">
              <div className="mb-2 flex items-center">
                <div className="mr-3 w-8 h-8 rounded-lg bg-[#00E5FF]/20 flex items-center justify-center">
                  <Check className="h-4 w-4 text-[#00E5FF]" />
                </div>
                <h3 className="text-lg font-medium">Monitoreo en Tiempo Real</h3>
              </div>
              <p className="text-sm text-gray-300 ml-11">
                Mantén el control total de tu reputación online con análisis en tiempo real de todas tus menciones.
              </p>
            </div>

            <div className="rounded-xl bg-white/5 border border-[#00E5FF]/20 p-4 backdrop-blur-sm">
              <div className="mb-2 flex items-center">
                <div className="mr-3 w-8 h-8 rounded-lg bg-[#00E5FF]/20 flex items-center justify-center">
                  <Check className="h-4 w-4 text-[#00E5FF]" />
                </div>
                <h3 className="text-lg font-medium">Análisis con IA</h3>
              </div>
              <p className="text-sm text-gray-300 ml-11">
                Nuestra asistente Julia analiza sentimientos y tendencias para brindarte insights accionables.
              </p>
            </div>

            <div className="rounded-xl bg-white/5 border border-[#00E5FF]/20 p-4 backdrop-blur-sm">
              <div className="mb-2 flex items-center">
                <div className="mr-3 w-8 h-8 rounded-lg bg-[#00E5FF]/20 flex items-center justify-center">
                  <Check className="h-4 w-4 text-[#00E5FF]" />
                </div>
                <h3 className="text-lg font-medium">Reportes Profesionales</h3>
              </div>
              <p className="text-sm text-gray-300 ml-11">
                Genera reportes detallados en PDF para compartir con tu equipo o stakeholders.
              </p>
            </div>
          </div>
        </div>

        <div className="absolute bottom-4 left-0 right-0 text-center text-sm text-white text-opacity-70">
          2025 Reputación Online. Todos los derechos reservados.
        </div>
      </div>

      {/* Formulario de login */}
      <div className="flex w-full items-center justify-center px-4 md:w-1/2 md:px-0 bg-gray-50">
        <div
          ref={formRef}
          className="w-full max-w-md space-y-8 p-8"
        >
          {/* Logo solo visible en móviles */}
          <div className="text-center md:hidden">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#00E5FF]/10">
              <span className="text-2xl font-bold text-[#00E5FF]">R</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Reputación Online</h1>
            <p className="text-gray-600">Gestiona tu presencia digital</p>
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Iniciar Sesión</h2>
            <p className="mt-2 text-sm text-gray-600">
              Ingresa tus credenciales para acceder a tu cuenta
            </p>
          </div>

          {/* Registration success message */}
          {justRegistered && (
            <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
              <p className="text-sm text-blue-700 font-medium">Cuenta creada exitosamente</p>
              <p className="text-sm text-blue-600 mt-1">Te enviamos un email de verificacion. Revisa tu bandeja de entrada y haz clic en el link para activar tu cuenta.</p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Formulario de email/password */}
          <form onSubmit={handleEmailLogin} className="mt-8 space-y-6">
            <div className="space-y-4">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Correo electrónico <span className="text-red-500">*</span>
                </label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 text-base text-gray-900 placeholder-gray-400 shadow-sm focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] transition-colors"
                    placeholder="usuario@empresa.com"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Contraseña <span className="text-red-500">*</span>
                </label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-10 text-base text-gray-900 placeholder-gray-400 shadow-sm focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] transition-colors"
                    placeholder="Tu contraseña"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-[#00E5FF] transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Eye className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Botón de submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-xl bg-[#00E5FF] px-5 py-3 text-center text-base font-semibold text-[#0B1120] hover:bg-[#00B8D4] focus:ring-4 focus:ring-[#00E5FF]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_4px_20px_rgba(0,229,255,0.3)] hover:shadow-[0_6px_25px_rgba(0,229,255,0.4)]"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Iniciando sesión...
                </span>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>

          {/* Link a recuperar contrasena */}
          <div className="text-center">
            <Link
              href="/reset-password"
              className="text-sm font-medium text-gray-500 hover:text-[#00E5FF] transition-colors"
            >
              ¿Olvidaste tu contrasena?
            </Link>
          </div>

          {/* Link a registro */}
          <div className="mt-4 text-center text-sm text-gray-600">
            ¿No tienes cuenta?{' '}
            <Link
              href="/register"
              className="font-medium text-[#00E5FF] hover:text-[#00B8D4] transition-colors"
            >
              Registrate
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function LoginLoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#00E5FF] border-t-transparent"></div>
        <p className="mt-4 text-gray-600">Cargando...</p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoadingFallback />}>
      <LoginPageContent />
    </Suspense>
  )
}
