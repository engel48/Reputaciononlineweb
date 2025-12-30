/**
 * Componente: Análisis de Sentimiento en Batch
 *
 * Permite analizar múltiples menciones pendientes en batch
 * Muestra progreso y estadísticas del análisis
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Brain, CheckCircle, XCircle, AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface BatchSentimentAnalysisProps {
  userId?: string;
  onComplete?: (stats: AnalysisStats) => void;
}

interface AnalysisStats {
  total: number;
  analyzed: number;
  failed: number;
  positive: number;
  negative: number;
  neutral: number;
}

interface PendingMention {
  id: string;
  platform: string;
  content: string;
  author_name: string;
  published_at: string;
}

export default function BatchSentimentAnalysis({ userId, onComplete }: BatchSentimentAnalysisProps) {
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stats, setStats] = useState<AnalysisStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cargar conteo de menciones pendientes
  useEffect(() => {
    loadPendingCount();
  }, [userId]);

  const loadPendingCount = async () => {
    setIsLoading(true);
    try {
      const url = userId
        ? `/api/mentions/pending-analysis?userId=${userId}&limit=1`
        : '/api/mentions/pending-analysis?limit=1';

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setPendingCount(data.data.total);
      }
    } catch (err) {
      console.error('Error cargando menciones pendientes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeBatch = async (batchSize: number = 50) => {
    setIsAnalyzing(true);
    setError(null);
    setStats(null);

    try {
      // 1. Obtener menciones pendientes
      const url = userId
        ? `/api/mentions/pending-analysis?userId=${userId}&limit=${batchSize}`
        : `/api/mentions/pending-analysis?limit=${batchSize}`;

      const pendingResponse = await fetch(url);
      const pendingData = await pendingResponse.json();

      if (!pendingData.success) {
        throw new Error(pendingData.error || 'Error al obtener menciones pendientes');
      }

      if (pendingData.data.count === 0) {
        setError('No hay menciones pendientes para analizar');
        return;
      }

      const mentionIds = pendingData.data.mentions.map((m: PendingMention) => m.id);

      // 2. Analizar en batch
      const batchResponse = await fetch('/api/mentions/analyze-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mentionIds })
      });

      const batchData = await batchResponse.json();

      if (!batchData.success) {
        throw new Error(batchData.error || 'Error en análisis batch');
      }

      // 3. Calcular estadísticas
      const results = batchData.data.results;
      const sentimentCounts = {
        positive: 0,
        negative: 0,
        neutral: 0
      };

      results.forEach((result: any) => {
        if (result.sentiment) {
          sentimentCounts[result.sentiment as keyof typeof sentimentCounts]++;
        }
      });

      const analysisStats: AnalysisStats = {
        total: batchData.data.total,
        analyzed: batchData.data.analyzed,
        failed: batchData.data.failed,
        positive: sentimentCounts.positive,
        negative: sentimentCounts.negative,
        neutral: sentimentCounts.neutral
      };

      setStats(analysisStats);

      // Actualizar conteo de pendientes
      setPendingCount(prev => Math.max(0, prev - batchData.data.analyzed));

      // Callback
      if (onComplete) {
        onComplete(analysisStats);
      }

    } catch (err: any) {
      console.error('Error en análisis batch:', err);
      setError(err.message || 'Error desconocido');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Si está cargando
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6 bg-white rounded-lg border border-gray-200">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500 mr-2" />
        <span className="text-sm text-gray-600">Cargando menciones pendientes...</span>
      </div>
    );
  }

  // Si hay error
  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg border border-red-200">
        <div className="flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800">Error en el análisis</h3>
            <p className="text-sm text-red-600 mt-1">{error}</p>
            <button
              onClick={() => {
                setError(null);
                loadPendingCount();
              }}
              className="mt-3 text-sm text-red-600 underline hover:no-underline"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Si está analizando
  if (isAnalyzing) {
    return (
      <div className="p-6 bg-white rounded-lg border border-blue-200">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <div>
            <h3 className="text-sm font-medium text-gray-900">Analizando menciones...</h3>
            <p className="text-sm text-gray-600 mt-1">
              Este proceso puede tomar varios minutos dependiendo de la cantidad de menciones.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Si hay resultados
  if (stats) {
    return (
      <div className="p-6 bg-white rounded-lg border border-green-200">
        <div className="flex items-start gap-3 mb-4">
          <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-900">Análisis completado</h3>
            <p className="text-sm text-gray-600 mt-1">
              {stats.analyzed} de {stats.total} menciones analizadas correctamente
            </p>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="p-3 rounded-lg bg-green-50 border border-green-200">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-xs font-medium text-green-700">Positivo</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.positive}</p>
            <p className="text-xs text-green-600 mt-1">
              {((stats.positive / stats.analyzed) * 100).toFixed(0)}%
            </p>
          </div>

          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-red-600" />
              <span className="text-xs font-medium text-red-700">Negativo</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{stats.negative}</p>
            <p className="text-xs text-red-600 mt-1">
              {((stats.negative / stats.analyzed) * 100).toFixed(0)}%
            </p>
          </div>

          <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <Minus className="w-4 h-4 text-gray-600" />
              <span className="text-xs font-medium text-gray-700">Neutral</span>
            </div>
            <p className="text-2xl font-bold text-gray-600">{stats.neutral}</p>
            <p className="text-xs text-gray-600 mt-1">
              {((stats.neutral / stats.analyzed) * 100).toFixed(0)}%
            </p>
          </div>
        </div>

        {stats.failed > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-yellow-700">
                {stats.failed} menciones no pudieron ser analizadas
              </span>
            </div>
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => {
              setStats(null);
              loadPendingCount();
            }}
            className="flex-1 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            Cerrar
          </button>
          {pendingCount > 0 && (
            <button
              onClick={() => analyzeBatch()}
              className="flex-1 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors text-sm font-medium"
            >
              Analizar más ({pendingCount} pendientes)
            </button>
          )}
        </div>
      </div>
    );
  }

  // Estado inicial: mostrar botón para iniciar análisis
  return (
    <div className="p-6 bg-white rounded-lg border border-gray-200">
      <div className="flex items-start gap-3">
        <Brain className="w-6 h-6 text-blue-500 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-900">Análisis de Sentimiento Automático</h3>
          <p className="text-sm text-gray-600 mt-1">
            {pendingCount > 0
              ? `Hay ${pendingCount} menciones sin analizar. El análisis usa IA para detectar el sentimiento de cada mención.`
              : 'No hay menciones pendientes de análisis. ¡Todas están actualizadas!'}
          </p>

          {pendingCount > 0 && (
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => analyzeBatch(50)}
                className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors text-sm font-medium"
              >
                Analizar 50 menciones
              </button>
              <button
                onClick={() => analyzeBatch(100)}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Analizar 100 menciones
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
