'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Coins, TrendingUp, TrendingDown, Clock, Plus, AlertTriangle } from 'lucide-react';
import { useCredits } from '@/context/CreditosContext';
import { usePlan } from '@/context/PlanContext';

function formatRelativeTime(date: Date | null): string {
  if (!date) return 'Nunca actualizado';
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSec < 5) return 'Actualizado ahora';
  if (diffSec < 60) return `hace ${diffSec}s`;
  if (diffSec < 3600) return `hace ${Math.floor(diffSec / 60)} min`;
  if (diffSec < 86400) return `hace ${Math.floor(diffSec / 3600)} h`;
  return `el ${date.toLocaleDateString('es-CO')}`;
}

/**
 * Widget compacto de créditos que se muestra arriba del dashboard.
 * - Muestra el balance en vivo (sincronizado por evento `creditsChanged`)
 * - Indica uso del mes vs límite del plan
 * - Alerta si el saldo está bajo (<10% del límite)
 * - CTA a comprar más créditos
 */
export function CreditsWidget() {
  const { currentBalance, isLoading, lastUpdated, getMonthlyUsage } = useCredits();
  const { currentPlan, getFeatureLimit, isFeatureUnlimited } = usePlan();

  // Tick cada 30s para refrescar "hace X min"
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const monthlyLimit = getFeatureLimit('maxMonthlyCredits');
  const unlimited = isFeatureUnlimited('maxMonthlyCredits');
  const monthlyUsed = getMonthlyUsage();
  const usagePct = unlimited || monthlyLimit <= 0 ? 0 : Math.min((monthlyUsed / monthlyLimit) * 100, 100);
  const lowBalance = !unlimited && monthlyLimit > 0 && currentBalance / monthlyLimit < 0.1;

  const planLabels: Record<string, string> = {
    free: 'Gratis',
    basic: 'Básico',
    pro: 'Pro',
    enterprise: 'Enterprise',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`rounded-2xl border p-4 sm:p-5 ${
        lowBalance
          ? 'border-red-300 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/10'
          : 'border-gray-200 dark:border-gray-700 bg-gradient-to-r from-[#01257D]/5 to-[#00E5FF]/5 dark:from-[#01257D]/20 dark:to-[#00E5FF]/10'
      }`}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div
            className={`p-3 rounded-xl shadow-sm ${
              lowBalance ? 'bg-red-500 text-white' : 'bg-gradient-to-br from-[#01257D] to-indigo-600 text-white'
            }`}
          >
            <Coins className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                {isLoading ? '...' : currentBalance.toLocaleString('es-CO')}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">créditos</span>
              {lowBalance && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold uppercase">
                  <AlertTriangle className="h-3 w-3" /> saldo bajo
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs font-semibold text-[#01257D] dark:text-blue-400">
                Plan {planLabels[currentPlan] || currentPlan}
              </span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatRelativeTime(lastUpdated)}
              </span>
            </div>
          </div>
        </div>

        <Link
          href="/dashboard/creditos"
          className="inline-flex items-center gap-1 px-4 py-2 bg-[#01257D] hover:bg-[#013AAA] text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Ver / Comprar
        </Link>
      </div>

      {/* Barra de uso mensual (si hay límite) */}
      {!unlimited && monthlyLimit > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-600 dark:text-gray-400">Uso este mes</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {monthlyUsed.toLocaleString('es-CO')} / {monthlyLimit.toLocaleString('es-CO')}
            </span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                usagePct >= 90
                  ? 'bg-red-500'
                  : usagePct >= 70
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${usagePct}%` }}
            />
          </div>
        </div>
      )}
      {unlimited && (
        <p className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          Plan con créditos ilimitados
        </p>
      )}
    </motion.div>
  );
}

export default CreditsWidget;
