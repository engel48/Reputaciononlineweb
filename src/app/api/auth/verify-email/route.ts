import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function verifyCode(code: string, userId: string) {
  // Find valid verification code
  const { data: verification, error: findError } = await supabaseAdmin
    .from('email_verification_codes')
    .select('*')
    .eq('user_id', userId)
    .eq('code', code)
    .eq('verified', false)
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (findError || !verification) {
    return { success: false, message: 'Codigo de verificacion invalido o expirado' };
  }

  // Mark code as verified
  await supabaseAdmin
    .from('email_verification_codes')
    .update({ verified: true })
    .eq('id', verification.id);

  // Mark user email as verified
  await supabaseAdmin
    .from('users')
    .update({ email_verified: true, updated_at: new Date().toISOString() })
    .eq('id', userId);

  return { success: true, message: 'Correo verificado exitosamente' };
}

// GET - for link-based verification from email
export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get('code');
    const userId = request.nextUrl.searchParams.get('userId');

    if (!code || !userId) {
      return NextResponse.json(
        { success: false, message: 'Codigo y userId son requeridos' },
        { status: 400 }
      );
    }

    const result = await verifyCode(code, userId);
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('VERIFY-EMAIL GET Error:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - for programmatic verification
export async function POST(request: NextRequest) {
  try {
    const { code, userId } = await request.json();

    if (!code || !userId) {
      return NextResponse.json(
        { success: false, message: 'Codigo y userId son requeridos' },
        { status: 400 }
      );
    }

    const result = await verifyCode(code, userId);
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('VERIFY-EMAIL POST Error:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
