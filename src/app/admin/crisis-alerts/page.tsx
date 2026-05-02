"use client";

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  AlertTriangle, CheckCircle, ChevronLeft, ChevronRight, RefreshCw, Eye, Check, X,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AdminPageWrapper } from '@/components/admin';

interface CrisisAlert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'acknowledged' | 'resolved';
  description: string;
  triggerData: any;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string | null; email: string } | null;
}

interface AlertsResponse {
  success: boolean;
  total: number;
  limit: number;
  offset: number;
  stats: {
    total: number;
    bySeverity: Record<string, number>;
    byStatus: Record<string, number>;
  };
  alerts: CrisisAlert[];
}

const PAGE_SIZE = 20;

const SEVERITY_BADGE: Record<string, string> = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-300',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border border-orange-300',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border border-yellow-300',
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-300',
};

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-red-500 text-white',
  acknowledged: 'bg-yellow-500 text-white',
  resolved: 'bg-green-500 text-white',
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return format(new Date(iso), "d MMM yyyy HH:mm", { locale: es });
  } catch {
    return iso;
  }
}

export default function CrisisAlertsPage() {
  const [data, setData] = useState<AlertsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [page, setPage] = useState(0);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
      });
      if (filterStatus) params.set('status', filterStatus);
      if (filterSeverity) params.set('severity', filterSeverity);
      const res = await fetch(`/api/admin/crisis-alerts?${params}`, { credentials: 'include' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || `HTTP ${res.status}`);
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Error cargando alertas');
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, filterSeverity]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(0);
  }, [filterStatus, filterSeverity]);

  const updateStatus = async (alertId: string, status: 'acknowledged' | 'resolved') => {
    setActing(alertId);
    try {
      const res = await fetch(`/api/admin/crisis-alerts/${alertId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      await load();
    } catch (err: any) {
      setError(err.message || 'Error actualizando alerta');
    } finally {
      setActing(null);
    }
  };

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  return (
    <AdminPageWrapper title="Alertas de crisis" subtitle="Monitoreo de situaciones reputacionales que requieren accion">
      <div className="space-y-4">
        {/* Stats cards */}
        {data && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#151C2E] border border-red-500/40 rounded-lg p-4">
              <p className="text-xs uppercase text-red-300">Activas</p>
              <p className="text-2xl font-bold text-white">{data.stats.byStatus.active || 0}</p>
              <p className="text-xs text-gray-500 mt-1">requieren atencion</p>
            </div>
            <div className="bg-[#151C2E] border border-yellow-500/40 rounded-lg p-4">
              <p className="text-xs uppercase text-yellow-300">Acknowledged</p>
              <p className="text-2xl font-bold text-white">{data.stats.byStatus.acknowledged || 0}</p>
              <p className="text-xs text-gray-500 mt-1">en seguimiento</p>
            </div>
            <div className="bg-[#151C2E] border border-green-500/40 rounded-lg p-4">
              <p className="text-xs uppercase text-green-300">Resueltas</p>
              <p className="text-2xl font-bold text-white">{data.stats.byStatus.resolved || 0}</p>
            </div>
            <div className="bg-[#151C2E] border border-gray-700 rounded-lg p-4">
              <p className="text-xs uppercase text-gray-400">Total</p>
              <p className="text-2xl font-bold text-white">{data.stats.total}</p>
              <p className="text-xs text-gray-500 mt-1">
                {data.stats.bySeverity.critical || 0} criticas
              </p>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-[#151C2E] rounded-lg p-4 border border-gray-800 flex flex-wrap gap-3 items-center">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-md bg-[#0B1120] border border-gray-700 text-white text-sm"
          >
            <option value="">Todos los estados</option>
            <option value="active">Activas</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="resolved">Resueltas</option>
          </select>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-3 py-2 rounded-md bg-[#0B1120] border border-gray-700 text-white text-sm"
          >
            <option value="">Todas las severidades</option>
            <option value="critical">Critica</option>
            <option value="high">Alta</option>
            <option value="medium">Media</option>
            <option value="low">Baja</option>
          </select>
          <button
            onClick={load}
            className="px-3 py-2 rounded-md bg-cyan-500 text-white text-sm font-medium hover:bg-cyan-600 flex items-center gap-1"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refrescar
          </button>
        </div>

        {error && (
          <div className="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 text-sm p-3 rounded">
            {error}
          </div>
        )}

        {/* Lista */}
        <div className="bg-[#151C2E] rounded-lg border border-gray-800 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" /> Cargando...
            </div>
          ) : !data || data.alerts.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
              <p className="text-white font-medium mb-1">Sin alertas activas</p>
              <p className="text-sm text-gray-400">
                El sistema vigila menciones automaticamente y crea alertas cuando detecta picos de sentimiento negativo o trending topics hostiles.
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-700 text-sm">
              <thead className="bg-[#0B1120] text-xs uppercase text-gray-400">
                <tr>
                  <th className="px-3 py-2 text-left">Severidad</th>
                  <th className="px-3 py-2 text-left">Tipo</th>
                  <th className="px-3 py-2 text-left">Descripcion</th>
                  <th className="px-3 py-2 text-left">Usuario</th>
                  <th className="px-3 py-2 text-center">Estado</th>
                  <th className="px-3 py-2 text-left">Creada</th>
                  <th className="px-3 py-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700 text-gray-300">
                {data.alerts.map((alert) => (
                  <tr key={alert.id} className={alert.severity === 'critical' ? 'bg-red-900/10' : ''}>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${SEVERITY_BADGE[alert.severity] || ''}`}>
                        {alert.severity.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{alert.type}</td>
                    <td className="px-3 py-2 text-xs max-w-md truncate">{alert.description}</td>
                    <td className="px-3 py-2 text-xs">
                      {alert.user ? (
                        <Link href={`/admin/usuarios/${alert.user.id}`} className="text-cyan-400 hover:underline">
                          {alert.user.name || alert.user.email}
                        </Link>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[alert.status] || ''}`}>
                        {alert.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs">{formatDate(alert.createdAt)}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {alert.status === 'active' && (
                          <button
                            onClick={() => updateStatus(alert.id, 'acknowledged')}
                            disabled={acting === alert.id}
                            className="p-1.5 text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900/20 rounded disabled:opacity-50"
                            title="Marcar como acknowledged"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        {alert.status !== 'resolved' && (
                          <button
                            onClick={() => updateStatus(alert.id, 'resolved')}
                            disabled={acting === alert.id}
                            className="p-1.5 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20 rounded disabled:opacity-50"
                            title="Marcar como resuelta"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Paginacion */}
          {data && data.total > PAGE_SIZE && (
            <div className="border-t border-gray-800 px-4 py-3 flex items-center justify-between text-xs">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0 || loading}
                className="flex items-center gap-1 px-3 py-1 rounded bg-gray-700 text-white disabled:opacity-50"
              >
                <ChevronLeft className="w-3 h-3" /> Anterior
              </button>
              <span className="text-gray-400">
                Pagina {page + 1} de {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages - 1 || loading}
                className="flex items-center gap-1 px-3 py-1 rounded bg-gray-700 text-white disabled:opacity-50"
              >
                Siguiente <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </AdminPageWrapper>
  );
}
