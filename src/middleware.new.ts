/**
 * Middleware con Supabase Auth
 *
 * Reemplaza el middleware anterior basado en JWT custom
 * Ahora usa Supabase Auth para verificación de sesiones
 */

import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Rutas que requieren autenticación
const protectedPaths = ['/dashboard', '/onboarding', '/admin']

// Rutas públicas (no requieren autenticación)
const publicPaths = ['/login', '/register', '/', '/oauth-login']

// Rutas de admin (requieren role = 'admin')
const adminPaths = ['/admin']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  console.log('🔍 MIDDLEWARE (Supabase): Procesando ruta:', pathname)

  // Actualizar sesión de Supabase (refresca tokens si es necesario)
  const { response, user, supabase } = await updateSession(request)

  // Verificar si la ruta es protegida
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))
  const isPublicPath = publicPaths.some(path => pathname === path || pathname.startsWith(path))
  const isAdminPath = adminPaths.some(path => pathname.startsWith(path))

  console.log('🔍 MIDDLEWARE: Análisis de ruta:', {
    pathname,
    isProtectedPath,
    isPublicPath,
    isAdminPath,
    hasUser: !!user
  })

  // Si es una ruta pública, permitir acceso
  if (isPublicPath && !isProtectedPath) {
    console.log('✅ MIDDLEWARE: Ruta pública, permitiendo acceso')
    return response
  }

  // Si es una ruta protegida y no hay usuario, redirigir a login
  if (isProtectedPath && !user) {
    console.log('❌ MIDDLEWARE: Ruta protegida sin usuario, redirigiendo a login')
    const redirectUrl = new URL('/login', request.url)
    // Guardar la URL original para redirigir después del login
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Si es una ruta de admin, verificar role
  if (isAdminPath && user) {
    console.log('🔐 MIDDLEWARE: Verificando permisos de admin...')

    // Obtener datos del usuario de la tabla users
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || userData.role !== 'admin') {
      console.log('❌ MIDDLEWARE: Usuario no es admin, redirigiendo a dashboard')
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    console.log('✅ MIDDLEWARE: Usuario es admin, permitiendo acceso')
  }

  // Si llegamos aquí, permitir acceso
  console.log('✅ MIDDLEWARE: Permitiendo acceso a ruta')
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
