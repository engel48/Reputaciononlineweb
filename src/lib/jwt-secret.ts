/**
 * Devuelve el JWT_SECRET del entorno. Lanza si no está configurado.
 *
 * Es LAZY a propósito (se evalúa al USARSE, no al importar el módulo): Next.js
 * importa los módulos de ruta durante el build ("collecting page data") sin las
 * variables de entorno de runtime, así que un throw a nivel de módulo rompería
 * el build. Acá el throw solo ocurre cuando realmente se firma/verifica un token.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('FATAL: JWT_SECRET no está configurado en el entorno');
  }
  return secret;
}
