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
  return process.env.NEXTAUTH_URL || 'https://reputaciononline.com.co';
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
                      &nbsp;&nbsp;&#x2022;&nbsp;&nbsp;
                      <a href="${getAppUrl()}/dashboard/configuracion" style="color: ${BRAND_LIGHT}; text-decoration: none; font-weight: 500;">Preferencias de correo</a>
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

// 1b. Send welcome email (tras verificar la cuenta)
export async function sendWelcomeEmail(email: string, name: string): Promise<boolean> {
  try {
    const html = baseTemplate(`
      <h2 style="margin: 0 0 8px 0; color: #0f172a; font-size: 22px; font-weight: 700;">Bienvenido a ${APP_NAME}</h2>
      <div style="width: 48px; height: 4px; background: ${BRAND_GRADIENT}; border-radius: 2px; margin-bottom: 24px;"></div>

      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0;">
        Hola <strong style="color: #0f172a;">${name}</strong>, tu cuenta ya esta verificada y lista para usarse. Estos
        son los primeros pasos para sacarle el maximo provecho a tu monitoreo de reputacion:
      </p>

      ${infoBox(`
        <p style="margin: 0 0 10px 0; color: #334155; font-size: 14px; line-height: 1.6;"><strong style="color: #0f172a;">1.</strong> Conecta tus redes sociales (Facebook, Instagram, X, YouTube).</p>
        <p style="margin: 0 0 10px 0; color: #334155; font-size: 14px; line-height: 1.6;"><strong style="color: #0f172a;">2.</strong> Configura tus palabras clave para monitorear menciones y noticias.</p>
        <p style="margin: 0; color: #334155; font-size: 14px; line-height: 1.6;"><strong style="color: #0f172a;">3.</strong> Revisa tu dashboard y deja que Julia (IA) analice tu reputacion.</p>
      `)}

      ${emailButton('Ir al dashboard', `${getAppUrl()}/dashboard`)}

      <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 16px 0 0 0;">
        Si tienes dudas, escribenos desde <a href="${getAppUrl()}/dashboard/soporte" style="color: ${BRAND_LIGHT}; text-decoration: none;">Soporte</a>. Estamos para ayudarte.
      </p>
    `, '&#x1F44B;');

    return await sendEmail(email, `Bienvenido a ${APP_NAME}`, html);
  } catch (error) {
    console.error('EMAIL SERVICE EXCEPTION [welcome]:', error);
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

      ${emailButton('Ver mi plan', `${getAppUrl()}/dashboard/creditos`)}

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

      ${emailButton('Ver mis creditos', `${getAppUrl()}/dashboard/creditos`)}
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

      ${emailButton('Ver mis creditos', `${getAppUrl()}/dashboard/creditos`)}
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

// ============================================================
// CATEGORIA A: ALERTAS DE REDES SOCIALES SIN IA
// ============================================================

// A1. Nueva mencion detectada
export async function sendNewMentionAlert(
  email: string,
  name: string,
  mention: {
    content: string;
    source: string;
    author: string;
    sentiment: string;
    sentimentScore: number;
    sourceUrl?: string;
    date: string;
  }
): Promise<boolean> {
  try {
    const sentimentColors: Record<string, string> = {
      positive: '#16a34a', negative: '#dc2626', neutral: '#f59e0b',
    };
    const sentimentLabels: Record<string, string> = {
      positive: 'Positiva', negative: 'Negativa', neutral: 'Neutral',
    };
    const sentimentColor = sentimentColors[mention.sentiment] || '#64748b';
    const sentimentLabel = sentimentLabels[mention.sentiment] || mention.sentiment;
    const platformIcons: Record<string, string> = {
      facebook: '&#x1F535;', x: '&#x2B1B;', twitter: '&#x2B1B;', instagram: '&#x1F7E3;', youtube: '&#x1F534;', news: '&#x1F4F0;',
    };
    const platformIcon = platformIcons[mention.source.toLowerCase()] || '&#x1F4AC;';

    const html = baseTemplate(`
      <h2 style="margin: 0 0 8px 0; color: #0f172a; font-size: 22px; font-weight: 700;">Nueva mencion detectada</h2>
      <div style="width: 48px; height: 4px; background: ${sentimentColor}; border-radius: 2px; margin-bottom: 8px;"></div>
      <span style="display: inline-block; background: ${sentimentColor}; color: #ffffff; padding: 4px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 1px; margin-bottom: 20px;">${sentimentLabel.toUpperCase()}</span>

      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 16px 0;">
        Hola <strong style="color: #0f172a;">${name}</strong>,
      </p>
      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
        Se detecto una nueva mencion sobre ti en <strong>${mention.source}</strong>:
      </p>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid ${sentimentColor}; border-radius: 0 12px 12px 0; padding: 20px 24px; margin: 0 0 20px 0;">
        <p style="margin: 0 0 12px 0; color: #0f172a; font-size: 15px; line-height: 1.6; font-style: italic;">"${mention.content.length > 300 ? mention.content.substring(0, 300) + '...' : mention.content}"</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="color: #64748b; font-size: 13px;">
              ${platformIcon} <strong>${mention.source}</strong> &nbsp;&#x2022;&nbsp; @${mention.author} &nbsp;&#x2022;&nbsp; ${mention.date}
            </td>
          </tr>
        </table>
      </div>

      ${infoBox(`
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td><span style="color: #64748b; font-size: 13px;">Sentimiento</span></td>
            <td style="text-align: right;"><strong style="color: ${sentimentColor};">${sentimentLabel} (${mention.sentimentScore}%)</strong></td>
          </tr>
        </table>
      `)}

      ${mention.sourceUrl ? emailButton('Ver mencion original', mention.sourceUrl) : emailButton('Ir al dashboard', `${getAppUrl()}/dashboard/monitoreo`)}
    `, '&#x1F4AC;');

    return await sendEmail(email, `Nueva mencion ${sentimentLabel.toLowerCase()} en ${mention.source} | ${APP_NAME}`, html);
  } catch (error) {
    console.error('EMAIL SERVICE EXCEPTION [new-mention-alert]:', error);
    return false;
  }
}

// A2. Pico de menciones negativas
export async function sendNegativeSpikeAlert(
  email: string,
  name: string,
  data: {
    negativeCount: number;
    averageCount: number;
    increasePercent: number;
    topMentions: Array<{ content: string; source: string; author: string; sourceUrl?: string }>;
    period: string;
  }
): Promise<boolean> {
  try {
    const mentionsList = data.topMentions.slice(0, 3).map((m, i) => `
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #fecaca;">
          <p style="margin: 0 0 4px 0; color: #0f172a; font-size: 14px; line-height: 1.5;">${i + 1}. "${m.content.length > 150 ? m.content.substring(0, 150) + '...' : m.content}"</p>
          <p style="margin: 0; color: #94a3b8; font-size: 12px;">@${m.author} en ${m.source}${m.sourceUrl ? ` — <a href="${m.sourceUrl}" style="color: ${BRAND_LIGHT};">Ver</a>` : ''}</p>
        </td>
      </tr>
    `).join('');

    const html = baseTemplate(`
      <h2 style="margin: 0 0 8px 0; color: #0f172a; font-size: 22px; font-weight: 700;">Pico de menciones negativas</h2>
      <div style="width: 48px; height: 4px; background: #dc2626; border-radius: 2px; margin-bottom: 8px;"></div>
      <span style="display: inline-block; background: #dc2626; color: #ffffff; padding: 4px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 1px; margin-bottom: 20px;">ALERTA</span>

      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 16px 0;">
        Hola <strong style="color: #0f172a;">${name}</strong>,
      </p>
      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
        Se ha detectado un aumento inusual de menciones negativas en ${data.period}:
      </p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 24px 0;">
        <tr>
          <td width="33%" style="text-align: center; padding: 20px 12px; background: #fef2f2; border-radius: 12px;">
            <p style="margin: 0; font-size: 28px; font-weight: 700; color: #dc2626;">${data.negativeCount}</p>
            <p style="margin: 4px 0 0 0; color: #991b1b; font-size: 11px; text-transform: uppercase; font-weight: 600;">Negativas</p>
          </td>
          <td width="33%" style="text-align: center; padding: 20px 12px; background: #f8fafc; border-radius: 12px;">
            <p style="margin: 0; font-size: 28px; font-weight: 700; color: #64748b;">${data.averageCount}</p>
            <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 11px; text-transform: uppercase; font-weight: 600;">Promedio</p>
          </td>
          <td width="33%" style="text-align: center; padding: 20px 12px; background: #fef2f2; border-radius: 12px;">
            <p style="margin: 0; font-size: 28px; font-weight: 700; color: #dc2626;">+${data.increasePercent}%</p>
            <p style="margin: 4px 0 0 0; color: #991b1b; font-size: 11px; text-transform: uppercase; font-weight: 600;">Aumento</p>
          </td>
        </tr>
      </table>

      ${data.topMentions.length > 0 ? `
      <p style="color: #0f172a; font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">Menciones mas criticas:</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; overflow: hidden; margin: 0 0 24px 0;">
        ${mentionsList}
      </table>
      ` : ''}

      ${emailButton('Gestionar crisis', `${getAppUrl()}/dashboard/monitoreo`, '#dc2626')}
    `, '&#x1F6A8;');

    return await sendEmail(email, `Alerta: +${data.increasePercent}% menciones negativas | ${APP_NAME}`, html);
  } catch (error) {
    console.error('EMAIL SERVICE EXCEPTION [negative-spike]:', error);
    return false;
  }
}

// A3. Hito de seguidores alcanzado
export async function sendFollowerMilestoneEmail(
  email: string,
  name: string,
  data: {
    platform: string;
    currentFollowers: number;
    milestone: number;
    previousFollowers: number;
  }
): Promise<boolean> {
  try {
    const growth = data.currentFollowers - data.previousFollowers;
    const growthPercent = data.previousFollowers > 0 ? Math.round((growth / data.previousFollowers) * 100) : 0;

    const html = baseTemplate(`
      <h2 style="margin: 0 0 8px 0; color: #0f172a; font-size: 22px; font-weight: 700;">Hito de seguidores alcanzado</h2>
      <div style="width: 48px; height: 4px; background: ${BRAND_GRADIENT}; border-radius: 2px; margin-bottom: 24px;"></div>

      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0;">
        Hola <strong style="color: #0f172a;">${name}</strong>,
      </p>
      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
        Tu cuenta de <strong>${data.platform}</strong> ha alcanzado un importante hito:
      </p>

      <div style="text-align: center; padding: 32px 24px; background: linear-gradient(135deg, #f0f7ff, #ede9fe); border-radius: 16px; margin: 0 0 24px 0; border: 1px solid #c7d2fe;">
        <p style="margin: 0 0 8px 0; font-size: 48px; font-weight: 700; color: ${BRAND_COLOR};">${data.milestone.toLocaleString('es-CO')}</p>
        <p style="margin: 0; font-size: 14px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">seguidores en ${data.platform}</p>
      </div>

      ${infoBox(`
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 4px 0;"><span style="color: #64748b; font-size: 14px;">Seguidores actuales</span></td>
            <td style="padding: 4px 0; text-align: right;"><strong style="color: #0f172a;">${data.currentFollowers.toLocaleString('es-CO')}</strong></td>
          </tr>
          <tr>
            <td style="padding: 4px 0;"><span style="color: #64748b; font-size: 14px;">Crecimiento</span></td>
            <td style="padding: 4px 0; text-align: right;"><strong style="color: #16a34a;">+${growth.toLocaleString('es-CO')} (+${growthPercent}%)</strong></td>
          </tr>
        </table>
      `, '#f0fdf4', '#bbf7d0')}

      ${emailButton('Ver mis redes', `${getAppUrl()}/dashboard/redes-sociales`)}
    `, '&#x1F389;');

    return await sendEmail(email, `${data.milestone.toLocaleString('es-CO')} seguidores en ${data.platform} | ${APP_NAME}`, html);
  } catch (error) {
    console.error('EMAIL SERVICE EXCEPTION [follower-milestone]:', error);
    return false;
  }
}

// A4. Pico de engagement
export async function sendEngagementSpikeEmail(
  email: string,
  name: string,
  data: {
    platform: string;
    postContent: string;
    likes: number;
    shares: number;
    comments: number;
    engagementRate: number;
    averageEngagement: number;
    postUrl?: string;
  }
): Promise<boolean> {
  try {
    const multiplier = data.averageEngagement > 0 ? Math.round(data.engagementRate / data.averageEngagement) : 0;

    const html = baseTemplate(`
      <h2 style="margin: 0 0 8px 0; color: #0f172a; font-size: 22px; font-weight: 700;">Publicacion con alto engagement</h2>
      <div style="width: 48px; height: 4px; background: #16a34a; border-radius: 2px; margin-bottom: 8px;"></div>
      <span style="display: inline-block; background: #16a34a; color: #ffffff; padding: 4px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 1px; margin-bottom: 20px;">VIRAL &#x1F525;</span>

      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 16px 0;">
        Hola <strong style="color: #0f172a;">${name}</strong>,
      </p>
      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
        Una de tus publicaciones en <strong>${data.platform}</strong> esta generando ${multiplier}x mas engagement que tu promedio:
      </p>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #16a34a; border-radius: 0 12px 12px 0; padding: 20px 24px; margin: 0 0 20px 0;">
        <p style="margin: 0; color: #0f172a; font-size: 14px; line-height: 1.6; font-style: italic;">"${data.postContent.length > 200 ? data.postContent.substring(0, 200) + '...' : data.postContent}"</p>
      </div>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 24px 0;">
        <tr>
          <td width="33%" style="text-align: center; padding: 16px 8px; background: #f0fdf4; border-radius: 12px;">
            <p style="margin: 0; font-size: 24px; font-weight: 700; color: #16a34a;">${data.likes.toLocaleString('es-CO')}</p>
            <p style="margin: 4px 0 0 0; color: #64748b; font-size: 11px; text-transform: uppercase;">Likes</p>
          </td>
          <td width="33%" style="text-align: center; padding: 16px 8px; background: #f0f7ff; border-radius: 12px;">
            <p style="margin: 0; font-size: 24px; font-weight: 700; color: ${BRAND_LIGHT};">${data.shares.toLocaleString('es-CO')}</p>
            <p style="margin: 4px 0 0 0; color: #64748b; font-size: 11px; text-transform: uppercase;">Compartidos</p>
          </td>
          <td width="33%" style="text-align: center; padding: 16px 8px; background: #faf5ff; border-radius: 12px;">
            <p style="margin: 0; font-size: 24px; font-weight: 700; color: #8b5cf6;">${data.comments.toLocaleString('es-CO')}</p>
            <p style="margin: 4px 0 0 0; color: #64748b; font-size: 11px; text-transform: uppercase;">Comentarios</p>
          </td>
        </tr>
      </table>

      ${data.postUrl ? emailButton('Ver publicacion', data.postUrl, '#16a34a') : emailButton('Ir al dashboard', `${getAppUrl()}/dashboard/redes-sociales`, '#16a34a')}
    `, '&#x1F4C8;');

    return await sendEmail(email, `Publicacion viral en ${data.platform} (${multiplier}x engagement) | ${APP_NAME}`, html);
  } catch (error) {
    console.error('EMAIL SERVICE EXCEPTION [engagement-spike]:', error);
    return false;
  }
}

// A5. Plataforma desconectada
export async function sendPlatformDisconnectedEmail(
  email: string,
  name: string,
  data: { platform: string; reason?: string }
): Promise<boolean> {
  try {
    const html = baseTemplate(`
      <h2 style="margin: 0 0 8px 0; color: #0f172a; font-size: 22px; font-weight: 700;">Plataforma desconectada</h2>
      <div style="width: 48px; height: 4px; background: #f59e0b; border-radius: 2px; margin-bottom: 24px;"></div>

      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0;">
        Hola <strong style="color: #0f172a;">${name}</strong>,
      </p>
      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
        Tu cuenta de <strong>${data.platform}</strong> se ha desconectado de ${APP_NAME}.
        ${data.reason ? ` Motivo: ${data.reason}.` : ''}
      </p>

      ${infoBox(`
        <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
          Mientras la cuenta este desconectada, no podremos monitorear menciones, engagement ni seguidores de <strong>${data.platform}</strong>. Reconecta tu cuenta para continuar el monitoreo.
        </p>
      `, '#fffbeb', '#fde68a')}

      ${emailButton('Reconectar ' + data.platform, `${getAppUrl()}/dashboard/redes-sociales`, '#f59e0b')}
    `, '&#x1F50C;');

    return await sendEmail(email, `${data.platform} desconectada - Reconecta tu cuenta | ${APP_NAME}`, html);
  } catch (error) {
    console.error('EMAIL SERVICE EXCEPTION [platform-disconnected]:', error);
    return false;
  }
}

// A6. Mencion en medios de comunicacion
export async function sendNewsMentionAlert(
  email: string,
  name: string,
  article: {
    title: string;
    source: string;
    url: string;
    sentiment: string;
    sentimentScore: number;
    matchedTerms: string[];
    context: string;
    publishedDate: string;
  }
): Promise<boolean> {
  try {
    const sentimentColors: Record<string, string> = {
      positive: '#16a34a', negative: '#dc2626', neutral: '#f59e0b',
    };
    const sentimentLabels: Record<string, string> = {
      positive: 'Positivo', negative: 'Negativo', neutral: 'Neutral',
    };
    const color = sentimentColors[article.sentiment] || '#64748b';
    const label = sentimentLabels[article.sentiment] || article.sentiment;

    const html = baseTemplate(`
      <h2 style="margin: 0 0 8px 0; color: #0f172a; font-size: 22px; font-weight: 700;">Mencion en medios</h2>
      <div style="width: 48px; height: 4px; background: ${color}; border-radius: 2px; margin-bottom: 8px;"></div>
      <span style="display: inline-block; background: ${color}; color: #ffffff; padding: 4px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 1px; margin-bottom: 20px;">${label.toUpperCase()}</span>

      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 16px 0;">
        Hola <strong style="color: #0f172a;">${name}</strong>,
      </p>
      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
        Fuiste mencionado en un articulo de <strong>${article.source}</strong>:
      </p>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 0 0 20px 0;">
        <p style="margin: 0 0 12px 0; font-size: 18px; font-weight: 700; color: #0f172a; line-height: 1.4;">${article.title}</p>
        <p style="margin: 0 0 12px 0; color: #64748b; font-size: 13px;">${article.source} &nbsp;&#x2022;&nbsp; ${article.publishedDate}</p>
        <div style="background: #fffbeb; border-left: 3px solid #f59e0b; padding: 12px 16px; border-radius: 0 8px 8px 0;">
          <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.6; font-style: italic;">"...${article.context.length > 300 ? article.context.substring(0, 300) + '...' : article.context}..."</p>
        </div>
      </div>

      ${article.matchedTerms.length > 0 ? `
      <p style="color: #64748b; font-size: 13px; margin: 0 0 20px 0;">
        Terminos encontrados: ${article.matchedTerms.map(t => `<strong style="color: #0f172a;">${t}</strong>`).join(', ')}
      </p>
      ` : ''}

      ${emailButton('Leer articulo completo', article.url)}
    `, '&#x1F4F0;');

    return await sendEmail(email, `Mencion en ${article.source}: ${article.title.substring(0, 50)}... | ${APP_NAME}`, html);
  } catch (error) {
    console.error('EMAIL SERVICE EXCEPTION [news-mention]:', error);
    return false;
  }
}

// ============================================================
// CATEGORIA B: ALERTAS CON IA
// ============================================================

// B1. Reporte de sentimiento semanal con IA
export async function sendAISentimentReportEmail(
  email: string,
  name: string,
  data: {
    period: string;
    totalMentions: number;
    positive: number;
    negative: number;
    neutral: number;
    sentimentScore: number;
    previousScore: number;
    topKeywords: string[];
    aiInsight: string;
  }
): Promise<boolean> {
  try {
    const scoreDiff = data.sentimentScore - data.previousScore;
    const trendColor = scoreDiff >= 0 ? '#16a34a' : '#dc2626';
    const trendArrow = scoreDiff >= 0 ? '&#x2191;' : '&#x2193;';
    const total = data.positive + data.negative + data.neutral || 1;
    const posPercent = Math.round((data.positive / total) * 100);
    const negPercent = Math.round((data.negative / total) * 100);
    const neuPercent = 100 - posPercent - negPercent;

    const html = baseTemplate(`
      <h2 style="margin: 0 0 8px 0; color: #0f172a; font-size: 22px; font-weight: 700;">Reporte semanal de sentimiento</h2>
      <div style="width: 48px; height: 4px; background: ${BRAND_GRADIENT}; border-radius: 2px; margin-bottom: 8px;"></div>
      <p style="margin: 0 0 24px 0; color: #64748b; font-size: 13px;">${data.period}</p>

      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
        Hola <strong style="color: #0f172a;">${name}</strong>, aqui esta tu resumen semanal:
      </p>

      <!-- Score card -->
      <div style="text-align: center; padding: 24px; background: linear-gradient(135deg, #f0f7ff, #f8fafc); border-radius: 16px; margin: 0 0 24px 0; border: 1px solid #e2e8f0;">
        <p style="margin: 0; font-size: 48px; font-weight: 700; color: ${BRAND_COLOR};">${data.sentimentScore}</p>
        <p style="margin: 4px 0 0 0; color: #64748b; font-size: 13px;">Puntuacion de sentimiento</p>
        <p style="margin: 4px 0 0 0; color: ${trendColor}; font-size: 14px; font-weight: 600;">${trendArrow} ${scoreDiff >= 0 ? '+' : ''}${scoreDiff.toFixed(1)} vs semana anterior</p>
      </div>

      <!-- Mention stats -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 20px 0;">
        <tr>
          <td width="25%" style="text-align: center; padding: 16px 4px;">
            <p style="margin: 0; font-size: 24px; font-weight: 700; color: #0f172a;">${data.totalMentions}</p>
            <p style="margin: 4px 0 0 0; color: #64748b; font-size: 11px;">Total</p>
          </td>
          <td width="25%" style="text-align: center; padding: 16px 4px;">
            <p style="margin: 0; font-size: 24px; font-weight: 700; color: #16a34a;">${data.positive}</p>
            <p style="margin: 4px 0 0 0; color: #64748b; font-size: 11px;">Positivas</p>
          </td>
          <td width="25%" style="text-align: center; padding: 16px 4px;">
            <p style="margin: 0; font-size: 24px; font-weight: 700; color: #dc2626;">${data.negative}</p>
            <p style="margin: 4px 0 0 0; color: #64748b; font-size: 11px;">Negativas</p>
          </td>
          <td width="25%" style="text-align: center; padding: 16px 4px;">
            <p style="margin: 0; font-size: 24px; font-weight: 700; color: #f59e0b;">${data.neutral}</p>
            <p style="margin: 4px 0 0 0; color: #64748b; font-size: 11px;">Neutrales</p>
          </td>
        </tr>
      </table>

      <!-- Sentiment bar -->
      <div style="height: 12px; background: #f1f5f9; border-radius: 6px; overflow: hidden; margin: 0 0 24px 0;">
        <div style="height: 100%; display: flex;">
          <div style="width: ${posPercent}%; background: #16a34a;"></div>
          <div style="width: ${neuPercent}%; background: #f59e0b;"></div>
          <div style="width: ${negPercent}%; background: #dc2626;"></div>
        </div>
      </div>

      ${data.topKeywords.length > 0 ? `
      <p style="color: #64748b; font-size: 13px; margin: 0 0 16px 0;">
        Palabras clave principales: ${data.topKeywords.slice(0, 8).map(k => `<span style="display: inline-block; background: #f0f7ff; color: ${BRAND_COLOR}; padding: 2px 10px; border-radius: 12px; font-size: 12px; margin: 2px;">${k}</span>`).join(' ')}
      </p>
      ` : ''}

      ${data.aiInsight ? `
      <div style="background: linear-gradient(135deg, #f0f7ff, #ede9fe); border: 1px solid #c7d2fe; border-radius: 12px; padding: 20px 24px; margin: 0 0 24px 0;">
        <p style="margin: 0 0 8px 0; color: ${BRAND_COLOR}; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">&#x1F916; Analisis de Julia IA</p>
        <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.7;">${data.aiInsight}</p>
      </div>
      ` : ''}

      ${emailButton('Ver reporte completo', `${getAppUrl()}/dashboard/monitoreo`)}
    `, '&#x1F4CA;');

    return await sendEmail(email, `Reporte semanal: Sentimiento ${data.sentimentScore}/100 | ${APP_NAME}`, html);
  } catch (error) {
    console.error('EMAIL SERVICE EXCEPTION [ai-sentiment-report]:', error);
    return false;
  }
}

// B2. Alerta de crisis detectada por IA
export async function sendAICrisisDetectionEmail(
  email: string,
  name: string,
  data: {
    severity: 'high' | 'critical';
    triggerMentions: Array<{ content: string; source: string; author: string }>;
    criticalKeywords: string[];
    sentimentScore: number;
    aiRecommendation: string;
  }
): Promise<boolean> {
  try {
    const isCritical = data.severity === 'critical';
    const color = isCritical ? '#dc2626' : '#f59e0b';
    const label = isCritical ? 'CRISIS CRITICA' : 'CRISIS ALTA';

    const mentionsHtml = data.triggerMentions.slice(0, 3).map(m => `
      <div style="padding: 12px 0; border-bottom: 1px solid #fecaca;">
        <p style="margin: 0 0 4px 0; color: #0f172a; font-size: 13px; line-height: 1.5;">"${m.content.length > 120 ? m.content.substring(0, 120) + '...' : m.content}"</p>
        <p style="margin: 0; color: #94a3b8; font-size: 11px;">@${m.author} en ${m.source}</p>
      </div>
    `).join('');

    const html = baseTemplate(`
      <h2 style="margin: 0 0 8px 0; color: #0f172a; font-size: 22px; font-weight: 700;">Crisis de reputacion detectada</h2>
      <div style="width: 48px; height: 4px; background: ${color}; border-radius: 2px; margin-bottom: 8px;"></div>
      <span style="display: inline-block; background: ${color}; color: #ffffff; padding: 4px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 1px; margin-bottom: 20px;">${label}</span>

      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 16px 0;">
        Hola <strong style="color: #0f172a;">${name}</strong>,
      </p>
      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
        Nuestro sistema ha detectado una situacion de crisis que requiere atencion inmediata.
      </p>

      ${infoBox(`
        <p style="margin: 0 0 4px 0; color: #64748b; font-size: 13px;">Puntuacion de sentimiento actual:</p>
        <p style="margin: 0; font-size: 28px; font-weight: 700; color: ${color};">${data.sentimentScore}/100</p>
      `)}

      ${data.criticalKeywords.length > 0 ? `
      <p style="color: #64748b; font-size: 13px; margin: 16px 0 8px 0;">Terminos criticos detectados:</p>
      <p style="margin: 0 0 16px 0;">${data.criticalKeywords.map(k => `<span style="display: inline-block; background: #fef2f2; color: #dc2626; padding: 2px 10px; border-radius: 12px; font-size: 12px; margin: 2px; border: 1px solid #fecaca;">${k}</span>`).join(' ')}</p>
      ` : ''}

      ${mentionsHtml ? `
      <p style="color: #0f172a; font-size: 14px; font-weight: 600; margin: 16px 0 8px 0;">Menciones que activaron la alerta:</p>
      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 4px 16px; margin: 0 0 20px 0;">
        ${mentionsHtml}
      </div>
      ` : ''}

      ${data.aiRecommendation ? `
      <div style="background: linear-gradient(135deg, #f0f7ff, #ede9fe); border: 1px solid #c7d2fe; border-radius: 12px; padding: 20px 24px; margin: 0 0 24px 0;">
        <p style="margin: 0 0 8px 0; color: ${BRAND_COLOR}; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">&#x1F916; Recomendacion de Julia IA</p>
        <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.7;">${data.aiRecommendation}</p>
      </div>
      ` : ''}

      ${emailButton('Gestionar crisis ahora', `${getAppUrl()}/dashboard/monitoreo`, color)}
    `, '&#x1F6A8;');

    return await sendEmail(email, `${label}: Accion requerida | ${APP_NAME}`, html);
  } catch (error) {
    console.error('EMAIL SERVICE EXCEPTION [ai-crisis-detection]:', error);
    return false;
  }
}

// B3. Insight de contenido con IA
export async function sendAIContentInsightEmail(
  email: string,
  name: string,
  data: {
    topPosts: Array<{ content: string; platform: string; likes: number; shares: number; comments: number }>;
    aiInsight: string;
    bestDay?: string;
    bestTime?: string;
    period: string;
  }
): Promise<boolean> {
  try {
    const postsHtml = data.topPosts.slice(0, 3).map((p, i) => `
      <tr>
        <td style="padding: 14px 16px; border-bottom: 1px solid #f1f5f9;">
          <p style="margin: 0 0 6px 0; color: #0f172a; font-size: 14px; font-weight: 600;">#${i + 1} en ${p.platform}</p>
          <p style="margin: 0 0 8px 0; color: #475569; font-size: 13px; line-height: 1.5;">"${p.content.length > 100 ? p.content.substring(0, 100) + '...' : p.content}"</p>
          <p style="margin: 0; color: #94a3b8; font-size: 12px;">&#x2764; ${p.likes} &nbsp; &#x1F501; ${p.shares} &nbsp; &#x1F4AC; ${p.comments}</p>
        </td>
      </tr>
    `).join('');

    const html = baseTemplate(`
      <h2 style="margin: 0 0 8px 0; color: #0f172a; font-size: 22px; font-weight: 700;">Insights de contenido</h2>
      <div style="width: 48px; height: 4px; background: ${BRAND_GRADIENT}; border-radius: 2px; margin-bottom: 8px;"></div>
      <p style="margin: 0 0 24px 0; color: #64748b; font-size: 13px;">${data.period}</p>

      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
        Hola <strong style="color: #0f172a;">${name}</strong>, estos son tus contenidos con mejor rendimiento:
      </p>

      ${postsHtml ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin: 0 0 24px 0;">
        <tr style="background: #f8fafc;">
          <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0;"><p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Top publicaciones</p></td>
        </tr>
        ${postsHtml}
      </table>
      ` : ''}

      ${data.bestDay || data.bestTime ? `
      ${infoBox(`
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${data.bestDay ? `<tr><td style="padding: 4px 0;"><span style="color: #64748b; font-size: 14px;">Mejor dia para publicar</span></td><td style="text-align: right;"><strong style="color: #0f172a;">${data.bestDay}</strong></td></tr>` : ''}
          ${data.bestTime ? `<tr><td style="padding: 4px 0;"><span style="color: #64748b; font-size: 14px;">Mejor hora</span></td><td style="text-align: right;"><strong style="color: #0f172a;">${data.bestTime}</strong></td></tr>` : ''}
        </table>
      `, '#f0fdf4', '#bbf7d0')}
      ` : ''}

      ${data.aiInsight ? `
      <div style="background: linear-gradient(135deg, #f0f7ff, #ede9fe); border: 1px solid #c7d2fe; border-radius: 12px; padding: 20px 24px; margin: 0 0 24px 0;">
        <p style="margin: 0 0 8px 0; color: ${BRAND_COLOR}; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">&#x1F916; Analisis de Julia IA</p>
        <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.7;">${data.aiInsight}</p>
      </div>
      ` : ''}

      ${emailButton('Ver analytics completo', `${getAppUrl()}/dashboard/social-listening`)}
    `, '&#x1F4A1;');

    return await sendEmail(email, `Insights de contenido - ${data.period} | ${APP_NAME}`, html);
  } catch (error) {
    console.error('EMAIL SERVICE EXCEPTION [ai-content-insight]:', error);
    return false;
  }
}

// B4. Alerta de competencia (enterprise)
export async function sendAICompetitorAlertEmail(
  email: string,
  name: string,
  data: {
    competitorName: string;
    articles: Array<{ title: string; source: string; url: string; sentiment: string }>;
    aiAnalysis: string;
  }
): Promise<boolean> {
  try {
    const articlesHtml = data.articles.slice(0, 3).map(a => {
      const sColor = a.sentiment === 'positive' ? '#16a34a' : a.sentiment === 'negative' ? '#dc2626' : '#f59e0b';
      return `
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9;">
          <p style="margin: 0 0 4px 0; color: #0f172a; font-size: 14px; font-weight: 500;">${a.title}</p>
          <p style="margin: 0; color: #94a3b8; font-size: 12px;">${a.source} &nbsp; <span style="color: ${sColor};">&#x25CF; ${a.sentiment}</span></p>
        </td>
      </tr>`;
    }).join('');

    const html = baseTemplate(`
      <h2 style="margin: 0 0 8px 0; color: #0f172a; font-size: 22px; font-weight: 700;">Alerta de competencia</h2>
      <div style="width: 48px; height: 4px; background: #8b5cf6; border-radius: 2px; margin-bottom: 8px;"></div>
      <span style="display: inline-block; background: #8b5cf6; color: #ffffff; padding: 4px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 1px; margin-bottom: 20px;">ENTERPRISE</span>

      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 16px 0;">
        Hola <strong style="color: #0f172a;">${name}</strong>,
      </p>
      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
        Se detecto cobertura mediatica de tu competidor <strong>${data.competitorName}</strong>:
      </p>

      ${articlesHtml ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin: 0 0 24px 0;">
        ${articlesHtml}
      </table>
      ` : ''}

      ${data.aiAnalysis ? `
      <div style="background: linear-gradient(135deg, #f0f7ff, #ede9fe); border: 1px solid #c7d2fe; border-radius: 12px; padding: 20px 24px; margin: 0 0 24px 0;">
        <p style="margin: 0 0 8px 0; color: ${BRAND_COLOR}; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">&#x1F916; Analisis competitivo de Julia IA</p>
        <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.7;">${data.aiAnalysis}</p>
      </div>
      ` : ''}

      ${emailButton('Ver analisis completo', `${getAppUrl()}/dashboard/monitoreo`, '#8b5cf6')}
    `, '&#x1F3AF;');

    return await sendEmail(email, `Actividad de competencia: ${data.competitorName} | ${APP_NAME}`, html);
  } catch (error) {
    console.error('EMAIL SERVICE EXCEPTION [ai-competitor-alert]:', error);
    return false;
  }
}

// ============================================================
// CATEGORIA C: EMAILS PERSONALIZADOS
// ============================================================

// C1. Resumen semanal de reputacion
export async function sendWeeklyDigestEmail(
  email: string,
  name: string,
  data: {
    period: string;
    sentimentScore: number;
    totalMentions: number;
    positiveMentions: number;
    negativeMentions: number;
    topMentions: Array<{ content: string; source: string; sentiment: string }>;
    platforms: Array<{ name: string; followers: number; change: number }>;
    newsCount: number;
  }
): Promise<boolean> {
  try {
    const mentionsHtml = data.topMentions.slice(0, 3).map(m => {
      const color = m.sentiment === 'positive' ? '#16a34a' : m.sentiment === 'negative' ? '#dc2626' : '#f59e0b';
      return `<div style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">
        <p style="margin: 0 0 4px 0; color: #0f172a; font-size: 13px; line-height: 1.5;">"${m.content.length > 100 ? m.content.substring(0, 100) + '...' : m.content}"</p>
        <p style="margin: 0; font-size: 11px;"><span style="color: ${color};">&#x25CF;</span> <span style="color: #94a3b8;">${m.source}</span></p>
      </div>`;
    }).join('');

    const platformsHtml = data.platforms.map(p => `
      <tr>
        <td style="padding: 6px 0;"><span style="color: #475569; font-size: 14px;">${p.name}</span></td>
        <td style="text-align: right;"><strong style="color: #0f172a;">${p.followers.toLocaleString('es-CO')}</strong></td>
        <td style="text-align: right;"><span style="color: ${p.change >= 0 ? '#16a34a' : '#dc2626'}; font-size: 13px;">${p.change >= 0 ? '+' : ''}${p.change.toLocaleString('es-CO')}</span></td>
      </tr>
    `).join('');

    const html = baseTemplate(`
      <h2 style="margin: 0 0 8px 0; color: #0f172a; font-size: 22px; font-weight: 700;">Tu resumen semanal</h2>
      <div style="width: 48px; height: 4px; background: ${BRAND_GRADIENT}; border-radius: 2px; margin-bottom: 8px;"></div>
      <p style="margin: 0 0 24px 0; color: #64748b; font-size: 13px;">${data.period}</p>

      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
        Hola <strong style="color: #0f172a;">${name}</strong>, aqui esta tu resumen de la semana:
      </p>

      <!-- Key metrics -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 24px 0;">
        <tr>
          <td width="33%" style="text-align: center; padding: 20px 8px; background: #f0f7ff; border-radius: 12px;">
            <p style="margin: 0; font-size: 28px; font-weight: 700; color: ${BRAND_COLOR};">${data.sentimentScore}</p>
            <p style="margin: 4px 0 0 0; color: #64748b; font-size: 11px;">Sentimiento</p>
          </td>
          <td width="33%" style="text-align: center; padding: 20px 8px; background: #f8fafc; border-radius: 12px;">
            <p style="margin: 0; font-size: 28px; font-weight: 700; color: #0f172a;">${data.totalMentions}</p>
            <p style="margin: 4px 0 0 0; color: #64748b; font-size: 11px;">Menciones</p>
          </td>
          <td width="33%" style="text-align: center; padding: 20px 8px; background: #f8fafc; border-radius: 12px;">
            <p style="margin: 0; font-size: 28px; font-weight: 700; color: #0f172a;">${data.newsCount}</p>
            <p style="margin: 4px 0 0 0; color: #64748b; font-size: 11px;">En medios</p>
          </td>
        </tr>
      </table>

      ${mentionsHtml ? `
      <p style="color: #0f172a; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">Menciones destacadas</p>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 4px 16px; margin: 0 0 24px 0;">
        ${mentionsHtml}
      </div>
      ` : ''}

      ${platformsHtml ? `
      <p style="color: #0f172a; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">Seguidores por plataforma</p>
      ${infoBox(`
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="color: #94a3b8; font-size: 12px; padding: 0 0 8px 0;">Plataforma</td><td style="text-align: right; color: #94a3b8; font-size: 12px;">Seguidores</td><td style="text-align: right; color: #94a3b8; font-size: 12px;">Cambio</td></tr>
          ${platformsHtml}
        </table>
      `)}
      ` : ''}

      ${emailButton('Ver dashboard completo', `${getAppUrl()}/dashboard`)}
    `, '&#x1F4CA;');

    return await sendEmail(email, `Resumen semanal: ${data.totalMentions} menciones | ${APP_NAME}`, html);
  } catch (error) {
    console.error('EMAIL SERVICE EXCEPTION [weekly-digest]:', error);
    return false;
  }
}

// C2. Reporte mensual detallado
export async function sendMonthlyReportEmail(
  email: string,
  name: string,
  data: {
    month: string;
    currentMonth: { mentions: number; sentiment: number; reach: number; engagement: number };
    previousMonth: { mentions: number; sentiment: number; reach: number; engagement: number };
    topPlatform: string;
    topPlatformGrowth: number;
    newsArticles: number;
    creditsUsed: number;
    creditsRemaining: number;
  }
): Promise<boolean> {
  try {
    const diff = (curr: number, prev: number) => {
      const d = curr - prev;
      const color = d >= 0 ? '#16a34a' : '#dc2626';
      return `<span style="color: ${color};">${d >= 0 ? '+' : ''}${d}</span>`;
    };

    const html = baseTemplate(`
      <h2 style="margin: 0 0 8px 0; color: #0f172a; font-size: 22px; font-weight: 700;">Reporte mensual</h2>
      <div style="width: 48px; height: 4px; background: ${BRAND_GRADIENT}; border-radius: 2px; margin-bottom: 8px;"></div>
      <p style="margin: 0 0 24px 0; color: #64748b; font-size: 13px;">${data.month}</p>

      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
        Hola <strong style="color: #0f172a;">${name}</strong>, aqui esta tu reporte mensual detallado:
      </p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin: 0 0 24px 0;">
        <tr style="background: #f8fafc;">
          <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 600;">Metrica</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 600;">Este mes</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 600;">Anterior</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 600;">Cambio</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; color: #475569;">Menciones</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600; color: #0f172a;">${data.currentMonth.mentions}</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; text-align: right; color: #64748b;">${data.previousMonth.mentions}</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600;">${diff(data.currentMonth.mentions, data.previousMonth.mentions)}</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; color: #475569;">Sentimiento</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600; color: #0f172a;">${data.currentMonth.sentiment}/100</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; text-align: right; color: #64748b;">${data.previousMonth.sentiment}/100</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600;">${diff(data.currentMonth.sentiment, data.previousMonth.sentiment)}</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; color: #475569;">Alcance</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600; color: #0f172a;">${data.currentMonth.reach.toLocaleString('es-CO')}</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; text-align: right; color: #64748b;">${data.previousMonth.reach.toLocaleString('es-CO')}</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600;">${diff(data.currentMonth.reach, data.previousMonth.reach)}</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; color: #475569;">Engagement</td>
          <td style="padding: 12px 16px; text-align: right; font-weight: 600; color: #0f172a;">${data.currentMonth.engagement}%</td>
          <td style="padding: 12px 16px; text-align: right; color: #64748b;">${data.previousMonth.engagement}%</td>
          <td style="padding: 12px 16px; text-align: right; font-weight: 600;">${diff(data.currentMonth.engagement, data.previousMonth.engagement)}</td>
        </tr>
      </table>

      ${infoBox(`
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding: 4px 0;"><span style="color: #64748b;">Plataforma destacada</span></td><td style="text-align: right;"><strong style="color: #0f172a;">${data.topPlatform} (+${data.topPlatformGrowth}%)</strong></td></tr>
          <tr><td style="padding: 4px 0;"><span style="color: #64748b;">Articulos en medios</span></td><td style="text-align: right;"><strong style="color: #0f172a;">${data.newsArticles}</strong></td></tr>
          <tr><td style="padding: 4px 0;"><span style="color: #64748b;">Creditos usados</span></td><td style="text-align: right;"><strong style="color: #0f172a;">${data.creditsUsed}</strong></td></tr>
          <tr><td style="padding: 4px 0;"><span style="color: #64748b;">Creditos restantes</span></td><td style="text-align: right;"><strong style="color: ${data.creditsRemaining < 100 ? '#dc2626' : '#0f172a'};">${data.creditsRemaining}</strong></td></tr>
        </table>
      `)}

      ${emailButton('Ver reporte completo', `${getAppUrl()}/dashboard`)}
    `, '&#x1F4C5;');

    return await sendEmail(email, `Reporte mensual: ${data.month} | ${APP_NAME}`, html);
  } catch (error) {
    console.error('EMAIL SERVICE EXCEPTION [monthly-report]:', error);
    return false;
  }
}

// C3. Creditos bajos
export async function sendLowCreditsWarningEmail(
  email: string,
  name: string,
  data: { credits: number; plan: string; estimatedDaysLeft?: number }
): Promise<boolean> {
  try {
    const html = baseTemplate(`
      <h2 style="margin: 0 0 8px 0; color: #0f172a; font-size: 22px; font-weight: 700;">Creditos bajos</h2>
      <div style="width: 48px; height: 4px; background: #f59e0b; border-radius: 2px; margin-bottom: 24px;"></div>

      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0;">
        Hola <strong style="color: #0f172a;">${name}</strong>,
      </p>
      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
        Tu saldo de creditos en ${APP_NAME} esta bajo. Te recomendamos recargar para continuar usando todos los servicios.
      </p>

      <div style="text-align: center; padding: 24px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 16px; margin: 0 0 24px 0;">
        <p style="margin: 0; font-size: 48px; font-weight: 700; color: #f59e0b;">${data.credits}</p>
        <p style="margin: 4px 0 0 0; color: #92400e; font-size: 14px;">creditos restantes</p>
        ${data.estimatedDaysLeft ? `<p style="margin: 8px 0 0 0; color: #64748b; font-size: 13px;">Estimado: ~${data.estimatedDaysLeft} dias de uso</p>` : ''}
      </div>

      ${infoBox(`
        <p style="margin: 0; color: #475569; font-size: 14px;">
          Tu plan actual: <strong style="color: #0f172a; text-transform: capitalize;">${data.plan}</strong>. Puedes comprar mas creditos o mejorar tu plan para obtener un mayor limite.
        </p>
      `)}

      ${emailButton('Comprar creditos', `${getAppUrl()}/dashboard/creditos/comprar`, '#f59e0b')}
    `, '&#x26A0;');

    return await sendEmail(email, `Creditos bajos: ${data.credits} restantes | ${APP_NAME}`, html);
  } catch (error) {
    console.error('EMAIL SERVICE EXCEPTION [low-credits]:', error);
    return false;
  }
}

// C4. Recordatorio de inactividad
export async function sendInactiveUserReminderEmail(
  email: string,
  name: string,
  data: { daysSinceLogin: number; pendingMentions: number; pendingAlerts: number }
): Promise<boolean> {
  try {
    const html = baseTemplate(`
      <h2 style="margin: 0 0 8px 0; color: #0f172a; font-size: 22px; font-weight: 700;">Te extrañamos</h2>
      <div style="width: 48px; height: 4px; background: ${BRAND_GRADIENT}; border-radius: 2px; margin-bottom: 24px;"></div>

      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0;">
        Hola <strong style="color: #0f172a;">${name}</strong>,
      </p>
      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
        Han pasado <strong>${data.daysSinceLogin} dias</strong> desde tu ultima visita. Mientras tanto, tu reputacion online sigue siendo monitoreada:
      </p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 24px 0;">
        <tr>
          <td width="50%" style="text-align: center; padding: 20px 12px; background: #f0f7ff; border-radius: 12px;">
            <p style="margin: 0; font-size: 32px; font-weight: 700; color: ${BRAND_COLOR};">${data.pendingMentions}</p>
            <p style="margin: 4px 0 0 0; color: #64748b; font-size: 12px;">Menciones sin revisar</p>
          </td>
          <td width="50%" style="text-align: center; padding: 20px 12px; background: ${data.pendingAlerts > 0 ? '#fef2f2' : '#f8fafc'}; border-radius: 12px;">
            <p style="margin: 0; font-size: 32px; font-weight: 700; color: ${data.pendingAlerts > 0 ? '#dc2626' : '#64748b'};">${data.pendingAlerts}</p>
            <p style="margin: 4px 0 0 0; color: #64748b; font-size: 12px;">Alertas pendientes</p>
          </td>
        </tr>
      </table>

      ${emailButton('Volver al dashboard', `${getAppUrl()}/dashboard`)}
    `, '&#x1F44B;');

    return await sendEmail(email, `${data.pendingMentions} menciones sin revisar | ${APP_NAME}`, html);
  } catch (error) {
    console.error('EMAIL SERVICE EXCEPTION [inactive-user]:', error);
    return false;
  }
}

// C5. Onboarding incompleto
export async function sendOnboardingIncompleteEmail(
  email: string,
  name: string,
  data: { connectedPlatforms: number; totalPlatforms: number; hasKeywords: boolean }
): Promise<boolean> {
  try {
    const check = '&#x2705;';
    const pending = '&#x2B1C;';

    const html = baseTemplate(`
      <h2 style="margin: 0 0 8px 0; color: #0f172a; font-size: 22px; font-weight: 700;">Completa tu configuracion</h2>
      <div style="width: 48px; height: 4px; background: ${BRAND_GRADIENT}; border-radius: 2px; margin-bottom: 24px;"></div>

      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0;">
        Hola <strong style="color: #0f172a;">${name}</strong>,
      </p>
      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
        Tu cuenta en ${APP_NAME} esta casi lista. Completa estos pasos para aprovechar al maximo la plataforma:
      </p>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px 24px; margin: 0 0 24px 0;">
        <p style="margin: 0 0 14px 0; color: #0f172a; font-size: 15px; line-height: 2;">
          ${check} Crear tu cuenta<br>
          ${data.connectedPlatforms > 0 ? check : pending} Conectar redes sociales (${data.connectedPlatforms}/${data.totalPlatforms})<br>
          ${data.hasKeywords ? check : pending} Configurar palabras clave de monitoreo<br>
          ${data.connectedPlatforms >= 2 && data.hasKeywords ? check : pending} Activar monitoreo automatico
        </p>
      </div>

      ${data.connectedPlatforms === 0 ? `
      ${infoBox(`
        <p style="margin: 0; color: #475569; font-size: 14px;">
          Conecta al menos una red social para empezar a recibir datos reales de tu reputacion digital.
        </p>
      `, '#fffbeb', '#fde68a')}
      ` : ''}

      ${emailButton('Completar configuracion', `${getAppUrl()}/onboarding`)}
    `, '&#x1F680;');

    return await sendEmail(email, `Completa tu configuracion en ${APP_NAME}`, html);
  } catch (error) {
    console.error('EMAIL SERVICE EXCEPTION [onboarding-incomplete]:', error);
    return false;
  }
}

// C6. Acercandose al limite del plan
export async function sendPlanLimitWarningEmail(
  email: string,
  name: string,
  data: {
    plan: string;
    resource: string;
    currentUsage: number;
    limit: number;
    usagePercent: number;
    suggestedPlan: string;
  }
): Promise<boolean> {
  try {
    const barColor = data.usagePercent >= 90 ? '#dc2626' : data.usagePercent >= 80 ? '#f59e0b' : BRAND_LIGHT;

    const html = baseTemplate(`
      <h2 style="margin: 0 0 8px 0; color: #0f172a; font-size: 22px; font-weight: 700;">Limite del plan proximo</h2>
      <div style="width: 48px; height: 4px; background: ${barColor}; border-radius: 2px; margin-bottom: 24px;"></div>

      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0;">
        Hola <strong style="color: #0f172a;">${name}</strong>,
      </p>
      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
        Estas usando el <strong>${data.usagePercent}%</strong> de tu limite de <strong>${data.resource}</strong> en tu plan <strong style="text-transform: capitalize;">${data.plan}</strong>:
      </p>

      <!-- Progress bar -->
      <div style="margin: 0 0 8px 0;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
          <span style="color: #64748b; font-size: 13px;">${data.currentUsage} de ${data.limit}</span>
          <span style="color: ${barColor}; font-size: 13px; font-weight: 600;">${data.usagePercent}%</span>
        </div>
        <div style="height: 12px; background: #f1f5f9; border-radius: 6px; overflow: hidden;">
          <div style="height: 100%; width: ${data.usagePercent}%; background: ${barColor}; border-radius: 6px;"></div>
        </div>
      </div>

      ${infoBox(`
        <p style="margin: 0; color: #475569; font-size: 14px;">
          Mejora al plan <strong style="color: #0f172a; text-transform: capitalize;">${data.suggestedPlan}</strong> para obtener limites mas altos y funciones avanzadas.
        </p>
      `, '#f0f7ff', '#bfdbfe')}

      ${emailButton('Mejorar mi plan', `${getAppUrl()}/dashboard/plan`, barColor)}
    `, '&#x1F4CA;');

    return await sendEmail(email, `${data.usagePercent}% del limite de ${data.resource} | ${APP_NAME}`, html);
  } catch (error) {
    console.error('EMAIL SERVICE EXCEPTION [plan-limit-warning]:', error);
    return false;
  }
}
