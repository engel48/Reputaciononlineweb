import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireRole } from '@/lib/auth-helper';
import bcrypt from 'bcryptjs';
import { sendAdminResetPasswordEmail } from '@/lib/email-service';

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
    if (user.email) {
      try {
        const sent = await sendAdminResetPasswordEmail(user.email, user.name || 'Usuario', newPassword);
        console.log(`${sent ? '✅' : '❌'} Email con contraseña temporal ${sent ? 'enviado' : 'FALLO'} a: ${user.email}`);
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
