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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mis Créditos</h1>
          <p className="text-gray-600 dark:text-gray-300">Gestiona tus créditos y planes de suscripción</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'resumen', label: 'Resumen', icon: Wallet },
            { id: 'historial', label: 'Historial', icon: History },
            { id: 'planes', label: 'Planes', icon: Star },
            { id: 'comprar', label: 'Comprar', icon: ShoppingCart }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center px-1 py-4 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-[#01257D] text-[#01257D]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-5 h-5 mr-2" />
                {tab.label}
              </button>
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
                <div className="bg-gradient-to-r from-[#01257D] to-blue-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100">Balance Actual</p>
                      <p className="text-3xl font-bold">{currentBalance.toLocaleString()}</p>
                    </div>
                    <Wallet className="h-12 w-12 text-blue-200" />
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Total Comprado</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalPurchased.toLocaleString()}</p>
                    </div>
                    <CreditCard className="h-8 w-8 text-green-500" />
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Total Usado</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalUsed.toLocaleString()}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-red-500" />
                  </div>
                </div>
              </div>

              {/* Usage Progress */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4">Uso de Créditos</h3>
                <div className="mb-2">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>Usado: {totalUsed.toLocaleString()}</span>
                    <span>Total: {totalPurchased.toLocaleString()}</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-[#01257D] h-3 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                  ></div>
                </div>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {usagePercentage.toFixed(1)}% utilizado
                </p>
              </div>

              {/* Monthly Stats */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4">Estadísticas del Mes</h3>
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
              </div>
            </div>
          )}

          {activeTab === 'historial' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
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
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
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
                <div key={plan.id} className={`relative bg-white dark:bg-gray-800 rounded-lg border-2 p-6 ${
                  plan.popular ? 'border-[#01257D] shadow-lg' : 'border-gray-200 dark:border-gray-700'
                }`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-[#01257D] text-white px-3 py-1 rounded-full text-sm font-medium">
                        Más Popular
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
                    <div className="mt-2">
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        {plan.credits.toLocaleString()} créditos
                      </span>
                    </div>
                  </div>

                  <ul className="mt-6 space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handlePurchase(plan.id)}
                    disabled={isProcessing}
                    className={`w-full mt-6 py-2 px-4 rounded-md font-medium transition-colors ${
                      plan.popular
                        ? 'bg-[#01257D] text-white hover:bg-[#01257D]/90'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600'
                    } disabled:opacity-50`}
                  >
                    {isProcessing ? 'Procesando...' : 'Comprar Plan'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'comprar' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold mb-6">Comprar Créditos Adicionales</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { credits: 100, price: 15000, bonus: 0 },
                  { credits: 500, price: 65000, bonus: 50 },
                  { credits: 1000, price: 120000, bonus: 150 },
                  { credits: 2500, price: 280000, bonus: 500 }
                ].map((pack, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="text-center">
                      <h4 className="font-semibold text-lg">{pack.credits} Créditos</h4>
                      {pack.bonus > 0 && (
                        <p className="text-sm text-green-600">+{pack.bonus} créditos bonus</p>
                      )}
                      <p className="text-xl font-bold text-[#01257D] mt-2">
                        ${pack.price.toLocaleString()} COP
                      </p>
                      <button 
                        onClick={() => handlePurchase(`pack-${index}`)}
                        className="w-full mt-4 bg-[#01257D] text-white py-2 rounded-md hover:bg-[#01257D]/90 transition-colors"
                      >
                        Comprar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
