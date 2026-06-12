'use client';

/**
 * Panel de Salud de Conexiones Sociales
 *
 * Muestra el estado de todas las conexiones OAuth del usuario,
 * incluyendo validez de tokens y alertas de expiración.
 *
 * Características:
 * - Visualización en tiempo real del estado de conexiones
 * - Alertas para tokens próximos a expirar
 * - Botón de renovación manual
 * - Indicadores visuales de estado
 */

import { useState, useEffect } from 'react';
import { RefreshCw, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Connection {
  platform: string;
  username: string | null;
  followers: number;
  connected: boolean;
  token_valid: boolean;
  days_until_expiry: number | null;
  needs_reconnection: boolean;
  status: 'active' | 'expired' | 'expiring_soon';
  icon: string;
  display_name: string;
  last_sync: string | null;
}

interface ConnectionsSummary {
  total: number;
  active: number;
  expired: number;
  expiring_soon: number;
}

export default function ConnectionsHealthPanel() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [summary, setSummary] = useState<ConnectionsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConnectionsStatus();
  }, []);

  const loadConnectionsStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/user/connections/status');
      const data = await response.json();

      if (data.success) {
        setConnections(data.connections);
        setSummary(data.summary);
      } else {
        setError(data.error || 'Error cargando estado de conexiones');
      }
    } catch (err: any) {
      setError(err.message || 'Error de red');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshTokens = async () => {
    try {
      setRefreshing(true);
      setError(null);

      const response = await fetch('/api/user/connections/status', {
        method: 'POST'
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Renovación completada', {
          description: `Exitosos: ${data.refreshed} · Fallidos: ${data.failed}`,
        });
        await loadConnectionsStatus(); // Recargar estado
      } else {
        setError(data.error || 'Error renovando tokens');
      }
    } catch (err: any) {
      setError(err.message || 'Error de red');
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'expired':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'expiring_soon':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'expired':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'expiring_soon':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusText = (conn: Connection): string => {
    if (!conn.connected) return 'Desconectado';
    if (!conn.token_valid) return 'Token expirado';
    if (conn.days_until_expiry !== null && conn.days_until_expiry < 7) {
      return `Expira en ${conn.days_until_expiry} días`;
    }
    return 'Activo';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Estado de Conexiones Sociales
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Monitoreo de tokens OAuth y validez de conexiones
          </p>
        </div>
        <button
          onClick={handleRefreshTokens}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Renovando...' : 'Renovar Tokens'}
        </button>
      </div>

      {/* Resumen */}
      {summary && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm text-blue-600 font-medium">Total</div>
            <div className="text-2xl font-bold text-blue-700">{summary.total}</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-sm text-green-600 font-medium">Activos</div>
            <div className="text-2xl font-bold text-green-700">{summary.active}</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="text-sm text-yellow-600 font-medium">Por Expirar</div>
            <div className="text-2xl font-bold text-yellow-700">{summary.expiring_soon}</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-sm text-red-600 font-medium">Expirados</div>
            <div className="text-2xl font-bold text-red-700">{summary.expired}</div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Lista de Conexiones */}
      <div className="space-y-3">
        {connections.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hay conexiones sociales configuradas
          </div>
        ) : (
          connections.map((conn) => (
            <div
              key={conn.platform}
              className={`border rounded-lg p-4 transition-all ${getStatusColor(conn.status)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Icono y Nombre */}
                  <div className="text-3xl">{conn.icon}</div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {conn.display_name}
                    </div>
                    {conn.username && (
                      <div className="text-sm text-gray-600">
                        @{conn.username}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* Seguidores */}
                  {conn.followers > 0 && (
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Seguidores</div>
                      <div className="font-semibold text-gray-900">
                        {conn.followers.toLocaleString()}
                      </div>
                    </div>
                  )}

                  {/* Estado */}
                  <div className="flex items-center gap-2">
                    {getStatusIcon(conn.status)}
                    <div>
                      <div className="text-sm font-medium">
                        {getStatusText(conn)}
                      </div>
                      {conn.last_sync && (
                        <div className="text-xs text-gray-500">
                          Última sync: {new Date(conn.last_sync).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Acción */}
                  {conn.needs_reconnection && (
                    <a
                      href={`/api/auth/${conn.platform}`}
                      className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    >
                      Reconectar
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Leyenda */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          <strong>💡 Recomendaciones:</strong>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Tokens que expiran en menos de 7 días se marcan en amarillo</li>
            <li>Tokens expirados se marcan en rojo y requieren reconexión</li>
            <li>El sistema intenta renovar automáticamente cada 6 horas</li>
            <li>Usa "Renovar Tokens" para forzar renovación manual</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
