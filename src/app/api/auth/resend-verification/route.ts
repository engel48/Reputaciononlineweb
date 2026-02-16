import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendVerificationEmail, generateVerificationCode } from '@/lib/email-service';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: NextRequest) {
  try {
    const { userId, email } = await request.json();

    if (!userId || !email) {
      return NextResponse.json(
        { success: false, message: 'userId y email son requeridos' },
        { status: 400 }
      );
    }

    // Verify user exists
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, name, email, email_verified')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, message: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    if (user.email_verified) {
      return NextResponse.json(
        { success: false, message: 'El correo ya esta verificado' },
        { status: 400 }
      );
    }

    // Rate limiting: check if a code was sent in the last 60 seconds
    const { data: recentCode } = await supabaseAdmin
      .from('email_verification_codes')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (recentCode) {
      const timeSinceLastCode = Date.now() - new Date(recentCode.created_at).getTime();
      if (timeSinceLastCode < 60000) {
        return NextResponse.json(
          { success: false, message: 'Espera al menos 60 segundos antes de reenviar' },
          { status: 429 }
        );
      }
    }

    // Generate new code
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

    // Save to database
    await supabaseAdmin
      .from('email_verification_codes')
      .insert({
        user_id: userId,
        code,
        email: user.email,
        expires_at: expiresAt,
      });

    // Send email
    const sent = await sendVerificationEmail(user.email, code, user.name || 'Usuario');

    if (!sent) {
      return NextResponse.json(
        { success: false, message: 'Error enviando el correo. Intenta nuevamente.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Codigo de verificacion enviado exitosamente'
    });

  } catch (error) {
    console.error('RESEND-VERIFICATION Error:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
