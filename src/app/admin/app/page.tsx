"use client";

import React, { useCallback, useEffect, useState } from 'react';
import {
  Smartphone, Send, RefreshCw, Save, BarChart3, Megaphone, Settings2,
  Apple, Bot, CheckCircle, AlertCircle, Plus, Trash2,
} from 'lucide-react';
import { AdminPageWrapper } from '@/components/admin';

type TabKey = 'analytics' | 'push' | 'version' | 'config';

interface Analytics {
  devices: { total: number; android: number; ios: number; active7d: number };
  sessions: { last7d: number; last30d: number };
}

interface AppConfig {
  min_supported_version: string;
  latest_version: string;
  force_update: boolean;
  maintenance_mode: boolean;
  maintenance_message: string;
  update_url_android: string;
  update_url_ios: string;
  feature_flags: Record<string, boolean>;
  announcements: Array<{ title: string; body: string; level?: string }>;
}

interface Campaign {
  id: string;
  segment: string;
  title: string;
  body: string;
  sent_count: number;
  failed_count: number;
  created_at: string;
}

const CARD = 'rounded-2xl bg-[#151C2E] border border-gray-800 p-5';
const INPUT =
  'w-full rounded-lg bg-[#0B1120] border border-gray-700 px-3 py-2 text-white text-sm focus:border-[#00E5FF] focus:outline-none';
const LABEL = 'text-xs font-semibold text-gray-400 mb-1 block';
const BTN_PRIMARY =
  'inline-flex items-center gap-2 rounded-lg bg-[#00E5FF] px-4 py-2 text-sm font-semibold text-[#0B1120] hover:bg-[#33EAFF] disabled:opacity-50';

async function api(path: string, init?: RequestInit) {
  const res = await fetch(path, { credentials: 'include', ...init });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    throw new Error(json.error || json.message || `HTTP ${res.status}`);
  }
  return json;
}

export default function AdminAppPage() {
  const [tab, setTab] = useState<TabKey>('analytics');

  const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: 'analytics', label: 'Analíticas', icon: BarChart3 },
    { key: 'push', label: 'Notificaciones', icon: Send },
    { key: 'version', label: 'Versión / Mantenimiento', icon: Settings2 },
    { key: 'config', label: 'Config / Anuncios', icon: Megaphone },
  ];

  return (
    <AdminPageWrapper title="App Móvil" subtitle="Gestión de la app Reputación Online">
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
              tab === t.key
                ? 'bg-[#00E5FF]/15 text-[#00E5FF]'
                : 'text-gray-400 hover:bg-[#00E5FF]/10 hover:text-[#00E5FF]'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'analytics' && <AnalyticsTab />}
      {tab === 'push' && <PushTab />}
      {tab === 'version' && <ConfigTab section="version" />}
      {tab === 'config' && <ConfigTab section="config" />}
    </AdminPageWrapper>
  );
}

function Stat({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return (
    <div className={CARD}>
      <div className="flex items-center gap-3">
        <div className="rounded-xl p-2.5" style={{ backgroundColor: `${color}22` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div>
          <div className="text-2xl font-bold text-white">{value.toLocaleString('es-CO')}</div>
          <div className="text-xs text-gray-400">{label}</div>
        </div>
      </div>
    </div>
  );
}

function AnalyticsTab() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const json = await api('/api/admin/app/analytics');
      setData(json.data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={load} />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={Smartphone} label="Dispositivos totales" value={data.devices.total} color="#00E5FF" />
        <Stat icon={Bot} label="Android" value={data.devices.android} color="#10B981" />
        <Stat icon={Apple} label="iOS" value={data.devices.ios} color="#A78BFA" />
        <Stat icon={CheckCircle} label="Activos (7 días)" value={data.devices.active7d} color="#F59E0B" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Stat icon={BarChart3} label="Sesiones (7 días)" value={data.sessions.last7d} color="#00E5FF" />
        <Stat icon={BarChart3} label="Sesiones (30 días)" value={data.sessions.last30d} color="#01257D" />
      </div>
      <button onClick={load} className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-[#00E5FF]">
        <RefreshCw className="w-4 h-4" /> Actualizar
      </button>
    </div>
  );
}

function PushTab() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [segment, setSegment] = useState('all');
  const [plan, setPlan] = useState('');
  const [platform, setPlatform] = useState('android');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  const loadHistory = useCallback(async () => {
    try {
      const json = await api('/api/admin/app/push');
      setCampaigns(json.data || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const send = async () => {
    setSending(true);
    setResult(null);
    setError(null);
    try {
      const payload: any = { title, body, segment };
      if (segment === 'plan') payload.plan = plan;
      if (segment === 'platform') payload.platform = platform;
      const json = await api('/api/admin/app/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setResult(`Enviadas: ${json.data.sent} · Fallidas: ${json.data.failed} · Total: ${json.data.total}`);
      setTitle('');
      setBody('');
      loadHistory();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className={CARD}>
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Send className="w-4 h-4 text-[#00E5FF]" /> Componer notificación
        </h3>
        <div className="space-y-4">
          <div>
            <label className={LABEL}>Título</label>
            <input className={INPUT} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={64} placeholder="Ej: Nueva función disponible" />
          </div>
          <div>
            <label className={LABEL}>Mensaje</label>
            <textarea className={INPUT} value={body} onChange={(e) => setBody(e.target.value)} rows={3} maxLength={240} placeholder="Texto de la notificación…" />
          </div>
          <div>
            <label className={LABEL}>Segmento</label>
            <select className={INPUT} value={segment} onChange={(e) => setSegment(e.target.value)}>
              <option value="all">Todos los dispositivos</option>
              <option value="platform">Por plataforma</option>
              <option value="plan">Por plan</option>
            </select>
          </div>
          {segment === 'platform' && (
            <div>
              <label className={LABEL}>Plataforma</label>
              <select className={INPUT} value={platform} onChange={(e) => setPlatform(e.target.value)}>
                <option value="android">Android</option>
                <option value="ios">iOS</option>
              </select>
            </div>
          )}
          {segment === 'plan' && (
            <div>
              <label className={LABEL}>Código de plan</label>
              <input className={INPUT} value={plan} onChange={(e) => setPlan(e.target.value)} placeholder="Ej: pro" />
            </div>
          )}
          <button onClick={send} disabled={sending || !title || !body} className={BTN_PRIMARY}>
            {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sending ? 'Enviando…' : 'Enviar notificación'}
          </button>
          {result && (
            <div className="flex items-center gap-2 text-sm text-green-400">
              <CheckCircle className="w-4 h-4" /> {result}
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-400">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}
        </div>
      </div>

      <div className={CARD}>
        <h3 className="text-white font-semibold mb-4">Historial reciente</h3>
        {campaigns.length === 0 ? (
          <p className="text-sm text-gray-500">Sin campañas enviadas todavía.</p>
        ) : (
          <div className="space-y-3 max-h-[420px] overflow-y-auto">
            {campaigns.map((c) => (
              <div key={c.id} className="rounded-lg bg-[#0B1120] border border-gray-800 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{c.title}</span>
                  <span className="text-xs text-gray-500">{c.segment}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{c.body}</p>
                <div className="flex gap-3 mt-2 text-xs">
                  <span className="text-green-400">✓ {c.sent_count}</span>
                  <span className="text-red-400">✗ {c.failed_count}</span>
                  <span className="text-gray-500 ml-auto">{new Date(c.created_at).toLocaleString('es-CO')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ConfigTab({ section }: { section: 'version' | 'config' }) {
  const [cfg, setCfg] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const json = await api('/api/admin/app/config');
      const d = json.data || {};
      setCfg({
        min_supported_version: d.min_supported_version || '1.0.0',
        latest_version: d.latest_version || '1.0.0',
        force_update: !!d.force_update,
        maintenance_mode: !!d.maintenance_mode,
        maintenance_message: d.maintenance_message || '',
        update_url_android: d.update_url_android || '',
        update_url_ios: d.update_url_ios || '',
        feature_flags: d.feature_flags || {},
        announcements: d.announcements || [],
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!cfg) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await api('/api/admin/app/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfg),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;
  if (error && !cfg) return <ErrorBox message={error} onRetry={load} />;
  if (!cfg) return null;

  const set = (patch: Partial<AppConfig>) => setCfg({ ...cfg, ...patch });

  return (
    <div className="space-y-6 max-w-3xl">
      {section === 'version' ? (
        <>
          <div className={CARD}>
            <h3 className="text-white font-semibold mb-4">Control de versión</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Versión mínima soportada</label>
                <input className={INPUT} value={cfg.min_supported_version} onChange={(e) => set({ min_supported_version: e.target.value })} placeholder="1.0.0" />
              </div>
              <div>
                <label className={LABEL}>Última versión</label>
                <input className={INPUT} value={cfg.latest_version} onChange={(e) => set({ latest_version: e.target.value })} placeholder="1.1.0" />
              </div>
              <div>
                <label className={LABEL}>URL tienda Android</label>
                <input className={INPUT} value={cfg.update_url_android} onChange={(e) => set({ update_url_android: e.target.value })} placeholder="https://play.google.com/..." />
              </div>
              <div>
                <label className={LABEL}>URL tienda iOS</label>
                <input className={INPUT} value={cfg.update_url_ios} onChange={(e) => set({ update_url_ios: e.target.value })} placeholder="https://apps.apple.com/..." />
              </div>
            </div>
            <Toggle className="mt-4" label="Forzar actualización a todos" checked={cfg.force_update} onChange={(v) => set({ force_update: v })} />
          </div>

          <div className={CARD}>
            <h3 className="text-white font-semibold mb-4">Mantenimiento</h3>
            <Toggle label="Modo mantenimiento (bloquea la app)" checked={cfg.maintenance_mode} onChange={(v) => set({ maintenance_mode: v })} />
            <div className="mt-4">
              <label className={LABEL}>Mensaje de mantenimiento</label>
              <textarea className={INPUT} rows={2} value={cfg.maintenance_message} onChange={(e) => set({ maintenance_message: e.target.value })} />
            </div>
          </div>
        </>
      ) : (
        <>
          <FeatureFlagsEditor flags={cfg.feature_flags} onChange={(f) => set({ feature_flags: f })} />
          <AnnouncementsEditor items={cfg.announcements} onChange={(a) => set({ announcements: a })} />
        </>
      )}

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving} className={BTN_PRIMARY}>
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar cambios
        </button>
        {saved && <span className="flex items-center gap-1 text-sm text-green-400"><CheckCircle className="w-4 h-4" /> Guardado</span>}
        {error && <span className="flex items-center gap-1 text-sm text-red-400"><AlertCircle className="w-4 h-4" /> {error}</span>}
      </div>
    </div>
  );
}

function FeatureFlagsEditor({ flags, onChange }: { flags: Record<string, boolean>; onChange: (f: Record<string, boolean>) => void }) {
  const [newKey, setNewKey] = useState('');
  const entries = Object.entries(flags);
  return (
    <div className={CARD}>
      <h3 className="text-white font-semibold mb-4">Feature flags</h3>
      {entries.length === 0 && <p className="text-sm text-gray-500 mb-3">Sin flags. Agregá una abajo.</p>}
      <div className="space-y-2">
        {entries.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between rounded-lg bg-[#0B1120] border border-gray-800 px-3 py-2">
            <span className="text-sm text-white font-mono">{k}</span>
            <div className="flex items-center gap-3">
              <Toggle label="" checked={v} onChange={(val) => onChange({ ...flags, [k]: val })} />
              <button onClick={() => { const f = { ...flags }; delete f[k]; onChange(f); }} className="text-red-400 hover:text-red-300">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-3">
        <input className={INPUT} value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="nombre_del_flag" />
        <button
          onClick={() => { if (newKey.trim()) { onChange({ ...flags, [newKey.trim()]: false }); setNewKey(''); } }}
          className="inline-flex items-center gap-1 rounded-lg bg-[#00E5FF]/15 px-3 text-sm text-[#00E5FF]"
        >
          <Plus className="w-4 h-4" /> Agregar
        </button>
      </div>
    </div>
  );
}

function AnnouncementsEditor({ items, onChange }: { items: Array<{ title: string; body: string; level?: string }>; onChange: (a: Array<{ title: string; body: string; level?: string }>) => void }) {
  return (
    <div className={CARD}>
      <h3 className="text-white font-semibold mb-4">Anuncios in-app</h3>
      <div className="space-y-3">
        {items.map((a, i) => (
          <div key={i} className="rounded-lg bg-[#0B1120] border border-gray-800 p-3 space-y-2">
            <div className="flex gap-2">
              <input className={INPUT} value={a.title} onChange={(e) => { const c = [...items]; c[i] = { ...a, title: e.target.value }; onChange(c); }} placeholder="Título" />
              <select className={INPUT + ' max-w-[140px]'} value={a.level || 'info'} onChange={(e) => { const c = [...items]; c[i] = { ...a, level: e.target.value }; onChange(c); }}>
                <option value="info">Info</option>
                <option value="success">Éxito</option>
                <option value="warning">Aviso</option>
              </select>
              <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-300 px-2">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <textarea className={INPUT} rows={2} value={a.body} onChange={(e) => { const c = [...items]; c[i] = { ...a, body: e.target.value }; onChange(c); }} placeholder="Mensaje" />
          </div>
        ))}
      </div>
      <button
        onClick={() => onChange([...items, { title: '', body: '', level: 'info' }])}
        className="inline-flex items-center gap-1 rounded-lg bg-[#00E5FF]/15 px-3 py-2 mt-3 text-sm text-[#00E5FF]"
      >
        <Plus className="w-4 h-4" /> Agregar anuncio
      </button>
    </div>
  );
}

function Toggle({ label, checked, onChange, className = '' }: { label: string; checked: boolean; onChange: (v: boolean) => void; className?: string }) {
  return (
    <label className={`flex items-center gap-3 cursor-pointer ${className}`}>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition ${checked ? 'bg-[#00E5FF]' : 'bg-gray-600'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </button>
      {label && <span className="text-sm text-gray-300">{label}</span>}
    </label>
  );
}

function Loading() {
  return (
    <div className="flex items-center gap-2 text-gray-400 text-sm">
      <RefreshCw className="w-4 h-4 animate-spin" /> Cargando…
    </div>
  );
}

function ErrorBox({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className={CARD}>
      <div className="flex items-center gap-2 text-red-400 text-sm mb-3">
        <AlertCircle className="w-4 h-4" /> {message}
      </div>
      <button onClick={onRetry} className="inline-flex items-center gap-2 text-sm text-[#00E5FF]">
        <RefreshCw className="w-4 h-4" /> Reintentar
      </button>
    </div>
  );
}
