/**
 * Get Current User - Bearer Token Authentication
 *
 * ✅ ARQUITECTURA UNIFICADA WEB + MÓVIL
 * GET /api/auth/me
 *
 * Headers: Authorization: Bearer {token}
 * Response: { success: true, user: {...} }
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helper';
import { userService } from '@/lib/database-adapter';

export async function GET(request: NextRequest) {
  try {
    // ✅ Verificar autenticación usando el nuevo helper
    const authResult = await requireAuth(request);

    // Si requireAuth retorna un NextResponse, es un error (401)
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // authResult contiene { userId, email, role }
    const { userId } = authResult;

    // Obtener datos completos del usuario desde la base de datos
    const user = await userService.findById(userId);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('❌ Error obteniendo usuario actual:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
