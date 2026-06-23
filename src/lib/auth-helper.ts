/**
 * Auth Helper - Utilidad para verificar Bearer Tokens
 *
 * ✅ ARQUITECTURA UNIFICADA WEB + MÓVIL
 * Todos los endpoints API deben usar esta utilidad para autenticación
 */

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import type { StringValue } from 'ms';

const JWT_SECRET = process.env.JWT_SECRET || (() => { throw new Error('FATAL: JWT_SECRET no está configurado en el entorno') })();

export interface AuthUser {
  userId: string;
  email: string;
  role?: string;
  [key: string]: any;
}

/**
 * Extrae y verifica el Bearer token de los headers de la request
 *
 * Soporta dos métodos (para transición gradual):
 * 1. Authorization: Bearer {token} (PREFERIDO - funciona en web y móvil)
 * 2. Cookie: auth-token (LEGACY - solo para backward compatibility temporal)
 *
 * @param request - NextRequest object
 * @returns Objeto con userId y datos del usuario, o null si no autenticado
 */
export async function verifyAuthToken(request: NextRequest): Promise<AuthUser | null> {
  try {
    // Método 1: Authorization header (PREFERIDO)
    const authHeader = request.headers.get('authorization');
    let token: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remover "Bearer "
    }

    // Método 2: Cookie (LEGACY - backward compatibility)
    if (!token) {
      const { cookies } = await import('next/headers');
      const cookieStore = cookies();
      token = cookieStore.get('auth-token')?.value || null;
    }

    if (!token) {
      return null;
    }

    // Verificar y decodificar token
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;

    return decoded;

  } catch (error) {
    console.error('❌ Error verificando token:', error);
    return null;
  }
}

/**
 * Middleware helper para endpoints protegidos
 *
 * Uso:
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const user = await requireAuth(request);
 *   if (user instanceof NextResponse) return user; // Error response
 *
 *   // Usuario autenticado, continuar...
 * }
 * ```
 *
 * @param request - NextRequest object
 * @returns AuthUser o NextResponse con error 401
 */
export async function requireAuth(request: NextRequest): Promise<AuthUser | NextResponse> {
  const user = await verifyAuthToken(request);

  if (!user) {
    return NextResponse.json(
      {
        success: false,
        error: 'No autenticado',
        message: 'Token de autenticación requerido. Incluir en header: Authorization: Bearer {token}'
      },
      { status: 401 }
    );
  }

  return user;
}

/**
 * Middleware helper para endpoints que requieren role específico
 *
 * @param request - NextRequest object
 * @param requiredRole - Role requerido (ej: 'admin')
 * @returns AuthUser o NextResponse con error 401/403
 */
export async function requireRole(
  request: NextRequest,
  requiredRole: string
): Promise<AuthUser | NextResponse> {
  const user = await requireAuth(request);

  if (user instanceof NextResponse) {
    return user; // Ya es un error response
  }

  if (user.role !== requiredRole) {
    return NextResponse.json(
      {
        success: false,
        error: 'Acceso denegado',
        message: `Se requiere role: ${requiredRole}`
      },
      { status: 403 }
    );
  }

  return user;
}

/**
 * Genera un JWT token para un usuario
 *
 * @param user - Datos del usuario para incluir en el token
 * @param expiresIn - Tiempo de expiración (default: 7 días)
 * @returns Token JWT
 */
export function generateToken(
  user: { id: string; email: string; role?: string; [key: string]: any },
  expiresIn: StringValue | number = '7d'
): string {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role || 'user',
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}
