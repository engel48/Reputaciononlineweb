"use client";

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, User, Mail, Phone, Building2, Calendar, Crown, CreditCard,
  Activity, MessageSquare, DollarSign, AlertTriangle, ExternalLink, RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AdminPageWrapper } from '@/components/admin';

interface UserDetail {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    plan: string;
    credits: number;
    company: string | null;
    phone: string | null;
    profileType: string | null;
    category: string | null;
    brandName: string | null;
    political: { partido: string | null; cargo: string | null; propuestas: string | null };
    isActive: boolean;
    onboardingCompleted: boolean;
    createdAt: string;
    lastLogin: string | null;
    updatedAt: string;
  };
  socialAccounts: Array<{
    id: string;
    platform: string;
    username: string;
    displayName: string | null;
    profileUrl: string | null;
    profileImage: string | null;
    followers: number;
    posts: number;
    connected: boolean;
    lastSync: string | null;
    tokenExpiresAt: string | null;
    tokenStatus: 'valid' | 'expired' | 'unknown';
  }>;
  credits: {
    currentBalance: number;
    transactionsCount: number;
    recentTransactions: Array<{
      id: string;
      type: string;
      amount: number;
      balanceAfter: number;
      description: string;
      relatedEntity: string | null;
      createdAt: string;
    }>;
  };
  mentions: {
    total: number;
    recent: Array<{
      id: string;
      platform: string;
      content: string;
      url: string | null;
      publishedAt: string;
      likes: number;
      shares: number;
      comments: number;
      sentiment: string | null;
    }>;
  };
  julia: {
    conversationsCount: number;
    lastConversation: { id: string; title: string; createdAt: string; updatedAt: string } | null;
  };
  payments: {
    total: number;
    recent: Array<{
      id: string;
      amount: number;
      currency: string;
      status: string;
      paymentMethod: string | null;
      transactionId: string | null;
      createdAt: string;
    }>;
  };
}

const PLAN_COLORS: Record<string, string> = {
  free: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  basic: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  pro: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  enterprise: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
};

const SENTIMENT_COLORS: Record<string, string> = {
  positive: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  negative: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  neutral: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
};

function formatCOP(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return format(new Date(iso), "d 'de' MMM yyyy, HH:mm", { locale: es });
  } catch {
    return iso;
  }
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.id as string;

  const [data, setData] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { credentials: 'include' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Error cargando detalle');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) load();
  }, [userId, load]);

  if (loading) {
    return (
      <AdminPageWrapper title="Detalle de usuario" subtitle="Cargando...">
        <div className="flex justify-center py-12 text-gray-400">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" /> Cargando datos del usuario...
        </div>
      </AdminPageWrapper>
    );
  }

  if (error || !data) {
    return (
      <AdminPageWrapper title="Detalle de usuario" subtitle="">
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 p-4 rounded-lg">
          <p className="text-red-800 dark:text-red-300">
            <AlertTriangle className="inline w-4 h-4 mr-1" /> {error || 'Usuario no encontrado'}
          </p>
          <Link href="/admin/usuarios" className="inline-flex items-center mt-3 text-sm text-blue-600 dark:text-blue-400">
            <ArrowLeft className="w-4 h-4 mr-1" /> Volver a usuarios
          </Link>
        </div>
      </AdminPageWrapper>
    );
  }

  const u = data.user;

  return (
    <AdminPageWrapper title={u.name || u.email} subtitle={`Detalle de usuario · ${u.email}`}>
      <div className="space-y-6">
        {/* Header con acciones rapidas */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/admin/usuarios" className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600">
            <ArrowLeft className="w-4 h-4 mr-1" /> Volver al listado
          </Link>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${PLAN_COLORS[u.plan] || PLAN_COLORS.free}`}>
              <Crown className="w-3 h-3 mr-1" /> {u.plan.toUpperCase()}
            </span>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              u.isActive
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
            }`}>
              {u.isActive ? 'Activo' : 'Deshabilitado'}
            </span>
            {u.role === 'admin' && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                ADMIN
              </span>
            )}
            <button onClick={load} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700" title="Refrescar">
              <RefreshCw className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#151C2E] rounded-lg p-4 border border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-5 h-5 text-cyan-400" />
              <span className="text-xs uppercase tracking-wide text-gray-400">Creditos</span>
            </div>
            <p className="text-2xl font-bold text-white">{u.credits.toLocaleString('es-CO')}</p>
            <p className="text-xs text-gray-500 mt-1">{data.credits.transactionsCount} transacciones</p>
          </div>
          <div className="bg-[#151C2E] rounded-lg p-4 border border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              <span className="text-xs uppercase tracking-wide text-gray-400">Redes conectadas</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {data.socialAccounts.filter((s) => s.connected).length}
            </p>
            <p className="text-xs text-gray-500 mt-1">{data.socialAccounts.length} totales</p>
          </div>
          <div className="bg-[#151C2E] rounded-lg p-4 border border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-5 h-5 text-cyan-400" />
              <span className="text-xs uppercase tracking-wide text-gray-400">Menciones</span>
            </div>
            <p className="text-2xl font-bold text-white">{data.mentions.total.toLocaleString('es-CO')}</p>
            <p className="text-xs text-gray-500 mt-1">{data.julia.conversationsCount} chats con Julia</p>
          </div>
          <div className="bg-[#151C2E] rounded-lg p-4 border border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-cyan-400" />
              <span className="text-xs uppercase tracking-wide text-gray-400">Pagos</span>
            </div>
            <p className="text-2xl font-bold text-white">{data.payments.total}</p>
            <p className="text-xs text-gray-500 mt-1">historico</p>
          </div>
        </div>

        {/* Perfil basico */}
        <div className="bg-[#151C2E] rounded-lg p-6 border border-gray-800">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-cyan-400" /> Perfil
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400 text-xs uppercase">Email</p>
              <p className="text-white flex items-center gap-2"><Mail className="w-4 h-4 text-gray-500" /> {u.email}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase">Telefono</p>
              <p className="text-white flex items-center gap-2"><Phone className="w-4 h-4 text-gray-500" /> {u.phone || '—'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase">Empresa / Marca</p>
              <p className="text-white flex items-center gap-2"><Building2 className="w-4 h-4 text-gray-500" /> {u.brandName || u.company || '—'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase">Tipo de perfil</p>
              <p className="text-white">{u.profileType || '—'} {u.category ? `· ${u.category}` : ''}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase">Registrado</p>
              <p className="text-white flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-500" /> {formatDate(u.createdAt)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase">Ultimo login</p>
              <p className="text-white flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-500" /> {formatDate(u.lastLogin)}</p>
            </div>
            {(u.political.cargo || u.political.partido) && (
              <div className="md:col-span-2">
                <p className="text-gray-400 text-xs uppercase">Perfil politico</p>
                <p className="text-white">
                  {u.political.cargo ? <span>Cargo: {u.political.cargo}</span> : null}
                  {u.political.partido ? <span className="ml-3">Partido: {u.political.partido}</span> : null}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Redes sociales */}
        <div className="bg-[#151C2E] rounded-lg p-6 border border-gray-800">
          <h3 className="text-lg font-semibold text-white mb-4">Redes sociales conectadas</h3>
          {data.socialAccounts.length === 0 ? (
            <p className="text-gray-500 text-sm">No tiene redes conectadas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="text-xs uppercase text-gray-400">
                  <tr>
                    <th className="px-3 py-2 text-left">Plataforma</th>
                    <th className="px-3 py-2 text-left">Usuario</th>
                    <th className="px-3 py-2 text-right">Seguidores</th>
                    <th className="px-3 py-2 text-right">Posts</th>
                    <th className="px-3 py-2 text-center">Estado</th>
                    <th className="px-3 py-2 text-center">Token</th>
                    <th className="px-3 py-2 text-left">Ultimo sync</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700 text-sm text-gray-300">
                  {data.socialAccounts.map((s) => (
                    <tr key={s.id}>
                      <td className="px-3 py-2 capitalize text-white">{s.platform}</td>
                      <td className="px-3 py-2">
                        @{s.username}
                        {s.profileUrl && (
                          <a href={s.profileUrl} target="_blank" rel="noopener noreferrer" className="ml-2 text-cyan-400">
                            <ExternalLink className="w-3 h-3 inline" />
                          </a>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">{s.followers.toLocaleString('es-CO')}</td>
                      <td className="px-3 py-2 text-right">{s.posts}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          s.connected ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {s.connected ? 'Conectado' : 'Desconectado'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          s.tokenStatus === 'valid' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                          s.tokenStatus === 'expired' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                          'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {s.tokenStatus}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs">{formatDate(s.lastSync)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Transacciones de creditos */}
        <div className="bg-[#151C2E] rounded-lg p-6 border border-gray-800">
          <h3 className="text-lg font-semibold text-white mb-4">
            Transacciones de creditos <span className="text-sm font-normal text-gray-400">(ultimas {data.credits.recentTransactions.length} de {data.credits.transactionsCount})</span>
          </h3>
          {data.credits.recentTransactions.length === 0 ? (
            <p className="text-gray-500 text-sm">Sin transacciones registradas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="text-xs uppercase text-gray-400">
                  <tr>
                    <th className="px-3 py-2 text-left">Fecha</th>
                    <th className="px-3 py-2 text-left">Tipo</th>
                    <th className="px-3 py-2 text-right">Monto</th>
                    <th className="px-3 py-2 text-right">Balance</th>
                    <th className="px-3 py-2 text-left">Descripcion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700 text-sm text-gray-300">
                  {data.credits.recentTransactions.map((t) => (
                    <tr key={t.id}>
                      <td className="px-3 py-2 text-xs">{formatDate(t.createdAt)}</td>
                      <td className="px-3 py-2"><span className="px-2 py-0.5 text-xs rounded-full bg-gray-700">{t.type}</span></td>
                      <td className={`px-3 py-2 text-right font-medium ${
                        t.amount > 0 ? 'text-green-400' : t.amount < 0 ? 'text-red-400' : 'text-gray-400'
                      }`}>
                        {t.amount > 0 ? '+' : ''}{t.amount.toLocaleString('es-CO')}
                      </td>
                      <td className="px-3 py-2 text-right">{t.balanceAfter.toLocaleString('es-CO')}</td>
                      <td className="px-3 py-2 text-xs">{t.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagos */}
        <div className="bg-[#151C2E] rounded-lg p-6 border border-gray-800">
          <h3 className="text-lg font-semibold text-white mb-4">
            Pagos <span className="text-sm font-normal text-gray-400">({data.payments.total} totales)</span>
          </h3>
          {data.payments.recent.length === 0 ? (
            <p className="text-gray-500 text-sm">No hay pagos registrados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="text-xs uppercase text-gray-400">
                  <tr>
                    <th className="px-3 py-2 text-left">Fecha</th>
                    <th className="px-3 py-2 text-right">Monto</th>
                    <th className="px-3 py-2 text-center">Estado</th>
                    <th className="px-3 py-2 text-left">Metodo</th>
                    <th className="px-3 py-2 text-left font-mono">Transaccion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700 text-sm text-gray-300">
                  {data.payments.recent.map((p) => (
                    <tr key={p.id}>
                      <td className="px-3 py-2 text-xs">{formatDate(p.createdAt)}</td>
                      <td className="px-3 py-2 text-right">{formatCOP(Number(p.amount))}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          p.status === 'approved' || p.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                          p.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-3 py-2">{p.paymentMethod || '—'}</td>
                      <td className="px-3 py-2 text-xs font-mono">{p.transactionId || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Menciones recientes */}
        {data.mentions.recent.length > 0 && (
          <div className="bg-[#151C2E] rounded-lg p-6 border border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-4">
              Menciones recientes <span className="text-sm font-normal text-gray-400">({data.mentions.total} totales)</span>
            </h3>
            <div className="space-y-3">
              {data.mentions.recent.map((m) => (
                <div key={m.id} className="border border-gray-700 rounded p-3 text-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="capitalize text-cyan-400 text-xs">{m.platform}</span>
                      {m.sentiment && (
                        <span className={`px-2 py-0.5 text-xs rounded-full ${SENTIMENT_COLORS[m.sentiment] || SENTIMENT_COLORS.neutral}`}>
                          {m.sentiment}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">{formatDate(m.publishedAt)}</span>
                  </div>
                  <p className="text-gray-300 line-clamp-2">{m.content}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span>{m.likes} likes</span>
                    <span>{m.shares} shares</span>
                    <span>{m.comments} comments</span>
                    {m.url && (
                      <a href={m.url} target="_blank" rel="noopener noreferrer" className="ml-auto text-cyan-400">Ver</a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Julia */}
        {data.julia.lastConversation && (
          <div className="bg-[#151C2E] rounded-lg p-6 border border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-2">Conversaciones con Julia</h3>
            <p className="text-sm text-gray-400">
              {data.julia.conversationsCount} conversacion{data.julia.conversationsCount !== 1 ? 'es' : ''} totales.
            </p>
            <p className="text-sm text-gray-300 mt-2">
              <strong>Ultima:</strong> {data.julia.lastConversation.title}
              <span className="text-gray-500 ml-2">({formatDate(data.julia.lastConversation.updatedAt)})</span>
            </p>
          </div>
        )}
      </div>
    </AdminPageWrapper>
  );
}
