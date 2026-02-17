import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireRole } from '@/lib/auth-helper';
import bcrypt from 'bcryptjs';
import { Resend } from 'resend';

// Crear cliente Supabase admin
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Generar contraseña temporal segura
function generateTempPassword(length: number = 10): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación y rol admin
    const admin = await requireRole(request, 'admin');
    if (admin instanceof NextResponse) return admin;

    const body = await request.json();
    const { userId, customPassword } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId es requerido' },
        { status: 400 }
      );
    }

    console.log(`🔐 RESET PASSWORD API: Reseteando contraseña para usuario ${userId}`);

    // Verificar que el usuario existe
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, name, email')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Generar nueva contraseña (temporal o personalizada)
    const newPassword = customPassword || generateTempPassword();

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar la contraseña en la base de datos
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        password: hashedPassword,
        updated_at: new Date().toISOString(),
        // Marcar que necesita cambiar la contraseña en el próximo login
        metadata: {
          password_reset_required: true,
          password_reset_at: new Date().toISOString(),
          password_reset_by: 'admin'
        }
      })
      .eq('id', userId);

    if (updateError) {
      console.error('❌ Error actualizando contraseña:', updateError);
      throw updateError;
    }

    console.log(`✅ Contraseña reseteada exitosamente para: ${user.email}`);

    // Enviar email con la contraseña temporal al usuario
    if (user.email && process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@reputaciononline.com.co';
        await resend.emails.send({
          from: fromEmail,
          to: user.email,
          subject: 'Tu contraseña ha sido restablecida | Reputacion Online',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="background: #fff; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h1 style="color: #0f172a; font-size: 20px;">Contraseña restablecida</h1>
                <p style="color: #475569;">Hola <strong>${user.name || 'Usuario'}</strong>,</p>
                <p style="color: #475569;">Tu contraseña ha sido restablecida por un administrador. Tu nueva contraseña temporal es:</p>
                <div style="background: #f0f9ff; border: 2px dashed #0ea5e9; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
                  <div style="font-size: 24px; font-weight: 700; letter-spacing: 2px; color: #0369a1;">${newPassword}</div>
                </div>
                <p style="color: #475569;">Te recomendamos cambiar esta contraseña despues de iniciar sesion.</p>
                <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">Este correo fue enviado automaticamente. No responder a este mensaje.</p>
              </div>
            </div>
          `,
        });
        console.log(`✅ Email con contraseña temporal enviado a: ${user.email}`);
      } catch (emailErr) {
        console.error('Error enviando email de reset:', emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        email: user.email,
        name: user.name,
        temporaryPassword: newPassword,
        message: 'Contraseña reseteada exitosamente. Se envio un email al usuario con la contraseña temporal.'
      }
    });

  } catch (error: any) {
    console.error('❌ RESET PASSWORD API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error reseteando contraseña' },
      { status: 500 }
    );
  }
}
