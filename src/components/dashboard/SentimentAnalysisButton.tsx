/**
 * Componente: Botón de Análisis de Sentimiento
 *
 * Permite analizar el sentimiento de una mención individual o en batch
 * Integra con los endpoints de análisis de sentimiento
 */

'use client';

import React, { useState } from 'react';
import { Loader2, Brain, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SentimentAnalysisButtonProps {
  mentionId?: string;
  content: string;
  onAnalysisComplete?: (result: SentimentResult) => void;
  variant?: 'button' | 'icon';
}

interface SentimentResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  explanation: string;
  method: string;
}

export default function SentimentAnalysisButton({
  mentionId,
  content,
  onAnalysisComplete,
  variant = 'button'
}: SentimentAnalysisButtonProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<SentimentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeSentiment = async () => {
    if (!content || content.trim().length === 0) {
      setError('No hay contenido para analizar');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/mentions/analyze-sentiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          mentionId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al analizar sentimiento');
      }

      if (!data.success) {
        throw new Error(data.error || 'Análisis falló');
      }

      const sentimentResult: SentimentResult = {
        sentiment: data.data.sentiment,
        score: data.data.score,
        explanation: data.data.explanation,
        method: data.data.method
      };

      setResult(sentimentResult);

      // Callback opcional
      if (onAnalysisComplete) {
        onAnalysisComplete(sentimentResult);
      }

    } catch (err: any) {
      console.error('Error al analizar sentimiento:', err);
      setError(err.message || 'Error desconocido');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Renderizar icono según sentimiento
  const SentimentIcon = ({ sentiment }: { sentiment: string }) => {
    switch (sentiment) {
      case 'positive':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'negative':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  // Color según sentimiento
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'negative':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Texto en español para sentimientos
  const getSentimentText = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'Positivo';
      case 'negative':
        return 'Negativo';
      default:
        return 'Neutral';
    }
  };

  // Si ya hay resultado, mostrar badge
  if (result) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${getSentimentColor(result.sentiment)}`}>
        <SentimentIcon sentiment={result.sentiment} />
        <div className="flex flex-col">
          <span className="text-xs font-medium">{getSentimentText(result.sentiment)}</span>
          <span className="text-[10px] opacity-70">
            Score: {(result.score * 100).toFixed(0)}%
          </span>
        </div>
        {result.method === 'keywords' && (
          <span className="text-[10px] opacity-50" title="Análisis basado en keywords">
            (KB)
          </span>
        )}
      </div>
    );
  }

  // Si hay error, mostrar mensaje
  if (error) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600">
        <span className="text-xs">{error}</span>
        <button
          onClick={() => {
            setError(null);
            analyzeSentiment();
          }}
          className="text-xs underline hover:no-underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  // Botón para iniciar análisis
  if (variant === 'icon') {
    return (
      <button
        onClick={analyzeSentiment}
        disabled={isAnalyzing}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Analizar sentimiento"
      >
        {isAnalyzing ? (
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
        ) : (
          <Brain className="w-4 h-4 text-gray-600" />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={analyzeSentiment}
      disabled={isAnalyzing}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isAnalyzing ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Analizando...</span>
        </>
      ) : (
        <>
          <Brain className="w-4 h-4" />
          <span className="text-sm">Analizar Sentimiento</span>
        </>
      )}
    </button>
  );
}
