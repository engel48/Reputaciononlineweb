/**
 * POST /api/payments/webhook
 *
 * Webhook oficial de Wompi. Wompi envía un POST cada vez que una transacción
 * cambia de estado (APPROVED, DECLINED, VOIDED, ERROR, etc.).
 *
 * Seguridad: validación de firma HMAC con WOMPI_EVENTS_SECRET.
 * Docs: https://docs.wompi.co/docs/colombia/eventos/
 *
 * Body recibido:
 * {
 *   "event": "transaction.updated",
 *   "data": {
 *     "transaction": {
 *       "id": "string",
 *       "reference": "string",
 *       "status": "APPROVED|DECLINED|VOIDED|ERROR|PENDING",
 *       ...
 *     }
 *   },
 *   "timestamp": number,
 *   "signature": { "checksum": "SHA256", "properties": [...] }
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { processWompiPayment } from '@/lib/payments/process-wompi-payment';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const WOMPI_EVENTS_SECRET = process.env.WOMPI_EVENTS_SECRET || '';

function verifyWompiSignature(body: any, secret: string): boolean {
  if (!secret) {
    console.warn('[wompi-webhook] WOMPI_EVENTS_SECRET no configurado, saltando verificación');
    return true; // no bloqueamos si no hay secret configurado
  }

  const sig = body?.signature;
  if (!sig?.checksum || !Array.isArray(sig?.properties) || !body?.timestamp) return false;

  // Concatenar las propiedades listadas en signature.properties + timestamp + secret
  // y calcular SHA256.
  let concatenated = '';
  for (const propPath of sig.properties) {
    const value = getNestedValue(body, propPath);
    concatenated += value !== undefined && value !== null ? String(value) : '';
  }
  concatenated += String(body.timestamp);
  concatenated += secret;

  const computed = crypto.createHash('sha256').update(concatenated).digest('hex');
  return computed === sig.checksum;
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((acc, key) => (acc != null ? acc[key] : undefined), obj);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Validar firma HMAC
    if (!verifyWompiSignature(body, WOMPI_EVENTS_SECRET)) {
      console.warn('[wompi-webhook] Firma inválida');
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 401 });
    }

    // 2. Validar tipo de evento
    const eventType = body?.event;
    const tx = body?.data?.transaction;
    if (!eventType || !tx) {
      return NextResponse.json({ success: false, error: 'Payload inválido' }, { status: 400 });
    }

    // Actualmente solo procesamos transaction.updated
    if (eventType !== 'transaction.updated') {
      console.log(`[wompi-webhook] Ignorando evento ${eventType}`);
      return NextResponse.json({ success: true, ignored: true });
    }

    // 3. Delegar a helper compartido
    const result = await processWompiPayment({
      reference: tx.reference,
      wompiTransactionId: tx.id,
      wompiStatus: tx.status,
    });

    // Log sistema
    try {
      const { supabase } = await import('@/lib/supabase-server');
      await supabase.from('system_logs').insert({
        event_type: 'wompi_webhook',
        details: {
          event: eventType,
          reference: tx.reference,
          wompi_id: tx.id,
          wompi_status: tx.status,
          processed: result.success,
          user_id: result.userId,
          error: result.error,
        },
      });
    } catch {
      // silencioso
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, status: result.status });
  } catch (error: any) {
    console.error('[wompi-webhook] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Error interno' },
      { status: 500 }
    );
  }
}
