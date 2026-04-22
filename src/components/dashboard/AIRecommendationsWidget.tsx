'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Sparkles,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  Lightbulb,
  Loader2,
} from 'lucide-react';

interface Recommendation {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
}

interface RecommendationsResponse {
  success: boolean;
  data?: {
    recommendations: Recommendation[];
    summary: string;
  };
  error?: string;
  credits?: { cost: number; newBalance?: number };
}

const priorityStyles: Record<Recommendation['priority'], { badge: string; border: string }> = {
  high: {
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    border: 'border-l-red-500',
  },
  medium: {
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    border: 'border-l-amber-500',
  },
  low: {
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    border: 'border-l-emerald-500',
  },
};

const priorityLabel: Record<Recommendation['priority'], string> = {
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
};

export function AIRecommendationsWidget() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RecommendationsResponse['data'] | null>(null);
  const [creditsInfo, setCreditsInfo] = useState<{ cost: number; newBalance?: number } | null>(null);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/recommendations', {
        credentials: 'include',
      });
      const json: RecommendationsResponse = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'No se pudieron generar recomendaciones');
      }
      setData(json.data || null);
      if (json.credits) setCreditsInfo(json.credits);
    } catch (err: any) {
      setError(err?.message || 'Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="card overflow-hidden"
    >
      <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-[#01257D] to-indigo-600 shadow-sm">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Recomendaciones de Julia
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Generadas con tus datos reales
            </p>
          </div>
        </div>
        <button
          onClick={fetchRecommendations}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition"
          title="Regenerar con Julia IA (consume créditos)"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          Regenerar
        </button>
      </div>

      <div className="p-4">
        <AnimatePresence mode="wait">
          {loading && !data && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-10 text-gray-500 dark:text-gray-400"
            >
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Julia está analizando tus datos...
            </motion.div>
          )}

          {error && !loading && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-amber-500" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {error.toLowerCase().includes('crédito')
                  ? 'No tienes créditos suficientes para generar recomendaciones.'
                  : error.toLowerCase().includes('no autenticado')
                  ? 'Inicia sesión para ver recomendaciones personalizadas.'
                  : 'Conecta tus redes sociales para que Julia genere recomendaciones personalizadas.'}
              </p>
              <Link
                href="/dashboard/redes-sociales"
                className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-[#01257D] dark:text-blue-400 hover:underline"
              >
                Conectar redes <ArrowRight className="h-3 w-3" />
              </Link>
            </motion.div>
          )}

          {data && !loading && (
            <motion.div
              key="data"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              {data.summary && (
                <p className="text-sm text-gray-700 dark:text-gray-300 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/10 rounded-lg p-3 border-l-4 border-[#00E5FF]">
                  {data.summary}
                </p>
              )}

              {data.recommendations.length === 0 ? (
                <p className="text-sm text-center text-gray-500 dark:text-gray-400 py-4">
                  Julia no tiene recomendaciones específicas en este momento.
                </p>
              ) : (
                <ul className="space-y-2">
                  {data.recommendations.slice(0, 5).map((rec, i) => {
                    const style = priorityStyles[rec.priority] || priorityStyles.medium;
                    return (
                      <li
                        key={i}
                        className={`border-l-4 ${style.border} bg-gray-50 dark:bg-gray-900/40 rounded-r-lg p-3`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                            <Lightbulb className="inline h-3.5 w-3.5 mr-1 text-amber-500" />
                            {rec.title}
                          </h4>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${style.badge}`}
                          >
                            {priorityLabel[rec.priority] || rec.priority}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {rec.description}
                        </p>
                        {rec.category && (
                          <span className="inline-block mt-2 text-[10px] font-medium text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                            {rec.category}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}

              {creditsInfo && (
                <p className="text-[10px] text-gray-400 dark:text-gray-500 text-right">
                  Costo: {creditsInfo.cost} crédito{creditsInfo.cost !== 1 ? 's' : ''} ·{' '}
                  {creditsInfo.newBalance !== undefined && `Balance: ${creditsInfo.newBalance}`}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default AIRecommendationsWidget;
