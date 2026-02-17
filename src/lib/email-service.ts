/**
 * Email Service - Resend Integration
 * Handles all transactional emails for the platform
 */

import { Resend } from 'resend';

const APP_NAME = 'Reputacion Online';

// Read env vars at call time, not module load time
function getFromEmail(): string {
  return process.env.RESEND_FROM_EMAIL || 'noreply@reputaciononline.com.co';
}

function getAppUrl(): string {
  return process.env.NEXTAUTH_URL || 'http://localhost:3000';
}

// Create fresh Resend instance each call to avoid stale/empty key caching
function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('EMAIL SERVICE: RESEND_API_KEY no esta configurada. No se pueden enviar emails.');
    return null;
  }
  return new Resend(apiKey);
}

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
    .invoice-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    .invoice-table td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
    .invoice-table td:first-child { color: #64748b; font-size: 14px; }
    .invoice-table td:last-child { text-align: right; font-weight: 600; color: #0f172a; }
    .alert-critical { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .alert-warning { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; margin: 16px 0; }
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

// Helper to send email with proper logging
async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const resend = getResend();
  if (!resend) return false;

  const from = `${APP_NAME} <${getFromEmail()}>`;

  console.log(`EMAIL SERVICE: Enviando "${subject}" a ${to} desde ${from}`);

  const { data, error } = await resend.emails.send({ from, to, subject, html });

  if (error) {
    console.error(`EMAIL SERVICE ERROR: ${subject} -> ${to}:`, JSON.stringify(error));
    return false;
  }

  console.log(`EMAIL SERVICE OK: "${subject}" enviado a ${to} (id: ${data?.id})`);
  return true;
}

// Send email verification link
export async function sendVerificationEmail(email: string, code: string, name: string, userId?: string): Promise<boolean> {
  try {
    const verifyUrl = `${getAppUrl()}/verify-email?code=${code}${userId ? `&userId=${userId}` : ''}`;

    const html = baseTemplate(`
      <h1>Verifica tu correo electronico</h1>
      <p>Hola <span class="highlight">${name}</span>,</p>
      <p>Gracias por registrarte en ${APP_NAME}. Haz clic en el siguiente boton para verificar tu cuenta:</p>
      <div style="text-align: center;">
        <a href="${verifyUrl}" class="btn">Verificar mi cuenta</a>
      </div>
      <p>O copia y pega este enlace en tu navegador:</p>
      <p style="word-break: break-all; font-size: 13px; color: #64748b;">${verifyUrl}</p>
      <p>Este enlace expira en <span class="highlight">15 minutos</span>.</p>
      <p>Si no creaste una cuenta, puedes ignorar este mensaje.</p>
    `);

    return await sendEmail(email, `Verifica tu cuenta | ${APP_NAME}`, html);
  } catch (error) {
    console.error('EMAIL SERVICE EXCEPTION [verification]:', error);
    return false;
  }
}

// Send password reset email
export async function sendPasswordResetEmail(email: string, token: string, name: string): Promise<boolean> {
  try {
    const resetUrl = `${getAppUrl()}/reset-password?token=${token}`;

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

    return await sendEmail(email, `Recupera tu contrasena | ${APP_NAME}`, html);
  } catch (error) {
    console.error('EMAIL SERVICE EXCEPTION [password-reset]:', error);
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

    return await sendEmail(email, `Plan actualizado a ${newPlan} | ${APP_NAME}`, html);
  } catch (error) {
    console.error('EMAIL SERVICE EXCEPTION [plan-change]:', error);
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
      <p>Puedes ver el detalle de tus creditos en tu <a href="${getAppUrl()}/dashboard/credito" style="color: #0ea5e9;">panel de control</a>.</p>
    `);

    return await sendEmail(email, `Confirmacion de compra - ${details.plan} | ${APP_NAME}`, html);
  } catch (error) {
    console.error('EMAIL SERVICE EXCEPTION [purchase]:', error);
    return false;
  }
}

// Send invoice/receipt email
export async function sendInvoiceEmail(
  email: string,
  name: string,
  invoice: {
    transactionId: string;
    plan: string;
    credits: number;
    amount: number;
    paymentMethod?: string;
    date?: string;
  }
): Promise<boolean> {
  try {
    const fecha = invoice.date || new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const metodo = invoice.paymentMethod || 'Tarjeta de credito';

    const html = baseTemplate(`
      <h1>Factura de compra</h1>
      <p>Hola <span class="highlight">${name}</span>,</p>
      <p>A continuacion encontraras el detalle de tu compra en ${APP_NAME}:</p>
      <table class="invoice-table">
        <tr><td>No. Transaccion</td><td>${invoice.transactionId}</td></tr>
        <tr><td>Fecha</td><td>${fecha}</td></tr>
        <tr><td>Plan / Producto</td><td>${invoice.plan}</td></tr>
        <tr><td>Creditos</td><td>${invoice.credits}</td></tr>
        <tr><td>Metodo de pago</td><td>${metodo}</td></tr>
        <tr style="border-top: 2px solid #0f172a;"><td style="font-weight: 700; color: #0f172a;">Total</td><td style="font-size: 18px;">$${invoice.amount.toLocaleString('es-CO')} COP</td></tr>
      </table>
      <p style="font-size: 13px; color: #64748b;">Este documento sirve como comprobante de pago. Si necesitas una factura formal con NIT, contacta a nuestro equipo de soporte.</p>
      <div style="text-align: center;">
        <a href="${getAppUrl()}/dashboard/credito" class="btn">Ver mis creditos</a>
      </div>
    `);

    return await sendEmail(email, `Factura de compra #${invoice.transactionId} | ${APP_NAME}`, html);
  } catch (error) {
    console.error('EMAIL SERVICE EXCEPTION [invoice]:', error);
    return false;
  }
}

// Send critical alert email
export async function sendCriticalAlertEmail(
  email: string,
  name: string,
  alert: {
    type: string;
    severity: string;
    description: string;
    actionRequired?: string;
  }
): Promise<boolean> {
  try {
    const severityLabel = alert.severity === 'critical' ? 'CRITICA' : 'ALTA';
    const severityClass = alert.severity === 'critical' ? 'alert-critical' : 'alert-warning';
    const typeLabels: Record<string, string> = {
      'negative_spike': 'Pico de menciones negativas',
      'sentiment_drop': 'Caida de sentimiento',
      'influential_criticism': 'Critica de influenciador',
      'trending_negative': 'Tendencia negativa',
      'media_coverage': 'Cobertura mediatica negativa',
    };

    const html = baseTemplate(`
      <h1>Alerta de reputacion ${severityLabel}</h1>
      <p>Hola <span class="highlight">${name}</span>,</p>
      <p>Se ha detectado una situacion importante que requiere tu atencion:</p>
      <div class="${severityClass}">
        <p style="margin: 4px 0; font-weight: 600; color: #0f172a;">${typeLabels[alert.type] || alert.type}</p>
        <p style="margin: 8px 0 4px 0; color: #475569;">${alert.description}</p>
      </div>
      ${alert.actionRequired ? `<p><span class="highlight">Accion recomendada:</span> ${alert.actionRequired}</p>` : ''}
      <div style="text-align: center;">
        <a href="${getAppUrl()}/dashboard" class="btn">Ir al dashboard</a>
      </div>
      <p style="font-size: 13px; color: #64748b;">Puedes configurar tus preferencias de notificacion en tu perfil.</p>
    `);

    return await sendEmail(email, `Alerta ${severityLabel}: ${typeLabels[alert.type] || alert.type} | ${APP_NAME}`, html);
  } catch (error) {
    console.error('EMAIL SERVICE EXCEPTION [critical-alert]:', error);
    return false;
  }
}
