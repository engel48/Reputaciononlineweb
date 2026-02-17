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
import { createClient } from '@supabase/supabase-js';
import { sendVerificationEmail, generateVerificationCode } from '@/lib/email-service';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

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

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: 'La contrasena debe tener al menos 8 caracteres' },
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

    // Send verification email (non-blocking)
    if (result.user?.id && process.env.RESEND_API_KEY) {
      try {
        const code = generateVerificationCode();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

        await supabaseAdmin
          .from('email_verification_codes')
          .insert({
            user_id: result.user.id,
            code,
            email: email.toLowerCase().trim(),
            expires_at: expiresAt,
          });

        await sendVerificationEmail(email, code, name);
      } catch (emailError) {
        console.error('Error sending verification email:', emailError);
        // Don't fail registration if email fails
      }
    }

    const response = NextResponse.json({
      success: true,
      user: result.user,
      token: result.token,
      expiresIn: 7 * 24 * 60 * 60,
      requiresEmailVerification: !!process.env.RESEND_API_KEY,
      message: 'Usuario registrado exitosamente'
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
    console.error('💥 REGISTER ERROR:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
