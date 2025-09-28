'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

const platformConfig = {
  facebook: {
    name: 'Facebook',
    color: '#1877F2',
    logo: '📘'
  },
  instagram: {
    name: 'Instagram',
    color: '#C32AA3',
    logo: '📷'
  },
  x: {
    name: 'X',
    color: '#000000',
    logo: '𝕏'
  },
  twitter: {
    name: 'X',
    color: '#000000',
    logo: '𝕏'
  },
  linkedin: {
    name: 'LinkedIn',
    color: '#0A66C2',
    logo: '💼'
  },
  youtube: {
    name: 'YouTube',
    color: '#FF0000',
    logo: '📺'
  },
  threads: {
    name: 'Threads',
    color: '#000000',
    logo: '@'
  },
  tiktok: {
    name: 'TikTok',
    color: '#EE1D52',
    logo: '🎵'
  }
};

export default function OAuthLogin() {
  const searchParams = useSearchParams();
  const platform = searchParams.get('platform') || 'facebook';
  const config = platformConfig[platform as keyof typeof platformConfig] || platformConfig.facebook;

  const [step, setStep] = useState('login');
  const [accepted, setAccepted] = useState(false);

  const validateForm = () => {
    const email = (document.getElementById('emailInput') as HTMLInputElement)?.value;
    const password = (document.getElementById('passwordInput') as HTMLInputElement)?.value;

    if (!email || !email.includes('@')) {
      alert('Por favor ingresa un email válido');
      return false;
    }
    if (!password || password.length < 3) {
      alert('Por favor ingresa una contraseña');
      return false;
    }
    if (!accepted) {
      alert('Debes aceptar las políticas para continuar');
      return false;
    }
    return true;
  };

  const handleLogin = () => {
    if (!validateForm()) return;

    setStep('loading');

    setTimeout(() => {
      setStep('error');
    }, 2000);
  };

  if (step === 'loading') {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        backgroundColor: '#ffffff',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: `3px solid ${config.color}`,
          borderTop: '3px solid transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '20px'
        }}></div>
        <h2 style={{ color: config.color, marginBottom: '10px' }}>Conectando con {config.name}</h2>
        <p style={{ color: '#666' }}>Verificando credenciales...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        backgroundColor: '#ffffff',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{
          fontSize: '48px',
          marginBottom: '20px'
        }}>⚠️</div>
        <h2 style={{ color: '#e74c3c', marginBottom: '20px' }}>Conexión temporalmente no disponible</h2>
        <div style={{
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px',
          maxWidth: '400px'
        }}>
          <p style={{ margin: '0 0 10px 0', color: '#856404' }}>
            <strong>Actualización de políticas de API</strong>
          </p>
          <p style={{ margin: 0, color: '#856404' }}>
            Debido a actualizaciones en las políticas de {config.name}, la conexión de cuentas estará disponible a partir del <strong>martes 30 de septiembre</strong>.
          </p>
        </div>
        <button
          onClick={() => window.close()}
          style={{
            backgroundColor: config.color,
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          Cerrar
        </button>
      </div>
    );
  }

  return (
    <div style={{
      padding: '40px',
      maxWidth: '400px',
      margin: '0 auto',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: '#ffffff',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <div style={{
          fontSize: '32px',
          marginBottom: '10px',
          color: config.color
        }}>
          {config.logo}
        </div>
        <h1 style={{
          color: config.color,
          margin: '0 0 5px 0',
          fontSize: '24px',
          fontWeight: '600'
        }}>
          Iniciar sesión en {config.name}
        </h1>
        <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>
          Conecta tu cuenta para continuar
        </p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{
          display: 'block',
          marginBottom: '8px',
          color: '#333',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          Email o teléfono
        </label>
        <input
          id="emailInput"
          type="email"
          placeholder="Ingresa tu email"
          style={{
            width: '100%',
            padding: '12px',
            border: '1px solid #ddd',
            borderRadius: '6px',
            fontSize: '16px',
            outline: 'none',
            transition: 'border-color 0.2s',
            boxSizing: 'border-box'
          }}
          onFocus={(e) => e.target.style.borderColor = config.color}
          onBlur={(e) => e.target.style.borderColor = '#ddd'}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{
          display: 'block',
          marginBottom: '8px',
          color: '#333',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          Contraseña
        </label>
        <input
          id="passwordInput"
          type="password"
          placeholder="Ingresa tu contraseña"
          style={{
            width: '100%',
            padding: '12px',
            border: '1px solid #ddd',
            borderRadius: '6px',
            fontSize: '16px',
            outline: 'none',
            transition: 'border-color 0.2s',
            boxSizing: 'border-box'
          }}
          onFocus={(e) => e.target.style.borderColor = config.color}
          onBlur={(e) => e.target.style.borderColor = '#ddd'}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          fontSize: '12px',
          color: '#666',
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
        style={{
          width: '100%',
          backgroundColor: config.color,
          color: 'white',
          border: 'none',
          padding: '14px',
          borderRadius: '6px',
          fontSize: '16px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'opacity 0.2s',
          marginBottom: '15px'
        }}
        onMouseOver={(e) => e.target.style.opacity = '0.9'}
        onMouseOut={(e) => e.target.style.opacity = '1'}
      >
        Iniciar sesión
      </button>

      <div style={{ textAlign: 'center' }}>
        <a
          href="#"
          style={{
            color: config.color,
            textDecoration: 'none',
            fontSize: '14px'
          }}
          onClick={(e) => e.preventDefault()}
        >
          ¿Olvidaste tu contraseña?
        </a>
      </div>
    </div>
  );
}