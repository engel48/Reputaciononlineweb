import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helper';
import { createClient } from '@supabase/supabase-js';
import { sendPlanChangeEmail, sendPurchaseConfirmationEmail } from '@/lib/email-service';

// Cliente Supabase directo - NO usar userService/database-adapter
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticacion y rol admin
    const admin = await requireRole(request, 'admin');
    if (admin instanceof NextResponse) return admin;

    const body = await request.json();
    const { userId, plan, credits, profileType } = body;

    console.log('ADMIN UPDATE: Request recibido:', { userId, plan, credits, profileType });

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'ID de usuario requerido' },
        { status: 400 }
      );
    }

    // Obtener usuario directamente de Supabase
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, plan, credits, profile_type')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('ADMIN UPDATE: Usuario no encontrado:', userId, userError);
      return NextResponse.json(
        { success: false, message: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    console.log('ADMIN UPDATE: Usuario encontrado:', {
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
      credits: user.credits,
    });

    // Preparar datos de actualizacion (snake_case para Supabase)
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (plan) updateData.plan = plan;
    if (credits !== undefined) updateData.credits = parseInt(credits);
    if (profileType) updateData.profile_type = profileType;

    console.log('ADMIN UPDATE: Datos a actualizar:', updateData);

    // Actualizar DIRECTAMENTE en Supabase (NO usar userService/database-adapter)
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', userId);

    if (updateError) {
      console.error('ADMIN UPDATE: Error actualizando en Supabase:', updateError);
      return NextResponse.json(
        { success: false, message: 'Error al actualizar usuario', error: updateError.message },
        { status: 500 }
      );
    }

    console.log('ADMIN UPDATE: Usuario actualizado exitosamente en Supabase');

    const emailResults: Record<string, any> = {};

    // Enviar email si cambio de plan
    if (plan && plan !== user.plan) {
      const oldPlan = user.plan || 'free';
      console.log(`ADMIN UPDATE: Plan cambio de "${oldPlan}" a "${plan}", enviando email a ${user.email}`);
      try {
        if (user.email) {
          const sent = await sendPlanChangeEmail(user.email, user.name || 'Usuario', oldPlan, plan);
          emailResults.planChange = { sent, to: user.email, from: oldPlan, to_plan: plan };
          console.log(`ADMIN UPDATE: Email de cambio de plan ${sent ? 'ENVIADO OK' : 'FALLO'} a ${user.email}`);
        } else {
          emailResults.planChange = { sent: false, reason: 'sin email' };
          console.warn('ADMIN UPDATE: Usuario no tiene email');
        }
      } catch (emailError: any) {
        emailResults.planChange = { sent: false, error: emailError.message };
        console.error('ADMIN UPDATE: Excepcion enviando email:', emailError);
      }
    } else if (plan) {
      console.log(`ADMIN UPDATE: Plan no cambio (${plan} === ${user.plan}), no se envia email`);
      emailResults.planChange = { skipped: true, reason: 'plan no cambio' };
    }

    // Enviar email si se agregaron creditos
    if (credits !== undefined && parseInt(credits) > (user.credits || 0)) {
      const creditsAdded = parseInt(credits) - (user.credits || 0);
      console.log(`ADMIN UPDATE: Creditos aumentaron +${creditsAdded}, enviando email a ${user.email}`);
      try {
        if (user.email) {
          const sent = await sendPurchaseConfirmationEmail(user.email, user.name || 'Usuario', {
            plan: plan || user.plan || 'admin',
            credits: creditsAdded,
            amount: 0,
            transactionId: `ADMIN-${Date.now()}`
          });
          emailResults.credits = { sent, to: user.email, creditsAdded };
          console.log(`ADMIN UPDATE: Email de creditos ${sent ? 'ENVIADO OK' : 'FALLO'} a ${user.email}`);
        }
      } catch (emailError: any) {
        emailResults.credits = { sent: false, error: emailError.message };
        console.error('ADMIN UPDATE: Excepcion enviando email creditos:', emailError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      emailResults,
    });

  } catch (error: any) {
    console.error('ADMIN UPDATE: Error general:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor', error: error.message },
      { status: 500 }
    );
  }
}
