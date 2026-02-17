/**
 * POST /api/system/test-email
 * Endpoint diagnostico para verificar configuracion de emails en produccion.
 * Protegido por autenticacion admin.
 *
 * Body: { email: "destino@ejemplo.com" }
 * Response: diagnostico completo + resultado del envio
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helper';
import { Resend } from 'resend';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticacion y rol admin
    const admin = await requireRole(request, 'admin');
    if (admin instanceof NextResponse) return admin;

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email destino requerido' },
        { status: 400 }
      );
    }

    // Diagnostico de variables de entorno
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;

    const diagnostics = {
      RESEND_API_KEY: apiKey ? `SET (${apiKey.substring(0, 10)}...)` : 'NOT SET',
      RESEND_FROM_EMAIL: fromEmail || 'NOT SET (default: noreply@reputaciononline.com.co)',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT SET',
      NODE_ENV: process.env.NODE_ENV || 'NOT SET',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET',
    };

    console.log('TEST-EMAIL: Diagnostico de configuracion:', JSON.stringify(diagnostics, null, 2));

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'RESEND_API_KEY no esta configurada en el servidor',
        diagnostics,
        fix: 'Agregar RESEND_API_KEY en las variables de entorno de Coolify/produccion',
      });
    }

    // Intentar enviar email de prueba
    const from = `Reputacion Online <${fromEmail || 'noreply@reputaciononline.com.co'}>`;
    const resend = new Resend(apiKey);

    console.log(`TEST-EMAIL: Enviando correo de prueba a ${email} desde ${from}`);

    const { data, error } = await resend.emails.send({
      from,
      to: email,
      subject: 'Prueba de email desde produccion | Reputacion Online',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: #fff; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 24px; font-size: 24px; font-weight: 700; color: #0f172a;">Reputacion Online</div>
            <h1 style="color: #0f172a; font-size: 20px;">Prueba de email exitosa</h1>
            <p style="color: #475569;">Este correo confirma que el servicio de emails esta funcionando correctamente en produccion.</p>
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <p style="margin: 4px 0;"><strong>Servidor:</strong> ${process.env.NEXTAUTH_URL || 'localhost'}</p>
              <p style="margin: 4px 0;"><strong>Entorno:</strong> ${process.env.NODE_ENV || 'development'}</p>
              <p style="margin: 4px 0;"><strong>Fecha:</strong> ${new Date().toLocaleString('es-CO')}</p>
              <p style="margin: 4px 0;"><strong>From:</strong> ${from}</p>
            </div>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('TEST-EMAIL: Error enviando:', JSON.stringify(error));
      return NextResponse.json({
        success: false,
        error: 'Error al enviar email',
        resendError: error,
        diagnostics,
      });
    }

    console.log(`TEST-EMAIL: Email enviado exitosamente (id: ${data?.id})`);

    return NextResponse.json({
      success: true,
      message: `Email de prueba enviado a ${email}`,
      emailId: data?.id,
      diagnostics,
    });

  } catch (error: any) {
    console.error('TEST-EMAIL: Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
