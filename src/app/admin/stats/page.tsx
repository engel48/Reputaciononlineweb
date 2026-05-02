"use client";

import React, { useEffect, useState, useCallback } from 'react';
import {
  Users, CreditCard, DollarSign, Activity, AlertTriangle, RefreshCw, Heart,
  TrendingUp, Globe, Server, CheckCircle, XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AdminPageWrapper } from '@/components/admin';

interface OverviewResponse {
  success: boolean;
  generatedAt: string;
  users: {
    total: number;
    activeLast30d: number;
    byPlan: Record<string, number>;
    byProfileType: Record<string, number>;
  };
  credits: {
    inCirculation: number;
    consumedLast30d: number;
    bonusLast30d: number;
    purchasedLast30d: number;
    topConsumers: Array<{ userId: string; consumed: number; user: { id: string; name: string; email: string; plan: string } | null }>;
  };
  payments: {
    revenueTotal: number;
    revenueLast30d: number;
    byStatus: Record<string, { count: number; amount: number }>;
  };
  platform: {
    socialAccountsConnected: number;
    mentionsLast7d: number;
    mentionsLast30d: number;
    mentionsLast90d: number;
    scrapedNewsLast30d: number;
  };
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
    averageScore: number | null;
    totalAnalyzed: number;
  };
  health: {
    lastTokenRefresh: { at: string; status: number | null; summary: any } | null;
    lastSocialSync: { at: string; summary: any } | null;
    errorsLast24h: number;
    activeCrisisAlerts: number;
  };
}

function formatCOP(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(iso: string): string {
  try {
    return format(new Date(iso), "d MMM HH:mm", { locale: es });
  } catch { return iso; }
}

export default function StatsPage() {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/stats/overview', { credentials: 'include' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || `HTTP ${res.status}`);
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Error cargando stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <AdminPageWrapper title="Stats globales" subtitle="Cargando...">
        <div className="text-center py-12 text-gray-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" /> Calculando metricas...
        </div>
      </AdminPageWrapper>
    );
  }

  if (error || !data) {
    return (
      <AdminPageWrapper title="Stats globales" subtitle="">
        <div className="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 p-4 rounded-lg">
          <AlertTriangle className="inline w-4 h-4 mr-1" /> {error || 'Sin datos'}
        </div>
      </AdminPageWrapper>
    );
  }

  const sentimentTotal = data.sentiment.positive + data.sentiment.neutral + data.sentiment.negative;

  return (
    <AdminPageWrapper title="Stats globales" subtitle={`Snapshot agregado de toda la plataforma · generado a las ${formatDate(data.generatedAt)}`}>
      <div className="space-y-6">
        <div className="flex justify-end">
          <button onClick={load} className="px-3 py-2 rounded-md bg-cyan-500 text-white text-sm font-medium flex items-center gap-1 hover:bg-cyan-600">
            <RefreshCw className="w-4 h-4" /> Refrescar
          </button>
        </div>

        {/* Top stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Usuarios" value={data.users.total} sub={`${data.users.activeLast30d} activos 30d`} />
          <StatCard icon={CreditCard} label="Creditos en circulacion" value={data.credits.inCirculation.toLocaleString('es-CO')} sub={`${data.credits.consumedLast30d.toLocaleString('es-CO')} consumidos 30d`} />
          <StatCard icon={DollarSign} label="Revenue 30d" value={formatCOP(data.payments.revenueLast30d)} sub={`${formatCOP(data.payments.revenueTotal)} total historico`} />
          <StatCard icon={Activity} label="Menciones 7d" value={data.platform.mentionsLast7d} sub={`${data.platform.mentionsLast30d} en 30d`} />
        </div>

        {/* Usuarios */}
        <div className="bg-[#151C2E] rounded-lg p-6 border border-gray-800">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" /> Usuarios
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DistributionList
              title="Por plan"
              entries={Object.entries(data.users.byPlan).sort((a, b) => b[1] - a[1])}
              total={data.users.total}
            />
            <DistributionList
              title="Por tipo de perfil"
              entries={Object.entries(data.users.byProfileType).sort((a, b) => b[1] - a[1])}
              total={data.users.total}
            />
          </div>
        </div>

        {/* Creditos */}
        <div className="bg-[#151C2E] rounded-lg p-6 border border-gray-800">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-cyan-400" /> Creditos (ultimos 30 dias)
          </h3>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Mini label="Consumo" value={data.credits.consumedLast30d.toLocaleString('es-CO')} color="text-orange-400" />
            <Mini label="Bonus (renovacion)" value={data.credits.bonusLast30d.toLocaleString('es-CO')} color="text-green-400" />
            <Mini label="Compras" value={data.credits.purchasedLast30d.toLocaleString('es-CO')} color="text-cyan-400" />
          </div>
          {data.credits.topConsumers.length > 0 && (
            <div>
              <p className="text-sm text-gray-400 mb-2">Top 5 consumidores</p>
              <div className="space-y-1">
                {data.credits.topConsumers.map((tc, i) => (
                  <div key={tc.userId} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-700">
                    <span className="text-white">
                      <span className="text-gray-500 mr-2">#{i + 1}</span>
                      {tc.user?.name || tc.user?.email || tc.userId.slice(0, 8)}
                      {tc.user?.plan && (
                        <span className="ml-2 text-xs text-gray-500">({tc.user.plan})</span>
                      )}
                    </span>
                    <span className="text-orange-400 font-medium">{tc.consumed.toLocaleString('es-CO')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pagos */}
        <div className="bg-[#151C2E] rounded-lg p-6 border border-gray-800">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-cyan-400" /> Pagos
          </h3>
          {Object.keys(data.payments.byStatus).length === 0 ? (
            <p className="text-gray-500 text-sm">Sin pagos registrados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-xs uppercase text-gray-400 border-b border-gray-700">
                  <tr>
                    <th className="text-left py-2">Estado</th>
                    <th className="text-right py-2">Cantidad</th>
                    <th className="text-right py-2">Monto total</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(data.payments.byStatus).map(([status, info]) => (
                    <tr key={status} className="border-b border-gray-700 last:border-0">
                      <td className="py-2 capitalize text-white">{status}</td>
                      <td className="py-2 text-right text-gray-300">{info.count}</td>
                      <td className="py-2 text-right text-cyan-400">{formatCOP(info.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Sentimiento global */}
        <div className="bg-[#151C2E] rounded-lg p-6 border border-gray-800">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-cyan-400" /> Sentimiento global (30d)
          </h3>
          {sentimentTotal === 0 ? (
            <p className="text-gray-500 text-sm">Sin menciones analizadas en los ultimos 30 dias.</p>
          ) : (
            <>
              <div className="flex h-4 rounded-full overflow-hidden mb-2">
                <div className="bg-green-500" style={{ width: `${data.sentiment.positive}%` }} title={`Positivo ${data.sentiment.positive}%`} />
                <div className="bg-yellow-500" style={{ width: `${data.sentiment.neutral}%` }} title={`Neutral ${data.sentiment.neutral}%`} />
                <div className="bg-red-500" style={{ width: `${data.sentiment.negative}%` }} title={`Negativo ${data.sentiment.negative}%`} />
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span className="text-green-400">{data.sentiment.positive}% positivo</span>
                <span className="text-yellow-400">{data.sentiment.neutral}% neutro</span>
                <span className="text-red-400">{data.sentiment.negative}% negativo</span>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Basado en {data.sentiment.totalAnalyzed.toLocaleString('es-CO')} menciones analizadas.
                {data.sentiment.averageScore !== null && (
                  <> Score promedio: <span className="text-white font-medium">{data.sentiment.averageScore}</span>/100</>
                )}
              </p>
            </>
          )}
        </div>

        {/* Salud */}
        <div className="bg-[#151C2E] rounded-lg p-6 border border-gray-800">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Server className="w-5 h-5 text-cyan-400" /> Salud del sistema
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs uppercase text-gray-400 mb-1">Ultimo token refresh</p>
              {data.health.lastTokenRefresh ? (
                <>
                  <p className="text-white">{formatDate(data.health.lastTokenRefresh.at)}</p>
                  <p className="text-xs">
                    Status:{' '}
                    {data.health.lastTokenRefresh.status === 200 ? (
                      <span className="text-green-400 font-medium"><CheckCircle className="inline w-3 h-3" /> 200 OK</span>
                    ) : (
                      <span className="text-red-400 font-medium"><XCircle className="inline w-3 h-3" /> {data.health.lastTokenRefresh.status}</span>
                    )}
                  </p>
                </>
              ) : (
                <p className="text-gray-500">Nunca ejecutado</p>
              )}
            </div>
            <div>
              <p className="text-xs uppercase text-gray-400 mb-1">Ultimo sync social</p>
              {data.health.lastSocialSync ? (
                <>
                  <p className="text-white">{formatDate(data.health.lastSocialSync.at)}</p>
                  <p className="text-xs text-gray-400">
                    Menciones creadas: {data.health.lastSocialSync.summary?.mentions_created ?? 0}
                  </p>
                </>
              ) : (
                <p className="text-gray-500">Nunca ejecutado</p>
              )}
            </div>
            <div>
              <p className="text-xs uppercase text-gray-400 mb-1">Errores 24h</p>
              <p className={`text-2xl font-bold ${data.health.errorsLast24h > 0 ? 'text-red-400' : 'text-green-400'}`}>
                {data.health.errorsLast24h}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-400 mb-1">Crisis alerts activas</p>
              <p className={`text-2xl font-bold ${data.health.activeCrisisAlerts > 0 ? 'text-red-400' : 'text-green-400'}`}>
                {data.health.activeCrisisAlerts}
              </p>
            </div>
          </div>
        </div>

        {/* Plataforma */}
        <div className="bg-[#151C2E] rounded-lg p-6 border border-gray-800">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-cyan-400" /> Plataforma
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Mini label="Redes conectadas" value={data.platform.socialAccountsConnected} />
            <Mini label="Menciones 7d" value={data.platform.mentionsLast7d.toLocaleString('es-CO')} />
            <Mini label="Menciones 30d" value={data.platform.mentionsLast30d.toLocaleString('es-CO')} />
            <Mini label="Menciones 90d" value={data.platform.mentionsLast90d.toLocaleString('es-CO')} />
            <Mini label="Noticias 30d" value={data.platform.scrapedNewsLast30d.toLocaleString('es-CO')} />
          </div>
        </div>
      </div>
    </AdminPageWrapper>
  );
}

function StatCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: any; sub?: string }) {
  return (
    <div className="bg-[#151C2E] rounded-lg p-4 border border-gray-800">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-5 h-5 text-cyan-400" />
        <span className="text-xs uppercase tracking-wide text-gray-400">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

function Mini({ label, value, color = 'text-white' }: { label: string; value: any; color?: string }) {
  return (
    <div>
      <p className="text-xs uppercase text-gray-400">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function DistributionList({ title, entries, total }: { title: string; entries: Array<[string, number]>; total: number }) {
  if (entries.length === 0) return <div><p className="text-gray-500 text-sm">{title}: sin datos</p></div>;
  return (
    <div>
      <p className="text-sm font-medium text-gray-300 mb-2">{title}</p>
      <div className="space-y-1.5">
        {entries.map(([key, count]) => {
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={key}>
              <div className="flex justify-between text-xs text-gray-400 mb-0.5">
                <span className="capitalize text-white">{key}</span>
                <span>{count} ({pct}%)</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
