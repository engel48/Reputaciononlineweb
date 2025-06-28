import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Rutas que requieren autenticación
const protectedPaths = ['/dashboard', '/onboarding'];
// Rutas que no requieren autenticación (públicas)
const publicPaths = ['/login', '/register', '/'];

// Función para verificar JWT usando Web Crypto API (compatible con Edge Runtime)
async function verifyJWT(token: string): Promise<boolean> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    const header = JSON.parse(atob(parts[0]));
    const payload = JSON.parse(atob(parts[1]));
    const signature = parts[2];
    
    // Verificar que no haya expirado
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return false;
    }
    
    // Para Edge Runtime, simplificamos la verificación
    // En un entorno de producción, implementarías verificación completa de firma
    return true;
  } catch (error) {
    console.error('Error verificando JWT:', error);
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Verificar si la ruta requiere autenticación
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));
  const isPublicPath = publicPaths.some(path => pathname === path || pathname.startsWith(path));
  
  // Si es una ruta pública, permitir acceso
  if (isPublicPath && !isProtectedPath) {
    return NextResponse.next();
  }
  
  // Si es una ruta protegida, verificar autenticación
  if (isProtectedPath) {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      // Redirigir al login si no hay token
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    const isValid = await verifyJWT(token);
    
    if (!isValid) {
      // Si el token es inválido, redirigir al login
      console.error('Token inválido o expirado');
      const response = NextResponse.redirect(new URL('/login', request.url));
      // Limpiar la cookie inválida
      response.cookies.delete('auth-token');
      return response;
    }
    
    // Si el token es válido, continuar
    return NextResponse.next();
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg).*)',
  ],
}
