import { describe, it, expect } from 'vitest';
import { isSetupError, syncFailureResponse } from '@/lib/social-sync/sync-response';

describe('isSetupError', () => {
  it('detecta fallas de configuración/permisos como benignas', () => {
    expect(isSetupError('No se encontraron páginas de Facebook')).toBe(true);
    expect(isSetupError('Facebook /me/accounts error: 400')).toBe(true);
    expect(isSetupError('insufficient permission')).toBe(true);
    expect(isSetupError('No hay cuenta de Instagram Business vinculada')).toBe(true);
  });

  it('trata errores genéricos como reales', () => {
    expect(isSetupError('TypeError: undefined is not a function')).toBe(false);
    expect(isSetupError('ECONNRESET')).toBe(false);
    expect(isSetupError(undefined)).toBe(false);
  });
});

describe('syncFailureResponse', () => {
  it('falla de setup → 200 con needsSetup', async () => {
    const res = syncFailureResponse('No se encontraron páginas de Facebook');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.needsSetup).toBe(true);
    expect(body.message).toContain('App Review');
  });

  it('error real → 500', async () => {
    const res = syncFailureResponse('TypeError inesperado');
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.needsSetup).toBeUndefined();
  });
});
