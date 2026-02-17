/**
 * Email Service - Resend Integration
 * Handles all transactional emails for the platform
 */

import { Resend } from 'resend';

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY || '');
  }
  return _resend;
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@reputaciononline.com.co';
const APP_NAME = 'Reputacion Online';
const APP_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

// Generate a random 6-digit code
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate a random token for password reset
export function generateResetToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Base HTML template
function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .logo { text-align: center; margin-bottom: 24px; font-size: 24px; font-weight: 700; color: #0f172a; }
    .code { background: #f0f9ff; border: 2px dashed #0ea5e9; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0; }
    .code-text { font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #0369a1; }
    .btn { display: inline-block; background: #0ea5e9; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; margin: 24px 0; }
    .footer { text-align: center; margin-top: 24px; color: #94a3b8; font-size: 12px; }
    h1 { color: #0f172a; font-size: 20px; margin-bottom: 16px; }
    p { color: #475569; line-height: 1.6; margin-bottom: 12px; }
    .highlight { color: #0f172a; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">${APP_NAME}</div>
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${APP_NAME}. Todos los derechos reservados.</p>
      <p>Este correo fue enviado automaticamente. No responder a este mensaje.</p>
    </div>
  </div>
</body>
</html>`;
}

// Send email verification code
export async function sendVerificationEmail(email: string, code: string, name: string): Promise<boolean> {
  try {
    const html = baseTemplate(`
      <h1>Verifica tu correo electronico</h1>
      <p>Hola <span class="highlight">${name}</span>,</p>
      <p>Gracias por registrarte en ${APP_NAME}. Usa el siguiente codigo para verificar tu cuenta:</p>
      <div class="code">
        <div class="code-text">${code}</div>
      </div>
      <p>Este codigo expira en <span class="highlight">15 minutos</span>.</p>
      <p>Si no creaste una cuenta, puedes ignorar este mensaje.</p>
    `);

    const { error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `${code} - Codigo de verificacion | ${APP_NAME}`,
      html,
    });

    if (error) {
      console.error('Error sending verification email:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
}

// Send password reset email
export async function sendPasswordResetEmail(email: string, token: string, name: string): Promise<boolean> {
  try {
    const resetUrl = `${APP_URL}/reset-password?token=${token}`;

    const html = baseTemplate(`
      <h1>Recupera tu contrasena</h1>
      <p>Hola <span class="highlight">${name}</span>,</p>
      <p>Recibimos una solicitud para restablecer la contrasena de tu cuenta en ${APP_NAME}.</p>
      <p>Haz clic en el siguiente boton para crear una nueva contrasena:</p>
      <div style="text-align: center;">
        <a href="${resetUrl}" class="btn">Restablecer Contrasena</a>
      </div>
      <p>O copia y pega este enlace en tu navegador:</p>
      <p style="word-break: break-all; font-size: 13px; color: #64748b;">${resetUrl}</p>
      <p>Este enlace expira en <span class="highlight">1 hora</span>.</p>
      <p>Si no solicitaste este cambio, puedes ignorar este mensaje. Tu contrasena no sera modificada.</p>
    `);

    const { error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Recupera tu contrasena | ${APP_NAME}`,
      html,
    });

    if (error) {
      console.error('Error sending password reset email:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
}

// Send plan change notification
export async function sendPlanChangeEmail(email: string, name: string, oldPlan: string, newPlan: string): Promise<boolean> {
  try {
    const html = baseTemplate(`
      <h1>Tu plan ha sido actualizado</h1>
      <p>Hola <span class="highlight">${name}</span>,</p>
      <p>Tu plan en ${APP_NAME} ha sido actualizado exitosamente.</p>
      <div style="background: #f0f9ff; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <p style="margin: 4px 0;"><span class="highlight">Plan anterior:</span> ${oldPlan}</p>
        <p style="margin: 4px 0;"><span class="highlight">Plan nuevo:</span> ${newPlan}</p>
      </div>
      <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
    `);

    const { error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Plan actualizado a ${newPlan} | ${APP_NAME}`,
      html,
    });

    if (error) {
      console.error('Error sending plan change email:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending plan change email:', error);
    return false;
  }
}

// Send purchase confirmation email
export async function sendPurchaseConfirmationEmail(
  email: string,
  name: string,
  details: { plan: string; amount: number; credits: number; transactionId: string }
): Promise<boolean> {
  try {
    const html = baseTemplate(`
      <h1>Confirmacion de compra</h1>
      <p>Hola <span class="highlight">${name}</span>,</p>
      <p>Tu compra en ${APP_NAME} ha sido procesada exitosamente.</p>
      <div style="background: #f0fdf4; border-radius: 8px; padding: 16px; margin: 16px 0; border: 1px solid #bbf7d0;">
        <p style="margin: 4px 0;"><span class="highlight">Plan:</span> ${details.plan}</p>
        <p style="margin: 4px 0;"><span class="highlight">Creditos:</span> ${details.credits}</p>
        <p style="margin: 4px 0;"><span class="highlight">Monto:</span> $${details.amount.toLocaleString('es-CO')} COP</p>
        <p style="margin: 4px 0;"><span class="highlight">ID Transaccion:</span> ${details.transactionId}</p>
        <p style="margin: 4px 0;"><span class="highlight">Fecha:</span> ${new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
      <p>Puedes ver el detalle de tus creditos en tu <a href="${APP_URL}/dashboard/credito" style="color: #0ea5e9;">panel de control</a>.</p>
    `);

    const { error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Confirmacion de compra - ${details.plan} | ${APP_NAME}`,
      html,
    });

    if (error) {
      console.error('Error sending purchase confirmation email:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending purchase confirmation email:', error);
    return false;
  }
}
