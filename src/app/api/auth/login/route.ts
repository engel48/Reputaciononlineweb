/**
 * Login Endpoint - Bearer Token Authentication
 *
 * ✅ ARQUITECTURA UNIFICADA WEB + MÓVIL
 * POST /api/auth/login
 *
 * Body: { email: string, password: string }
 * Response: { success: true, user: {...}, token: string, expiresIn: number }
 *
 * El cliente (web o móvil) debe:
 * 1. Guardar el token (localStorage en web, Secure Storage en Flutter)
 * 2. Enviar en cada request: Authorization: Bearer {token}
 */

import { NextRequest, NextResponse } from 'next/server';
import { login } from '@/services/authServiceReal';

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 LOGIN: Iniciando autenticación Bearer Token');

    const body = await request.json();
    const { email, password } = body;

    // Validaciones básicas
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Intentar login
    const result = await login(email, password);

    if (!result.success) {
      console.log('❌ LOGIN: Credenciales inválidas');
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 401 }
      );
    }

    if (!result.token) {
      console.error('❌ LOGIN: Token no generado por el servicio de autenticación');
      return NextResponse.json(
        { success: false, message: 'Error generando token de autenticación' },
        { status: 500 }
      );
    }

    console.log('✅ LOGIN: Autenticación exitosa para:', result.user?.email);

    // ✅ NUEVA ARQUITECTURA: Retornar token en JSON
    // El cliente (web/móvil) guardará el token localmente
    const response = NextResponse.json({
      success: true,
      user: result.user,
      token: result.token, // ✅ Token JWT para usar en Authorization header
      expiresIn: 7 * 24 * 60 * 60, // 7 días en segundos
      message: 'Login exitoso'
    });

    // Establecer cookie httpOnly para backward compatibility con middleware
    response.cookies.set('auth-token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;

  } catch (error) {
    console.error('💥 LOGIN ERROR:', error);

    if (error instanceof Error && error.message.includes('ENOTFOUND')) {
      return NextResponse.json(
        { success: false, message: 'Error de conexión a la base de datos' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
