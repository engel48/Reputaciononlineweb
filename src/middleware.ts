/**
 * Middleware de autenticación con JWT Bearer Tokens
 *
 * ✅ ARQUITECTURA UNIFICADA WEB + MÓVIL
 * - Web: Token en localStorage enviado via Authorization header
 * - Móvil (Flutter): Token en Secure Storage enviado via Authorization header
 *
 * El token se verifica en cada API endpoint, no en middleware
 * El middleware solo protege páginas SSR del acceso directo por URL
 */

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
  '/about',
  '/contacto',
  '/planes',
  '/demo'
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Redirigir dashboard-politico al dashboard unificado
  if (pathname.startsWith('/dashboard-politico')) {
    const newPath = pathname.replace('/dashboard-politico', '/dashboard')
    return NextResponse.redirect(new URL(newPath || '/dashboard', request.url))
  }

  // Verificar si la ruta requiere autenticación
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))
  const isAdminPath = adminPaths.some(path => pathname.startsWith(path))
  const isPublicPath = publicPaths.some(path => pathname === path || pathname.startsWith(path))

  // NOTA: Para páginas SSR, verificamos cookie temporal (backward compatibility)
  // Para API routes, cada endpoint verifica Authorization header
  const cookieToken = request.cookies.get('auth-token')?.value;
  const authHeader = request.headers.get('authorization');
  const hasAuthToken = !!(cookieToken || authHeader?.startsWith('Bearer '));

  // Redirigir raiz: autenticados al dashboard, no autenticados al login
  if (pathname === '/') {
    return NextResponse.redirect(new URL(hasAuthToken ? '/dashboard' : '/login', request.url))
  }

  // Si es ruta pública y no protegida, permitir acceso
  if (isPublicPath && !isProtectedPath && !isAdminPath) {
    return NextResponse.next()
  }

  // Si es ruta protegida y no hay token, redirigir a login
  if ((isProtectedPath || isAdminPath) && !hasAuthToken) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Si ya está autenticado y trata de ir a login/register, redirigir a dashboard
  if ((pathname === '/login' || pathname === '/register') && hasAuthToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
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
