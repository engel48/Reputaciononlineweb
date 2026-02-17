import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendPasswordResetEmail, generateResetToken } from '@/lib/email-service';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    console.log('PASSWORD-RESET: Solicitud recibida para:', email);

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'El correo electronico es requerido' },
        { status: 400 }
      );
    }

    // Always return success to prevent email enumeration
    const successResponse = {
      success: true,
      message: 'Si el correo esta registrado, recibiras instrucciones para restablecer tu contrasena'
    };

    // Find user by email
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, name, email')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (userError || !user) {
      console.log('PASSWORD-RESET: Usuario no encontrado para:', email, userError?.message);
      return NextResponse.json(successResponse);
    }

    console.log('PASSWORD-RESET: Usuario encontrado:', { id: user.id, email: user.email, name: user.name });

    // Rate limiting: check if a token was created in the last 5 minutes
    const { data: recentToken } = await supabaseAdmin
      .from('password_reset_tokens')
      .select('created_at')
      .eq('user_id', user.id)
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (recentToken) {
      const timeSinceLastToken = Date.now() - new Date(recentToken.created_at).getTime();
      if (timeSinceLastToken < 5 * 60 * 1000) {
        console.log('PASSWORD-RESET: Rate limited - token creado hace', Math.round(timeSinceLastToken / 1000), 'segundos');
        return NextResponse.json(successResponse);
      }
    }

    // Generate reset token
    const token = generateResetToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    // Save to database
    const { error: insertError } = await supabaseAdmin
      .from('password_reset_tokens')
      .insert({
        user_id: user.id,
        token,
        email: user.email,
        expires_at: expiresAt,
      });

    if (insertError) {
      console.error('PASSWORD-RESET: Error guardando token en DB:', insertError);
      // Continue anyway - email will still be sent but link won't work
    } else {
      console.log('PASSWORD-RESET: Token guardado en DB exitosamente');
    }

    // Send email
    console.log('PASSWORD-RESET: Enviando email a:', user.email);
    const sent = await sendPasswordResetEmail(user.email, token, user.name || 'Usuario');
    console.log(`PASSWORD-RESET: Email ${sent ? 'ENVIADO OK' : 'FALLO'} a ${user.email}`);

    return NextResponse.json(successResponse);

  } catch (error) {
    console.error('PASSWORD-RESET: Error general:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
