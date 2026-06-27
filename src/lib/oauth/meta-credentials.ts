/**
 * Lee las credenciales de la app de Meta (Facebook/Instagram) aceptando los
 * distintos nombres de variable que conviven en el proyecto. Así funciona sin
 * importar cuál haya seteado el operador en el entorno (Coolify):
 *   App ID : NEXT_PUBLIC_FACEBOOK_APP_ID | FACEBOOK_APP_ID | FACEBOOK_CLIENT_ID
 *   Secret : FACEBOOK_APP_SECRET | FACEBOOK_CLIENT_SECRET
 *
 * Se leen en cada request (no a nivel de módulo) para reflejar el entorno de
 * runtime sin necesidad de recompilar.
 */
export function getFacebookAppId(): string {
  return (
    process.env.NEXT_PUBLIC_FACEBOOK_APP_ID ||
    process.env.FACEBOOK_APP_ID ||
    process.env.FACEBOOK_CLIENT_ID ||
    ''
  );
}

export function getFacebookAppSecret(): string {
  return process.env.FACEBOOK_APP_SECRET || process.env.FACEBOOK_CLIENT_SECRET || '';
}
