import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

interface AuthWebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: {
    id: string;
    email?: string;
    raw_user_meta_data?: {
      full_name?: string;
      avatar_url?: string;
    };
  };
  old_record?: any;
}

Deno.serve(async (req: Request) => {
  try {
    // Solo aceptar POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: AuthWebhookPayload = await req.json();
    console.log('Auth webhook received:', payload.type, payload.table);

    // Manejar nuevo usuario registrado
    if (payload.type === 'INSERT' && payload.table === 'users') {
      const userId = payload.record.id;
      const email = payload.record.email || '';
      const fullName = payload.record.raw_user_meta_data?.full_name || email.split('@')[0];
      const avatarUrl = payload.record.raw_user_meta_data?.avatar_url || null;

      console.log(`Creating user profile for ${userId}`);

      // 1. Crear registro en tabla users
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: email,
          name: fullName,
          avatar: avatarUrl,
          plan: 'basico',
          credits: 100, // Créditos de bienvenida
          role: 'user',
          email_verified: false,
          created_at: new Date().toISOString()
        });

      if (userError) {
        console.error('Error creating user:', userError);
        throw userError;
      }

      // 2. Inicializar user_stats
      const { error: statsError } = await supabase
        .from('user_stats')
        .insert({
          user_id: userId,
          total_mentions: 0,
          positive_mentions: 0,
          negative_mentions: 0,
          neutral_mentions: 0,
          total_reach: 0,
          sentiment_score: 50.0,
          reputation_score: 50.0,
          platforms_connected: 0,
          reports_generated: 0,
          last_updated: new Date().toISOString()
        });

      if (statsError) {
        console.error('Error creating user_stats:', statsError);
      }

      // 3. Registrar transacción de créditos de bienvenida
      const { error: creditError } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: userId,
          amount: 100,
          type: 'bonus',
          description: 'Créditos de bienvenida',
          balance_after: 100,
          created_at: new Date().toISOString()
        });

      if (creditError) {
        console.error('Error creating credit transaction:', creditError);
      }

      // 4. Registrar actividad de registro
      const { error: activityError } = await supabase
        .from('activities')
        .insert({
          user_id: userId,
          type: 'register',
          description: 'Usuario registrado exitosamente',
          metadata: { email, method: 'supabase_auth' },
          created_at: new Date().toISOString()
        });

      if (activityError) {
        console.error('Error creating activity:', activityError);
      }

      console.log(`✅ User ${userId} initialized successfully`);
    }

    // Manejar login de usuario
    if (payload.type === 'UPDATE' && payload.table === 'users') {
      const userId = payload.record.id;

      // Actualizar last_login
      const { error: updateError } = await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating last_login:', updateError);
      }

      // Registrar actividad de login
      const { error: activityError } = await supabase
        .from('activities')
        .insert({
          user_id: userId,
          type: 'login',
          description: 'Usuario inició sesión',
          metadata: { timestamp: new Date().toISOString() },
          created_at: new Date().toISOString()
        });

      if (activityError) {
        console.error('Error creating login activity:', activityError);
      }

      console.log(`✅ Login registered for user ${userId}`);
    }

    // Manejar eliminación de usuario
    if (payload.type === 'DELETE' && payload.table === 'users') {
      const userId = payload.old_record.id;
      console.log(`User ${userId} deleted - cleanup handled by CASCADE`);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Auth webhook error:', error);
    return new Response(JSON.stringify({
      error: error.message,
      details: error.toString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
