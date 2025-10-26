/**
 * Middleware de autenticación con Supabase
 *
 * Protege rutas y refresca sesiones automáticamente
 */

import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rutas que requieren autenticación
const protectedPaths = [
  '/dashboard',
  '/settings',
  '/reports',
  '/alerts',
  '/analytics',
  '/amelia',
  '/onboarding'
]

// Rutas de admin (requieren role = 'admin')
const adminPaths = ['/admin']

// Rutas públicas (acceso sin autenticación)
const publicPaths = [
  '/login',
  '/register',
  '/',
  '/pricing',
  '/about'
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Actualizar sesión de Supabase y obtener usuario
  const { response, user } = await updateSession(request)

  // Verificar si la ruta requiere autenticación
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))
  const isAdminPath = adminPaths.some(path => pathname.startsWith(path))
  const isPublicPath = publicPaths.some(path => pathname === path || pathname.startsWith(path))

  // Si es ruta pública y no protegida, permitir acceso
  if (isPublicPath && !isProtectedPath && !isAdminPath) {
    return response
  }

  // Si es ruta protegida y no hay usuario, redirigir a login
  if (isProtectedPath && !user) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Si es ruta de admin, verificar role
  if (isAdminPath) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Obtener rol del usuario desde la tabla users
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Si ya está autenticado y trata de ir a login/register, redirigir a dashboard
  if ((pathname === '/login' || pathname === '/register') && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.webp|.*\\.ico).*)',
  ],
}
