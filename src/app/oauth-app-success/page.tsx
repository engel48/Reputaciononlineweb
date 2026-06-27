'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

/**
 * Página terminal del flujo OAuth iniciado desde la app móvil (WebView).
 *
 * El WebView de la app intercepta la navegación a esta ruta (`/oauth-app-success`)
 * y se cierra solo leyendo `?platform=` (éxito) o `?error=` (fallo); normalmente
 * el contenido ni se renderiza. Existe igual para no devolver 404 y como
 * fallback visible si se abriera en un navegador.
 */
function Content() {
  const params = useSearchParams();
  const error = params.get('error');
  const platform = params.get('platform');
  const okMsg = platform ? `${platform} conectada correctamente.` : 'Conexión completada.';

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0B1120',
        color: '#fff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '24px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: error ? 'rgba(239,68,68,0.15)' : 'rgba(0,229,255,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 32,
          marginBottom: 16,
        }}
      >
        {error ? '⚠️' : '✓'}
      </div>
      <h1 style={{ fontSize: 18, margin: '0 0 8px' }}>
        {error ? 'No se pudo conectar' : '¡Listo!'}
      </h1>
      <p style={{ color: '#94a3b8', fontSize: 14, margin: 0 }}>
        {error ? `Error: ${error}` : okMsg}
      </p>
      <p style={{ color: '#64748b', fontSize: 12, marginTop: 16 }}>
        Podés volver a la aplicación.
      </p>
    </div>
  );
}

export default function OAuthAppSuccessPage() {
  return (
    <Suspense fallback={null}>
      <Content />
    </Suspense>
  );
}
