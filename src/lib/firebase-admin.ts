/**
 * Firebase Admin — envío de notificaciones push (FCM) server-side.
 *
 * Inicialización lazy (no se ejecuta en build): la credencial se lee de variables
 * de entorno. Acepta dos formatos:
 *   1) FIREBASE_SERVICE_ACCOUNT = JSON completo de la service account (string).
 *   2) FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY.
 *
 * Si no hay credencial configurada, `isPushConfigured()` devuelve false y los
 * endpoints responden 503 con un mensaje claro (sin romper el build ni el runtime).
 */
import type { App } from 'firebase-admin/app';

let cachedApp: App | null = null;

interface ServiceAccountCreds {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

function readCreds(): ServiceAccountCreds | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (raw) {
    try {
      const json = JSON.parse(raw);
      const projectId = json.project_id || json.projectId;
      const clientEmail = json.client_email || json.clientEmail;
      const privateKey = (json.private_key || json.privateKey || '').replace(/\\n/g, '\n');
      if (projectId && clientEmail && privateKey) {
        return { projectId, clientEmail, privateKey };
      }
    } catch (e) {
      console.error('[firebase-admin] FIREBASE_SERVICE_ACCOUNT no es JSON válido:', e);
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (projectId && clientEmail && privateKey) {
    return { projectId, clientEmail, privateKey };
  }
  return null;
}

export function isPushConfigured(): boolean {
  return readCreds() !== null;
}

async function getApp(): Promise<App | null> {
  if (cachedApp) return cachedApp;
  const creds = readCreds();
  if (!creds) return null;

  const { getApps, initializeApp, cert } = await import('firebase-admin/app');
  const existing = getApps();
  cachedApp = existing.length
    ? existing[0]
    : initializeApp({
        credential: cert({
          projectId: creds.projectId,
          clientEmail: creds.clientEmail,
          privateKey: creds.privateKey,
        }),
      });
  return cachedApp;
}

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface PushResult {
  sent: number;
  failed: number;
  invalidTokens: string[];
}

/**
 * Envía una notificación a una lista de tokens FCM (en lotes de 500, límite FCM).
 * Devuelve conteos y los tokens inválidos (para limpiarlos de la BD).
 */
export async function sendPushToTokens(
  tokens: string[],
  payload: PushPayload
): Promise<PushResult> {
  const app = await getApp();
  if (!app) {
    throw new Error('Push no configurado: falta la service account de Firebase.');
  }
  const unique = [...new Set(tokens.filter(Boolean))];
  if (unique.length === 0) {
    return { sent: 0, failed: 0, invalidTokens: [] };
  }

  const { getMessaging } = await import('firebase-admin/messaging');
  const messaging = getMessaging(app);

  let sent = 0;
  let failed = 0;
  const invalidTokens: string[] = [];

  for (let i = 0; i < unique.length; i += 500) {
    const batch = unique.slice(i, i + 500);
    const res = await messaging.sendEachForMulticast({
      tokens: batch,
      notification: { title: payload.title, body: payload.body },
      data: payload.data ?? {},
      android: { priority: 'high' },
      apns: { payload: { aps: { sound: 'default' } } },
    });
    sent += res.successCount;
    failed += res.failureCount;
    res.responses.forEach((r, idx) => {
      if (!r.success) {
        const code = r.error?.code || '';
        if (
          code.includes('registration-token-not-registered') ||
          code.includes('invalid-registration-token') ||
          code.includes('invalid-argument')
        ) {
          invalidTokens.push(batch[idx]);
        }
      }
    });
  }

  return { sent, failed, invalidTokens };
}
