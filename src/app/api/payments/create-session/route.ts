/**
 * POST /api/payments/create-session
 * Crea una sesion de pago con Wompi
 * Soporta planes de suscripcion y paquetes de creditos
 */

import { NextRequest, NextResponse } from 'next/server';
import * as jwt from 'jsonwebtoken';
import { supabase } from '@/lib/supabase-server';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'reputacion-online-secret-key-2025';
const WOMPI_PRIVATE_KEY = process.env.WOMPI_PRIVATE_KEY || '';
const WOMPI_PUBLIC_KEY = process.env.WOMPI_PUBLIC_KEY || '';
const WOMPI_API_URL = process.env.WOMPI_API_URL || 'https://sandbox.wompi.co/v1';
const APP_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
  try {
    // Auth
    const authToken = request.cookies.get('auth-token')?.value;
    if (!authToken) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    let userId: string;
    try {
      const decoded = jwt.verify(authToken, JWT_SECRET) as { userId: string; email: string };
      userId = decoded.userId;
    } catch {
      return NextResponse.json({ success: false, error: 'Token invalido' }, { status: 401 });
    }

    const body = await request.json();
    const { type, planId, billingCycle, packId, paymentMethod, amount, currency } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, error: 'Monto invalido' }, { status: 400 });
    }

    // Generar referencia unica
    const timestamp = Date.now();
    let reference: string;
    let description: string;

    if (type === 'pack') {
      reference = `user_${userId}_pack_${packId}_${timestamp}`;
      description = `Paquete de creditos: ${packId}`;
    } else {
      reference = `user_${userId}_plan_${planId}_cycle_${billingCycle || 'monthly'}_${timestamp}`;
      description = `Suscripcion: ${planId} (${billingCycle || 'mensual'})`;
    }

    const amountInCents = Math.round(amount * 100);

    // Guardar pago pendiente en DB
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        amount: amount,
        currency: currency || 'COP',
        status: 'pending',
        payment_method: paymentMethod || 'card',
        plan_type: type === 'pack' ? null : planId,
        credit_pack_id: type === 'pack' ? packId : null,
        transaction_id: reference,
        metadata: {
          type,
          planId,
          billingCycle,
          packId,
          reference,
        },
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error creando pago:', paymentError);
      return NextResponse.json({ success: false, error: 'Error creando sesion de pago' }, { status: 500 });
    }

    // Generar firma de integridad para Wompi
    const integritySecret = process.env.WOMPI_INTEGRITY_SECRET || WOMPI_PRIVATE_KEY;
    const integrityString = `${reference}${amountInCents}COP${integritySecret}`;
    const integritySignature = crypto
      .createHash('sha256')
      .update(integrityString)
      .digest('hex');

    // Retornar datos para el widget de Wompi
    return NextResponse.json({
      success: true,
      data: {
        paymentId: payment.id,
        publicKey: WOMPI_PUBLIC_KEY,
        reference,
        amountInCents,
        currency: 'COP',
        integritySignature,
        redirectUrl: `${APP_URL}/api/payments/callback?ref=${reference}`,
        description,
        // Para pagos por redirect (PSE, Nequi, Bancolombia)
        wompiCheckoutUrl: WOMPI_PUBLIC_KEY
          ? `https://checkout.wompi.co/p/?public-key=${WOMPI_PUBLIC_KEY}&currency=COP&amount-in-cents=${amountInCents}&reference=${reference}&redirect-url=${encodeURIComponent(`${APP_URL}/api/payments/callback?ref=${reference}`)}`
          : null,
      },
    });

  } catch (error: any) {
    console.error('Error en create-session:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
