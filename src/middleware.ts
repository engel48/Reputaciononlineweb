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
      console.log('🔍 MIDDLEWARE: Token expirado');
      return false;
    }
    
    // Verificar que tenga los campos requeridos
    if (!payload.userId || !payload.email) {
      console.log('🔍 MIDDLEWARE: Token sin datos requeridos');
      return false;
    }
    
    // Verificación de firma simplificada para Edge Runtime
    // Crear la firma esperada con el mismo algoritmo
    const encoder = new TextEncoder();
    const data = parts[0] + '.' + parts[1];
    const keyData = encoder.encode(JWT_SECRET);
    
    try {
      const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      
      const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
      const signatureArray = new Uint8Array(signatureBuffer);
      const expectedSignature = btoa(String.fromCharCode.apply(null, Array.from(signatureArray)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      
      const isValidSignature = signature === expectedSignature;
      if (!isValidSignature) {
        console.log('🔍 MIDDLEWARE: Firma de token inválida');
        return false;
      }
      
      console.log('✅ MIDDLEWARE: Token válido para usuario:', payload.email);
      return true;
    } catch (cryptoError) {
      // Fallback: validación básica si crypto.subtle falla
      console.log('⚠️ MIDDLEWARE: Usando validación fallback');
      return payload.userId && payload.email && (!payload.exp || payload.exp > Math.floor(Date.now() / 1000));
    }
  } catch (error) {
    console.error('❌ MIDDLEWARE: Error verificando JWT:', error);
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log('🔍 MIDDLEWARE: Procesando ruta:', pathname);
  
  // Verificar si la ruta requiere autenticación
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));
  const isPublicPath = publicPaths.some(path => pathname === path || pathname.startsWith(path));
  
  console.log('🔍 MIDDLEWARE: Análisis de ruta:', {
    pathname,
    isProtectedPath,
    isPublicPath,
    protectedPaths,
    publicPaths
  });
  
  // Si es una ruta pública, permitir acceso
  if (isPublicPath && !isProtectedPath) {
    console.log('✅ MIDDLEWARE: Ruta pública, permitiendo acceso');
    return NextResponse.next();
  }
  
  // Si es una ruta protegida, verificar autenticación
  if (isProtectedPath) {
    console.log('🔐 MIDDLEWARE: Ruta protegida, verificando autenticación...');
    const token = request.cookies.get('auth-token')?.value;
    
    console.log('🔍 MIDDLEWARE: Token encontrado:', token ? 'Sí' : 'No');
    console.log('🔍 MIDDLEWARE: Todas las cookies:', request.cookies.getAll());
    
    if (token) {
      console.log('🔍 MIDDLEWARE: Primeros caracteres del token:', token.substring(0, 20) + '...');
    }
    
    if (!token) {
      console.log('❌ MIDDLEWARE: No hay token en cookies');
      
      // Para debugging: verificar headers
      const authHeader = request.headers.get('authorization');
      console.log('🔍 MIDDLEWARE: Authorization header:', authHeader ? 'Presente' : 'No presente');
      
      // Verificar si viene de un login reciente (para dar tiempo a que se establezca la cookie)
      const referer = request.headers.get('referer');
      console.log('🔍 MIDDLEWARE: Referer:', referer);
      
      if (referer && referer.includes('/login')) {
        console.log('⚠️ MIDDLEWARE: Viene de login, posible problema de timing');
      }
      
      console.log('❌ MIDDLEWARE: Redirigiendo a login');
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    console.log('🔍 MIDDLEWARE: Verificando validez del token...');
    const isValid = await verifyJWT(token);
    
    if (!isValid) {
      console.log('❌ MIDDLEWARE: Token inválido o expirado, redirigiendo a login');
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('auth-token');
      return response;
    }
    
    console.log('✅ MIDDLEWARE: Token válido, permitiendo acceso');
    return NextResponse.next();
  }
  
  console.log('✅ MIDDLEWARE: Ruta no clasificada, permitiendo acceso');
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
    // Explicitly include dashboard routes for debugging
    '/dashboard/:path*',
    '/login',
    '/register',
    '/'
  ],
}
