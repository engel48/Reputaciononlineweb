'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePlan } from '@/context/PlanContext';
import {
  Facebook,
  Instagram,
  Youtube,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Clock,
  Zap,
  Plus,
  Crown
} from 'lucide-react';
import { XIcon } from '@/components/icons/XIcon';

interface SocialConnection {
  connected: boolean;
  username: string;
  displayName: string;
  followers: number;
  profileImage: string;
  lastSync: string | null;
  metrics: {
    posts: number;
    engagement: number;
    reach: number;
  };
}

interface SocialConnectionsState {
  facebook: SocialConnection;
  instagram: SocialConnection;
  x: SocialConnection;
  youtube: SocialConnection;
}

interface SocialNetworkConnectorProps {
  onComplete?: (networks: SocialConnectionsState) => void;
  allowSkip?: boolean;
  isOnboarding?: boolean;
}

const socialNetworks = [
  {
    id: 'facebook',
    name: 'Facebook',
    icon: Facebook,
    color: 'bg-[#1877F2]',
    iconColor: 'text-white',
    description: 'Conecta tu página de Facebook para monitorear comentarios y menciones'
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: Instagram,
    color: 'bg-gradient-to-r from-[#FCAF45] via-[#E1306C] to-[#833AB4]',
    iconColor: 'text-white',
    description: 'Conecta tu cuenta de Instagram Business para analizar posts y stories'
  },
  {
    id: 'x',
    name: 'X',
    icon: XIcon,
    color: 'bg-[#0B1120]',
    iconColor: 'text-white',
    description: 'Monitorea menciones, hashtags y respuestas en X'
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: Youtube,
    color: 'bg-[#FF0000]',
    iconColor: 'text-white',
    description: 'Monitorea comentarios y métricas de tu canal de YouTube'
  }
];

interface AccountItem {
  id: string;
  platform: string;
  username: string;
  displayName: string | null;
  profileImage: string | null;
  profileUrl: string | null;
  followers: number;
  connected: boolean;
  lastSync: string | null;
  metrics: { posts: number; engagement: number };
}

export default function SocialNetworkConnectorFixed(props: SocialNetworkConnectorProps) {
  const { currentPlan } = usePlan();
  const isEnterprise = currentPlan === 'enterprise';

  const [connections, setConnections] = useState<SocialConnectionsState>({
    facebook: { connected: false, username: '', displayName: '', followers: 0, profileImage: '', lastSync: null, metrics: { posts: 0, engagement: 0, reach: 0 } },
    instagram: { connected: false, username: '', displayName: '', followers: 0, profileImage: '', lastSync: null, metrics: { posts: 0, engagement: 0, reach: 0 } },
    x: { connected: false, username: '', displayName: '', followers: 0, profileImage: '', lastSync: null, metrics: { posts: 0, engagement: 0, reach: 0 } },
    youtube: { connected: false, username: '', displayName: '', followers: 0, profileImage: '', lastSync: null, metrics: { posts: 0, engagement: 0, reach: 0 } }
  });

  // Lista completa de cuentas por plataforma (solo relevante para enterprise con múltiples)
  const [accounts, setAccounts] = useState<Record<string, AccountItem[]>>({
    facebook: [], instagram: [], x: [], youtube: []
  });

  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Cargar conexiones al montar el componente
  useEffect(() => {
    loadConnections();
    
    // Escuchar callbacks de OAuth
    const urlParams = new URLSearchParams(window.location.search);
    const connectPlatform = urlParams.get('connect');
    const error = urlParams.get('error');
    
    if (connectPlatform) {
      handleOAuthCallback(connectPlatform);
    } else if (error) {
      handleOAuthError(error);
    }
  }, []);

  const loadConnections = async () => {
    setIsValidating(true);

    try {
      const response = await fetch('/api/social-connect', {
        method: 'GET',
        credentials: 'include', // ✅ IMPORTANTE: Enviar cookies con la petición
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        // Intentar parsear error JSON si existe
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // Si no es JSON, usar mensaje por defecto
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error al cargar conexiones');
      }

      // Verificar que los datos son reales de Supabase
      if (data.socialConnections) {
        setConnections(data.socialConnections);
        setLastUpdated(new Date().toISOString());
      } else {
        throw new Error('No se recibieron datos de conexiones');
      }

      // Cargar lista completa de cuentas (soporta múltiples para enterprise)
      try {
        const accRes = await fetch('/api/social-connect?action=list_accounts', {
          credentials: 'include',
        });
        if (accRes.ok) {
          const accData = await accRes.json();
          if (accData.success && Array.isArray(accData.accounts)) {
            const grouped: Record<string, AccountItem[]> = {
              facebook: [], instagram: [], x: [], youtube: []
            };
            for (const acc of accData.accounts as AccountItem[]) {
              if (grouped[acc.platform]) grouped[acc.platform].push(acc);
            }
            setAccounts(grouped);
          }
        }
      } catch (accErr) {
        console.warn('No se pudo cargar lista multi-cuenta:', accErr);
      }

    } catch (error) {
      console.error('Error loading connections:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Error al cargar conexiones. Por favor recarga la página.'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleOAuthCallback = async (platform: string) => {
    try {
      setMessage({ type: 'info', text: `Procesando conexión con ${platform}...` });

      // Obtener código de autorización de la URL
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const storedState = sessionStorage.getItem('oauth_state');

      // Validar state (CSRF protection)
      if (!state || state !== storedState) {
        throw new Error('Estado de OAuth inválido. Posible ataque CSRF.');
      }

      if (!code) {
        throw new Error('No se recibió código de autorización');
      }

      // Enviar código al backend para exchange por access token
      const response = await fetch('/api/social-connect', {
        method: 'POST',
        credentials: 'include', // ✅ Enviar cookies
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'connect',
          platform,
          code,
          codeVerifier: sessionStorage.getItem('code_verifier') // Para PKCE (Twitter)
        })
      });

      if (!response.ok) {
        throw new Error(`Error al conectar: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error desconocido al conectar');
      }

      // Limpiar sessionStorage
      sessionStorage.removeItem('oauth_state');
      sessionStorage.removeItem('code_verifier');

      // Limpiar URL
      window.history.replaceState({}, document.title, window.location.pathname);

      // Recargar conexiones con datos REALES de Supabase
      await loadConnections();
      setMessage({ type: 'success', text: `¡${platform} conectado exitosamente!` });

    } catch (error) {
      console.error('Error en callback OAuth:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : `Error al procesar la conexión con ${platform}`
      });
    }
  };

  const handleOAuthError = (error: string) => {
    // Extraer detalles del error si existen
    const urlParams = new URLSearchParams(window.location.search);
    const errorDetails = urlParams.get('details');

    const errorMessages: Record<string, string> = {
      // Errores generales
      'platform_not_supported': 'Plataforma no soportada',
      'access_denied': 'Acceso denegado por el usuario',
      'invalid_request': 'Solicitud OAuth inválida',
      'invalid_state': 'Error de seguridad: Estado OAuth inválido. Por favor intenta de nuevo.',
      'config_missing': 'Plataforma no configurada correctamente. Contacta al administrador.',
      'not_authenticated': 'Debes iniciar sesión antes de conectar la red social',
      'invalid_token': 'Tu sesión ha expirado. Por favor inicia sesión de nuevo.',
      'token_exchange_failed': 'Error al obtener autorización. Intenta de nuevo.',
      'profile_fetch_failed': 'No se pudo obtener tu perfil. Verifica los permisos.',
      'save_failed': 'Error al guardar la conexión. Intenta de nuevo.',
      'oauth_failed': 'Error en el proceso de autenticación'
    };

    let message = errorMessages[error] || `Error en la autenticación: ${error}`;

    // Agregar detalles si existen
    if (errorDetails) {
      message += ` (Detalles: ${errorDetails})`;
    }

    console.error('🔴 OAuth Error:', error, '→', message);
    console.error('   Error details:', errorDetails);
    setMessage({ type: 'error', text: message });

    // Limpiar URL
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleConnect = async (networkId: string) => {
    setLoading(prev => ({ ...prev, [networkId]: true }));
    setMessage(null);

    try {
      // Abrir popup OAuth
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        `/oauth-login?platform=${networkId}`,
        `${networkId}_oauth`,
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes,popup=yes`
      );

      if (!popup) {
        throw new Error('Por favor permite popups para conectar redes sociales');
      }

      // Escuchar mensajes del popup cuando complete OAuth
      const handleMessage = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (event.data.type === 'oauth_success') {
          setMessage({
            type: 'success',
            text: `¡${networkId} conectado exitosamente!`
          });

          // Recargar datos REALES de la API
          await loadConnections();

          window.removeEventListener('message', handleMessage);
        } else if (event.data.type === 'oauth_error') {
          setMessage({
            type: 'error',
            text: `Error al conectar ${networkId}: ${event.data.error}`
          });
        }

        setLoading(prev => ({ ...prev, [networkId]: false }));
      };

      window.addEventListener('message', handleMessage);

      // Detectar si el usuario cierra el popup
      const checkPopupClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkPopupClosed);
          window.removeEventListener('message', handleMessage);
          setLoading(prev => ({ ...prev, [networkId]: false }));
        }
      }, 500);

    } catch (error) {
      console.error(`Error connecting to ${networkId}:`, error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Error al conectar'
      });
      setLoading(prev => ({ ...prev, [networkId]: false }));
    }
  };

  const handleDisconnectAccount = async (accountId: string, username: string) => {
    if (!confirm(`¿Desconectar la cuenta @${username}?`)) return;

    try {
      const response = await fetch('/api/social-connect', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect_account', accountId }),
      });
      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: `Cuenta @${username} desconectada` });
        await loadConnections();
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al desconectar cuenta' });
      }
    } catch (error) {
      console.error('Error disconnecting account:', error);
      setMessage({ type: 'error', text: 'Error de red al desconectar cuenta' });
    }
  };

  const handleDisconnect = async (platform: string) => {
    if (loading[platform]) return;
    
    if (!confirm(`¿Estás seguro de que quieres desconectar ${platform}?`)) {
      return;
    }
    
    setLoading(prev => ({ ...prev, [platform]: true }));
    
    try {
      const response = await fetch('/api/social-connect', {
        method: 'POST',
        credentials: 'include', // ✅ Enviar cookies
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform,
          action: 'disconnect'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        await loadConnections();
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al desconectar la red social' });
      }
      
    } catch (error) {
      console.error('Error desconectando red social:', error);
      setMessage({ type: 'error', text: 'Error al desconectar la red social' });
    } finally {
      setLoading(prev => ({ ...prev, [platform]: false }));
    }
  };

  const handleSyncAll = async () => {
    setIsValidating(true);
    
    try {
      const response = await fetch('/api/social-connect', {
        method: 'POST',
        credentials: 'include', // ✅ Enviar cookies
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'sync'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: 'Datos sincronizados exitosamente' });
        await loadConnections();
      } else {
        setMessage({ type: 'error', text: 'Error al sincronizar datos' });
      }
      
    } catch (error) {
      console.error('Error sincronizando datos:', error);
      setMessage({ type: 'error', text: 'Error al sincronizar datos' });
    } finally {
      setIsValidating(false);
    }
  };

  const handleValidateTokens = async () => {
    setIsValidating(true);
    
    try {
      const response = await fetch('/api/social-connect', {
        method: 'POST',
        credentials: 'include', // ✅ Enviar cookies
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'validate'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: 'Validación de tokens completada' });
        await loadConnections();
      } else {
        setMessage({ type: 'error', text: 'Error al validar tokens' });
      }
      
    } catch (error) {
      console.error('Error validando tokens:', error);
      setMessage({ type: 'error', text: 'Error al validar tokens' });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSyncSingle = async (platform: string) => {
    if (syncing[platform]) return;
    setSyncing((prev) => ({ ...prev, [platform]: true }));
    setMessage(null);

    try {
      // Mapear platform al endpoint correcto
      const endpoint = platform === 'x' ? '/api/x/sync' : `/api/${platform}/sync`;
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (data.success) {
        const mentionsCreated =
          (data.data?.mentions_created || 0) +
          (data.data?.external_mentions_created || 0);
        setMessage({
          type: 'success',
          text: `${platform}: ${mentionsCreated} menciones nuevas sincronizadas`,
        });
        await loadConnections();
      } else {
        setMessage({
          type: 'error',
          text: data.error || `Error sincronizando ${platform}`,
        });
      }
    } catch (error) {
      console.error(`Error sincronizando ${platform}:`, error);
      setMessage({
        type: 'error',
        text: `Error de conexión al sincronizar ${platform}`,
      });
    } finally {
      setSyncing((prev) => ({ ...prev, [platform]: false }));
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const connectedCount = Object.values(connections).filter(conn => conn.connected).length;

  return (
    <div className="space-y-6">
      {/* Header con acciones globales */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Conexiones de Redes Sociales</h2>
          <p className="text-gray-600">
            Conecta tus redes sociales para monitorear tu reputación online.
            Conectado: {connectedCount} de {socialNetworks.length}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={handleValidateTokens}
            disabled={isValidating}
            variant="outline"
            size="sm"
          >
            {isValidating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            Validar Tokens
          </Button>
          
          <Button
            onClick={handleSyncAll}
            disabled={isValidating}
            variant="outline"
            size="sm"
          >
            {isValidating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Sincronizar Todo
          </Button>
        </div>
      </div>

      {/* Mostrar mensajes */}
      {message && (
        <div className={`border-l-4 ${
          message.type === 'success' ? 'border-green-500 bg-green-50' :
          message.type === 'error' ? 'border-red-500 bg-red-50' :
          'border-blue-500 bg-blue-50'
        } p-4`}>
          <div className={
            message.type === 'success' ? 'text-green-700' :
            message.type === 'error' ? 'text-red-700' :
            'text-blue-700'
          }>
            {message.text}
          </div>
        </div>
      )}

      {/* Información de última actualización */}
      {lastUpdated && (
        <div className="text-sm text-gray-500">
          Última actualización: {formatDate(lastUpdated)}
        </div>
      )}

      {/* Banner: sync automático cada 30 min */}
      <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm flex-shrink-0">
            <Clock className="h-5 w-5 text-[#01257D] dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                Sincronización automática cada 30 minutos
              </h4>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                <Zap className="h-3 w-3" /> Activo
              </span>
            </div>
            <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">
              El sistema trae automáticamente menciones y métricas de todas tus redes
              conectadas. También puedes usar el botón <strong>Sincronizar ahora</strong> en
              cada tarjeta para traer datos al instante.
            </p>
          </div>
        </div>
      </div>

      {/* Grid de redes sociales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {socialNetworks.map((network) => {
          const connection = connections[network.id as keyof SocialConnectionsState];
          const isLoading = loading[network.id];
          const isSyncing = syncing[network.id];
          const IconComponent = network.icon;

          return (
            <Card key={network.id} className="relative overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${network.color} ${network.iconColor}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{network.name}</CardTitle>
                      <Badge variant={connection.connected ? "default" : "secondary"} className="mt-1">
                        {connection.connected ? (
                          <><CheckCircle className="w-3 h-3 mr-1" /> Conectado</>
                        ) : (
                          <><XCircle className="w-3 h-3 mr-1" /> Desconectado</>
                        )}
                      </Badge>
                    </div>
                  </div>
                </div>
                <CardDescription className="text-sm">
                  {network.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-0 space-y-4">
                {connection.connected && (
                  <div className="space-y-3">
                    {/* Información del perfil */}
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      {connection.profileImage && (
                        <img 
                          src={connection.profileImage} 
                          alt={connection.displayName}
                          className="w-8 h-8 rounded-full"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{connection.displayName}</p>
                        <p className="text-xs text-gray-500 truncate">@{connection.username}</p>
                      </div>
                    </div>

                    {/* Métricas */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-blue-50 p-2 rounded text-center">
                        <div className="font-semibold text-blue-700">{formatNumber(connection.followers)}</div>
                        <div className="text-blue-600">Seguidores</div>
                      </div>
                      <div className="bg-green-50 p-2 rounded text-center">
                        <div className="font-semibold text-green-700">{formatNumber(connection.metrics.engagement)}</div>
                        <div className="text-green-600">Engagement</div>
                      </div>
                    </div>

                    {/* Última sincronización */}
                    <div className="text-xs text-gray-500">
                      Última sync: {formatDate(connection.lastSync)}
                    </div>
                  </div>
                )}

                {/* Cuentas adicionales (solo enterprise con 2+ cuentas en esta red) */}
                {isEnterprise && accounts[network.id] && accounts[network.id].length > 1 && (
                  <div className="space-y-2 border-t border-gray-200 dark:border-gray-700 pt-3">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300">
                      <Crown className="w-3.5 h-3.5 text-amber-500" />
                      Cuentas adicionales ({accounts[network.id].length - 1})
                    </div>
                    {accounts[network.id].slice(1).map((acc) => (
                      <div
                        key={acc.id}
                        className="flex items-center justify-between gap-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-md text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {acc.profileImage ? (
                            <img src={acc.profileImage} alt={acc.username} className="w-6 h-6 rounded-full flex-shrink-0" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gray-300 flex-shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="font-medium truncate">@{acc.username}</p>
                            <p className="text-gray-500">{formatNumber(acc.followers)} seguidores</p>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleDisconnectAccount(acc.id, acc.username)}
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Botones de acción */}
                <div className="flex flex-col gap-2">
                  {connection.connected ? (
                    <>
                      <Button
                        onClick={() => handleSyncSingle(network.id)}
                        disabled={isSyncing || isLoading}
                        className="w-full bg-[#01257D] hover:bg-[#013AAA] text-white"
                        size="sm"
                      >
                        {isSyncing ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sincronizando...</>
                        ) : (
                          <><RefreshCw className="w-4 h-4 mr-2" /> Sincronizar ahora</>
                        )}
                      </Button>
                      {/* Botón "Agregar otra cuenta" solo para enterprise */}
                      {isEnterprise && (
                        <Button
                          onClick={() => handleConnect(network.id)}
                          disabled={isLoading}
                          variant="outline"
                          size="sm"
                          className="w-full border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/20"
                        >
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Plus className="w-4 h-4 mr-2" />
                          )}
                          Agregar otra cuenta
                        </Button>
                      )}
                      <Button
                        onClick={() => handleDisconnect(network.id)}
                        disabled={isLoading || isSyncing}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <XCircle className="w-4 h-4 mr-2" />
                        )}
                        Desconectar {isEnterprise && accounts[network.id]?.length > 1 ? 'todas' : ''}
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => handleConnect(network.id)}
                      disabled={isLoading}
                      className="flex-1 bg-[#01257D] hover:bg-[#013AAA] text-white disabled:opacity-60 disabled:cursor-not-allowed"
                      size="sm"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <ExternalLink className="w-4 h-4 mr-2" />
                      )}
                      Conectar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Información adicional */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Información Importante
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-gray-600 space-y-2">
            <p>• Para conectar redes sociales, necesitas tener permisos de administrador en las cuentas.</p>
            <p>• Los tokens de acceso se validan automáticamente y se renuevan cuando es necesario.</p>
            <p>• La sincronización de datos se realiza cada 30 minutos automáticamente.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
