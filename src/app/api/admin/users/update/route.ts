import { NextRequest, NextResponse } from 'next/server';
import { userService } from '@/lib/database-adapter';
import { requireRole } from '@/lib/auth-helper';
import { createClient } from '@supabase/supabase-js';
import { sendPlanChangeEmail, sendPurchaseConfirmationEmail } from '@/lib/email-service';

// Cliente Supabase directo para obtener datos confiables del usuario
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticación y rol admin
    const admin = await requireRole(request, 'admin');
    if (admin instanceof NextResponse) return admin;

    const body = await request.json();
    const { userId, plan, credits, profileType } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'ID de usuario requerido' },
        { status: 400 }
      );
    }

    // Obtener usuario directamente de Supabase (datos confiables)
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, plan, credits')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('ADMIN UPDATE: Usuario no encontrado:', userId, userError);
      return NextResponse.json(
        { success: false, message: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    console.log('ADMIN UPDATE: Usuario encontrado:', { id: user.id, email: user.email, plan: user.plan, credits: user.credits });

    // Preparar datos de actualización
    const updateData: any = {};
    if (plan) updateData.plan = plan;
    if (credits !== undefined) updateData.credits = parseInt(credits);
    if (profileType) updateData.profileType = profileType;

    // Actualizar usuario via service layer
    const success = await userService.update(userId, updateData);

    if (success) {
      console.log('ADMIN UPDATE: Usuario actualizado exitosamente:', updateData);

      // Enviar email si cambio de plan
      if (plan && plan !== user.plan) {
        const oldPlan = user.plan || 'free';
        console.log(`ADMIN UPDATE: Enviando email de cambio de plan a ${user.email}: ${oldPlan} -> ${plan}`);
        try {
          if (user.email) {
            const sent = await sendPlanChangeEmail(user.email, user.name || 'Usuario', oldPlan, plan);
            console.log(`ADMIN UPDATE: Email de cambio de plan ${sent ? 'ENVIADO' : 'FALLO'} a ${user.email}`);
          } else {
            console.warn('ADMIN UPDATE: Usuario no tiene email, no se puede enviar notificacion');
          }
        } catch (emailError) {
          console.error('ADMIN UPDATE: Error enviando email de cambio de plan:', emailError);
        }
      }

      // Enviar email si se agregaron creditos
      if (credits !== undefined && parseInt(credits) > (user.credits || 0)) {
        const creditsAdded = parseInt(credits) - (user.credits || 0);
        console.log(`ADMIN UPDATE: Enviando email de creditos agregados a ${user.email}: +${creditsAdded}`);
        try {
          if (user.email) {
            const sent = await sendPurchaseConfirmationEmail(user.email, user.name || 'Usuario', {
              plan: plan || user.plan || 'admin',
              credits: creditsAdded,
              amount: 0,
              transactionId: `ADMIN-${Date.now()}`
            });
            console.log(`ADMIN UPDATE: Email de creditos ${sent ? 'ENVIADO' : 'FALLO'} a ${user.email}`);
          }
        } catch (emailError) {
          console.error('ADMIN UPDATE: Error enviando email de creditos:', emailError);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Usuario actualizado exitosamente'
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Error al actualizar usuario' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error actualizando usuario:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
