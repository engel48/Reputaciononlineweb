import { NextResponse } from 'next/server';

/**
 * Una sincronización puede "fallar" por dos motivos muy distintos:
 *  - Configuración/permisos: no hay página/cuenta business vinculada, faltan
 *    scopes (App Review), token sin acceso a páginas, etc. → NO es un error del
 *    servidor; la cuenta igual quedó conectada. Devolvemos 200 con `needsSetup`
 *    y un mensaje claro para que la UI no muestre un 500 "roto".
 *  - Error real (excepción inesperada) → 500.
 */
const SETUP_PATTERN =
  /p[áa]gina|page|permiso|permission|scope|oauth|business|negocio|no se encontr|not found|insufficient|accounts|vinculad/i;

export function isSetupError(error: string | undefined | null): boolean {
  return !!error && SETUP_PATTERN.test(error);
}

export function syncFailureResponse(error: string | undefined | null, data?: unknown) {
  const err = error || 'No se pudo sincronizar';
  if (isSetupError(err)) {
    return NextResponse.json(
      {
        success: false,
        needsSetup: true,
        error: err,
        message:
          'La cuenta quedó conectada, pero para traer datos necesitás una página de Facebook (o cuenta de Instagram Business vinculada a una página) y la aprobación de permisos de Meta (App Review).',
        data,
      },
      { status: 200 },
    );
  }
  return NextResponse.json({ success: false, error: err, data }, { status: 500 });
}
