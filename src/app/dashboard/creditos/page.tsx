"use client";

import React, { useState, useEffect } from 'react';
import { useCredits } from '@/context/CreditosContext';
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
  AlertCircle
} from 'lucide-react';
import CreditosSummary from '@/components/creditos/CreditosSummary';

type TabType = 'resumen' | 'historial' | 'planes';

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

  const {
    currentBalance,
    totalPurchased,
    totalUsed,
    transactions,
    availablePlans,
    purchaseCredits,
    isLoading
  } = useCredits();

  // Filtrar transacciones
  const filteredTransactions = transactions.filter(transaction => {
    const matchesType = filters.type === 'all' || transaction.type === filters.type;
    const matchesSearch = transaction.description.toLowerCase().includes(filters.search.toLowerCase());
    
    let matchesDate = true;
    if (filters.dateRange !== 'all') {
      const transactionDate = new Date(transaction.date);
      const now = new Date();
      const daysAgo = filters.dateRange === 'week' ? 7 : filters.dateRange === 'month' ? 30 : 90;
      const cutoff = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      matchesDate = transactionDate >= cutoff;
    }
    
    return matchesType && matchesSearch && matchesDate;
  });

  // Manejar compra de créditos
  const handlePurchase = async (planId: string) => {
    setIsProcessing(true);
    try {
      const success = await purchaseCredits(planId);
      if (success) {
        // Mostrar notificación de éxito
        setActiveTab('historial');
      }
    } catch (error) {
      console.error('Error en la compra:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Obtener color del tipo de transacción
  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'purchase': return 'text-green-600 bg-green-100';
      case 'bonus': return 'text-blue-600 bg-blue-100';
      case 'usage': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Obtener icono del tipo de transacción
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase': return ShoppingCart;
      case 'bonus': return Star;
      case 'usage': return TrendingUp;
      default: return CreditCard;
    }
  };

  const tabs = [
    { id: 'resumen', label: 'Resumen', icon: CreditCard },
    { id: 'historial', label: 'Historial', icon: History },
    { id: 'planes', label: 'Planes', icon: ShoppingCart }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Gestión de Créditos
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Administra tu balance, revisa el historial y compra más créditos
          </p>
        </div>

        {/* Tabs Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors duration-200 ${
                      activeTab === tab.id
                        ? 'border-[#01257D] text-[#01257D]'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Resumen Tab */}
            {activeTab === 'resumen' && (
              <div className="space-y-6">
                <CreditosSummary showDetails={true} variant="full" />
                
                {/* Estadísticas adicionales */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Promedio Mensual
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {Math.round(totalUsed / 3).toLocaleString('es-CO')}
                        </p>
                      </div>
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Eficiencia de Uso
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {totalPurchased > 0 ? Math.round(((totalPurchased - currentBalance) / totalPurchased) * 100) : 0}%
                        </p>
                      </div>
                      <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Días Restantes
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {totalUsed > 0 ? Math.max(1, Math.round(currentBalance / (totalUsed / 30))) : '∞'}
                        </p>
                      </div>
                      <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                        <AlertCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Historial Tab */}
            {activeTab === 'historial' && (
              <div className="space-y-6">
                {/* Filtros */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Buscar transacciones..."
                          value={filters.search}
                          onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#01257D] focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>
                    
                    <select
                      value={filters.type}
                      onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as any }))}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#01257D] focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="all">Todos los tipos</option>
                      <option value="purchase">Compras</option>
                      <option value="usage">Uso</option>
                      <option value="bonus">Bonos</option>
                    </select>
                    
                    <select
                      value={filters.dateRange}
                      onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#01257D] focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="all">Todos los períodos</option>
                      <option value="week">Última semana</option>
                      <option value="month">Último mes</option>
                      <option value="quarter">Último trimestre</option>
                    </select>
                    
                    <button className="px-4 py-2 bg-[#01257D] text-white rounded-lg hover:bg-[#01257D]/90 transition-colors duration-200 flex items-center space-x-2">
                      <Download className="h-4 w-4" />
                      <span>Exportar</span>
                    </button>
                  </div>
                </div>

                {/* Lista de transacciones */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Historial de Transacciones
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {filteredTransactions.length} transacciones encontradas
                    </p>
                  </div>
                  
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredTransactions.map((transaction) => {
                      const Icon = getTransactionIcon(transaction.type);
                      return (
                        <div key={transaction.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className={`p-2 rounded-lg ${getTransactionColor(transaction.type)}`}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {transaction.description}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {formatDate(transaction.date)}
                                  {transaction.service && ` • ${transaction.service}`}
                                </p>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <p className={`font-bold ${
                                transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {transaction.amount > 0 ? '+' : ''}
                                {transaction.amount.toLocaleString('es-CO')}
                              </p>
                              <p className={`text-xs px-2 py-1 rounded-full inline-block ${
                                transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                                transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {transaction.status === 'completed' ? 'Completado' :
                                 transaction.status === 'pending' ? 'Pendiente' : 'Fallido'}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {filteredTransactions.length === 0 && (
                    <div className="px-6 py-12 text-center">
                      <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">
                        No se encontraron transacciones con los filtros aplicados
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Planes Tab */}
            {activeTab === 'planes' && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Planes de Créditos
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Elige el plan que mejor se adapte a tus necesidades
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {availablePlans.map((plan) => (
                    <motion.div
                      key={plan.id}
                      whileHover={{ scale: 1.02 }}
                      className={`relative bg-white dark:bg-gray-800 rounded-lg border-2 p-6 ${
                        plan.popular 
                          ? 'border-[#01257D] shadow-lg' 
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      {plan.popular && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <span className="bg-[#01257D] text-white px-3 py-1 rounded-full text-xs font-medium">
                            Más Popular
                          </span>
                        </div>
                      )}
                      
                      <div className="text-center mb-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                          {plan.name}
                        </h3>
                        <div className="mb-4">
                          <span className="text-3xl font-bold text-gray-900 dark:text-white">
                            ${plan.price.toLocaleString('es-CO')}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400 ml-1">COP</span>
                        </div>
                        <div className="bg-[#01257D]/10 text-[#01257D] px-3 py-1 rounded-full text-sm font-medium inline-block">
                          {plan.credits.toLocaleString('es-CO')} créditos
                        </div>
                      </div>
                      
                      <ul className="space-y-3 mb-6">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center space-x-2">
                            <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                      
                      <button
                        onClick={() => handlePurchase(plan.id)}
                        disabled={isProcessing}
                        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors duration-200 ${
                          plan.popular
                            ? 'bg-[#01257D] text-white hover:bg-[#01257D]/90'
                            : 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {isProcessing ? 'Procesando...' : 'Comprar Plan'}
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
