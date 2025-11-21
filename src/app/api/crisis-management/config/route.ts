import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId required' },
        { status: 400 }
      );
    }

    // Obtener configuración real desde Supabase
    const { data: config, error } = await supabase
      .from('crisis_config')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !config) {
      // Retornar configuración vacía si no existe
      return NextResponse.json({
        templates: [],
        rules: [],
        emergency_contacts: []
      });
    }

    return NextResponse.json({
      templates: config.response_templates || [],
      rules: config.escalation_rules || [],
      emergency_contacts: config.emergency_contacts || []
    });
  } catch (error) {
    console.error('Error fetching crisis config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, templates, rules, emergencyContacts } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId required' },
        { status: 400 }
      );
    }

    // Guardar configuración en Supabase
    const { data, error } = await supabase
      .from('crisis_config')
      .upsert({
        user_id: userId,
        response_templates: templates || [],
        escalation_rules: rules || [],
        emergency_contacts: emergencyContacts || [],
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error saving crisis config:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error saving crisis config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
