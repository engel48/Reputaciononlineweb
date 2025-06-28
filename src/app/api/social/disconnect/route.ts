// src/app/api/social/disconnect/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { disconnectSocialAccount } from '@/services/socialMediaServiceReal';
import { getUserByToken } from '@/services/authServiceReal';

export async function POST(request: NextRequest) {
  try {
    // Obtener token desde cookie
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar usuario
    const user = await getUserByToken(token);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Token inválido' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { platform } = body;

    if (!platform) {
      return NextResponse.json(
        { success: false, message: 'Plataforma requerida' },
        { status: 400 }
      );
    }

    // Desconectar cuenta social
    const result = await disconnectSocialAccount(user.id, platform);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Cuenta desconectada exitosamente'
    });
  } catch (error) {
    console.error('Error desconectando cuenta social:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
