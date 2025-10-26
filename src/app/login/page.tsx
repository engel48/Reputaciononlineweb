/**
 * Página de Login con Supabase Auth
 *
 * Soporta:
 * - Autenticación con email/password
 * - OAuth con Google, Facebook, X (Twitter), LinkedIn
 * - Redirección automática después del login
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { Eye, EyeOff, Mail, Lock, Check } from 'lucide-react'
import { FcGoogle } from 'react-icons/fc'
import { FaFacebook, FaTwitter, FaLinkedin } from 'react-icons/fa'
import Link from 'next/link'
import gsap from 'gsap'
import { createTimeline, staggerFadeIn } from '@/lib/gsap-animations'
import AnimatedBackground from '@/components/ui/AnimatedBackground'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/dashboard'
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

  async function handleOAuthLogin(provider: 'google' | 'facebook' | 'twitter' | 'linkedin') {
    setError('')

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${redirectTo}`
      }
    })

    if (error) {
      setError(error.message)
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
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Panel lateral - Solo visible en pantallas medianas y grandes */}
      <div className="relative hidden w-1/2 bg-gradient-to-br from-[#01257D] to-[#013AAA] md:block">
        <AnimatedBackground
          className="opacity-40"
          particleColor="rgba(255, 255, 255, 0.6)"
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
            <div className="rounded-lg bg-white bg-opacity-10 p-4">
              <div className="mb-2 flex items-center">
                <Check className="mr-2 h-5 w-5 text-green-400" />
                <h3 className="text-lg font-medium">Monitoreo en Tiempo Real</h3>
              </div>
              <p className="text-sm text-white/80">
                Mantén el control total de tu reputación online con análisis en tiempo real de todas tus menciones.
              </p>
            </div>

            <div className="rounded-lg bg-white bg-opacity-10 p-4">
              <div className="mb-2 flex items-center">
                <Check className="mr-2 h-5 w-5 text-green-400" />
                <h3 className="text-lg font-medium">Análisis con IA</h3>
              </div>
              <p className="text-sm text-white/80">
                Nuestra asistente Julia analiza sentimientos y tendencias para brindarte insights accionables.
              </p>
            </div>

            <div className="rounded-lg bg-white bg-opacity-10 p-4">
              <div className="mb-2 flex items-center">
                <Check className="mr-2 h-5 w-5 text-green-400" />
                <h3 className="text-lg font-medium">Reportes Profesionales</h3>
              </div>
              <p className="text-sm text-white/80">
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
      <div className="flex w-full items-center justify-center px-4 md:w-1/2 md:px-0">
        <div
          ref={formRef}
          className="w-full max-w-md space-y-8 p-8"
        >
          {/* Logo solo visible en móviles */}
          <div className="text-center md:hidden">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#01257D]">
              <div className="h-8 w-8 rounded-full bg-white"></div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reputación Online</h1>
            <p className="text-gray-500 dark:text-gray-400">Gestiona tu presencia digital</p>
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Iniciar Sesión</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Ingresa tus credenciales para acceder a tu cuenta
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Formulario de email/password */}
          <form onSubmit={handleEmailLogin} className="mt-8 space-y-6">
            <div className="space-y-4">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                    className="block w-full rounded-md border-gray-300 py-3 pl-10 placeholder-gray-400 shadow-sm focus:border-[#01257D] focus:ring-[#01257D] dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                    placeholder="usuario@empresa.com"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                    className="block w-full rounded-md border-gray-300 py-3 pl-10 pr-10 placeholder-gray-400 shadow-sm focus:border-[#01257D] focus:ring-[#01257D] dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                    placeholder="Tu contraseña"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-500"
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
              className="flex w-full items-center justify-center rounded-lg bg-[#01257D] px-5 py-3 text-center text-base font-medium text-white hover:bg-[#013AAA] focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="mr-2 h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">O continúa con</span>
            </div>
          </div>

          {/* OAuth Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleOAuthLogin('google')}
              disabled={loading}
              className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FcGoogle className="w-5 h-5 mr-2" />
              <span className="text-sm font-medium text-gray-700">Google</span>
            </button>

            <button
              onClick={() => handleOAuthLogin('facebook')}
              disabled={loading}
              className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaFacebook className="w-5 h-5 mr-2 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Facebook</span>
            </button>

            <button
              onClick={() => handleOAuthLogin('twitter')}
              disabled={loading}
              className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaTwitter className="w-5 h-5 mr-2 text-sky-500" />
              <span className="text-sm font-medium text-gray-700">X / Twitter</span>
            </button>

            <button
              onClick={() => handleOAuthLogin('linkedin')}
              disabled={loading}
              className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaLinkedin className="w-5 h-5 mr-2 text-blue-700" />
              <span className="text-sm font-medium text-gray-700">LinkedIn</span>
            </button>
          </div>

          {/* Link a registro */}
          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            ¿No tienes cuenta?{' '}
            <Link
              href="/register"
              className="font-medium text-[#01257D] hover:text-[#013AAA] dark:text-[#01257D]"
            >
              Regístrate
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
