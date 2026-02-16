/**
 * GET /api/payments/callback
 * Callback de Wompi despues de pago por redirect (PSE, Bancolombia, Nequi)
 * Verifica estado de la transaccion y redirige al usuario
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-server';

const WOMPI_PRIVATE_KEY = process.env.WOMPI_PRIVATE_KEY || '';
const WOMPI_API_URL = process.env.WOMPI_API_URL || 'https://sandbox.wompi.co/v1';
const APP_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const reference = searchParams.get('ref');
    const transactionId = searchParams.get('id');

    if (!reference) {
      return NextResponse.redirect(new URL('/dashboard/pago?error=missing_reference', APP_URL));
    }

    // Verificar estado de transaccion con Wompi
    let transactionStatus = 'PENDING';

    if (transactionId && WOMPI_PRIVATE_KEY) {
      try {
        const response = await fetch(`${WOMPI_API_URL}/transactions/${transactionId}`, {
          headers: {
            'Authorization': `Bearer ${WOMPI_PRIVATE_KEY}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          transactionStatus = data.data?.status || 'PENDING';
        }
      } catch (error) {
        console.error('Error verificando transaccion Wompi:', error);
      }
    }

    // Actualizar estado del pago en DB
    const newStatus = transactionStatus === 'APPROVED' ? 'approved'
      : transactionStatus === 'DECLINED' ? 'declined'
      : transactionStatus === 'VOIDED' ? 'voided'
      : 'pending';

    await supabase
      .from('payments')
      .update({
        status: newStatus,
        wompi_transaction_id: transactionId,
        updated_at: new Date().toISOString(),
      })
      .eq('transaction_id', reference);

    // Si el pago fue aprobado, el webhook de Wompi se encargara de:
    // - Agregar creditos
    // - Crear/actualizar suscripcion
    // - Notificar al usuario

    // Redirigir al usuario
    if (transactionStatus === 'APPROVED') {
      return NextResponse.redirect(new URL('/dashboard/perfil?tab=plan&success=true', APP_URL));
    } else if (transactionStatus === 'DECLINED') {
      return NextResponse.redirect(new URL('/dashboard/pago?error=declined', APP_URL));
    } else {
      // Pendiente - el webhook lo procesara
      return NextResponse.redirect(new URL('/dashboard/perfil?tab=plan&pending=true', APP_URL));
    }

  } catch (error: any) {
    console.error('Error en callback de pago:', error);
    return NextResponse.redirect(new URL('/dashboard/pago?error=unknown', APP_URL));
  }
}
