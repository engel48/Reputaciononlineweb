// src/app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Crear respuesta de logout exitoso
    const response = NextResponse.json({
      success: true,
      message: 'Logout exitoso'
    });

    // Eliminar cookie de autenticación
    const isSecure = process.env.NEXTAUTH_URL?.startsWith('https');
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: Boolean(isSecure),
      sameSite: 'lax',
      path: '/',
      maxAge: 0 // Expira inmediatamente
    });

    return response;
  } catch (error) {
    console.error('Error en logout:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
