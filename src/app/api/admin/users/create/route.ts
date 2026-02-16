import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireRole } from '@/lib/auth-helper';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Crear cliente Supabase admin
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Créditos iniciales según el plan
const PLAN_CREDITS: Record<string, number> = {
  'basic': 100,
  'professional': 500,
  'enterprise': 2000,
  'political': 5000
};

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación y rol admin
    const admin = await requireRole(request, 'admin');
    if (admin instanceof NextResponse) return admin;

    const body = await request.json();
    const {
      name,
      email,
      password,
      plan = 'basic',
      credits,
      role = 'user',
      phone,
      company
    } = body;

    // Validaciones
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Nombre, email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Formato de email inválido' },
        { status: 400 }
      );
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    console.log(`👤 CREATE USER API: Creando usuario ${email}`);

    // Verificar si el email ya existe
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'El email ya está registrado' },
        { status: 409 }
      );
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Determinar créditos iniciales
    const initialCredits = credits !== undefined ? credits : (PLAN_CREDITS[plan] || 100);

    // Crear el usuario
    const userId = crypto.randomUUID();
    const now = new Date().toISOString();

    const { data: newUser, error: createError } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        plan,
        credits: initialCredits,
        role,
        phone: phone || null,
        company: company || null,
        status: 'active',
        onboarding_completed: false,
        created_at: now,
        updated_at: now,
        metadata: {
          created_by: 'admin',
          created_at: now
        }
      })
      .select('id, name, email, plan, credits, role, created_at')
      .single();

    if (createError) {
      console.error('❌ Error creando usuario:', createError);
      throw createError;
    }

    // Registrar transacción de créditos iniciales
    if (initialCredits > 0) {
      await supabaseAdmin
        .from('credit_transactions')
        .insert({
          user_id: userId,
          type: 'bonus',
          amount: initialCredits,
          balance_after: initialCredits,
          description: `Créditos iniciales - Plan ${plan}`,
          related_entity: 'admin_create',
          created_at: now
        });
    }

    console.log(`✅ Usuario creado exitosamente: ${email}`);

    return NextResponse.json({
      success: true,
      data: {
        ...newUser,
        message: 'Usuario creado exitosamente'
      }
    });

  } catch (error: any) {
    console.error('❌ CREATE USER API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error creando usuario' },
      { status: 500 }
    );
  }
}
