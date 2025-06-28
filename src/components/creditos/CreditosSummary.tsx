"use client";

import React from 'react';
import { useCredits } from '@/context/CreditosContext';
import { motion } from 'framer-motion';
import { AlertTriangle, TrendingUp, TrendingDown, CreditCard, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface CreditosSummaryProps {
  showDetails?: boolean;
  variant?: 'dashboard' | 'full';
}

export default function CreditosSummary({ showDetails = true, variant = 'dashboard' }: CreditosSummaryProps) {
  const { 
    currentBalance, 
    totalPurchased, 
    totalUsed, 
    isLoading,
    getMonthlyUsage,
    getWeeklyUsage,
    refreshData
  } = useCredits();
  
  // Cálculos para la visualización
  const usagePercentage = totalPurchased > 0 ? (totalUsed / totalPurchased) * 100 : 0;
  const monthlyUsage = getMonthlyUsage();
  const weeklyUsage = getWeeklyUsage();
  
  // Determinar el estado de los créditos
  const getBalanceStatus = () => {
    const percentage = totalPurchased > 0 ? (currentBalance / totalPurchased) * 100 : 0;
    if (percentage < 10) return { status: 'critical', color: 'text-red-600', bgColor: 'bg-red-100', barColor: 'bg-red-500' };
    if (percentage < 25) return { status: 'warning', color: 'text-yellow-600', bgColor: 'bg-yellow-100', barColor: 'bg-yellow-500' };
    return { status: 'healthy', color: 'text-green-600', bgColor: 'bg-green-100', barColor: 'bg-[#01257D]' };
  };

  const balanceStatus = getBalanceStatus();

  // Animaciones
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: 'easeOut' }
    }
  };

  const progressVariants = {
    hidden: { width: 0 },
    visible: { 
      width: `${100 - usagePercentage}%`,
      transition: { duration: 1, ease: 'easeOut', delay: 0.3 }
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
            <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          </div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${balanceStatus.bgColor}`}>
            <CreditCard className={`h-5 w-5 ${balanceStatus.color}`} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Mis Créditos
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Balance actual y consumo
            </p>
          </div>
        </div>
        
        <button
          onClick={refreshData}
          className="p-2 text-gray-400 hover:text-[#01257D] transition-colors duration-200"
          title="Actualizar datos"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Balance Principal */}
      <div className="mb-6">
        <div className="flex items-end justify-between mb-2">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Créditos Disponibles
            </p>
            <div className="flex items-end space-x-2">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {currentBalance.toLocaleString('es-CO')}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                / {totalPurchased.toLocaleString('es-CO')}
              </span>
            </div>
          </div>
          
          {/* Indicador de tendencia */}
          <div className={`flex items-center space-x-1 ${balanceStatus.color}`}>
            {balanceStatus.status === 'critical' ? (
              <>
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">Crítico</span>
              </>
            ) : balanceStatus.status === 'warning' ? (
              <>
                <TrendingDown className="h-4 w-4" />
                <span className="text-sm font-medium">Bajo</span>
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">Saludable</span>
              </>
            )}
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2">
          <motion.div
            variants={progressVariants}
            className={`h-3 rounded-full ${balanceStatus.barColor}`}
          />
        </div>
        
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{usagePercentage.toFixed(1)}% utilizado</span>
          <span>{(100 - usagePercentage).toFixed(1)}% disponible</span>
        </div>
      </div>

      {/* Estadísticas detalladas */}
      {showDetails && (
        <div className="space-y-4">
          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Uso Mensual
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                {monthlyUsage.toLocaleString('es-CO')}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                créditos este mes
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Uso Semanal
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                {weeklyUsage.toLocaleString('es-CO')}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                créditos esta semana
              </p>
            </div>
          </div>

          {/* Resumen de totales */}
          <div className="bg-gradient-to-r from-[#01257D]/5 to-[#01257D]/10 dark:from-[#01257D]/10 dark:to-[#01257D]/20 rounded-lg p-4 border border-[#01257D]/20">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900 dark:text-white">Resumen Total</h3>
              <span className="text-xs bg-[#01257D]/10 text-[#01257D] px-2 py-1 rounded-full font-medium">
                Periodo completo
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Comprados</p>
                <p className="text-lg font-bold text-green-600">
                  +{totalPurchased.toLocaleString('es-CO')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Utilizados</p>
                <p className="text-lg font-bold text-red-600">
                  -{totalUsed.toLocaleString('es-CO')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Balance</p>
                <p className="text-lg font-bold text-[#01257D]">
                  {currentBalance.toLocaleString('es-CO')}
                </p>
              </div>
            </div>
          </div>

          {/* Acciones rápidas */}
          {variant === 'dashboard' && (
            <div className="flex space-x-3">
              <Link
                href="/dashboard/creditos"
                className="flex-1 bg-[#01257D] hover:bg-[#01257D]/90 text-white text-center py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200"
              >
                Ver Detalles
              </Link>
              <Link
                href="/dashboard/creditos?tab=planes"
                className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white text-center py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200"
              >
                Comprar Más
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Alerta de créditos bajos */}
      {balanceStatus.status === 'critical' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
        >
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              Créditos Críticos
            </p>
          </div>
          <p className="text-xs text-red-600 dark:text-red-300 mt-1">
            Tu balance está muy bajo. Considera comprar más créditos para continuar usando todos los servicios.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
