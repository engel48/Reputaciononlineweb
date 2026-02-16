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
      // Return success anyway to prevent email enumeration
      return NextResponse.json(successResponse);
    }

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
        // Silently return success (rate limit without revealing)
        return NextResponse.json(successResponse);
      }
    }

    // Generate reset token
    const token = generateResetToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    // Save to database
    await supabaseAdmin
      .from('password_reset_tokens')
      .insert({
        user_id: user.id,
        token,
        email: user.email,
        expires_at: expiresAt,
      });

    // Send email
    await sendPasswordResetEmail(user.email, token, user.name || 'Usuario');

    return NextResponse.json(successResponse);

  } catch (error) {
    console.error('REQUEST-PASSWORD-RESET Error:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
