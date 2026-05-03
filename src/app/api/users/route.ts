import { NextRequest, NextResponse } from 'next/server';
import { userService } from '@/lib/database-adapter';
import { createClient } from '@supabase/supabase-js';
import { sendPlanChangeEmail, sendPurchaseConfirmationEmail, sendLowCreditsWarningEmail } from '@/lib/email-service';
import { requireAuth } from '@/lib/auth-helper';

// Supabase directo para obtener email y datos confiables del usuario
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Campos que solo admin puede modificar (un usuario regular NO debe poder
// cambiar su propio plan ni asignarse creditos via este endpoint).
const ADMIN_ONLY_FIELDS = new Set(['plan', 'credits', 'role', 'isActive', 'is_active']);

export async function PUT(request: NextRequest) {
  try {
    // CRITICO: validar identidad ANTES de aceptar el userId del body.
    // Sin este check, cualquiera podria cambiar plan/creditos de cualquier
    // usuario simplemente enviando {userId: 'X', credits: 999999}.
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const { userId, ...updates } = body;

    console.log('USERS API PUT: Datos recibidos:', { userId, updates: Object.keys(updates), authUser: auth.userId });

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'ID de usuario requerido' },
        { status: 400 }
      );
    }

    // Solo el propio usuario o un admin pueden modificar el registro
    const isAdmin = auth.role === 'admin';
    const isOwner = auth.userId === userId;
    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { success: false, message: 'No tienes permiso para modificar este usuario' },
        { status: 403 }
      );
    }

    // Usuarios regulares NO pueden modificar plan, creditos, role o is_active
    if (!isAdmin) {
      const blocked = Object.keys(updates).filter((k) => ADMIN_ONLY_FIELDS.has(k));
      if (blocked.length > 0) {
        return NextResponse.json(
          { success: false, message: `Campos solo modificables por admin: ${blocked.join(', ')}` },
          { status: 403 }
        );
      }
    }

    // Obtener datos ACTUALES del usuario directo de Supabase (email, plan, credits)
    const { data: currentUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, plan, credits')
      .eq('id', userId)
      .single();

    if (fetchError || !currentUser) {
      console.error('USERS API PUT: Usuario no encontrado en Supabase:', userId, fetchError?.message);
      return NextResponse.json(
        { success: false, message: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const oldPlan = currentUser.plan || 'free';
    const oldCredits = currentUser.credits || 0;

    console.log('USERS API PUT: Estado actual:', { email: currentUser.email, plan: oldPlan, credits: oldCredits });

    // Actualizar usuario en la base de datos
    await userService.update(userId, {
      ...updates,
      updatedAt: new Date().toISOString()
    });

    // Obtener el usuario actualizado
    const updatedUser = await userService.findById(userId);
    console.log('USERS API PUT: Usuario actualizado exitosamente');

    // === ENVIAR EMAILS SI HUBO CAMBIOS ===
    const emailResults: Record<string, any> = {};
    const newPlan = updates.plan || oldPlan;
    const newCredits = updates.credits !== undefined ? parseInt(updates.credits) : oldCredits;

    // Email si cambio de plan
    if (updates.plan && updates.plan !== oldPlan) {
      console.log(`USERS API PUT: Plan cambio de "${oldPlan}" a "${updates.plan}", enviando email a ${currentUser.email}`);
      try {
        if (currentUser.email) {
          const sent = await sendPlanChangeEmail(currentUser.email, currentUser.name || 'Usuario', oldPlan, updates.plan);
          emailResults.planChange = { sent, to: currentUser.email };
          console.log(`USERS API PUT: Email de plan ${sent ? 'ENVIADO OK' : 'FALLO'} a ${currentUser.email}`);
        } else {
          emailResults.planChange = { sent: false, reason: 'sin email' };
        }
      } catch (emailError: any) {
        emailResults.planChange = { sent: false, error: emailError.message };
        console.error('USERS API PUT: Error enviando email de plan:', emailError.message);
      }
    }

    // Email si aumentaron creditos
    if (updates.credits !== undefined && newCredits > oldCredits) {
      const creditsAdded = newCredits - oldCredits;
      console.log(`USERS API PUT: Creditos +${creditsAdded}, enviando email a ${currentUser.email}`);
      try {
        if (currentUser.email) {
          const sent = await sendPurchaseConfirmationEmail(currentUser.email, currentUser.name || 'Usuario', {
            plan: newPlan,
            credits: creditsAdded,
            amount: 0,
            transactionId: `UPDATE-${Date.now()}`
          });
          emailResults.credits = { sent, to: currentUser.email, creditsAdded };
          console.log(`USERS API PUT: Email de creditos ${sent ? 'ENVIADO OK' : 'FALLO'} a ${currentUser.email}`);
        }
      } catch (emailError: any) {
        emailResults.credits = { sent: false, error: emailError.message };
        console.error('USERS API PUT: Error enviando email de creditos:', emailError.message);
      }
    }

    // C3: Email si creditos estan bajos (< 100)
    if (updates.credits !== undefined && newCredits < 100 && newCredits < oldCredits && currentUser.email) {
      sendLowCreditsWarningEmail(currentUser.email, currentUser.name || 'Usuario', {
        credits: newCredits,
        plan: newPlan,
      }).catch(e => console.error('USERS API PUT: Error enviando low credits warning:', e));
      emailResults.lowCredits = { triggered: true, credits: newCredits };
    }

    return NextResponse.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      user: updatedUser,
      emailResults,
    });

  } catch (error) {
    console.error('USERS API PUT: Error general:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'ID de usuario requerido' },
        { status: 400 }
      );
    }

    const user = await userService.findById(userId);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: user
    });

  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
