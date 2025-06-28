// src/app/api/social/connect/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateAuthUrl } from '@/services/socialMediaServiceReal';
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

    // Generar URL de autorización OAuth
    const authUrl = generateAuthUrl(platform, user.id);

    return NextResponse.json({
      success: true,
      authUrl
    });
  } catch (error) {
    console.error('Error generando URL de conexión:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
