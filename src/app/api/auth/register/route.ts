// src/app/api/auth/register/route.ts
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

    // Configurar cookie con el token
    const response = NextResponse.json({
      success: true,
      user: result.user,
      message: 'Usuario registrado exitosamente'
    });

    if (result.token) {
      const isSecure = process.env.NEXTAUTH_URL?.startsWith('https');
      response.cookies.set('auth-token', result.token, {
        httpOnly: true,
        secure: Boolean(isSecure),
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 // 7 días
      });
    }

    return response;
  } catch (error) {
    console.error('Error en registro:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
