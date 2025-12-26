"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { AdminPageWrapper } from '@/components/admin';
import {
  CreditCard, Search, Filter, RefreshCw, Eye, CheckCircle,
  XCircle, Clock, AlertCircle, DollarSign, TrendingUp, Users
} from 'lucide-react';

interface Payment {
  id: string;
  user_id: string;
  wompi_transaction_id: string | null;
  transaction_id: string | null;
  amount: number;
  currency: string;
  status: string;
  payment_method: string | null;
  plan_type: string | null;
  credits_purchased: number | null;
  paid_at: string | null;
  created_at: string;
  users: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface Stats {
  totalPayments: number;
  totalRevenue: number;
  pendingPayments: number;
  approvedPayments: number;
  declinedPayments: number;
}

export default function AdminPagosPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Filtros
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(statusFilter !== 'all' && { status: statusFilter })
      });

      const response = await fetch(`/api/admin/payments?${params}`);
      const result = await response.json();

      if (result.success) {
        setPayments(result.data.payments);
        setStats(result.data.stats);
        setTotalPages(result.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
      pending: { color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400', icon: <Clock className="w-3 h-3" />, label: 'Pendiente' },
      approved: { color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400', icon: <CheckCircle className="w-3 h-3" />, label: 'Aprobado' },
      completed: { color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400', icon: <CheckCircle className="w-3 h-3" />, label: 'Completado' },
      declined: { color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', icon: <XCircle className="w-3 h-3" />, label: 'Rechazado' },
      failed: { color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', icon: <XCircle className="w-3 h-3" />, label: 'Fallido' },
      voided: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300', icon: <AlertCircle className="w-3 h-3" />, label: 'Anulado' }
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  const formatCurrency = (amount: number, currency: string = 'COP') => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredPayments = payments.filter(payment => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      payment.users?.name?.toLowerCase().includes(search) ||
      payment.users?.email?.toLowerCase().includes(search) ||
      payment.wompi_transaction_id?.toLowerCase().includes(search) ||
      payment.transaction_id?.toLowerCase().includes(search)
    );
  });

  return (
    <AdminPageWrapper title="Pagos y Transacciones" subtitle="Gestiona todos los pagos de la plataforma">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-end">
          <button
            onClick={fetchPayments}
            disabled={loading}
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-[#00E5FF] hover:bg-[#00B8D4] text-[#0B1120] font-semibold transition-all shadow-[0_4px_20px_rgba(0,229,255,0.15)] hover:-translate-y-0.5"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-[#151C2E] rounded-xl p-4 border border-gray-100 dark:border-[#1A202C] shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-[#00E5FF]/10 rounded-lg">
                <CreditCard className="w-5 h-5 text-[#00E5FF]" />
              </div>
              <span className="text-2xl font-bold text-[#0B1120] dark:text-white">{stats.totalPayments}</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Total Pagos</p>
          </div>

          <div className="bg-white dark:bg-[#151C2E] rounded-xl p-4 border border-gray-100 dark:border-[#1A202C] shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
                <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-2xl font-bold text-[#0B1120] dark:text-white">{formatCurrency(stats.totalRevenue)}</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Ingresos Totales</p>
          </div>

          <div className="bg-white dark:bg-[#151C2E] rounded-xl p-4 border border-gray-100 dark:border-[#1A202C] shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-2xl font-bold text-[#0B1120] dark:text-white">{stats.pendingPayments}</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Pendientes</p>
          </div>

          <div className="bg-white dark:bg-[#151C2E] rounded-xl p-4 border border-gray-100 dark:border-[#1A202C] shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-2xl font-bold text-[#0B1120] dark:text-white">{stats.approvedPayments}</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Aprobados</p>
          </div>

          <div className="bg-white dark:bg-[#151C2E] rounded-xl p-4 border border-gray-100 dark:border-[#1A202C] shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <span className="text-2xl font-bold text-[#0B1120] dark:text-white">{stats.declinedPayments}</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Rechazados</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o ID de transacción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#1A202C] bg-white dark:bg-[#151C2E] focus:ring-2 focus:ring-[#00E5FF]/30 focus:border-[#00E5FF] transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#1A202C] bg-white dark:bg-[#151C2E] focus:ring-2 focus:ring-[#00E5FF]/30 focus:border-[#00E5FF] transition-all"
        >
          <option value="all">Todos los estados</option>
          <option value="pending">Pendientes</option>
          <option value="approved">Aprobados</option>
          <option value="completed">Completados</option>
          <option value="declined">Rechazados</option>
          <option value="failed">Fallidos</option>
          <option value="voided">Anulados</option>
        </select>
      </div>

      {/* Payments Table */}
      <div className="bg-white dark:bg-[#151C2E] rounded-xl border border-gray-100 dark:border-[#1A202C] shadow-[0_4px_20px_rgba(0,0,0,0.05)] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 text-[#00E5FF] animate-spin mx-auto" />
            <p className="text-gray-500 dark:text-gray-400 mt-2">Cargando pagos...</p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-8 text-center">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto" />
            <p className="text-gray-500 dark:text-gray-400 mt-2">No se encontraron pagos</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-[#1A202C]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Usuario</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Monto</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Plan/Créditos</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Método</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#1A202C]">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-[#1A202C]/50 transition-colors">
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium text-[#0B1120] dark:text-white">{payment.users?.name || 'Sin nombre'}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{payment.users?.email || 'Sin email'}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-semibold text-[#0B1120] dark:text-white">
                        {formatCurrency(payment.amount, payment.currency)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        {payment.plan_type && (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-[#00E5FF]/10 text-[#00E5FF] capitalize">
                            {payment.plan_type}
                          </span>
                        )}
                        {payment.credits_purchased && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            +{payment.credits_purchased} créditos
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {getStatusBadge(payment.status)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {payment.payment_method || 'N/A'}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(payment.created_at)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedPayment(payment);
                          setShowModal(true);
                        }}
                        className="p-2 rounded-lg text-gray-400 hover:text-[#00E5FF] hover:bg-[#00E5FF]/10 transition-colors"
                        title="Ver detalles"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-[#1A202C]">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1A202C] disabled:opacity-50 transition-colors"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1A202C] disabled:opacity-50 transition-colors"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>

      {/* Payment Detail Modal */}
      {showModal && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1120]/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#151C2E] rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 dark:border-[#1A202C]">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#0B1120] dark:text-white">Detalles del Pago</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-[#1A202C] transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID de Pago</p>
                  <p className="font-mono text-sm text-[#0B1120] dark:text-white mt-1">{selectedPayment.id.slice(0, 8)}...</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</p>
                  <div className="mt-1">{getStatusBadge(selectedPayment.status)}</div>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Usuario</p>
                <p className="font-medium text-[#0B1120] dark:text-white mt-1">{selectedPayment.users?.name}</p>
                <p className="text-sm text-gray-500">{selectedPayment.users?.email}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Monto</p>
                  <p className="text-2xl font-bold text-[#00E5FF] mt-1">
                    {formatCurrency(selectedPayment.amount, selectedPayment.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Créditos</p>
                  <p className="text-2xl font-bold text-emerald-500 mt-1">
                    +{selectedPayment.credits_purchased || 0}
                  </p>
                </div>
              </div>

              {selectedPayment.wompi_transaction_id && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID Wompi</p>
                  <p className="font-mono text-sm text-[#0B1120] dark:text-white mt-1">{selectedPayment.wompi_transaction_id}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha Creación</p>
                  <p className="text-sm text-[#0B1120] dark:text-white mt-1">{formatDate(selectedPayment.created_at)}</p>
                </div>
                {selectedPayment.paid_at && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha Pago</p>
                    <p className="text-sm text-[#0B1120] dark:text-white mt-1">{formatDate(selectedPayment.paid_at)}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-[#1A202C]">
              <button
                onClick={() => setShowModal(false)}
                className="w-full py-2.5 rounded-xl bg-[#0B1120] hover:bg-[#1A202C] text-white font-semibold transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </AdminPageWrapper>
  );
}
