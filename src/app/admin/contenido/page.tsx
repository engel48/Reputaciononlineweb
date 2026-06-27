"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Filter, Trash2, ChevronLeft, ChevronRight, MessageSquare, Newspaper } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AdminPageWrapper } from '@/components/admin';

type Tab = 'mentions' | 'news';
const PAGE_SIZE = 50;
const SENTIMENTS = ['', 'positive', 'neutral', 'negative'];

function fmt(iso: string | null): string {
  if (!iso) return '—';
  try { return format(new Date(iso), 'd MMM HH:mm', { locale: es }); } catch { return iso; }
}

const sentBadge: Record<string, string> = {
  positive: 'bg-green-900/30 text-green-300',
  negative: 'bg-red-900/30 text-red-300',
  neutral: 'bg-gray-700 text-gray-300',
};

export default function AdminContenidoPage() {
  const [tab, setTab] = useState<Tab>('mentions');
  const [search, setSearch] = useState('');
  const [sentiment, setSentiment] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ type: tab, limit: String(PAGE_SIZE), offset: String(page * PAGE_SIZE) });
      if (search) params.set('search', search);
      if (sentiment) params.set('sentiment', sentiment);
      const res = await fetch(`/api/admin/content?${params.toString()}`, { credentials: 'include' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || `HTTP ${res.status}`);
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Error cargando contenido');
    } finally {
      setLoading(false);
    }
  }, [tab, search, sentiment, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(0); }, [tab, search, sentiment]);

  const del = async (id: string) => {
    if (!window.confirm('¿Eliminar esta entrada? Esta acción no se puede deshacer.')) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/content?type=${tab}&id=${id}`, { method: 'DELETE', credentials: 'include' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || `HTTP ${res.status}`);
      await load();
    } catch (err: any) {
      alert(err.message || 'Error al borrar');
    } finally {
      setBusy(null);
    }
  };

  const items: any[] = data?.items || [];
  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  return (
    <AdminPageWrapper title="Contenido" subtitle="Menciones de redes y noticias scrapeadas (vista global)">
      <div className="space-y-4">
        <div className="flex gap-2">
          <TabBtn active={tab === 'mentions'} onClick={() => setTab('mentions')} icon={<MessageSquare className="w-4 h-4" />}>Menciones</TabBtn>
          <TabBtn active={tab === 'news'} onClick={() => setTab('news')} icon={<Newspaper className="w-4 h-4" />}>Noticias</TabBtn>
        </div>

        <div className="bg-[#151C2E] rounded-lg p-4 border border-gray-800 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Filter className="w-4 h-4 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={tab === 'mentions' ? 'Buscar contenido o @autor...' : 'Buscar título o resumen...'} className="flex-1 px-3 py-2 rounded-md bg-[#0B1120] border border-gray-700 text-white text-sm placeholder-gray-500" />
          </div>
          <select value={sentiment} onChange={(e) => setSentiment(e.target.value)} className="px-3 py-2 rounded-md bg-[#0B1120] border border-gray-700 text-white text-sm">
            {SENTIMENTS.map((s) => <option key={s} value={s}>{s ? s : 'Sentimiento: todos'}</option>)}
          </select>
          <button onClick={load} disabled={loading} className="px-3 py-2 rounded-md bg-cyan-500 text-white text-sm font-medium flex items-center gap-1 hover:bg-cyan-600">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refrescar
          </button>
        </div>

        <div className="bg-[#151C2E] rounded-lg border border-gray-800 overflow-hidden">
          <div className="px-4 py-2 border-b border-gray-800 text-xs text-gray-400">
            {loading ? 'Cargando...' : data ? `${data.total.toLocaleString('es-CO')} registros` : ''}
          </div>
          {error ? (
            <div className="p-6 bg-red-900/20 text-red-300 text-sm">{error}</div>
          ) : loading ? (
            <div className="p-12 text-center text-gray-400"><RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />Cargando...</div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-sm">No hay {tab === 'mentions' ? 'menciones' : 'noticias'} que coincidan.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700 text-sm">
                <thead className="bg-[#0B1120] text-xs uppercase text-gray-400">
                  {tab === 'mentions' ? (
                    <tr>
                      <th className="px-3 py-2 text-left">Usuario</th>
                      <th className="px-3 py-2 text-left">Red</th>
                      <th className="px-3 py-2 text-left">Contenido</th>
                      <th className="px-3 py-2 text-center">Sentimiento</th>
                      <th className="px-3 py-2 text-left">Fecha</th>
                      <th className="px-3 py-2 text-right">Acción</th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="px-3 py-2 text-left">Título</th>
                      <th className="px-3 py-2 text-left">Fuente</th>
                      <th className="px-3 py-2 text-center">Sentimiento</th>
                      <th className="px-3 py-2 text-left">Publicado</th>
                      <th className="px-3 py-2 text-right">Acción</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-gray-700 text-gray-300">
                  {items.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-800 align-top">
                      {tab === 'mentions' ? (
                        <>
                          <td className="px-3 py-2"><div className="text-white text-xs">{m.user?.name || '—'}</div><div className="text-xs text-gray-500">{m.user?.email || ''}</div></td>
                          <td className="px-3 py-2"><span className="px-2 py-0.5 rounded text-xs bg-gray-700 font-mono">{m.platform}</span></td>
                          <td className="px-3 py-2 text-xs max-w-md">
                            <div className="text-gray-300">{m.content}</div>
                            {m.url && <a href={m.url} target="_blank" rel="noreferrer" className="text-cyan-400 text-xs">ver →</a>}
                          </td>
                          <td className="px-3 py-2 text-center">{m.sentiment ? <span className={`px-2 py-0.5 rounded text-xs ${sentBadge[m.sentiment] || 'bg-gray-700'}`}>{m.sentiment}</span> : '—'}</td>
                          <td className="px-3 py-2 text-xs whitespace-nowrap">{fmt(m.publishedAt || m.scrapedAt)}</td>
                          <td className="px-3 py-2 text-right"><DelBtn busy={busy === m.id} onClick={() => del(m.id)} /></td>
                        </>
                      ) : (
                        <>
                          <td className="px-3 py-2 text-xs max-w-md">
                            <div className="text-gray-200">{m.title}</div>
                            {m.article_url && <a href={m.article_url} target="_blank" rel="noreferrer" className="text-cyan-400 text-xs">abrir artículo →</a>}
                          </td>
                          <td className="px-3 py-2 text-xs">{m.source}</td>
                          <td className="px-3 py-2 text-center">{m.sentiment ? <span className={`px-2 py-0.5 rounded text-xs ${sentBadge[m.sentiment] || 'bg-gray-700'}`}>{m.sentiment}</span> : '—'}</td>
                          <td className="px-3 py-2 text-xs whitespace-nowrap">{fmt(m.published_at || m.scraped_at)}</td>
                          <td className="px-3 py-2 text-right"><DelBtn busy={busy === m.id} onClick={() => del(m.id)} /></td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {data && data.total > PAGE_SIZE && (
            <div className="border-t border-gray-800 px-4 py-3 flex items-center justify-between">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0 || loading} className="flex items-center gap-1 px-3 py-1 rounded-md bg-gray-700 text-white text-xs disabled:opacity-50"><ChevronLeft className="w-3 h-3" /> Anterior</button>
              <span className="text-xs text-gray-400">Página {page + 1} de {totalPages || 1}</span>
              <button onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages - 1 || loading} className="flex items-center gap-1 px-3 py-1 rounded-md bg-gray-700 text-white text-xs disabled:opacity-50">Siguiente <ChevronRight className="w-3 h-3" /></button>
            </div>
          )}
        </div>
      </div>
    </AdminPageWrapper>
  );
}

function TabBtn({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1 ${active ? 'bg-cyan-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>{icon}{children}</button>
  );
}

function DelBtn({ busy, onClick }: { busy: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={busy} className="px-2 py-1 rounded bg-red-900/40 text-red-300 text-xs hover:bg-red-900/60 inline-flex items-center gap-1 disabled:opacity-50">
      <Trash2 className="w-3 h-3" /> Borrar
    </button>
  );
}
