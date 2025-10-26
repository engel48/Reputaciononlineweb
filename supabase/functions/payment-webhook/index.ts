import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { crypto } from "https://deno.land/std@0.224.0/crypto/mod.ts";

interface WompiWebhookPayload {
  event: string;
  data: {
    transaction: {
      id: string;
      amount_in_cents: number;
      reference: string;
      customer_email: string;
      currency: string;
      status: 'APPROVED' | 'DECLINED' | 'VOIDED' | 'PENDING';
      payment_method_type: string;
      created_at: string;
    };
  };
  signature: {
    properties: string[];
    checksum: string;
  };
}

// Configuración de planes y créditos
const PLAN_CREDITS = {
  basico: 1000,
  profesional: 5000,
  empresarial: 20000,
  politico: -1 // ilimitados
};

const PLAN_PRICES = {
  basico: 50000,      // 50,000 COP
  profesional: 200000, // 200,000 COP
  empresarial: 800000, // 800,000 COP
  politico: 1500000   // 1,500,000 COP
};

// Verificar firma de Wompi
async function verifyWompiSignature(payload: WompiWebhookPayload, secret: string): Promise<boolean> {
  try {
    const { properties, checksum } = payload.signature;

    // Construir string de propiedades
    const values = properties.map(prop => {
      const keys = prop.split('.');
      let value: any = payload;
      for (const key of keys) {
        value = value?.[key];
      }
      return value?.toString() || '';
    });

    const concatenated = values.join('');
    const withSecret = concatenated + secret;

    // Calcular SHA256
    const encoder = new TextEncoder();
    const data = encoder.encode(withSecret);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return hashHex === checksum;
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const wompiEventSecret = Deno.env.get('WOMPI_EVENT_SECRET')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const payload: WompiWebhookPayload = await req.json();

    console.log('Wompi webhook received:', payload.event);

    // Verificar firma de seguridad
    const isValid = await verifyWompiSignature(payload, wompiEventSecret);
    if (!isValid) {
      console.error('Invalid Wompi signature');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const transaction = payload.data.transaction;

    // Extraer user_id de la referencia (formato: user_123_plan_basico)
    const referenceMatch = transaction.reference.match(/user_([a-zA-Z0-9-]+)_plan_(\w+)/);
    if (!referenceMatch) {
      console.error('Invalid reference format:', transaction.reference);
      return new Response(JSON.stringify({ error: 'Invalid reference' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const userId = referenceMatch[1];
    const planType = referenceMatch[2] as keyof typeof PLAN_CREDITS;

    console.log(`Processing payment for user ${userId}, plan ${planType}`);

    // Manejar pago aprobado
    if (transaction.status === 'APPROVED') {
      const amountCOP = transaction.amount_in_cents / 100;
      const credits = PLAN_CREDITS[planType];

      // 1. Registrar pago en tabla payments
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          user_id: userId,
          amount: amountCOP,
          currency: 'COP',
          status: 'completed',
          payment_method: transaction.payment_method_type,
          transaction_id: transaction.id,
          plan_type: planType,
          credits_purchased: credits,
          metadata: {
            wompi_transaction: transaction,
            email: transaction.customer_email
          },
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (paymentError) {
        console.error('Error creating payment:', paymentError);
        throw paymentError;
      }

      // 2. Actualizar/crear suscripción
      const nextBillingDate = new Date();
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          plan_type: planType,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: nextBillingDate.toISOString(),
          cancel_at_period_end: false,
          metadata: {
            last_payment_id: payment.id,
            wompi_transaction_id: transaction.id
          }
        });

      if (subscriptionError) {
        console.error('Error creating subscription:', subscriptionError);
      }

      // 3. Asignar créditos usando función SQL (solo si no es plan político)
      if (credits > 0) {
        const { error: creditsError } = await supabase.rpc('add_user_credits', {
          p_user_id: userId,
          p_amount: credits,
          p_description: `Compra de plan ${planType} - ${amountCOP.toLocaleString('es-CO')} COP`
        });

        if (creditsError) {
          console.error('Error adding credits:', creditsError);
        }
      }

      // 4. Actualizar plan del usuario
      const { error: updateUserError } = await supabase
        .from('users')
        .update({
          plan: planType,
          next_billing_date: nextBillingDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateUserError) {
        console.error('Error updating user plan:', updateUserError);
      }

      // 5. Crear notificación de éxito
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'payment_success',
          title: '¡Pago procesado exitosamente!',
          message: `Tu plan ${planType} ha sido activado. ${credits > 0 ? `Se han agregado ${credits.toLocaleString('es-CO')} créditos a tu cuenta.` : 'Créditos ilimitados activados.'}`,
          read: false,
          metadata: {
            payment_id: payment.id,
            amount: amountCOP,
            plan: planType
          },
          created_at: new Date().toISOString()
        });

      if (notificationError) {
        console.error('Error creating notification:', notificationError);
      }

      // 6. Registrar actividad
      const { error: activityError } = await supabase
        .from('activities')
        .insert({
          user_id: userId,
          type: 'payment',
          description: `Pago procesado: Plan ${planType} - ${amountCOP.toLocaleString('es-CO')} COP`,
          metadata: {
            payment_id: payment.id,
            transaction_id: transaction.id,
            amount: amountCOP,
            plan: planType,
            credits: credits
          },
          created_at: new Date().toISOString()
        });

      if (activityError) {
        console.error('Error creating activity:', activityError);
      }

      console.log(`✅ Payment processed successfully for user ${userId}`);

      // TODO: Generar factura electrónica (implementar servicio externo)
      // TODO: Enviar email de confirmación vía Resender

      return new Response(JSON.stringify({
        success: true,
        payment_id: payment.id,
        credits_added: credits
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Manejar pago rechazado
    if (transaction.status === 'DECLINED') {
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          user_id: userId,
          amount: transaction.amount_in_cents / 100,
          currency: 'COP',
          status: 'failed',
          payment_method: transaction.payment_method_type,
          transaction_id: transaction.id,
          plan_type: planType,
          metadata: { wompi_transaction: transaction },
          created_at: new Date().toISOString()
        });

      if (paymentError) {
        console.error('Error creating failed payment:', paymentError);
      }

      // Notificar al usuario
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'payment_failed',
          title: 'Pago rechazado',
          message: 'Tu pago no pudo ser procesado. Por favor verifica tu método de pago e intenta nuevamente.',
          read: false,
          metadata: { transaction_id: transaction.id },
          created_at: new Date().toISOString()
        });

      if (notificationError) {
        console.error('Error creating notification:', notificationError);
      }

      console.log(`❌ Payment declined for user ${userId}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Payment webhook error:', error);
    return new Response(JSON.stringify({
      error: error.message,
      details: error.toString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
