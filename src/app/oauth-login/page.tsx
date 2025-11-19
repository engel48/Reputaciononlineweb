'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

const platformConfig = {
  facebook: {
    name: 'Facebook',
    color: '#1877F2',
    bgColor: '#F0F2F5',
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth'
  },
  instagram: {
    name: 'Instagram',
    gradient: 'linear-gradient(45deg, #405de6, #5851db, #833ab4, #c13584, #e1306c, #fd1d1d)',
    bgColor: '#FAFAFA',
    authUrl: 'https://api.instagram.com/oauth/authorize'
  },
  x: {
    name: 'X',
    color: '#000000',
    bgColor: '#FFFFFF',
    authUrl: 'https://twitter.com/i/oauth2/authorize'
  },
  twitter: {
    name: 'X',
    color: '#000000',
    bgColor: '#FFFFFF',
    authUrl: 'https://twitter.com/i/oauth2/authorize'
  },
  linkedin: {
    name: 'LinkedIn',
    color: '#0A66C2',
    bgColor: '#F3F2EF',
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization'
  },
  youtube: {
    name: 'YouTube',
    color: '#FF0000',
    bgColor: '#FFFFFF',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth'
  },
  threads: {
    name: 'Threads',
    color: '#000000',
    bgColor: '#FFFFFF',
    authUrl: null // Threads aún no disponible
  },
  tiktok: {
    name: 'TikTok',
    color: '#000000',
    bgColor: '#FFFFFF',
    authUrl: null // TikTok requiere configuración especial
  }
};

const logos = {
  facebook: (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="white">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  ),
  instagram: (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="white">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1 1 12.324 0 6.162 6.162 0 0 1-12.324 0zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm4.965-10.405a1.44 1.44 0 1 1 2.881.001 1.44 1.44 0 0 1-2.881-.001z"/>
    </svg>
  ),
  x: (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  ),
  linkedin: (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="white">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  ),
  youtube: (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="white">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  ),
  threads: (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10c1.384 0 2.706-.282 3.908-.79l-.184-.459c-1.084.436-2.264.661-3.474.661-4.892 0-8.871-3.979-8.871-8.871S7.108 3.67 12 3.67s8.871 3.979 8.871 8.871c0 .669-.074 1.32-.215 1.947l.588.147A9.354 9.354 0 0 0 21.462 12c0-5.177-4.197-9.374-9.374-9.374-.029 0-.058.002-.088.002zm.25 3.5A6.5 6.5 0 0 0 5.75 12a6.5 6.5 0 0 0 6.5 6.5c1.843 0 3.506-.767 4.69-2.001l-.425-.352A5.853 5.853 0 0 1 12.25 17.85 5.857 5.857 0 0 1 6.4 12a5.857 5.857 0 0 1 5.85-5.85c1.174 0 2.268.347 3.185.943l.33-.43A6.453 6.453 0 0 0 12.25 5.5z"/>
    </svg>
  ),
  tiktok: (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
  )
};

// Helper functions para OAuth
function generateState(): string {
  const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  sessionStorage.setItem('oauth_state', state);
  return state;
}

function generatePKCE(): string {
  const verifier = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  sessionStorage.setItem('code_verifier', verifier);
  // Generar challenge desde verifier (base64url encoding)
  return btoa(verifier).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export default function OAuthLogin() {
  const searchParams = useSearchParams();
  const platform = searchParams.get('platform') || 'facebook';
  const config = platformConfig[platform as keyof typeof platformConfig] || platformConfig.facebook;
  const logo = logos[platform as keyof typeof logos] || logos.facebook;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    // Verificar si la plataforma está disponible
    if (!config.authUrl) {
      setError(`${config.name} aún no está disponible para integración. Por favor intenta con otra red social.`);
    }
  }, [config]);

  const validateForm = (): boolean => {
    const email = (document.getElementById('emailInput') as HTMLInputElement)?.value;
    const password = (document.getElementById('passwordInput') as HTMLInputElement)?.value;

    if (!email || !email.includes('@')) {
      setError('Por favor ingresa un email válido');
      return false;
    }
    if (!password || password.length < 3) {
      setError('Por favor ingresa una contraseña');
      return false;
    }
    if (!accepted) {
      setError('Debes aceptar las políticas para continuar');
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    // Verificar que la plataforma tenga OAuth configurado
    if (!config.authUrl) {
      setError(`${config.name} no está disponible actualmente`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const state = generateState();
      const redirectUri = `${window.location.origin}/api/auth/${platform}/callback`;

      // Construir URL de OAuth según la plataforma
      let authUrl = '';

      switch (platform) {
        case 'facebook':
          const fbClientId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
          if (!fbClientId) {
            throw new Error('Facebook OAuth no está configurado. Contacta al administrador.');
          }
          authUrl = `${config.authUrl}?client_id=${fbClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=email,public_profile,pages_read_engagement,pages_show_list&response_type=code&state=${state}`;
          break;

        case 'twitter':
        case 'x':
          const twitterClientId = process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID;
          if (!twitterClientId) {
            throw new Error('Twitter/X OAuth no está configurado. Contacta al administrador.');
          }
          const codeChallenge = generatePKCE();
          authUrl = `${config.authUrl}?client_id=${twitterClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=tweet.read users.read offline.access&response_type=code&code_challenge=${codeChallenge}&code_challenge_method=S256&state=${state}`;
          break;

        case 'linkedin':
          const linkedinClientId = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID;
          if (!linkedinClientId) {
            throw new Error('LinkedIn OAuth no está configurado. Contacta al administrador.');
          }
          authUrl = `${config.authUrl}?client_id=${linkedinClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=r_liteprofile r_emailaddress w_member_social&response_type=code&state=${state}`;
          break;

        case 'youtube':
          // YouTube usa el backend API directamente (tiene credenciales del servidor)
          console.log('🔍 YouTube OAuth: Redirigiendo a /api/auth/youtube');
          window.location.href = '/api/auth/youtube';
          return; // Salir temprano, el backend maneja todo

        case 'instagram':
          const instaClientId = process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID;
          if (!instaClientId) {
            throw new Error('Instagram OAuth no está configurado. Contacta al administrador.');
          }
          authUrl = `${config.authUrl}?client_id=${instaClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user_profile,user_media&response_type=code&state=${state}`;
          break;

        default:
          throw new Error(`Plataforma ${platform} no soportada`);
      }

      // Redirigir a OAuth REAL de la plataforma
      window.location.href = authUrl;

    } catch (error) {
      console.error('OAuth error:', error);
      setError(error instanceof Error ? error.message : 'Error al conectar con la plataforma');
      setLoading(false);
    }
  };

  // Vista de carga mientras redirige a OAuth
  if (loading) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        backgroundColor: config.bgColor || '#FFFFFF',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: platform === 'instagram'
            ? '3px solid transparent'
            : `3px solid ${'color' in config ? config.color : '#000000'}`,
          borderImage: platform === 'instagram'
            ? ('gradient' in config ? config.gradient + ' 1' : '')
            : 'none',
          borderTop: '3px solid transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '20px'
        }}></div>
        <h2 style={{
          color: platform === 'instagram' ? '#262626' : ('color' in config ? config.color : '#000000'),
          marginBottom: '10px'
        }}>
          Redirigiendo a {config.name}
        </h2>
        <p style={{ color: '#666' }}>Preparando autenticación...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{
      padding: '40px',
      maxWidth: '400px',
      margin: '0 auto',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: config.bgColor || '#FFFFFF',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <div style={{
          width: '80px',
          height: '80px',
          margin: '0 auto 20px',
          background: platform === 'instagram'
            ? ('gradient' in config ? config.gradient : '')
            : ('color' in config ? config.color : '#000000'),
          borderRadius: platform === 'instagram' ? '20px' : platform === 'facebook' || platform === 'linkedin' ? '12px' : '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: platform === 'x' || platform === 'twitter' || platform === 'threads' ? '#000' : 'white'
        }}>
          {logo}
        </div>
        <h1 style={{
          color: '#262626',
          margin: '0 0 5px 0',
          fontSize: '24px',
          fontWeight: '600'
        }}>
          Iniciar sesión en {config.name}
        </h1>
        <p style={{ color: '#8E8E8E', margin: 0, fontSize: '14px' }}>
          Conecta tu cuenta para continuar
        </p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{
          display: 'block',
          marginBottom: '8px',
          color: '#262626',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          Email, teléfono o usuario
        </label>
        <input
          id="emailInput"
          type="email"
          placeholder={platform === 'instagram' ? 'Teléfono, usuario o correo electrónico' : 'Ingresa tu email'}
          style={{
            width: '100%',
            padding: '12px',
            border: '1px solid #DBDBDB',
            borderRadius: '6px',
            fontSize: '14px',
            outline: 'none',
            backgroundColor: '#FAFAFA',
            transition: 'border-color 0.2s',
            boxSizing: 'border-box'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = platform === 'instagram' ? '#A8A8A8' : ('color' in config ? config.color : '#000000');
            e.target.style.backgroundColor = '#FFFFFF';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#DBDBDB';
            e.target.style.backgroundColor = '#FAFAFA';
          }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{
          display: 'block',
          marginBottom: '8px',
          color: '#262626',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          Contraseña
        </label>
        <input
          id="passwordInput"
          type="password"
          placeholder="Contraseña"
          style={{
            width: '100%',
            padding: '12px',
            border: '1px solid #DBDBDB',
            borderRadius: '6px',
            fontSize: '14px',
            outline: 'none',
            backgroundColor: '#FAFAFA',
            transition: 'border-color 0.2s',
            boxSizing: 'border-box'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = platform === 'instagram' ? '#A8A8A8' : ('color' in config ? config.color : '#000000');
            e.target.style.backgroundColor = '#FFFFFF';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#DBDBDB';
            e.target.style.backgroundColor = '#FAFAFA';
          }}
        />
      </div>

      {/* Mostrar errores */}
      {error && (
        <div style={{
          backgroundColor: '#fee',
          border: '1px solid #fcc',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '20px',
          color: '#c00',
          fontSize: '14px'
        }}>
          <strong>⚠️ Error:</strong> {error}
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          fontSize: '12px',
          color: '#8E8E8E',
          cursor: 'pointer'
        }}>
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            style={{ marginRight: '8px' }}
          />
          Al continuar, aceptas las políticas de privacidad y términos de servicio de Reputación Online
        </label>
      </div>

      <button
        onClick={handleLogin}
        disabled={loading}
        style={{
          width: '100%',
          backgroundColor: platform === 'instagram' ? '#0095F6' : ('color' in config ? config.color : '#000000'),
          color: 'white',
          border: 'none',
          padding: '14px',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'opacity 0.2s',
          marginBottom: '15px'
        }}
        onMouseOver={(e) => (e.target as HTMLButtonElement).style.opacity = '0.9'}
        onMouseOut={(e) => (e.target as HTMLButtonElement).style.opacity = '1'}
      >
        Iniciar sesión
      </button>

      <div style={{ textAlign: 'center' }}>
        <a
          href="#"
          style={{
            color: platform === 'instagram' ? '#00376B' : ('color' in config ? config.color : '#000000'),
            textDecoration: 'none',
            fontSize: '12px'
          }}
          onClick={(e) => e.preventDefault()}
        >
          ¿Olvidaste tu contraseña?
        </a>
      </div>
    </div>
  );
}