'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';

const platformConfig: Record<string, {
  name: string;
  color: string;
  bgGradient: string;
  authUrl: string;
  scopes: string[];
  permissions: string[];
}> = {
  facebook: {
    name: 'Facebook',
    color: '#1877F2',
    bgGradient: 'linear-gradient(135deg, #1877F2 0%, #42a5f5 100%)',
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    scopes: ['email', 'public_profile', 'pages_read_engagement', 'pages_show_list'],
    permissions: [
      'Ver tu perfil publico y email',
      'Leer engagement de tus paginas',
      'Ver lista de tus paginas'
    ]
  },
  instagram: {
    name: 'Instagram',
    color: '#E1306C',
    bgGradient: 'linear-gradient(135deg, #405de6, #833ab4, #e1306c, #fd1d1d)',
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    scopes: ['email', 'public_profile', 'pages_read_engagement', 'pages_show_list', 'instagram_basic', 'instagram_manage_insights'],
    permissions: [
      'Ver tu perfil de Instagram Business',
      'Leer metricas y engagement',
      'Ver tus publicaciones y comentarios'
    ]
  },
  x: {
    name: 'X (Twitter)',
    color: '#000000',
    bgGradient: 'linear-gradient(135deg, #14171A 0%, #657786 100%)',
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    scopes: ['tweet.read', 'users.read', 'follows.read', 'offline.access'],
    permissions: [
      'Leer tus tweets y menciones',
      'Ver tu perfil y seguidores',
      'Acceso offline para sincronizacion'
    ]
  },
  twitter: {
    name: 'X (Twitter)',
    color: '#000000',
    bgGradient: 'linear-gradient(135deg, #14171A 0%, #657786 100%)',
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    scopes: ['tweet.read', 'users.read', 'follows.read', 'offline.access'],
    permissions: [
      'Leer tus tweets y menciones',
      'Ver tu perfil y seguidores',
      'Acceso offline para sincronizacion'
    ]
  },
  youtube: {
    name: 'YouTube',
    color: '#FF0000',
    bgGradient: 'linear-gradient(135deg, #FF0000 0%, #ff5252 100%)',
    authUrl: '',
    scopes: ['youtube.readonly'],
    permissions: [
      'Ver tu canal y estadisticas',
      'Leer videos y comentarios',
      'Acceso a metricas de rendimiento'
    ]
  }
};

const logos: Record<string, JSX.Element> = {
  facebook: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="white">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  ),
  instagram: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="white">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1 1 12.324 0 6.162 6.162 0 0 1-12.324 0zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm4.965-10.405a1.44 1.44 0 1 1 2.881.001 1.44 1.44 0 0 1-2.881-.001z"/>
    </svg>
  ),
  x: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="white">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  ),
  youtube: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="white">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  )
};

function OAuthLoginContent() {
  const searchParams = useSearchParams();
  const platform = searchParams.get('platform') || 'facebook';
  const config = platformConfig[platform] || platformConfig.facebook;
  const logo = logos[platform] || logos[platform === 'twitter' ? 'x' : 'facebook'];

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuthorize = async () => {
    setLoading(true);
    setError(null);

    try {
      // TODAS las redes inician el OAuth del lado del servidor (/api/auth/{provider}),
      // que lee las credenciales en runtime. Así no dependemos de variables
      // NEXT_PUBLIC_* horneadas en build (que en producción quedaban undefined y
      // hacían fallar Facebook/Instagram/X). X usa la ruta 'twitter'.
      const provider = platform === 'x' ? 'twitter' : platform;
      const supported = ['facebook', 'instagram', 'twitter', 'youtube'];
      if (!supported.includes(provider)) {
        throw new Error(`Plataforma ${platform} no soportada`);
      }
      window.location.href = `/api/auth/${provider}?redirect=/dashboard/redes-sociales`;
    } catch (err) {
      console.error('OAuth error:', err);
      setError(err instanceof Error ? err.message : 'Error al conectar con la plataforma');
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (window.opener) {
      window.opener.postMessage({
        type: 'oauth_error',
        platform,
        error: 'Cancelado por el usuario'
      }, window.location.origin);
      window.close();
    } else {
      window.location.href = '/dashboard/redes-sociales';
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: config.bgGradient,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '20px'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '3px solid rgba(255,255,255,0.3)',
          borderTop: '3px solid white',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '24px'
        }}></div>
        <h2 style={{ color: '#fff', margin: '0 0 8px', fontSize: '20px' }}>
          Redirigiendo a {config.name}...
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0, fontSize: '14px' }}>
          Se abrira la pagina de autorizacion
        </p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      background: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '20px'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
        maxWidth: '420px',
        width: '100%',
        overflow: 'hidden'
      }}>
        {/* Header con color de plataforma */}
        <div style={{
          background: config.bgGradient,
          padding: '32px 24px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            {logo}
          </div>
          <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: '700', margin: '0 0 4px' }}>
            Conectar {config.name}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px', margin: 0 }}>
            Reputacion Online solicita acceso a tu cuenta
          </p>
        </div>

        {/* Permisos */}
        <div style={{ padding: '24px' }}>
          <h3 style={{ color: '#334155', fontSize: '14px', fontWeight: '600', margin: '0 0 16px' }}>
            Permisos solicitados:
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            {config.permissions.map((perm, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: '#f0fdf4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3">
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                </div>
                <span style={{ color: '#475569', fontSize: '14px' }}>{perm}</span>
              </div>
            ))}
          </div>

          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '24px'
          }}>
            <p style={{ color: '#64748b', fontSize: '12px', margin: 0, lineHeight: '1.5' }}>
              Solo lectura. No publicaremos ni modificaremos nada en tu cuenta.
              Puedes desconectar en cualquier momento desde tu dashboard.
            </p>
          </div>

          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px',
              color: '#dc2626',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          {/* Botones */}
          <button
            onClick={handleAuthorize}
            style={{
              width: '100%',
              padding: '14px',
              background: config.bgGradient,
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: '10px',
              transition: 'opacity 0.2s'
            }}
            onMouseOver={(e) => (e.target as HTMLButtonElement).style.opacity = '0.9'}
            onMouseOut={(e) => (e.target as HTMLButtonElement).style.opacity = '1'}
          >
            Autorizar {config.name}
          </button>

          <button
            onClick={handleCancel}
            style={{
              width: '100%',
              padding: '12px',
              background: 'transparent',
              color: '#64748b',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => (e.target as HTMLButtonElement).style.background = '#f8fafc'}
            onMouseOut={(e) => (e.target as HTMLButtonElement).style.background = 'transparent'}
          >
            Cancelar
          </button>
        </div>
      </div>

      <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '16px', textAlign: 'center' }}>
        Reputacion Online &bull; Monitoreo Inteligente de Reputacion
      </p>
    </div>
  );
}

function OAuthLoadingFallback() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid #01257D',
        borderTop: '3px solid transparent',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function OAuthLogin() {
  return (
    <Suspense fallback={<OAuthLoadingFallback />}>
      <OAuthLoginContent />
    </Suspense>
  );
}
