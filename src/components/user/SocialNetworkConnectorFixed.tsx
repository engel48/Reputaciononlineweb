'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Youtube, 
  MessageCircle,
  Music,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';

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
  linkedin: SocialConnection;
  youtube: SocialConnection;
  threads: SocialConnection;
  tiktok: SocialConnection;
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
    color: 'bg-blue-600',
    description: 'Conecta tu página de Facebook para monitorear comentarios y menciones'
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: Instagram,
    color: 'bg-gradient-to-r from-purple-500 to-pink-500',
    description: 'Conecta tu cuenta de Instagram Business para analizar posts y stories'
  },
  {
    id: 'x',
    name: 'X (Twitter)',
    icon: Twitter,
    color: 'bg-black',
    description: 'Monitorea menciones, hashtags y respuestas en X (anteriormente Twitter)'
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: Linkedin,
    color: 'bg-blue-700',
    description: 'Analiza tu actividad profesional y engagement en LinkedIn'
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: Youtube,
    color: 'bg-red-600',
    description: 'Monitorea comentarios y métricas de tu canal de YouTube'
  },
  {
    id: 'threads',
    name: 'Threads',
    icon: MessageCircle,
    color: 'bg-black',
    description: 'Conecta tu cuenta de Threads para análisis de contenido'
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: Music,
    color: 'bg-black',
    description: 'Analiza videos, comentarios y tendencias en TikTok'
  }
];

export default function SocialNetworkConnectorFixed(props: SocialNetworkConnectorProps) {
  const [connections, setConnections] = useState<SocialConnectionsState>({
    facebook: { connected: false, username: '', displayName: '', followers: 0, profileImage: '', lastSync: null, metrics: { posts: 0, engagement: 0, reach: 0 } },
    instagram: { connected: false, username: '', displayName: '', followers: 0, profileImage: '', lastSync: null, metrics: { posts: 0, engagement: 0, reach: 0 } },
    x: { connected: false, username: '', displayName: '', followers: 0, profileImage: '', lastSync: null, metrics: { posts: 0, engagement: 0, reach: 0 } },
    linkedin: { connected: false, username: '', displayName: '', followers: 0, profileImage: '', lastSync: null, metrics: { posts: 0, engagement: 0, reach: 0 } },
    youtube: { connected: false, username: '', displayName: '', followers: 0, profileImage: '', lastSync: null, metrics: { posts: 0, engagement: 0, reach: 0 } },
    threads: { connected: false, username: '', displayName: '', followers: 0, profileImage: '', lastSync: null, metrics: { posts: 0, engagement: 0, reach: 0 } },
    tiktok: { connected: false, username: '', displayName: '', followers: 0, profileImage: '', lastSync: null, metrics: { posts: 0, engagement: 0, reach: 0 } }
  });

  const [loading, setLoading] = useState<Record<string, boolean>>({});
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
    try {
      const response = await fetch('/api/social-connect');
      const data = await response.json();
      
      if (data.success && data.socialConnections) {
        setConnections(data.socialConnections);
        setLastUpdated(data.lastUpdated || new Date().toISOString());
      }
    } catch (error) {
      console.error('Error cargando conexiones:', error);
      setMessage({ type: 'error', text: 'Error al cargar las conexiones de redes sociales' });
    }
  };

  const handleOAuthCallback = async (platform: string) => {
    try {
      // En un flujo real, aquí obtendríamos el token del callback de OAuth
      // Por ahora, simularemos una conexión exitosa
      setMessage({ type: 'info', text: `Procesando conexión con ${platform}...` });
      
      // Limpiar URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Recargar conexiones
      setTimeout(() => {
        loadConnections();
        setMessage({ type: 'success', text: `¡${platform} conectado exitosamente!` });
      }, 1500);
      
    } catch (error) {
      console.error('Error en callback OAuth:', error);
      setMessage({ type: 'error', text: `Error al procesar la conexión con ${platform}` });
    }
  };

  const handleOAuthError = (error: string) => {
    const errorMessages: Record<string, string> = {
      'threads_not_available': 'Threads aún no está disponible para integración',
      'tiktok_not_available': 'TikTok requiere configuración especial',
      'platform_not_supported': 'Plataforma no soportada',
      'access_denied': 'Acceso denegado por el usuario',
      'invalid_request': 'Solicitud OAuth inválida'
    };
    
    const message = errorMessages[error] || 'Error desconocido en la autenticación';
    setMessage({ type: 'error', text: message });
    
    // Limpiar URL
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleConnect = async (networkId: string) => {
    try {
      setLoading(prev => ({ ...prev, [networkId]: true }));
      
      // Llamar al endpoint OAuth real
      const response = await fetch(`/api/auth/${networkId}?action=connect`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al iniciar OAuth');
      }
      
      // Abrir popup OAuth
      const popup = window.open(
        data.authUrl,
        `${networkId}_oauth`,
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );
      
      if (!popup) {
        throw new Error('No se pudo abrir la ventana de autorización. Verifica que no estén bloqueados los popups.');
      }
      
      // Escuchar el mensaje del callback
      const handleMessage = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'oauth_success' && event.data.platform === networkId) {
          window.removeEventListener('message', handleMessage);
          popup.close();
          
          // Procesar los datos recibidos
          const profile = event.data.profile;
          setConnections(prev => ({
            ...prev,
            [networkId]: {
              ...prev[networkId as keyof SocialConnectionsState],
              connected: true,
              username: profile.username || profile.name,
              displayName: profile.name,
              followers: profile.followers || profile.subscribers || 0,
              profileImage: profile.picture || '',
              lastSync: new Date().toISOString()
            }
          }));
          
          // Llamar callback si está en onboarding
          if (props.onComplete) {
            const updatedConnections = { ...connections };
            updatedConnections[networkId as keyof SocialConnectionsState] = {
              ...updatedConnections[networkId as keyof SocialConnectionsState],
              connected: true,
              username: profile.username || profile.name,
              displayName: profile.name,
              followers: profile.followers || profile.subscribers || 0,
              profileImage: profile.picture || '',
              lastSync: new Date().toISOString()
            };
            props.onComplete(updatedConnections);
          }
          
        } else if (event.data.type === 'oauth_error' && event.data.platform === networkId) {
          window.removeEventListener('message', handleMessage);
          popup.close();
          throw new Error(event.data.error || 'Error en la autorización');
        }
      };
      
      window.addEventListener('message', handleMessage);
      
      // Verificar si el popup se cerró manualmente
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          setLoading(prev => ({ ...prev, [networkId]: false }));
        }
      }, 1000);
      
    } catch (error) {
      console.error(`Error connecting to ${networkId}:`, error);
      setConnections(prev => ({
        ...prev,
        [networkId]: {
          ...prev[networkId as keyof SocialConnectionsState],
          error: error instanceof Error ? error.message : 'Error de conexión'
        }
      }));
    } finally {
      setLoading(prev => ({ ...prev, [networkId]: false }));
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

      {/* Grid de redes sociales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {socialNetworks.map((network) => {
          const connection = connections[network.id as keyof SocialConnectionsState];
          const isLoading = loading[network.id];
          const IconComponent = network.icon;

          return (
            <Card key={network.id} className="relative overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${network.color} text-white`}>
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

                {/* Botones de acción */}
                <div className="flex gap-2">
                  {connection.connected ? (
                    <Button
                      onClick={() => handleDisconnect(network.id)}
                      disabled={isLoading}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4 mr-2" />
                      )}
                      Desconectar
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleConnect(network.id)}
                      disabled={isLoading}
                      className="flex-1 bg-[#01257D] hover:bg-[#013AAA] text-white"
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
            <p>• Algunas plataformas como Threads y TikTok están en desarrollo.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
