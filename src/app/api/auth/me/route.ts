// src/app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserByToken } from '@/services/authServiceReal';

export async function GET(request: NextRequest) {
  try {
    // Obtener token desde cookie
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'No autenticado' },
        { status: 401 }
      );
    }

    // Obtener usuario por token
    const user = await getUserByToken(token);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Token inválido' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
