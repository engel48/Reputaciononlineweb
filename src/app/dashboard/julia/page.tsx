'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Brain, Bot, AlertTriangle } from 'lucide-react';
import JuliaThinkingAnimation from '@/components/dashboard/JuliaThinkingAnimation';
import SimpleChat from '@/components/dashboard/SimpleChat';

/**
 * Página dedicada a Julia IA - Procesamiento Cognitivo
 *
 * Esta página contiene:
 * - Animación de red neuronal de Julia
 * - Chat con Julia IA
 * - Controles de modo de análisis
 * - Estado de análisis en tiempo real
 */
export default function JuliaPage() {
  const [neuralNetworkMode, setNeuralNetworkMode] = useState<'sentiment' | 'platform' | 'engagement'>('sentiment');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorConexion, setErrorConexion] = useState(false);

  // Simular análisis completado después de 8 segundos
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnalyzing(false);
    }, 8000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <Brain className="mr-3 h-8 w-8 text-[#01257D]" />
            Julia IA - Procesamiento Cognitivo
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-300">
            Análisis avanzado de reputación con inteligencia artificial
          </p>
        </div>
      </div>

      {/* Red Neuronal - Animación de Pensamiento */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <Sparkles className="mr-2 h-5 w-5 text-blue-500" />
            Red Neuronal de Análisis
          </h2>
          <div className="flex items-center space-x-4">
            {/* Selector de modo de análisis */}
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              {['sentiment', 'platform', 'engagement'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setNeuralNetworkMode(mode as any)}
                  className={`px-3 py-1 text-xs rounded-md transition-all duration-200 ${
                    neuralNetworkMode === mode
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {mode === 'sentiment' ? 'Sentimiento' : mode === 'platform' ? 'Plataforma' : 'Engagement'}
                </button>
              ))}
            </div>

            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
              {isAnalyzing ? (
                <>
                  <span className="relative flex h-3 w-3 mr-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                  </span>
                  Analizando en tiempo real
                </>
              ) : (
                <>
                  <div className="h-3 w-3 mr-2 rounded-full bg-green-500"></div>
                  Análisis completado
                </>
              )}
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 p-0 overflow-hidden rounded-xl shadow-lg border border-blue-100 dark:border-gray-700 relative">
          {/* Alerta de conexión si hay problemas */}
          {errorConexion && (
            <div className="absolute top-4 right-4 z-10 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg p-2 flex items-center text-sm text-red-800 dark:text-red-200">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Conexión limitada
            </div>
          )}

          <div className="w-full" style={{ height: "500px" }}>
            <JuliaThinkingAnimation
              particleCount={errorConexion ? 50 : 150}
              showMentions={!errorConexion}
              responsive={true}
              className="w-full h-full"
              title={isAnalyzing ? `Julia está analizando ${neuralNetworkMode === 'sentiment' ? 'sentimientos' : neuralNetworkMode === 'platform' ? 'plataformas' : 'engagement'}` : 'Análisis completado'}
              subtitle={isAnalyzing ? "Procesando menciones y sentimientos en tiempo real" : `Red neuronal lista para analizar`}
            />
          </div>
        </div>
      </motion.div>

      {/* Chat con Julia IA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center space-x-3 mb-4">
          <div className="relative">
            <div className="p-3 bg-gradient-to-r from-[#01257D] via-purple-600 to-blue-600 rounded-xl shadow-lg">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center">
              <span className="bg-gradient-to-r from-[#01257D] to-purple-600 bg-clip-text text-transparent">
                Julia IA
              </span>
              <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full dark:bg-blue-900/30 dark:text-blue-300">
                Asistente
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Análisis avanzado de reputación con IA • Asistente Julia integrado
            </p>
          </div>
        </div>

        {/* Chat funcional */}
        <SimpleChat />
      </motion.div>

      {/* Información adicional sobre Julia */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
          <div className="flex items-center space-x-3 mb-3">
            <Brain className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Análisis Profundo</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Julia analiza sentimientos, tendencias y patrones en tus menciones usando algoritmos avanzados de IA.
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-6 border border-purple-200 dark:border-purple-700">
          <div className="flex items-center space-x-3 mb-3">
            <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Procesamiento en Tiempo Real</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            La red neuronal procesa menciones continuamente, identificando patrones y alertas en tiempo real.
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-6 border border-green-200 dark:border-green-700">
          <div className="flex items-center space-x-3 mb-3">
            <Bot className="w-6 h-6 text-green-600 dark:text-green-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Asistente Inteligente</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Pregúntale a Julia sobre tu reputación, obtén insights y recomendaciones personalizadas.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
