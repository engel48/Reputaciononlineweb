'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Radio, ArrowRight, Sparkles, Clock } from 'lucide-react';

interface EmptyMentionsStateProps {
  title?: string;
  description?: string;
  ctaHref?: string;
  ctaLabel?: string;
  variant?: 'default' | 'compact';
  icon?: React.ReactNode;
}

/**
 * Empty state reutilizable para páginas de menciones / analytics sin datos.
 * Explica por qué no hay datos y guía al usuario a conectar redes sociales.
 */
export function EmptyMentionsState({
  title = 'Aún no hay menciones para mostrar',
  description = 'Conecta tus redes sociales y el sistema sincronizará las menciones automáticamente cada 30 minutos. Los datos aparecerán aquí tan pronto como Julia detecte actividad.',
  ctaHref = '/dashboard/redes-sociales',
  ctaLabel = 'Conectar redes sociales',
  variant = 'default',
  icon,
}: EmptyMentionsStateProps) {
  const isCompact = variant === 'compact';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden ${
        isCompact ? 'p-6' : 'p-10'
      }`}
    >
      <div className="flex flex-col items-center text-center max-w-lg mx-auto">
        <div className="relative mb-4">
          <div className="absolute inset-0 bg-gradient-to-br from-[#01257D]/10 to-indigo-500/10 rounded-2xl blur-xl" />
          <div className="relative p-4 bg-gradient-to-br from-[#01257D] to-indigo-600 rounded-2xl shadow-lg">
            {icon || <Radio className="h-8 w-8 text-white" />}
          </div>
        </div>

        <h3
          className={`font-bold text-gray-900 dark:text-white ${
            isCompact ? 'text-lg' : 'text-xl'
          } mb-2`}
        >
          {title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{description}</p>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Link
            href={ctaHref}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#01257D] hover:bg-[#013AAA] text-white font-medium rounded-lg transition-colors text-sm"
          >
            <Sparkles className="h-4 w-4" />
            {ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {!isCompact && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full text-left">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700">
              <Clock className="h-4 w-4 text-[#00E5FF] mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs font-semibold text-gray-900 dark:text-white">
                  Sync automático
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Cada 30 minutos
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700">
              <Radio className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs font-semibold text-gray-900 dark:text-white">
                  4 redes sociales
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  FB, IG, X, YouTube
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700">
              <Sparkles className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs font-semibold text-gray-900 dark:text-white">
                  IA Julia
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Análisis automático
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default EmptyMentionsState;
