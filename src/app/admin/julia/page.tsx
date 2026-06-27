"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Filter, Trash2, ChevronLeft, ChevronRight, Bot, Coins, MessagesSquare } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AdminPageWrapper } from '@/components/admin';

const PAGE_SIZE = 50;

function fmt(iso: string | null): string {
  if (!iso) return '—';
  try { return format(new Date(iso), 'd MMM HH:mm', { locale: es }); } catch { return iso; }
}

export default function AdminJuliaPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(page * PAGE_SIZE) });
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/julia?${params.toString()}`, { credentials: 'include' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || `HTTP ${res.status}`);
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Error cargando Julia');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(0); }, [search]);

  const del = async (id: string) => {
    if (!window.confirm('¿Eliminar esta conversación?')) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/julia?id=${id}`, { method: 'DELETE', credentials: 'include' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || `HTTP ${res.status}`);
      await load();
    } catch (err: any) {
      alert(err.message || 'Error al borrar');
    } finally {
      setBusy(null);
    }
  };

  const stats = data?.stats;
  const conversations: any[] = data?.conversations || [];
  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  return (
    <AdminPageWrapper title="Julia IA" subtitle="Uso de la asistente de IA: consumo de créditos y conversaciones">
      <div className="space-y-4">
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <StatCard label="Conversaciones" value={stats.conversationsTotal} icon={<MessagesSquare className="w-4 h-4" />} />
            <StatCard label="Créditos IA consumidos" value={stats.creditsConsumed} icon={<Coins className="w-4 h-4" />} tone="amber" />
            <StatCard label="Acciones IA" value={Object.keys(stats.byAction || {}).length} icon={<Bot className="w-4 h-4" />} />
          </div>
        )}

        {stats?.topUsers?.length > 0 && (
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-xs text-gray-500 mb-2">Top usuarios por consumo de IA</div>
            <div className="flex flex-wrap gap-2">
              {stats.topUsers.map((u: any) => (
                <span key={u.userId} className="px-2 py-1 rounded-full bg-gray-50 border border-gray-200 text-xs text-gray-600">
                  {u.name || u.email || u.userId} <span className="text-amber-600 font-semibold">· {u.creditsConsumed}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg p-4 border border-gray-200 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Filter className="w-4 h-4 text-gray-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por título de conversación..." className="flex-1 px-3 py-2 rounded-md bg-gray-50 border border-gray-200 text-gray-900 text-sm placeholder-gray-500" />
          </div>
          <button onClick={load} disabled={loading} className="px-3 py-2 rounded-md bg-cyan-500 text-white text-sm font-medium flex items-center gap-1 hover:bg-cyan-600">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refrescar
          </button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-2 border-b border-gray-200 text-xs text-gray-500">
            {loading ? 'Cargando...' : data ? `${data.total.toLocaleString('es-CO')} conversaciones` : ''}
          </div>
          {error ? (
            <div className="p-6 bg-red-50 text-red-700 text-sm">{error}</div>
          ) : loading ? (
            <div className="p-12 text-center text-gray-500"><RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />Cargando...</div>
          ) : conversations.length === 0 ? (
            <div className="p-12 text-center text-gray-500 text-sm">No hay conversaciones.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Usuario</th>
                    <th className="px-3 py-2 text-left">Título</th>
                    <th className="px-3 py-2 text-left">Creada</th>
                    <th className="px-3 py-2 text-left">Actualizada</th>
                    <th className="px-3 py-2 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-gray-600">
                  {conversations.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-100">
                      <td className="px-3 py-2"><div className="text-gray-900 text-xs">{c.user?.name || '—'}</div><div className="text-xs text-gray-500">{c.user?.email || ''}</div></td>
                      <td className="px-3 py-2 text-xs">{c.title || '(sin título)'}</td>
                      <td className="px-3 py-2 text-xs whitespace-nowrap">{fmt(c.createdAt)}</td>
                      <td className="px-3 py-2 text-xs whitespace-nowrap">{fmt(c.updatedAt)}</td>
                      <td className="px-3 py-2 text-right">
                        <button onClick={() => del(c.id)} disabled={busy === c.id} className="px-2 py-1 rounded bg-red-100 text-red-700 text-xs hover:bg-red-200 inline-flex items-center gap-1 disabled:opacity-50">
                          <Trash2 className="w-3 h-3" /> Borrar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {data && data.total > PAGE_SIZE && (
            <div className="border-t border-gray-200 px-4 py-3 flex items-center justify-between">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0 || loading} className="flex items-center gap-1 px-3 py-1 rounded-md bg-gray-100 text-gray-900 text-xs disabled:opacity-50"><ChevronLeft className="w-3 h-3" /> Anterior</button>
              <span className="text-xs text-gray-500">Página {page + 1} de {totalPages || 1}</span>
              <button onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages - 1 || loading} className="flex items-center gap-1 px-3 py-1 rounded-md bg-gray-100 text-gray-900 text-xs disabled:opacity-50">Siguiente <ChevronRight className="w-3 h-3" /></button>
            </div>
          )}
        </div>
      </div>
    </AdminPageWrapper>
  );
}

function StatCard({ label, value, icon, tone }: { label: string; value: number; icon?: React.ReactNode; tone?: 'amber' }) {
  const color = tone === 'amber' ? 'text-amber-600' : 'text-cyan-600';
  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <div className="flex items-center gap-2 text-xs text-gray-500">{icon}{label}</div>
      <div className={`text-2xl font-bold mt-1 ${color}`}>{value.toLocaleString('es-CO')}</div>
    </div>
  );
}
