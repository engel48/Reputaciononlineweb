"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, 
  History, 
  ShoppingCart, 
  TrendingUp, 
  Calendar,
  Filter,
  Search,
  Download,
  Check,
  Star,
  AlertCircle,
  Wallet,
  ArrowUpRight
} from 'lucide-react';

// Tipos de datos
interface CreditTransaction {
  id: string;
  date: string;
  amount: number;
  type: 'purchase' | 'usage' | 'bonus';
  description: string;
  service?: string;
  status: 'completed' | 'pending' | 'failed';
}

interface CreditPlan {
  id: string;
  name: string;
  credits: number;
  price: number;
  features: string[];
  popular?: boolean;
}

type TabType = 'resumen' | 'historial' | 'planes' | 'comprar';

interface TransactionFilters {
  type: 'all' | 'purchase' | 'usage' | 'bonus';
  dateRange: 'all' | 'week' | 'month' | 'quarter';
  search: string;
}

export default function CreditosPage() {
  const [activeTab, setActiveTab] = useState<TabType>('resumen');
  const [filters, setFilters] = useState<TransactionFilters>({
    type: 'all',
    dateRange: 'all',
    search: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // Datos demo
  const currentBalance = 2575;
  const totalPurchased = 5000;
  const totalUsed = 2425;

  const transactions: CreditTransaction[] = [
    {
      id: '1',
      date: '2025-06-15T10:30:00Z',
      amount: 500,
      type: 'purchase',
      description: 'Compra de créditos - Plan Professional',
      status: 'completed'
    },
    {
      id: '2',
      date: '2025-06-14T15:45:00Z',
      amount: 25,
      type: 'usage',
      description: 'Análisis de sentimientos',
      service: 'sentiment_analysis',
      status: 'completed'
    },
    {
      id: '3',
      date: '2025-06-13T09:20:00Z',
      amount: 15,
      type: 'usage',
      description: 'Monitoreo de menciones',
      service: 'mention_monitoring',
      status: 'completed'
    },
    {
      id: '4',
      date: '2025-06-12T14:10:00Z',
      amount: 50,
      type: 'usage',
      description: 'Reporte de competencia',
      service: 'competitor_analysis',
      status: 'completed'
    },
    {
      id: '5',
      date: '2025-06-10T11:00:00Z',
      amount: 1000,
      type: 'purchase',
      description: 'Compra de créditos - Plan Empresarial',
      status: 'completed'
    }
  ];

  const availablePlans: CreditPlan[] = [
    {
      id: 'basic',
      name: 'Básico',
      credits: 500,
      price: 29000,
      features: ['Análisis básico', 'Monitoreo diario', 'Reportes mensuales']
    },
    {
      id: 'professional',
      name: 'Professional',
      credits: 1500,
      price: 79000,
      popular: true,
      features: ['Análisis avanzado', 'Monitoreo en tiempo real', 'Reportes semanales', 'API access']
    },
    {
      id: 'enterprise',
      name: 'Empresarial',
      credits: 5000,
      price: 199000,
      features: ['Análisis completo', 'Monitoreo 24/7', 'Reportes diarios', 'API ilimitado', 'Soporte dedicado']
    }
  ];

  // Filtrar transacciones
  const filteredTransactions = transactions.filter(transaction => {
    const matchesType = filters.type === 'all' || transaction.type === filters.type;
    const matchesSearch = transaction.description.toLowerCase().includes(filters.search.toLowerCase());
    
    if (!matchesType || !matchesSearch) return false;
    
    if (filters.dateRange === 'all') return true;
    
    const transactionDate = new Date(transaction.date);
    const now = new Date();
    
    switch (filters.dateRange) {
      case 'week':
        return transactionDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return transactionDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case 'quarter':
        return transactionDate >= new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      default:
        return true;
    }
  });

  // Cálculos
  const usagePercentage = totalPurchased > 0 ? (totalUsed / totalPurchased) * 100 : 0;
  const monthlyUsage = transactions
    .filter(t => t.type === 'usage' && new Date(t.date) >= new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000))
    .reduce((sum, t) => sum + t.amount, 0);

  const handlePurchase = async (planId: string) => {
    setIsProcessing(true);
    // Simular compra
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsProcessing(false);
    setActiveTab('historial');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header con gradiente */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-[#01257D] to-indigo-600 rounded-2xl p-6"
      >
        <div className="flex items-center gap-3">
          <motion.div
            className="p-3 bg-white/20 rounded-xl"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 4 }}
            >
              <CreditCard className="h-7 w-7 text-white" />
            </motion.div>
          </motion.div>
          <div>
            <h1 className="text-2xl font-bold text-white">Mis Creditos</h1>
            <p className="text-white/70 text-sm">
              Gestiona tus creditos y planes de suscripcion
            </p>
          </div>
        </div>
      </motion.div>

      {/* Tabs mejorados */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-1.5">
        <nav className="flex space-x-1">
          {[
            { id: 'resumen', label: 'Resumen', icon: Wallet },
            { id: 'historial', label: 'Historial', icon: History },
            { id: 'planes', label: 'Planes', icon: Star },
            { id: 'comprar', label: 'Comprar', icon: ShoppingCart }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-[#01257D] to-indigo-600 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </motion.button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'resumen' && (
            <div className="space-y-6">
              {/* Balance Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                  whileHover={{ y: -4, boxShadow: '0 12px 30px rgba(1,37,125,0.2)' }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="bg-gradient-to-r from-[#01257D] to-indigo-600 rounded-xl p-6 text-white shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-200 text-sm font-medium">Balance Actual</p>
                      <p className="text-3xl font-bold mt-1">{currentBalance.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-white/20 rounded-xl">
                      <Wallet className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ y: -4, boxShadow: '0 12px 30px rgba(0,0,0,0.08)' }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Comprado</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalPurchased.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                      <CreditCard className="h-7 w-7 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ y: -4, boxShadow: '0 12px 30px rgba(0,0,0,0.08)' }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Usado</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalUsed.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                      <TrendingUp className="h-7 w-7 text-red-600 dark:text-red-400" />
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Usage Progress */}
              <motion.div
                whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm"
              >
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Uso de Creditos</h3>
                <div className="mb-2">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>Usado: {totalUsed.toLocaleString()}</span>
                    <span>Total: {totalPurchased.toLocaleString()}</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-[#01257D] to-indigo-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                  ></div>
                </div>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {usagePercentage.toFixed(1)}% utilizado
                </p>
              </motion.div>

              {/* Monthly Stats */}
              <motion.div
                whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm"
              >
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Estadisticas del Mes</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Uso Mensual</p>
                    <p className="text-xl font-bold text-[#01257D]">{monthlyUsage}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Días Restantes</p>
                    <p className="text-xl font-bold text-green-600">{Math.ceil(currentBalance / (monthlyUsage / 30))}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Uso Promedio</p>
                    <p className="text-xl font-bold text-blue-600">{Math.ceil(monthlyUsage / 30)}/día</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Eficiencia</p>
                    <p className="text-xl font-bold text-purple-600">87%</p>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {activeTab === 'historial' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Tipo</label>
                    <select 
                      value={filters.type} 
                      onChange={(e) => setFilters({...filters, type: e.target.value as any})}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2"
                    >
                      <option value="all">Todos</option>
                      <option value="purchase">Compras</option>
                      <option value="usage">Uso</option>
                      <option value="bonus">Bonus</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Período</label>
                    <select 
                      value={filters.dateRange} 
                      onChange={(e) => setFilters({...filters, dateRange: e.target.value as any})}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2"
                    >
                      <option value="all">Todo</option>
                      <option value="week">Última semana</option>
                      <option value="month">Último mes</option>
                      <option value="quarter">Último trimestre</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Buscar</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar transacciones..."
                        value={filters.search}
                        onChange={(e) => setFilters({...filters, search: e.target.value})}
                        className="w-full pl-10 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Transaction List */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Descripción</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cantidad</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredTransactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {new Date(transaction.date).toLocaleDateString('es-CO')}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                            {transaction.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              transaction.type === 'purchase' ? 'bg-green-100 text-green-800' :
                              transaction.type === 'usage' ? 'bg-red-100 text-red-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {transaction.type === 'purchase' ? 'Compra' :
                               transaction.type === 'usage' ? 'Uso' : 'Bonus'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={transaction.type === 'usage' ? 'text-red-600' : 'text-green-600'}>
                              {transaction.type === 'usage' ? '-' : '+'}{transaction.amount.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Completado
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'planes' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {availablePlans.map((plan) => (
                <motion.div
                  key={plan.id}
                  whileHover={{ y: -4, boxShadow: '0 12px 30px rgba(0,0,0,0.08)' }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className={`relative bg-white dark:bg-gray-800 rounded-xl border-2 p-6 ${
                    plan.popular ? 'border-[#01257D] shadow-lg' : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-[#01257D] to-indigo-600 text-white px-4 py-1 rounded-full text-sm font-medium shadow-md">
                        Mas Popular
                      </span>
                    </div>
                  )}

                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                    <div className="mt-4">
                      <span className="text-3xl font-bold text-[#01257D]">
                        ${plan.price.toLocaleString()}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400"> COP</span>
                    </div>
                    <div className="mt-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg py-2">
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        {plan.credits.toLocaleString()} creditos
                      </span>
                    </div>
                  </div>

                  <ul className="mt-6 space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <motion.button
                    onClick={() => handlePurchase(plan.id)}
                    disabled={isProcessing}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full mt-6 py-2.5 px-4 rounded-xl font-medium transition-colors ${
                      plan.popular
                        ? 'bg-gradient-to-r from-[#01257D] to-indigo-600 text-white hover:from-[#013AAA] hover:to-indigo-700 shadow-md'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600'
                    } disabled:opacity-50`}
                  >
                    {isProcessing ? 'Procesando...' : 'Comprar Plan'}
                  </motion.button>
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === 'comprar' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">Comprar Creditos Adicionales</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { credits: 100, price: 15000, bonus: 0 },
                  { credits: 500, price: 65000, bonus: 50 },
                  { credits: 1000, price: 120000, bonus: 150 },
                  { credits: 2500, price: 280000, bonus: 500 }
                ].map((pack, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ y: -4, boxShadow: '0 12px 30px rgba(0,0,0,0.08)' }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 bg-white dark:bg-gray-800"
                  >
                    <div className="text-center">
                      <h4 className="font-semibold text-lg text-gray-900 dark:text-white">{pack.credits} Creditos</h4>
                      {pack.bonus > 0 && (
                        <p className="text-sm text-green-600 font-medium">+{pack.bonus} creditos bonus</p>
                      )}
                      <p className="text-xl font-bold text-[#01257D] mt-2">
                        ${pack.price.toLocaleString()} COP
                      </p>
                      <motion.button
                        onClick={() => handlePurchase(`pack-${index}`)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full mt-4 bg-gradient-to-r from-[#01257D] to-indigo-600 text-white py-2.5 rounded-xl hover:from-[#013AAA] hover:to-indigo-700 transition-colors shadow-md font-medium"
                      >
                        Comprar
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
