"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Filter, Share2, Unplug, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AdminPageWrapper } from '@/components/admin';

interface Account {
  id: string;
  userId: string;
  user: { name: string; email: string; plan: string } | null;
  platform: string;
  username: string;
  displayName: string | null;
  followers: number;
  connected: boolean;
  lastSync: string | null;
  tokenExpiresAt: string | null;
  tokenStatus: 'valid' | 'expired' | 'unknown';
}

interface SocialResponse {
  success: boolean;
  total: number;
  limit: number;
  offset: number;
  accounts: Account[];
  stats: { totalAccounts: number; connected: number; expiredTokens: number; byPlatform: Record<string, number> };
}

const PAGE_SIZE = 50;
const PLATFORMS = ['', 'youtube', 'facebook', 'instagram', 'x'];

function fmt(iso: string | null): string {
  if (!iso) return '—';
  try { return format(new Date(iso), 'd MMM HH:mm', { locale: es }); } catch { return iso; }
}

const tokenBadge: Record<string, string> = {
  valid: 'bg-green-900/30 text-green-300',
  expired: 'bg-red-900/30 text-red-300',
  unknown: 'bg-gray-700 text-gray-300',
};

export default function AdminRedesPage() {
  const [platform, setPlatform] = useState('');
  const [connected, setConnected] = useState('');
  const [tokenStatus, setTokenStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState<SocialResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(page * PAGE_SIZE) });
      if (platform) params.set('platform', platform);
      if (connected) params.set('connected', connected);
      if (tokenStatus) params.set('tokenStatus', tokenStatus);
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/social?${params.toString()}`, { credentials: 'include' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || `HTTP ${res.status}`);
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Error cargando redes');
    } finally {
      setLoading(false);
    }
  }, [platform, connected, tokenStatus, search, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(0); }, [platform, connected, tokenStatus, search]);

  const act = async (action: 'disconnect' | 'refresh', a: Account) => {
    const label = action === 'disconnect' ? `Desconectar ${a.platform} de ${a.user?.email || a.username}?` : null;
    if (label && !window.confirm(label)) return;
    setBusy(a.id);
    try {
      const res = await fetch('/api/admin/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action, id: a.id, userId: a.userId }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || `HTTP ${res.status}`);
      await load();
    } catch (err: any) {
      alert(err.message || 'Error en la acción');
    } finally {
      setBusy(null);
    }
  };

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  return (
    <AdminPageWrapper title="Redes sociales" subtitle="Todas las cuentas conectadas de todos los usuarios">
      <div className="space-y-4">
        {/* Stats */}
        {data && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Cuentas" value={data.stats.totalAccounts} icon={<Share2 className="w-4 h-4" />} />
            <StatCard label="Conectadas" value={data.stats.connected} tone="green" />
            <StatCard label="Tokens vencidos" value={data.stats.expiredTokens} tone="red" />
            <StatCard label="Plataformas" value={Object.keys(data.stats.byPlatform).length} />
          </div>
        )}

        {/* Filtros */}
        <div className="bg-[#151C2E] rounded-lg p-4 border border-gray-800 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[180px]">
            <Filter className="w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar @usuario o nombre..."
              className="flex-1 px-3 py-2 rounded-md bg-[#0B1120] border border-gray-700 text-white text-sm placeholder-gray-500"
            />
          </div>
          <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="px-3 py-2 rounded-md bg-[#0B1120] border border-gray-700 text-white text-sm">
            {PLATFORMS.map((p) => <option key={p} value={p}>{p ? p : 'Todas las redes'}</option>)}
          </select>
          <select value={connected} onChange={(e) => setConnected(e.target.value)} className="px-3 py-2 rounded-md bg-[#0B1120] border border-gray-700 text-white text-sm">
            <option value="">Conexión: todas</option>
            <option value="true">Conectadas</option>
            <option value="false">Desconectadas</option>
          </select>
          <select value={tokenStatus} onChange={(e) => setTokenStatus(e.target.value)} className="px-3 py-2 rounded-md bg-[#0B1120] border border-gray-700 text-white text-sm">
            <option value="">Token: todos</option>
            <option value="valid">Válido</option>
            <option value="expired">Vencido</option>
          </select>
          <button onClick={load} disabled={loading} className="px-3 py-2 rounded-md bg-cyan-500 text-white text-sm font-medium flex items-center gap-1 hover:bg-cyan-600">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refrescar
          </button>
        </div>

        {/* Tabla */}
        <div className="bg-[#151C2E] rounded-lg border border-gray-800 overflow-hidden">
          {error ? (
            <div className="p-6 bg-red-900/20 text-red-300 text-sm">{error}</div>
          ) : loading ? (
            <div className="p-12 text-center text-gray-400"><RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />Cargando...</div>
          ) : !data || data.accounts.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-sm">No hay cuentas que coincidan.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700 text-sm">
                <thead className="bg-[#0B1120] text-xs uppercase text-gray-400">
                  <tr>
                    <th className="px-3 py-2 text-left">Usuario</th>
                    <th className="px-3 py-2 text-left">Red</th>
                    <th className="px-3 py-2 text-left">Cuenta</th>
                    <th className="px-3 py-2 text-right">Seguidores</th>
                    <th className="px-3 py-2 text-center">Token</th>
                    <th className="px-3 py-2 text-left">Último sync</th>
                    <th className="px-3 py-2 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700 text-gray-300">
                  {data.accounts.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-800">
                      <td className="px-3 py-2">
                        <div className="text-white">{a.user?.name || '—'}</div>
                        <div className="text-xs text-gray-500">{a.user?.email || a.userId}</div>
                      </td>
                      <td className="px-3 py-2"><span className="px-2 py-0.5 rounded text-xs bg-gray-700 font-mono">{a.platform}</span></td>
                      <td className="px-3 py-2">
                        <div>@{a.username}</div>
                        <div className="text-xs text-gray-500">{a.connected ? 'conectada' : 'desconectada'}</div>
                      </td>
                      <td className="px-3 py-2 text-right">{a.followers.toLocaleString('es-CO')}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-xs ${tokenBadge[a.tokenStatus]}`}>{a.tokenStatus}</span>
                      </td>
                      <td className="px-3 py-2 text-xs">{fmt(a.lastSync)}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => act('refresh', a)} disabled={busy === a.id} className="px-2 py-1 rounded bg-gray-700 text-xs hover:bg-gray-600 flex items-center gap-1 disabled:opacity-50">
                            <RefreshCw className={`w-3 h-3 ${busy === a.id ? 'animate-spin' : ''}`} /> Refresh
                          </button>
                          {a.connected && (
                            <button onClick={() => act('disconnect', a)} disabled={busy === a.id} className="px-2 py-1 rounded bg-red-900/40 text-red-300 text-xs hover:bg-red-900/60 flex items-center gap-1 disabled:opacity-50">
                              <Unplug className="w-3 h-3" /> Desconectar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {data && data.total > PAGE_SIZE && (
            <div className="border-t border-gray-800 px-4 py-3 flex items-center justify-between">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0 || loading} className="flex items-center gap-1 px-3 py-1 rounded-md bg-gray-700 text-white text-xs disabled:opacity-50">
                <ChevronLeft className="w-3 h-3" /> Anterior
              </button>
              <span className="text-xs text-gray-400">Página {page + 1} de {totalPages || 1}</span>
              <button onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages - 1 || loading} className="flex items-center gap-1 px-3 py-1 rounded-md bg-gray-700 text-white text-xs disabled:opacity-50">
                Siguiente <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </AdminPageWrapper>
  );
}

function StatCard({ label, value, icon, tone }: { label: string; value: number; icon?: React.ReactNode; tone?: 'green' | 'red' }) {
  const color = tone === 'green' ? 'text-green-400' : tone === 'red' ? 'text-red-400' : 'text-cyan-400';
  return (
    <div className="bg-[#151C2E] rounded-lg p-4 border border-gray-800">
      <div className="flex items-center gap-2 text-xs text-gray-400">{icon}{label}</div>
      <div className={`text-2xl font-bold mt-1 ${color}`}>{value.toLocaleString('es-CO')}</div>
    </div>
  );
}
