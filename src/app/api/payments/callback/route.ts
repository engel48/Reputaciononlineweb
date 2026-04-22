/**
 * GET /api/payments/callback
 * Callback de Wompi después de pago por redirect (PSE, Bancolombia, Nequi).
 * Consulta a Wompi el estado de la transacción, delega el procesamiento al
 * helper compartido (mismo código que usa el webhook POST) y redirige al user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { processWompiPayment, WompiStatus } from '@/lib/payments/process-wompi-payment';

const WOMPI_PRIVATE_KEY = process.env.WOMPI_PRIVATE_KEY || '';
const WOMPI_API_URL = process.env.WOMPI_API_URL || 'https://sandbox.wompi.co/v1';
const APP_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const reference = searchParams.get('ref');
    const transactionId = searchParams.get('id');

    if (!reference) {
      return NextResponse.redirect(new URL('/dashboard/pago?error=missing_reference', APP_URL));
    }

    // 1. Consultar a Wompi el estado actual de la transacción
    let wompiStatus: WompiStatus = 'PENDING';

    if (transactionId && WOMPI_PRIVATE_KEY) {
      try {
        const response = await fetch(`${WOMPI_API_URL}/transactions/${transactionId}`, {
          headers: { Authorization: `Bearer ${WOMPI_PRIVATE_KEY}` },
        });
        if (response.ok) {
          const data = await response.json();
          wompiStatus = (data.data?.status || 'PENDING') as WompiStatus;
        }
      } catch (error) {
        console.error('Error verificando transacción Wompi:', error);
      }
    }

    // 2. Delegar procesamiento al helper compartido (mismo que usa el webhook)
    await processWompiPayment({
      reference,
      wompiTransactionId: transactionId,
      wompiStatus,
    });

    // 3. Redirigir al usuario según el estado
    if (wompiStatus === 'APPROVED') {
      return NextResponse.redirect(new URL('/dashboard/perfil?tab=plan&success=true', APP_URL));
    }
    if (wompiStatus === 'DECLINED') {
      return NextResponse.redirect(new URL('/dashboard/pago?error=declined', APP_URL));
    }
    // Pendiente: el webhook POST lo procesará cuando cambie de estado
    return NextResponse.redirect(new URL('/dashboard/perfil?tab=plan&pending=true', APP_URL));
  } catch (error: any) {
    console.error('Error en callback de pago:', error);
    return NextResponse.redirect(new URL('/dashboard/pago?error=unknown', APP_URL));
  }
}
