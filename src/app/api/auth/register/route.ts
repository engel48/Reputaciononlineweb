/**
 * Register Endpoint - Bearer Token Authentication
 *
 * ✅ ARQUITECTURA UNIFICADA WEB + MÓVIL
 * POST /api/auth/register
 *
 * Body: { email: string, password: string, name: string, ... }
 * Response: { success: true, user: {...}, token: string, expiresIn: number }
 */

import { NextRequest, NextResponse } from 'next/server';
import { register } from '@/services/authServiceReal';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, company, phone, profileType, plan, credits, role, onboardingCompleted } = body;

    // Validaciones básicas
    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, message: 'Email, contraseña y nombre son requeridos' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Registrar usuario
    const result = await register({
      email,
      password,
      name,
      company,
      phone,
      profileType,
      plan,
      credits,
      role,
      onboardingCompleted
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    if (!result.token) {
      console.error('❌ REGISTER: Token no generado');
      return NextResponse.json(
        { success: false, message: 'Error generando token de autenticación' },
        { status: 500 }
      );
    }

    console.log('✅ REGISTER: Usuario creado:', result.user?.email);

    // ✅ NUEVA ARQUITECTURA: Retornar token en JSON
    const response = NextResponse.json({
      success: true,
      user: result.user,
      token: result.token, // ✅ Token JWT para usar en Authorization header
      expiresIn: 7 * 24 * 60 * 60, // 7 días en segundos
      message: 'Usuario registrado exitosamente'
    });

    // ⚠️ TEMPORAL: Establecer cookie también para backward compatibility
    // TODO: Eliminar después de migrar completamente el frontend
    response.cookies.set('auth-token', result.token, {
      httpOnly: false, // Permitir acceso desde JavaScript para migración
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;

  } catch (error) {
    console.error('💥 REGISTER ERROR:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
