'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function OAuthCallbackContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    const platform = success || searchParams.get('platform') || 'unknown';
    const description = searchParams.get('description') || searchParams.get('details') || '';

    // Enviar mensaje a la ventana principal
    if (window.opener) {
      if (success) {
        window.opener.postMessage({
          type: 'oauth_success',
          platform: success,
          message: `${success} conectado exitosamente`
        }, window.location.origin);
      } else if (error) {
        window.opener.postMessage({
          type: 'oauth_error',
          platform,
          error: error,
          description
        }, window.location.origin);
      }

      // Cerrar popup después de enviar mensaje
      setTimeout(() => {
        window.close();
      }, 1500);
    } else {
      // Si no hay ventana padre, redirigir al dashboard
      setTimeout(() => {
        if (success) {
          window.location.href = `/dashboard/redes-sociales?connected=${success}`;
        } else {
          window.location.href = `/dashboard/redes-sociales?error=${error || 'unknown'}`;
        }
      }, 1500);
    }
  }, [searchParams]);

  const success = searchParams.get('success');
  const error = searchParams.get('error');

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: success ? '#f0fdf4' : error ? '#fef2f2' : '#ffffff',
      padding: '20px'
    }}>
      {success ? (
        <>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: '#22c55e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px'
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
              <polyline points="20,6 9,17 4,12" />
            </svg>
          </div>
          <h2 style={{ color: '#166534', marginBottom: '10px' }}>
            Conexion exitosa
          </h2>
          <p style={{ color: '#15803d', textAlign: 'center' }}>
            {success.charAt(0).toUpperCase() + success.slice(1)} se ha conectado correctamente.
          </p>
          <p style={{ color: '#6b7280', marginTop: '20px', fontSize: '14px' }}>
            Cerrando ventana...
          </p>
        </>
      ) : error ? (
        <>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px'
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
          <h2 style={{ color: '#991b1b', marginBottom: '10px' }}>
            Error de conexion
          </h2>
          <p style={{ color: '#dc2626', textAlign: 'center' }}>
            {error === 'access_denied' ? 'Acceso denegado por el usuario' :
             error === 'invalid_state' ? 'Error de seguridad. Intenta de nuevo.' :
             error === 'token_exchange_failed' ? 'Error al obtener autorizacion.' :
             `Error: ${error}`}
          </p>
          <p style={{ color: '#6b7280', marginTop: '20px', fontSize: '14px' }}>
            Cerrando ventana...
          </p>
        </>
      ) : (
        <>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #3b82f6',
            borderTop: '3px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '20px'
          }} />
          <p style={{ color: '#6b7280' }}>Procesando...</p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </>
      )}
    </div>
  );
}

export default function OAuthCallback() {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh'
      }}>
        <p>Cargando...</p>
      </div>
    }>
      <OAuthCallbackContent />
    </Suspense>
  );
}
