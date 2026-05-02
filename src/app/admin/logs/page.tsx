"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Activity, AlertTriangle, RefreshCw, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AdminPageWrapper } from '@/components/admin';

interface LogEntry {
  id: string;
  created_at: string;
  [key: string]: any;
}

interface LogsResponse {
  success: boolean;
  source: 'system' | 'oauth';
  total: number;
  limit: number;
  offset: number;
  logs: LogEntry[];
  topEventTypes: Array<{ type: string; count: number }>;
}

const PAGE_SIZE = 50;

function formatDate(iso: string): string {
  try {
    return format(new Date(iso), "d MMM HH:mm:ss", { locale: es });
  } catch {
    return iso;
  }
}

export default function LogsPage() {
  const [source, setSource] = useState<'system' | 'oauth'>('system');
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState<LogsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        source,
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
      });
      if (eventTypeFilter) params.set('eventType', eventTypeFilter);

      const res = await fetch(`/api/admin/logs?${params.toString()}`, { credentials: 'include' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || `HTTP ${res.status}`);
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Error cargando logs');
    } finally {
      setLoading(false);
    }
  }, [source, page, eventTypeFilter]);

  useEffect(() => {
    load();
  }, [load]);

  // Reset paginacion al cambiar filtro o source
  useEffect(() => {
    setPage(0);
  }, [source, eventTypeFilter]);

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  return (
    <AdminPageWrapper title="Logs del sistema" subtitle="Auditoria de eventos: cron, OAuth, errores y operaciones admin">
      <div className="space-y-4">
        {/* Tabs source */}
        <div className="flex gap-2">
          <button
            onClick={() => setSource('system')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              source === 'system'
                ? 'bg-cyan-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Activity className="w-4 h-4 inline mr-1" /> System logs
          </button>
          <button
            onClick={() => setSource('oauth')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              source === 'oauth'
                ? 'bg-cyan-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <AlertTriangle className="w-4 h-4 inline mr-1" /> OAuth logs
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-[#151C2E] rounded-lg p-4 border border-gray-800">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Filter className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={eventTypeFilter}
                onChange={(e) => setEventTypeFilter(e.target.value)}
                placeholder={source === 'system' ? 'Filtrar por event_type...' : 'Filtrar por action...'}
                className="flex-1 px-3 py-2 rounded-md bg-[#0B1120] border border-gray-700 text-white text-sm placeholder-gray-500"
              />
            </div>
            <button
              onClick={load}
              className="px-3 py-2 rounded-md bg-cyan-500 text-white text-sm font-medium flex items-center gap-1 hover:bg-cyan-600"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refrescar
            </button>
          </div>

          {/* Quick filters: top event types */}
          {data && data.topEventTypes.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-xs text-gray-500 self-center">Tipos frecuentes:</span>
              {data.topEventTypes.slice(0, 10).map((t) => (
                <button
                  key={t.type}
                  onClick={() => setEventTypeFilter(t.type)}
                  className={`px-2 py-1 text-xs rounded-full transition-colors ${
                    eventTypeFilter === t.type
                      ? 'bg-cyan-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {t.type} <span className="opacity-60">({t.count})</span>
                </button>
              ))}
              {eventTypeFilter && (
                <button
                  onClick={() => setEventTypeFilter('')}
                  className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                >
                  Limpiar filtro
                </button>
              )}
            </div>
          )}
        </div>

        {/* Resultados */}
        <div className="bg-[#151C2E] rounded-lg border border-gray-800 overflow-hidden">
          <div className="px-4 py-2 border-b border-gray-800 flex items-center justify-between text-xs">
            <span className="text-gray-400">
              {loading ? 'Cargando...' : data ? `${data.total.toLocaleString('es-CO')} registros totales` : ''}
            </span>
            <span className="text-gray-500">
              Pagina {page + 1} de {totalPages || 1}
            </span>
          </div>

          {error ? (
            <div className="p-6 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 text-sm">
              {error}
            </div>
          ) : loading ? (
            <div className="p-12 text-center text-gray-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
              Cargando logs...
            </div>
          ) : !data || data.logs.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-sm">No hay logs que coincidan con el filtro.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700 text-sm">
                <thead className="bg-[#0B1120] text-xs uppercase text-gray-400">
                  <tr>
                    <th className="px-3 py-2 text-left whitespace-nowrap">Fecha</th>
                    {source === 'system' ? (
                      <>
                        <th className="px-3 py-2 text-left">Event type</th>
                        <th className="px-3 py-2 text-left">Detalles</th>
                      </>
                    ) : (
                      <>
                        <th className="px-3 py-2 text-left">Action</th>
                        <th className="px-3 py-2 text-center">Success</th>
                        <th className="px-3 py-2 text-left">Plataforma</th>
                        <th className="px-3 py-2 text-left">Detalles</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700 text-gray-300">
                  {data.logs.map((log) => {
                    const isExpanded = expandedRow === log.id;
                    return (
                      <React.Fragment key={log.id}>
                        <tr
                          className="hover:bg-gray-800 cursor-pointer"
                          onClick={() => setExpandedRow(isExpanded ? null : log.id)}
                        >
                          <td className="px-3 py-2 text-xs whitespace-nowrap font-mono">
                            {formatDate(log.created_at)}
                          </td>
                          {source === 'system' ? (
                            <>
                              <td className="px-3 py-2">
                                <span className="px-2 py-0.5 rounded text-xs bg-gray-700 font-mono">{log.event_type}</span>
                              </td>
                              <td className="px-3 py-2 text-xs text-gray-400 truncate max-w-xs">
                                {log.details ? JSON.stringify(log.details).slice(0, 80) : '—'}
                                {log.details && JSON.stringify(log.details).length > 80 ? '...' : ''}
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-3 py-2">
                                <span className="px-2 py-0.5 rounded text-xs bg-gray-700 font-mono">{log.action}</span>
                              </td>
                              <td className="px-3 py-2 text-center">
                                <span className={`px-2 py-0.5 rounded text-xs ${
                                  log.success
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                }`}>
                                  {log.success ? 'OK' : 'FAIL'}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-xs">{log.platform || '—'}</td>
                              <td className="px-3 py-2 text-xs text-gray-400 truncate max-w-xs">
                                {log.error_message || (log.metadata ? JSON.stringify(log.metadata).slice(0, 80) : '—')}
                              </td>
                            </>
                          )}
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={source === 'system' ? 3 : 5} className="px-3 py-3 bg-[#0B1120]">
                              <pre className="text-xs text-gray-300 whitespace-pre-wrap break-words">
                                {JSON.stringify(log, null, 2)}
                              </pre>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginacion */}
          {data && data.total > PAGE_SIZE && (
            <div className="border-t border-gray-800 px-4 py-3 flex items-center justify-between">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0 || loading}
                className="flex items-center gap-1 px-3 py-1 rounded-md bg-gray-700 text-white text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-3 h-3" /> Anterior
              </button>
              <span className="text-xs text-gray-400">
                Mostrando {page * PAGE_SIZE + 1} - {Math.min((page + 1) * PAGE_SIZE, data.total)} de {data.total}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages - 1 || loading}
                className="flex items-center gap-1 px-3 py-1 rounded-md bg-gray-700 text-white text-xs disabled:opacity-50 disabled:cursor-not-allowed"
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
