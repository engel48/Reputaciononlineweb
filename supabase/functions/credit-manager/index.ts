import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

interface CreditRequest {
  action: 'deduct' | 'add' | 'check';
  user_id: string;
  amount?: number;
  description?: string;
}

// Costos de operaciones en créditos
export const CREDIT_COSTS = {
  report_basic: 50,
  report_advanced: 200,
  competitor_analysis: 100,
  sentiment_analysis: 20,
  crisis_detection: 30,
  mention_processing: 1,
  ai_query: 10,
  export_pdf: 25,
  export_excel: 15
};

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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, user_id, amount, description }: CreditRequest = await req.json();

    if (!action || !user_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`Credit ${action} for user ${user_id}, amount: ${amount}`);

    // Obtener información del usuario
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, plan, credits, email')
      .eq('id', user_id)
      .single();

    if (userError || !user) {
      console.error('User not found:', userError);
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Plan político tiene créditos ilimitados
    const isUnlimited = user.plan === 'politico';

    // ACCIÓN: CHECK - Consultar balance
    if (action === 'check') {
      return new Response(JSON.stringify({
        success: true,
        user_id: user_id,
        balance: isUnlimited ? -1 : user.credits,
        plan: user.plan,
        unlimited: isUnlimited
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ACCIÓN: DEDUCT - Deducir créditos
    if (action === 'deduct') {
      if (!amount || amount <= 0) {
        return new Response(JSON.stringify({ error: 'Invalid amount' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Plan político no deduce créditos
      if (isUnlimited) {
        console.log(`User ${user_id} has unlimited plan, skipping deduction`);
        return new Response(JSON.stringify({
          success: true,
          user_id: user_id,
          balance: -1,
          unlimited: true,
          message: 'Plan político - Créditos ilimitados'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Verificar balance suficiente
      if (user.credits < amount) {
        console.warn(`Insufficient credits for user ${user_id}: ${user.credits} < ${amount}`);
        return new Response(JSON.stringify({
          success: false,
          error: 'Créditos insuficientes',
          balance: user.credits,
          required: amount,
          deficit: amount - user.credits
        }), {
          status: 402, // Payment Required
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Deducir créditos usando función SQL
      const { data: result, error: deductError } = await supabase.rpc('deduct_user_credits', {
        p_user_id: user_id,
        p_amount: amount,
        p_description: description || `Deducción de ${amount} créditos`
      });

      if (deductError) {
        console.error('Error deducting credits:', deductError);
        throw deductError;
      }

      console.log(`✅ Deducted ${amount} credits from user ${user_id}`);

      // Obtener nuevo balance
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .select('credits')
        .eq('id', user_id)
        .single();

      if (updateError) {
        console.error('Error fetching updated balance:', updateError);
      }

      const newBalance = updatedUser?.credits || 0;

      // Alerta si créditos están bajos (< 100)
      if (newBalance < 100) {
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: user_id,
            type: 'low_credits',
            title: 'Créditos bajos',
            message: `Te quedan ${newBalance} créditos. Considera recargar para continuar usando todas las funciones.`,
            read: false,
            created_at: new Date().toISOString()
          });

        if (notificationError) {
          console.error('Error creating low credits notification:', notificationError);
        }
      }

      return new Response(JSON.stringify({
        success: true,
        user_id: user_id,
        amount_deducted: amount,
        balance: newBalance,
        description: description
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ACCIÓN: ADD - Agregar créditos
    if (action === 'add') {
      if (!amount || amount <= 0) {
        return new Response(JSON.stringify({ error: 'Invalid amount' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Plan político no necesita agregar créditos
      if (isUnlimited) {
        console.log(`User ${user_id} has unlimited plan, skipping addition`);
        return new Response(JSON.stringify({
          success: true,
          user_id: user_id,
          balance: -1,
          unlimited: true,
          message: 'Plan político - Créditos ilimitados'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Agregar créditos usando función SQL
      const { data: result, error: addError } = await supabase.rpc('add_user_credits', {
        p_user_id: user_id,
        p_amount: amount,
        p_description: description || `Adición de ${amount} créditos`
      });

      if (addError) {
        console.error('Error adding credits:', addError);
        throw addError;
      }

      console.log(`✅ Added ${amount} credits to user ${user_id}`);

      // Obtener nuevo balance
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .select('credits')
        .eq('id', user_id)
        .single();

      if (updateError) {
        console.error('Error fetching updated balance:', updateError);
      }

      const newBalance = updatedUser?.credits || 0;

      // Notificación de créditos agregados
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: user_id,
          type: 'credits_added',
          title: 'Créditos agregados',
          message: `Se han agregado ${amount.toLocaleString('es-CO')} créditos a tu cuenta. Balance actual: ${newBalance.toLocaleString('es-CO')}`,
          read: false,
          created_at: new Date().toISOString()
        });

      if (notificationError) {
        console.error('Error creating credits added notification:', notificationError);
      }

      return new Response(JSON.stringify({
        success: true,
        user_id: user_id,
        amount_added: amount,
        balance: newBalance,
        description: description
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Acción no válida
    return new Response(JSON.stringify({
      error: 'Invalid action',
      valid_actions: ['deduct', 'add', 'check']
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Credit manager error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      details: error.toString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
