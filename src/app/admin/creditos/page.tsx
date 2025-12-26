"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ConsumosPorCanalChart from '@/components/admin/ConsumosPorCanalChart';
import TendenciaUsoChart from '@/components/admin/TendenciaUsoChart';
import CreditosPorUsuarioChart from '@/components/admin/CreditosPorUsuarioChart';
import PrediccionUsoChart from '@/components/admin/PrediccionUsoChart';
import { AdminPageWrapper } from '@/components/admin';
import {
  Search, Download, Filter, Users, CreditCard, Plus, X,
  CheckCircle, XCircle, Loader2, AlertCircle, Gift, RefreshCw,
  MinusCircle
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  credits: number;
  plan: string;
}

interface Transaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  balance_after: number;
  description: string;
  created_at: string;
  users?: {
    name: string;
    email: string;
  };
}

interface Stats {
  totalCredits: number;
  totalConsumed: number;
  activeUsers: number;
}

export default function AdminCreditosPage() {
  // Estado para usuarios
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Estado para transacciones
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);

  // Estado para estadísticas
  const [stats, setStats] = useState<Stats>({
    totalCredits: 0,
    totalConsumed: 0,
    activeUsers: 0
  });

  // Modal de asignación en lote
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkAmount, setBulkAmount] = useState('');
  const [bulkDescription, setBulkDescription] = useState('');
  const [bulkType, setBulkType] = useState<'bonus' | 'refund' | 'usage'>('bonus');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  // Animaciones
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  // Cargar usuarios
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const url = searchQuery
        ? `/api/admin/credits/bulk?search=${encodeURIComponent(searchQuery)}`
        : '/api/admin/credits/bulk';
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setUsers(data.data);

        // Calcular estadísticas
        const totalCredits = data.data.reduce((sum: number, u: User) => sum + (u.credits || 0), 0);
        const activeUsers = data.data.filter((u: User) => (u.credits || 0) > 0).length;

        setStats(prev => ({
          ...prev,
          totalCredits,
          activeUsers
        }));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Cargar transacciones recientes
  const fetchTransactions = async () => {
    try {
      setLoadingTransactions(true);
      const response = await fetch('/api/admin/credits/transactions');
      const data = await response.json();

      if (data.success) {
        setTransactions(data.data || []);

        // Calcular consumos totales
        const totalConsumed = (data.data || [])
          .filter((t: Transaction) => t.amount < 0)
          .reduce((sum: number, t: Transaction) => sum + Math.abs(t.amount), 0);

        setStats(prev => ({
          ...prev,
          totalConsumed
        }));
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchTransactions();
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  // Toggle selección de usuario
  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Seleccionar/deseleccionar todos
  const toggleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u.id));
    }
  };

  // Procesar asignación en lote
  const handleBulkAssign = async () => {
    if (selectedUsers.length === 0 || !bulkAmount) {
      setResult({ success: false, message: 'Selecciona usuarios y una cantidad' });
      return;
    }

    const amount = parseInt(bulkAmount);
    if (isNaN(amount) || amount === 0) {
      setResult({ success: false, message: 'Cantidad inválida' });
      return;
    }

    try {
      setProcessing(true);
      setResult(null);

      const response = await fetch('/api/admin/credits/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: selectedUsers,
          amount: bulkType === 'usage' ? -Math.abs(amount) : Math.abs(amount),
          description: bulkDescription || `Asignación masiva - ${bulkType}`,
          type: bulkType
        })
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          success: true,
          message: `✅ ${data.data.successful} usuarios actualizados exitosamente${data.data.failed > 0 ? `, ${data.data.failed} fallidos` : ''}`
        });

        // Recargar datos
        fetchUsers();
        fetchTransactions();

        // Limpiar selección
        setSelectedUsers([]);
        setBulkAmount('');
        setBulkDescription('');

        // Cerrar modal después de 2 segundos
        setTimeout(() => {
          setShowBulkModal(false);
          setResult(null);
        }, 2000);
      } else {
        setResult({ success: false, message: data.error || 'Error procesando créditos' });
      }
    } catch (error: any) {
      setResult({ success: false, message: error.message || 'Error de conexión' });
    } finally {
      setProcessing(false);
    }
  };

  // Formatear fecha
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Estadísticas resumen
  const estadisticas = [
    {
      titulo: 'Total Créditos en Sistema',
      valor: stats.totalCredits.toLocaleString('es-CO'),
      icono: <CreditCard className="h-5 w-5 text-[#00E5FF]" />
    },
    {
      titulo: 'Total Consumidos (Este Mes)',
      valor: stats.totalConsumed.toLocaleString('es-CO'),
      icono: <MinusCircle className="h-5 w-5 text-orange-500" />
    },
    {
      titulo: 'Usuarios con Créditos',
      valor: stats.activeUsers.toLocaleString('es-CO'),
      icono: <Users className="h-5 w-5 text-green-500" />
    }
  ];

  return (
    <AdminPageWrapper title="Gestión de Créditos" subtitle="Administra los créditos de todos los usuarios">
      <motion.div
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >

      {/* Estadísticas resumen */}
      <motion.div
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
        variants={itemVariants}
      >
        {estadisticas.map((stat, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.05)] flex items-center">
            <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700">
              {stat.icono}
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{stat.titulo}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.valor}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Sección de Asignación en Lote */}
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] overflow-hidden"
        variants={itemVariants}
      >
        <div className="border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Gift className="h-5 w-5 text-[#00E5FF]" />
                Asignación de Créditos en Lote
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Selecciona usuarios y asigna créditos a múltiples cuentas a la vez
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchUsers}
                className="inline-flex items-center rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Actualizar
              </button>
              <button
                onClick={() => setShowBulkModal(true)}
                disabled={selectedUsers.length === 0}
                className={`inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors
                  ${selectedUsers.length > 0
                    ? 'bg-[#00E5FF] hover:bg-[#00B8D4]'
                    : 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'}`}
              >
                <Plus className="h-4 w-4 mr-1" />
                Asignar a {selectedUsers.length} usuario{selectedUsers.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>

        {/* Búsqueda y filtros */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[250px]">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre o email..."
                className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 pl-10 pr-3 text-sm placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:border-[#00E5FF] focus:outline-none focus:ring-1 focus:ring-[#00E5FF]"
              />
            </div>
            <button
              onClick={toggleSelectAll}
              className="inline-flex items-center rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              {selectedUsers.length === users.length && users.length > 0 ? 'Deseleccionar todos' : 'Seleccionar todos'}
            </button>
          </div>
        </div>

        {/* Tabla de usuarios */}
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          {loadingUsers ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#00E5FF]" />
              <span className="ml-2 text-gray-500">Cargando usuarios...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Users className="h-12 w-12 mb-2 opacity-50" />
              <p>No se encontraron usuarios</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === users.length && users.length > 0}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-gray-300 text-[#00E5FF] focus:ring-[#00E5FF]"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Usuario
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Plan
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Créditos
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => toggleUserSelection(user.id)}
                    className={`cursor-pointer transition-colors ${
                      selectedUsers.includes(user.id)
                        ? 'bg-[#00E5FF]/10 dark:bg-[#00E5FF]/10'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4 rounded border-gray-300 text-[#00E5FF] focus:ring-[#00E5FF]"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {user.name || 'Sin nombre'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {user.email}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${user.plan === 'enterprise' || user.plan === 'political'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                          : user.plan === 'professional'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                        }`}
                      >
                        {user.plan || 'Básico'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-sm font-semibold ${
                        (user.credits || 0) >= 500
                          ? 'text-green-600 dark:text-green-400'
                          : (user.credits || 0) >= 100
                            ? 'text-[#00E5FF]'
                            : (user.credits || 0) >= 10
                              ? 'text-orange-500'
                              : 'text-red-500'
                      }`}>
                        {(user.credits || 0).toLocaleString('es-CO')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>

      {/* Gráficos y análisis */}
      <motion.div className="grid grid-cols-1 gap-6 lg:grid-cols-2" variants={itemVariants}>
        <ConsumosPorCanalChart />
        <TendenciaUsoChart />
      </motion.div>

      <motion.div variants={itemVariants}>
        <CreditosPorUsuarioChart />
      </motion.div>

      <motion.div variants={itemVariants}>
        <PrediccionUsoChart />
      </motion.div>

      {/* Tabla de transacciones recientes */}
      <motion.div className="bg-white dark:bg-gray-800 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] overflow-hidden" variants={itemVariants}>
        <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Transacciones Recientes
          </h2>
          <button
            onClick={fetchTransactions}
            className="text-sm text-[#00E5FF] hover:text-[#00B8D4] font-medium flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </button>
        </div>

        <div className="overflow-x-auto">
          {loadingTransactions ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#00E5FF]" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <CreditCard className="h-12 w-12 mb-2 opacity-50" />
              <p>No hay transacciones registradas</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Usuario</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Descripción</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Fecha</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Cantidad</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                {transactions.slice(0, 10).map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {tx.users?.name || 'Usuario desconocido'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${tx.type === 'bonus' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                          : tx.type === 'purchase' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : tx.type === 'refund' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 max-w-[300px] truncate">
                      {tx.description || '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(tx.created_at)}
                    </td>
                    <td className={`whitespace-nowrap px-6 py-4 text-right text-sm font-semibold
                      ${tx.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                    >
                      {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString('es-CO')}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-500 dark:text-gray-400">
                      {(tx.balance_after || 0).toLocaleString('es-CO')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {transactions.length > 10 && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 text-center">
            <button className="text-sm font-medium text-[#00E5FF] hover:text-[#00B8D4]">
              Ver todas las transacciones ({transactions.length})
            </button>
          </div>
        )}
      </motion.div>

      {/* Modal de Asignación en Lote */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Gift className="h-5 w-5 text-[#00E5FF]" />
                Asignar Créditos en Lote
              </h3>
              <button
                onClick={() => {
                  setShowBulkModal(false);
                  setResult(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Usuarios seleccionados */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-semibold text-[#00E5FF]">{selectedUsers.length}</span> usuario{selectedUsers.length !== 1 ? 's' : ''} seleccionado{selectedUsers.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Tipo de operación */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de Operación
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'bonus', label: 'Bonus', icon: <Gift className="h-4 w-4" /> },
                    { value: 'refund', label: 'Reembolso', icon: <RefreshCw className="h-4 w-4" /> },
                    { value: 'usage', label: 'Consumo', icon: <MinusCircle className="h-4 w-4" /> }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setBulkType(opt.value as 'bonus' | 'refund' | 'usage')}
                      className={`flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                        ${bulkType === opt.value
                          ? 'bg-[#00E5FF] text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cantidad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cantidad de Créditos
                </label>
                <input
                  type="number"
                  value={bulkAmount}
                  onChange={(e) => setBulkAmount(e.target.value)}
                  placeholder={bulkType === 'usage' ? 'Créditos a descontar' : 'Créditos a asignar'}
                  min="1"
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white placeholder-gray-500 focus:border-[#00E5FF] focus:outline-none focus:ring-1 focus:ring-[#00E5FF]"
                />
                {bulkType === 'usage' && (
                  <p className="mt-1 text-xs text-orange-500">
                    Se descontarán los créditos especificados
                  </p>
                )}
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descripción (opcional)
                </label>
                <input
                  type="text"
                  value={bulkDescription}
                  onChange={(e) => setBulkDescription(e.target.value)}
                  placeholder="Ej: Promoción navideña 2025"
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white placeholder-gray-500 focus:border-[#00E5FF] focus:outline-none focus:ring-1 focus:ring-[#00E5FF]"
                />
              </div>

              {/* Resultado */}
              {result && (
                <div className={`flex items-center gap-2 p-3 rounded-lg ${
                  result.success
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                }`}>
                  {result.success ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                  <span className="text-sm">{result.message}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <button
                onClick={() => {
                  setShowBulkModal(false);
                  setResult(null);
                }}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleBulkAssign}
                disabled={processing || !bulkAmount}
                className={`flex-1 px-4 py-2 rounded-lg font-medium text-white flex items-center justify-center gap-2
                  ${processing || !bulkAmount
                    ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                    : 'bg-[#00E5FF] hover:bg-[#00B8D4]'
                  }`}
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Asignar Créditos
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
      </motion.div>
    </AdminPageWrapper>
  );
}
