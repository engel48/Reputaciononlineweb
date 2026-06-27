"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Filter, Trash2, ChevronLeft, ChevronRight, Bell, BellRing, CreditCard, Eraser, Send, Power, Ban } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AdminPageWrapper } from '@/components/admin';

type Tab = 'notifications' | 'alerts' | 'subscriptions';
const PAGE_SIZE = 50;

function fmt(iso: string | null): string {
  if (!iso) return '—';
  try { return format(new Date(iso), 'd MMM HH:mm', { locale: es }); } catch { return iso; }
}

export default function AdminComunicacionesPage() {
  const [tab, setTab] = useState<Tab>('notifications');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [showBroadcast, setShowBroadcast] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ type: tab, limit: String(PAGE_SIZE), offset: String(page * PAGE_SIZE) });
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/communications?${params.toString()}`, { credentials: 'include' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || `HTTP ${res.status}`);
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Error cargando comunicaciones');
    } finally {
      setLoading(false);
    }
  }, [tab, search, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(0); }, [tab, search]);

  const del = async (id: string) => {
    if (!window.confirm('¿Eliminar este registro?')) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/communications?type=${tab}&id=${id}`, { method: 'DELETE', credentials: 'include' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || `HTTP ${res.status}`);
      await load();
    } catch (err: any) {
      alert(err.message || 'Error al borrar');
    } finally {
      setBusy(null);
    }
  };

  const patch = async (payload: any, id: string) => {
    setBusy(id);
    try {
      const res = await fetch('/api/admin/communications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
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

  const toggleAlert = (it: any) => patch({ type: 'alerts', id: it.id, isActive: !it.is_active }, it.id);
  const cancelSub = (it: any) => {
    if (!window.confirm('¿Cancelar esta suscripción?')) return;
    patch({ type: 'subscriptions', id: it.id, status: 'cancelled' }, it.id);
  };

  const purge = async () => {
    if (!window.confirm('¿Purgar notificaciones LEÍDAS de más de 30 días?')) return;
    setBusy('purge');
    try {
      const res = await fetch('/api/admin/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'purge', olderThanDays: 30 }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || `HTTP ${res.status}`);
      alert(`Purgadas ${json.purged} notificaciones.`);
      await load();
    } catch (err: any) {
      alert(err.message || 'Error al purgar');
    } finally {
      setBusy(null);
    }
  };

  const items: any[] = data?.items || [];
  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  return (
    <AdminPageWrapper title="Comunicaciones" subtitle="Notificaciones, alertas de usuarios y suscripciones">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 items-center">
          <TabBtn active={tab === 'notifications'} onClick={() => setTab('notifications')} icon={<Bell className="w-4 h-4" />}>Notificaciones</TabBtn>
          <TabBtn active={tab === 'alerts'} onClick={() => setTab('alerts')} icon={<BellRing className="w-4 h-4" />}>Alertas</TabBtn>
          <TabBtn active={tab === 'subscriptions'} onClick={() => setTab('subscriptions')} icon={<CreditCard className="w-4 h-4" />}>Suscripciones</TabBtn>
          {tab === 'notifications' && (
            <div className="ml-auto flex gap-2">
              <button onClick={() => setShowBroadcast(true)} className="px-3 py-2 rounded-md bg-cyan-500 text-white text-sm font-medium flex items-center gap-1 hover:bg-cyan-600">
                <Send className="w-4 h-4" /> Difundir
              </button>
              <button onClick={purge} disabled={busy === 'purge'} className="px-3 py-2 rounded-md bg-amber-900/40 text-amber-300 text-sm font-medium flex items-center gap-1 hover:bg-amber-900/60 disabled:opacity-50">
                <Eraser className="w-4 h-4" /> Purgar leídas +30d
              </button>
            </div>
          )}
        </div>

        <div className="bg-[#151C2E] rounded-lg p-4 border border-gray-800 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Filter className="w-4 h-4 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="flex-1 px-3 py-2 rounded-md bg-[#0B1120] border border-gray-700 text-white text-sm placeholder-gray-500" />
          </div>
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
            <div className="p-12 text-center text-gray-400 text-sm">No hay registros.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700 text-sm">
                <thead className="bg-[#0B1120] text-xs uppercase text-gray-400">
                  {tab === 'notifications' && (
                    <tr><th className="px-3 py-2 text-left">Usuario</th><th className="px-3 py-2 text-left">Título</th><th className="px-3 py-2 text-left">Mensaje</th><th className="px-3 py-2 text-center">Leída</th><th className="px-3 py-2 text-left">Fecha</th><th className="px-3 py-2 text-right">Acción</th></tr>
                  )}
                  {tab === 'alerts' && (
                    <tr><th className="px-3 py-2 text-left">Usuario</th><th className="px-3 py-2 text-left">Nombre</th><th className="px-3 py-2 text-left">Keywords</th><th className="px-3 py-2 text-center">Activa</th><th className="px-3 py-2 text-left">Últim. disparo</th><th className="px-3 py-2 text-right">Acciones</th></tr>
                  )}
                  {tab === 'subscriptions' && (
                    <tr><th className="px-3 py-2 text-left">Usuario</th><th className="px-3 py-2 text-left">Plan</th><th className="px-3 py-2 text-center">Estado</th><th className="px-3 py-2 text-left">Período</th><th className="px-3 py-2 text-center">Cancela fin período</th><th className="px-3 py-2 text-right">Acción</th></tr>
                  )}
                </thead>
                <tbody className="divide-y divide-gray-700 text-gray-300">
                  {items.map((it) => (
                    <tr key={it.id} className="hover:bg-gray-800 align-top">
                      <td className="px-3 py-2"><div className="text-white text-xs">{it.user?.name || '—'}</div><div className="text-xs text-gray-500">{it.user?.email || ''}</div></td>
                      {tab === 'notifications' && (
                        <>
                          <td className="px-3 py-2 text-xs">{it.title}</td>
                          <td className="px-3 py-2 text-xs text-gray-400 max-w-xs">{String(it.message || '').slice(0, 120)}</td>
                          <td className="px-3 py-2 text-center text-xs">{it.is_read ? '✓' : '—'}</td>
                          <td className="px-3 py-2 text-xs whitespace-nowrap">{fmt(it.created_at)}</td>
                          <td className="px-3 py-2 text-right"><DelBtn busy={busy === it.id} onClick={() => del(it.id)} /></td>
                        </>
                      )}
                      {tab === 'alerts' && (
                        <>
                          <td className="px-3 py-2 text-xs">{it.name}</td>
                          <td className="px-3 py-2 text-xs text-gray-400 max-w-xs">{it.keywords}</td>
                          <td className="px-3 py-2 text-center text-xs">
                            <span className={`px-2 py-0.5 rounded text-xs ${it.is_active ? 'bg-green-900/30 text-green-300' : 'bg-gray-700 text-gray-400'}`}>{it.is_active ? 'activa' : 'inactiva'}</span>
                          </td>
                          <td className="px-3 py-2 text-xs whitespace-nowrap">{fmt(it.last_triggered)}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => toggleAlert(it)} disabled={busy === it.id} className="px-2 py-1 rounded bg-gray-700 text-xs hover:bg-gray-600 inline-flex items-center gap-1 disabled:opacity-50">
                                <Power className="w-3 h-3" /> {it.is_active ? 'Desactivar' : 'Activar'}
                              </button>
                              <DelBtn busy={busy === it.id} onClick={() => del(it.id)} />
                            </div>
                          </td>
                        </>
                      )}
                      {tab === 'subscriptions' && (
                        <>
                          <td className="px-3 py-2 text-xs">{it.plan_type}</td>
                          <td className="px-3 py-2 text-center"><span className="px-2 py-0.5 rounded text-xs bg-gray-700">{it.status}</span></td>
                          <td className="px-3 py-2 text-xs whitespace-nowrap">{fmt(it.current_period_start)} → {fmt(it.current_period_end)}</td>
                          <td className="px-3 py-2 text-center text-xs">{it.cancel_at_period_end ? '✓' : '—'}</td>
                          <td className="px-3 py-2 text-right">
                            {it.status !== 'cancelled' && it.status !== 'canceled' ? (
                              <button onClick={() => cancelSub(it)} disabled={busy === it.id} className="px-2 py-1 rounded bg-red-900/40 text-red-300 text-xs hover:bg-red-900/60 inline-flex items-center gap-1 disabled:opacity-50">
                                <Ban className="w-3 h-3" /> Cancelar
                              </button>
                            ) : <span className="text-xs text-gray-500">—</span>}
                          </td>
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

      {showBroadcast && <BroadcastModal onClose={() => setShowBroadcast(false)} onSent={() => { setShowBroadcast(false); load(); }} />}
    </AdminPageWrapper>
  );
}

function BroadcastModal({ onClose, onSent }: { onClose: () => void; onSent: () => void }) {
  const [segment, setSegment] = useState<'all' | 'plan'>('all');
  const [plan, setPlan] = useState('free');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const send = async () => {
    if (!title.trim() || !message.trim()) { setErr('Título y mensaje son requeridos'); return; }
    setSending(true);
    setErr(null);
    try {
      const body: any = { action: 'broadcast', segment, title: title.trim(), message: message.trim() };
      if (segment === 'plan') body.plan = plan;
      const res = await fetch('/api/admin/communications', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || `HTTP ${res.status}`);
      alert(`Notificación enviada a ${json.sent} usuario(s).`);
      onSent();
    } catch (e: any) {
      setErr(e.message || 'Error al enviar');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-[#151C2E] border border-gray-700 rounded-xl w-full max-w-md p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-white font-semibold flex items-center gap-2"><Send className="w-4 h-4 text-cyan-400" /> Difundir notificación</h3>
        <div className="flex gap-2">
          <select value={segment} onChange={(e) => setSegment(e.target.value as any)} className="px-3 py-2 rounded-md bg-[#0B1120] border border-gray-700 text-white text-sm">
            <option value="all">Todos los usuarios activos</option>
            <option value="plan">Por plan</option>
          </select>
          {segment === 'plan' && (
            <select value={plan} onChange={(e) => setPlan(e.target.value)} className="px-3 py-2 rounded-md bg-[#0B1120] border border-gray-700 text-white text-sm">
              {['free', 'basico', 'pro', 'enterprise'].map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          )}
        </div>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" className="w-full px-3 py-2 rounded-md bg-[#0B1120] border border-gray-700 text-white text-sm placeholder-gray-500" />
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Mensaje" rows={3} className="w-full px-3 py-2 rounded-md bg-[#0B1120] border border-gray-700 text-white text-sm placeholder-gray-500" />
        {err && <div className="text-red-300 text-xs">{err}</div>}
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="px-3 py-2 rounded-md bg-gray-700 text-white text-sm">Cancelar</button>
          <button onClick={send} disabled={sending} className="px-3 py-2 rounded-md bg-cyan-500 text-white text-sm font-medium flex items-center gap-1 disabled:opacity-50">
            <Send className="w-4 h-4" /> {sending ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
      </div>
    </div>
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
