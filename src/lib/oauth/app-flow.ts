/**
 * Helpers para el flujo OAuth iniciado desde la app móvil (WebView).
 *
 * A diferencia del flujo web (popup + `window.opener.postMessage`), la app abre
 * el OAuth dentro de un WebView que NO tiene `window.opener`. Por eso las rutas
 * de inicio marcan el flujo como "app" dentro del parámetro `state` y los
 * callbacks, al detectarlo, terminan con un `NextResponse.redirect` a una URL
 * que el WebView detecta (`/oauth-app-success`) en vez de devolver HTML con
 * `postMessage`.
 */

export interface AppOAuthState {
  app: true;
  redirect: string;
  ts: number;
}

/** Ruta a la que la app espera ser redirigida al terminar el OAuth. */
export const APP_SUCCESS_PATH = '/oauth-app-success';

/** ¿El `redirect` recibido corresponde al flujo de la app? */
export function isAppRedirect(redirect: string | null | undefined): boolean {
  return !!redirect && redirect.startsWith(APP_SUCCESS_PATH);
}

/** Codifica el `state` para el flujo app (base64 JSON, igual formato que YouTube). */
export function encodeAppState(redirect: string): string {
  const payload: AppOAuthState = { app: true, redirect, ts: Date.now() };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

/**
 * Intenta interpretar el `state` como flujo app. Devuelve null si es el flujo
 * web (state aleatorio que no es base64-JSON, o sin `app:true`).
 */
export function parseAppState(state: string | null | undefined): AppOAuthState | null {
  if (!state) return null;
  try {
    const data = JSON.parse(Buffer.from(state, 'base64').toString());
    if (data && data.app === true) {
      const redirect = typeof data.redirect === 'string' ? data.redirect : APP_SUCCESS_PATH;
      return { app: true, redirect, ts: Number(data.ts) || 0 };
    }
  } catch {
    // state aleatorio del flujo web → no es flujo app
  }
  return null;
}

/** Construye la URL de retorno a la app (éxito o error). */
export function appResultUrl(
  baseUrl: string,
  redirect: string,
  params: Record<string, string>,
): string {
  const url = new URL(redirect.startsWith('http') ? redirect : `${baseUrl}${redirect}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return url.toString();
}
