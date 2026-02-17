/**
 * Email Service - Resend Integration
 * Handles all transactional emails for the platform
 * Professional email templates with modern design
 */

import { Resend } from 'resend';

const APP_NAME = 'Reputacion Online';
const BRAND_COLOR = '#01257D';
const BRAND_LIGHT = '#0ea5e9';
const BRAND_GRADIENT = 'linear-gradient(135deg, #01257D 0%, #0ea5e9 100%)';

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
    console.error('EMAIL SERVICE: Variables disponibles:', {
      RESEND_API_KEY: 'NOT SET',
      RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL || 'NOT SET',
      NODE_ENV: process.env.NODE_ENV || 'NOT SET',
    });
    return null;
  }
  console.log(`EMAIL SERVICE: Resend inicializado (key: ${apiKey.substring(0, 10)}...)`);
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

// Parse user agent to friendly device/browser name
function parseUserAgent(ua: string): { browser: string; os: string } {
  let browser = 'Navegador desconocido';
  let os = 'Sistema desconocido';

  // Browser detection
  if (ua.includes('Edg/')) browser = 'Microsoft Edge';
  else if (ua.includes('OPR/') || ua.includes('Opera')) browser = 'Opera';
  else if (ua.includes('Chrome/') && !ua.includes('Edg/')) browser = 'Google Chrome';
  else if (ua.includes('Firefox/')) browser = 'Mozilla Firefox';
  else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari';

  // OS detection
  if (ua.includes('Windows NT 10')) os = 'Windows 10/11';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS X')) os = 'macOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Linux')) os = 'Linux';

  return { browser, os };
}

// Professional base HTML template
function baseTemplate(content: string, headerIcon?: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${APP_NAME}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f0f2f5; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">

  <!-- Wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f2f5;">
    <tr>
      <td align="center" style="padding: 32px 16px;">

        <!-- Main Container -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">

          <!-- Header with gradient -->
          <tr>
            <td style="background: ${BRAND_GRADIENT}; border-radius: 16px 16px 0 0; padding: 32px 40px; text-align: center;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <!-- Logo/Icon -->
                    <div style="width: 56px; height: 56px; background: rgba(255,255,255,0.2); border-radius: 14px; display: inline-block; line-height: 56px; font-size: 28px; margin-bottom: 12px;">
                      ${headerIcon || '&#x1F310;'}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: 0.5px;">${APP_NAME}</h1>
                    <p style="margin: 6px 0 0 0; color: rgba(255,255,255,0.8); font-size: 13px; font-weight: 400;">Gestion inteligente de reputacion digital</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Accent line -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, ${BRAND_COLOR} 0%, ${BRAND_LIGHT} 50%, #38bdf8 100%);"></td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background: #ffffff; padding: 40px 40px 32px 40px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #f8fafc; border-radius: 0 0 16px 16px; padding: 24px 40px; border-top: 1px solid #e2e8f0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13px;">
                      <a href="${getAppUrl()}/dashboard" style="color: ${BRAND_LIGHT}; text-decoration: none; font-weight: 500;">Dashboard</a>
                      &nbsp;&nbsp;&#x2022;&nbsp;&nbsp;
                      <a href="${getAppUrl()}/dashboard/configuracion" style="color: ${BRAND_LIGHT}; text-decoration: none; font-weight: 500;">Configuracion</a>
                      &nbsp;&nbsp;&#x2022;&nbsp;&nbsp;
                      <a href="${getAppUrl()}/dashboard/soporte" style="color: ${BRAND_LIGHT}; text-decoration: none; font-weight: 500;">Soporte</a>
                    </p>
                    <p style="margin: 8px 0 0 0; color: #94a3b8; font-size: 12px;">
                      &copy; ${new Date().getFullYear()} ${APP_NAME}. Todos los derechos reservados.
                    </p>
                    <p style="margin: 4px 0 0 0; color: #cbd5e1; font-size: 11px;">
                      Este correo fue enviado automaticamente. No responder a este mensaje.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}

// Reusable button component
function emailButton(text: string, url: string, color?: string): string {
  const bgColor = color || BRAND_COLOR;
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 28px auto;">
      <tr>
        <td align="center" style="background: ${bgColor}; border-radius: 10px;">
          <a href="${url}" target="_blank" style="display: inline-block; padding: 14px 36px; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; letter-spacing: 0.3px;">${text}</a>
        </td>
      </tr>
    </table>`;
}

// Reusable info box component
function infoBox(content: string, bgColor?: string, borderColor?: string): string {
  const bg = bgColor || '#f0f7ff';
  const border = borderColor || '#bfdbfe';
  return `
    <div style="background: ${bg}; border: 1px solid ${border}; border-radius: 12px; padding: 20px 24px; margin: 20px 0;">
      ${content}
    </div>`;
}

// Reusable detail row for info boxes
function detailRow(label: string, value: string): string {
  return `<p style="margin: 6px 0; color: #334155; font-size: 14px; line-height: 1.5;">
    <span style="color: #64748b;">${label}:</span> <strong style="color: #0f172a;">${value}</strong>
  </p>`;
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
    console.error(`EMAIL SERVICE ERROR: Config check - API_KEY: ${process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.substring(0, 10) + '...' : 'NOT SET'}, FROM: ${getFromEmail()}`);
    return false;
  }

  console.log(`EMAIL SERVICE OK: "${subject}" enviado a ${to} (id: ${data?.id})`);
  return true;
}

// ============================================================
// EMAIL FUNCTIONS
// ============================================================

// 1. Send email verification link
export async function sendVerificationEmail(email: string, code: string, name: string, userId?: string): Promise<boolean> {
  try {
    const verifyUrl = `${getAppUrl()}/verify-email?code=${code}${userId ? `&userId=${userId}` : ''}`;

    const html = baseTemplate(`
      <h2 style="margin: 0 0 8px 0; color: #0f172a; font-size: 22px; font-weight: 700;">Verifica tu correo electronico</h2>
      <div style="width: 48px; height: 4px; background: ${BRAND_GRADIENT}; border-radius: 2px; margin-bottom: 24px;"></div>

      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0;">
        Hola <strong style="color: #0f172a;">${name}</strong>,
      </p>
      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 8px 0;">
        Gracias por registrarte en <strong>${APP_NAME}</strong>. Para activar tu cuenta y acceder a todas las funciones, verifica tu correo electronico haciendo clic en el siguiente boton:
      </p>

      ${emailButton('Verificar mi cuenta', verifyUrl)}

      <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 16px 0 8px 0;">
        O copia y pega este enlace en tu navegador:
      </p>
      <p style="word-break: break-all; font-size: 12px; color: #94a3b8; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">${verifyUrl}</p>

      ${infoBox(`
        <p style="margin: 0; color: #475569; font-size: 13px;">
          &#x23F0; Este enlace expira en <strong style="color: #0f172a;">15 minutos</strong>. Si no creaste una cuenta, puedes ignorar este mensaje.
        </p>
      `, '#fffbeb', '#fde68a')}
    `, '&#x2709;');

    return await sendEmail(email, `Verifica tu cuenta | ${APP_NAME}`, html);
  } catch (error) {
    console.error('EMAIL SERVICE EXCEPTION [verification]:', error);
    return false;
  }
}

// 2. Send password reset email
export async function sendPasswordResetEmail(email: string, token: string, name: string): Promise<boolean> {
  try {
    const resetUrl = `${getAppUrl()}/reset-password?token=${token}`;

    const html = baseTemplate(`
      <h2 style="margin: 0 0 8px 0; color: #0f172a; font-size: 22px; font-weight: 700;">Recupera tu contrasena</h2>
      <div style="width: 48px; height: 4px; background: ${BRAND_GRADIENT}; border-radius: 2px; margin-bottom: 24px;"></div>

      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0;">
        Hola <strong style="color: #0f172a;">${name}</strong>,
      </p>
      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 8px 0;">
        Recibimos una solicitud para restablecer la contrasena de tu cuenta en <strong>${APP_NAME}</strong>. Haz clic en el siguiente boton para crear una nueva contrasena:
      </p>

      ${emailButton('Restablecer contrasena', resetUrl)}

      <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 16px 0 8px 0;">
        O copia y pega este enlace en tu navegador:
      </p>
      <p style="word-break: break-all; font-size: 12px; color: #94a3b8; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">${resetUrl}</p>

      ${infoBox(`
        <p style="margin: 0; color: #475569; font-size: 13px;">
          &#x23F0; Este enlace expira en <strong style="color: #0f172a;">1 hora</strong>. Si no solicitaste este cambio, puedes ignorar este mensaje. Tu contrasena no sera modificada.
        </p>
      `, '#fffbeb', '#fde68a')}
    `, '&#x1F512;');

    return await sendEmail(email, `Recupera tu contrasena | ${APP_NAME}`, html);
  } catch (error) {
    console.error('EMAIL SERVICE EXCEPTION [password-reset]:', error);
    return false;
  }
}

// 3. Send plan change notification
export async function sendPlanChangeEmail(email: string, name: string, oldPlan: string, newPlan: string): Promise<boolean> {
  try {
    const planColors: Record<string, string> = {
      free: '#94a3b8',
      basic: '#0ea5e9',
      professional: '#8b5cf6',
      enterprise: '#f59e0b',
      political: '#ef4444',
    };

    const oldColor = planColors[oldPlan] || '#94a3b8';
    const newColor = planColors[newPlan] || '#0ea5e9';

    const html = baseTemplate(`
      <h2 style="margin: 0 0 8px 0; color: #0f172a; font-size: 22px; font-weight: 700;">Tu plan ha sido actualizado</h2>
      <div style="width: 48px; height: 4px; background: ${BRAND_GRADIENT}; border-radius: 2px; margin-bottom: 24px;"></div>

      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0;">
        Hola <strong style="color: #0f172a;">${name}</strong>,
      </p>
      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
        Tu plan en <strong>${APP_NAME}</strong> ha sido actualizado exitosamente.
      </p>

      <!-- Plan change visual -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 8px 0 24px 0;">
        <tr>
          <td width="44%" style="text-align: center; padding: 20px 16px; background: #f8fafc; border-radius: 12px; border: 2px solid #e2e8f0;">
            <p style="margin: 0 0 8px 0; color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Plan anterior</p>
            <p style="margin: 0; font-size: 18px; font-weight: 700; color: ${oldColor}; text-transform: capitalize;">${oldPlan}</p>
          </td>
          <td width="12%" style="text-align: center; vertical-align: middle;">
            <span style="font-size: 24px; color: #cbd5e1;">&#x27A1;</span>
          </td>
          <td width="44%" style="text-align: center; padding: 20px 16px; background: linear-gradient(135deg, ${newColor}10, ${newColor}20); border-radius: 12px; border: 2px solid ${newColor};">
            <p style="margin: 0 0 8px 0; color: ${newColor}; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Plan nuevo</p>
            <p style="margin: 0; font-size: 18px; font-weight: 700; color: ${newColor}; text-transform: capitalize;">${newPlan}</p>
          </td>
        </tr>
      </table>

      ${emailButton('Ver mi plan', `${getAppUrl()}/dashboard/credito`)}

      <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 0; text-align: center;">
        Si tienes alguna pregunta sobre tu nuevo plan, no dudes en contactarnos.
      </p>
    `, '&#x1F680;');

    return await sendEmail(email, `Plan actualizado a ${newPlan} | ${APP_NAME}`, html);
  } catch (error) {
    console.error('EMAIL SERVICE EXCEPTION [plan-change]:', error);
    return false;
  }
}

// 4. Send purchase confirmation email
export async function sendPurchaseConfirmationEmail(
  email: string,
  name: string,
  details: { plan: string; amount: number; credits: number; transactionId: string }
): Promise<boolean> {
  try {
    const fecha = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });

    const html = baseTemplate(`
      <h2 style="margin: 0 0 8px 0; color: #0f172a; font-size: 22px; font-weight: 700;">Compra confirmada</h2>
      <div style="width: 48px; height: 4px; background: ${BRAND_GRADIENT}; border-radius: 2px; margin-bottom: 24px;"></div>

      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0;">
        Hola <strong style="color: #0f172a;">${name}</strong>,
      </p>
      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
        Tu compra en <strong>${APP_NAME}</strong> ha sido procesada exitosamente.
      </p>

      ${infoBox(`
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 6px 0;"><span style="color: #64748b; font-size: 14px;">Plan</span></td>
            <td style="padding: 6px 0; text-align: right;"><strong style="color: #0f172a; font-size: 14px; text-transform: capitalize;">${details.plan}</strong></td>
          </tr>
          <tr>
            <td style="padding: 6px 0; border-top: 1px solid #e0e7ff;"><span style="color: #64748b; font-size: 14px;">Creditos agregados</span></td>
            <td style="padding: 6px 0; border-top: 1px solid #e0e7ff; text-align: right;"><strong style="color: #0ea5e9; font-size: 14px;">+${details.credits}</strong></td>
          </tr>
          <tr>
            <td style="padding: 6px 0; border-top: 1px solid #e0e7ff;"><span style="color: #64748b; font-size: 14px;">Monto</span></td>
            <td style="padding: 6px 0; border-top: 1px solid #e0e7ff; text-align: right;"><strong style="color: #0f172a; font-size: 14px;">$${details.amount.toLocaleString('es-CO')} COP</strong></td>
          </tr>
          <tr>
            <td style="padding: 6px 0; border-top: 1px solid #e0e7ff;"><span style="color: #64748b; font-size: 14px;">ID Transaccion</span></td>
            <td style="padding: 6px 0; border-top: 1px solid #e0e7ff; text-align: right;"><strong style="color: #0f172a; font-size: 13px; font-family: monospace;">${details.transactionId}</strong></td>
          </tr>
          <tr>
            <td style="padding: 6px 0; border-top: 1px solid #e0e7ff;"><span style="color: #64748b; font-size: 14px;">Fecha</span></td>
            <td style="padding: 6px 0; border-top: 1px solid #e0e7ff; text-align: right;"><strong style="color: #0f172a; font-size: 14px;">${fecha}</strong></td>
          </tr>
        </table>
      `, '#f0fdf4', '#bbf7d0')}

      ${emailButton('Ver mis creditos', `${getAppUrl()}/dashboard/credito`)}
    `, '&#x2705;');

    return await sendEmail(email, `Confirmacion de compra - ${details.plan} | ${APP_NAME}`, html);
  } catch (error) {
    console.error('EMAIL SERVICE EXCEPTION [purchase]:', error);
    return false;
  }
}

// 5. Send invoice/receipt email
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
      <h2 style="margin: 0 0 8px 0; color: #0f172a; font-size: 22px; font-weight: 700;">Factura de compra</h2>
      <div style="width: 48px; height: 4px; background: ${BRAND_GRADIENT}; border-radius: 2px; margin-bottom: 24px;"></div>

      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0;">
        Hola <strong style="color: #0f172a;">${name}</strong>,
      </p>
      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
        A continuacion encontraras el detalle de tu compra:
      </p>

      <!-- Invoice table -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 24px 0; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <tr style="background: #f8fafc;">
          <td colspan="2" style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0;">
            <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Detalle de factura</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 14px 20px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 14px;">No. Transaccion</td>
          <td style="padding: 14px 20px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600; color: #0f172a; font-size: 14px; font-family: monospace;">${invoice.transactionId}</td>
        </tr>
        <tr>
          <td style="padding: 14px 20px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 14px;">Fecha</td>
          <td style="padding: 14px 20px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600; color: #0f172a; font-size: 14px;">${fecha}</td>
        </tr>
        <tr>
          <td style="padding: 14px 20px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 14px;">Plan / Producto</td>
          <td style="padding: 14px 20px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600; color: #0f172a; font-size: 14px; text-transform: capitalize;">${invoice.plan}</td>
        </tr>
        <tr>
          <td style="padding: 14px 20px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 14px;">Creditos</td>
          <td style="padding: 14px 20px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600; color: #0ea5e9; font-size: 14px;">${invoice.credits}</td>
        </tr>
        <tr>
          <td style="padding: 14px 20px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 14px;">Metodo de pago</td>
          <td style="padding: 14px 20px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600; color: #0f172a; font-size: 14px;">${metodo}</td>
        </tr>
        <tr style="background: #f0f7ff;">
          <td style="padding: 18px 20px; color: #01257D; font-size: 16px; font-weight: 700;">Total</td>
          <td style="padding: 18px 20px; text-align: right; color: #01257D; font-size: 20px; font-weight: 700;">$${invoice.amount.toLocaleString('es-CO')} COP</td>
        </tr>
      </table>

      <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0 0 20px 0;">
        Este documento sirve como comprobante de pago. Si necesitas una factura formal con NIT, contacta a nuestro equipo de soporte.
      </p>

      ${emailButton('Ver mis creditos', `${getAppUrl()}/dashboard/credito`)}
    `, '&#x1F9FE;');

    return await sendEmail(email, `Factura de compra #${invoice.transactionId} | ${APP_NAME}`, html);
  } catch (error) {
    console.error('EMAIL SERVICE EXCEPTION [invoice]:', error);
    return false;
  }
}

// 6. Send critical alert email
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
    const isCritical = alert.severity === 'critical';
    const severityLabel = isCritical ? 'CRITICA' : 'ALTA';
    const alertBg = isCritical ? '#fef2f2' : '#fffbeb';
    const alertBorder = isCritical ? '#fecaca' : '#fde68a';
    const alertTextColor = isCritical ? '#991b1b' : '#92400e';
    const alertBadgeBg = isCritical ? '#dc2626' : '#f59e0b';

    const typeLabels: Record<string, string> = {
      'negative_spike': 'Pico de menciones negativas',
      'sentiment_drop': 'Caida de sentimiento',
      'influential_criticism': 'Critica de influenciador',
      'trending_negative': 'Tendencia negativa',
      'media_coverage': 'Cobertura mediatica negativa',
    };

    const html = baseTemplate(`
      <h2 style="margin: 0 0 8px 0; color: #0f172a; font-size: 22px; font-weight: 700;">Alerta de reputacion</h2>
      <div style="width: 48px; height: 4px; background: ${alertBadgeBg}; border-radius: 2px; margin-bottom: 8px;"></div>

      <!-- Severity badge -->
      <span style="display: inline-block; background: ${alertBadgeBg}; color: #ffffff; padding: 4px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 1px; margin-bottom: 20px;">SEVERIDAD ${severityLabel}</span>

      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 16px 0;">
        Hola <strong style="color: #0f172a;">${name}</strong>,
      </p>
      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
        Se ha detectado una situacion importante que requiere tu atencion:
      </p>

      <div style="background: ${alertBg}; border: 1px solid ${alertBorder}; border-left: 4px solid ${alertBadgeBg}; border-radius: 0 12px 12px 0; padding: 20px 24px; margin: 0 0 24px 0;">
        <p style="margin: 0 0 8px 0; font-weight: 700; color: ${alertTextColor}; font-size: 16px;">${typeLabels[alert.type] || alert.type}</p>
        <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.6;">${alert.description}</p>
      </div>

      ${alert.actionRequired ? `
      ${infoBox(`
        <p style="margin: 0; color: #475569; font-size: 14px;">
          <strong style="color: #0f172a;">Accion recomendada:</strong> ${alert.actionRequired}
        </p>
      `, '#f0f7ff', '#bfdbfe')}
      ` : ''}

      ${emailButton('Ir al dashboard', `${getAppUrl()}/dashboard`, alertBadgeBg)}

      <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0; text-align: center;">
        Puedes configurar tus preferencias de notificacion en tu perfil.
      </p>
    `, '&#x26A0;');

    return await sendEmail(email, `Alerta ${severityLabel}: ${typeLabels[alert.type] || alert.type} | ${APP_NAME}`, html);
  } catch (error) {
    console.error('EMAIL SERVICE EXCEPTION [critical-alert]:', error);
    return false;
  }
}

// 7. Send admin password reset email (when admin resets a user's password)
export async function sendAdminResetPasswordEmail(email: string, name: string, tempPassword: string): Promise<boolean> {
  try {
    const html = baseTemplate(`
      <h2 style="margin: 0 0 8px 0; color: #0f172a; font-size: 22px; font-weight: 700;">Contrasena restablecida</h2>
      <div style="width: 48px; height: 4px; background: ${BRAND_GRADIENT}; border-radius: 2px; margin-bottom: 24px;"></div>

      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0;">
        Hola <strong style="color: #0f172a;">${name}</strong>,
      </p>
      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
        Tu contrasena ha sido restablecida por un administrador. Tu nueva contrasena temporal es:
      </p>

      <!-- Password display -->
      <div style="background: #f0f7ff; border: 2px dashed #0ea5e9; border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 24px 0;">
        <p style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 3px; color: #01257D; font-family: 'Courier New', monospace;">${tempPassword}</p>
      </div>

      ${infoBox(`
        <p style="margin: 0; color: #475569; font-size: 13px;">
          &#x1F6E1; Te recomendamos cambiar esta contrasena inmediatamente despues de iniciar sesion por seguridad.
        </p>
      `, '#fffbeb', '#fde68a')}

      ${emailButton('Iniciar sesion', `${getAppUrl()}/login`)}
    `, '&#x1F511;');

    return await sendEmail(email, `Contrasena restablecida | ${APP_NAME}`, html);
  } catch (error) {
    console.error('EMAIL SERVICE EXCEPTION [admin-reset-password]:', error);
    return false;
  }
}

// 8. Send login notification email
export async function sendLoginNotificationEmail(
  email: string,
  name: string,
  details: {
    ip: string;
    userAgent: string;
    date: string;
  }
): Promise<boolean> {
  try {
    const { browser, os } = parseUserAgent(details.userAgent);

    const html = baseTemplate(`
      <h2 style="margin: 0 0 8px 0; color: #0f172a; font-size: 22px; font-weight: 700;">Nuevo inicio de sesion</h2>
      <div style="width: 48px; height: 4px; background: ${BRAND_GRADIENT}; border-radius: 2px; margin-bottom: 24px;"></div>

      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0;">
        Hola <strong style="color: #0f172a;">${name}</strong>,
      </p>
      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
        Se ha detectado un nuevo inicio de sesion en tu cuenta de <strong>${APP_NAME}</strong>. Aqui estan los detalles:
      </p>

      ${infoBox(`
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e0e7ff;">
              <span style="color: #64748b; font-size: 13px;">Fecha y hora</span>
            </td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e0e7ff; text-align: right;">
              <strong style="color: #0f172a; font-size: 14px;">${details.date}</strong>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e0e7ff;">
              <span style="color: #64748b; font-size: 13px;">Direccion IP</span>
            </td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e0e7ff; text-align: right;">
              <strong style="color: #0f172a; font-size: 14px; font-family: monospace;">${details.ip}</strong>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e0e7ff;">
              <span style="color: #64748b; font-size: 13px;">Navegador</span>
            </td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e0e7ff; text-align: right;">
              <strong style="color: #0f172a; font-size: 14px;">${browser}</strong>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">
              <span style="color: #64748b; font-size: 13px;">Sistema operativo</span>
            </td>
            <td style="padding: 8px 0; text-align: right;">
              <strong style="color: #0f172a; font-size: 14px;">${os}</strong>
            </td>
          </tr>
        </table>
      `, '#f8fafc', '#e2e8f0')}

      <div style="background: #fef2f2; border: 1px solid #fecaca; border-left: 4px solid #ef4444; border-radius: 0 12px 12px 0; padding: 16px 20px; margin: 20px 0;">
        <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.5;">
          <strong>Si no fuiste tu,</strong> cambia tu contrasena inmediatamente para proteger tu cuenta.
        </p>
      </div>

      ${emailButton('Cambiar contrasena', `${getAppUrl()}/dashboard/configuracion`, '#ef4444')}

      <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0; text-align: center;">
        Este es un correo de seguridad. Recibiras esta notificacion cada vez que inicies sesion.
      </p>
    `, '&#x1F6E1;');

    return await sendEmail(email, `Nuevo inicio de sesion | ${APP_NAME}`, html);
  } catch (error) {
    console.error('EMAIL SERVICE EXCEPTION [login-notification]:', error);
    return false;
  }
}
