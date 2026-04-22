'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Brain, Bot, AlertTriangle, MessageSquare, BarChart3, FileText, History, Coins } from 'lucide-react';
import JuliaThinkingAnimation from '@/components/dashboard/JuliaThinkingAnimation';
import SimpleChat from '@/components/dashboard/SimpleChat';
import { CREDIT_COSTS } from '@/lib/credit-costs';
import { useHasMentionsData } from '@/hooks/useHasMentionsData';
import { useUser } from '@/context/UserContext';
import Link from 'next/link';

type JuliaTab = 'chat' | 'analysis' | 'reports' | 'history';

export default function JuliaPage() {
  const { user } = useUser();
  const { loading: hasDataLoading, hasConnections } = useHasMentionsData();
  const [activeTab, setActiveTab] = useState<JuliaTab>('chat');
  const [neuralNetworkMode, setNeuralNetworkMode] = useState<'sentiment' | 'platform' | 'engagement'>('sentiment');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorConexion, setErrorConexion] = useState(false);
  const firstName = user?.name ? user.name.split(' ')[0] : null;

  // Analisis states
  const [analysisText, setAnalysisText] = useState('');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  // Reports states
  const [reportName, setReportName] = useState('');
  const [reportResult, setReportResult] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsAnalyzing(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  const handleSentimentAnalysis = async () => {
    if (!analysisText.trim()) return;
    setAnalysisLoading(true);
    setAnalysisResult(null);
    try {
      const res = await fetch('/api/julia', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: analysisText, action: 'analyze' }),
      });
      const data = await res.json();
      if (data.success) {
        try { setAnalysisResult(JSON.parse(data.response)); } catch { setAnalysisResult({ raw: data.response }); }
      } else {
        setAnalysisResult({ error: data.response || data.error });
      }
    } catch (err) {
      setAnalysisResult({ error: 'Error de conexion' });
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleReputationReport = async () => {
    if (!reportName.trim()) return;
    setReportLoading(true);
    setReportResult(null);
    try {
      const res = await fetch('/api/julia', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: reportName, action: 'reputation', context: '[]' }),
      });
      const data = await res.json();
      if (data.success) {
        try { setReportResult(JSON.parse(data.response)); } catch { setReportResult({ raw: data.response }); }
      } else {
        setReportResult({ error: data.response || data.error });
      }
    } catch (err) {
      setReportResult({ error: 'Error de conexion' });
    } finally {
      setReportLoading(false);
    }
  };

  const tabs = [
    { id: 'chat' as JuliaTab, label: 'Chat', icon: MessageSquare, cost: CREDIT_COSTS.julia_chat },
    { id: 'analysis' as JuliaTab, label: 'Analisis', icon: Brain, cost: CREDIT_COSTS.julia_sentiment },
    { id: 'reports' as JuliaTab, label: 'Reportes', icon: FileText, cost: CREDIT_COSTS.julia_reputation },
    { id: 'history' as JuliaTab, label: 'Historial', icon: History, cost: 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Header con gradiente */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-[#01257D] via-purple-600 to-indigo-600 rounded-2xl p-6 mb-2"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
                <Brain className="h-7 w-7 text-white" />
              </motion.div>
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {firstName ? `Hola ${firstName}, soy Julia` : 'Julia IA'}
              </h1>
              <p className="text-white/70 text-sm">
                Análisis de reputación personalizado — respondo con tus datos reales
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
              <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-white/80 text-sm font-medium">IA Activa</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Hint: sin redes conectadas */}
      {!hasDataLoading && !hasConnections && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-4"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                {firstName ? `${firstName}, ` : ''}conecta tus redes para potenciar mis respuestas
              </h4>
              <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">
                Puedo chatear contigo ahora mismo, pero cuando conectes Facebook, Instagram, X o YouTube tendré contexto real (menciones, sentimiento, seguidores) para darte respuestas específicas a tu caso.
              </p>
              <Link
                href="/dashboard/redes-sociales"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#01257D] dark:text-blue-400 hover:underline mt-2"
              >
                <Sparkles className="h-3.5 w-3.5" /> Conectar redes sociales →
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tabs mejoradas */}
      <div className="flex space-x-1 bg-white dark:bg-gray-800 rounded-xl p-1.5 border border-gray-200 dark:border-gray-700 shadow-sm">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-[#01257D] to-indigo-600 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
            {tab.cost > 0 && (
              <span className={`flex items-center text-xs px-1.5 py-0.5 rounded ${
                activeTab === tab.id
                  ? 'bg-white/20 text-white'
                  : 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20'
              }`}>
                <Coins className="w-3 h-3 mr-0.5" />{tab.cost}
              </span>
            )}
          </motion.button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'chat' && (
        <>
          {/* Red Neuronal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <Sparkles className="mr-2 h-5 w-5 text-blue-500" />
                Red Neuronal de Analisis
              </h2>
              <div className="flex items-center space-x-4">
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
                      Analisis completado
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 p-0 overflow-hidden rounded-xl shadow-lg border border-blue-100 dark:border-gray-700 relative">
              {errorConexion && (
                <div className="absolute top-4 right-4 z-10 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg p-2 flex items-center text-sm text-red-800 dark:text-red-200">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Conexion limitada
                </div>
              )}
              <div className="w-full" style={{ height: "500px" }}>
                <JuliaThinkingAnimation
                  particleCount={errorConexion ? 50 : 150}
                  showMentions={!errorConexion}
                  responsive={true}
                  className="w-full h-full"
                  title={isAnalyzing ? `Julia esta analizando ${neuralNetworkMode === 'sentiment' ? 'sentimientos' : neuralNetworkMode === 'platform' ? 'plataformas' : 'engagement'}` : 'Analisis completado'}
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
                  Analisis avanzado de reputacion con IA
                </p>
              </div>
            </div>
            <SimpleChat />
          </motion.div>
        </>
      )}

      {activeTab === 'analysis' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <Brain className="w-5 h-5 mr-2 text-[#01257D]" />
            Analisis de Sentimiento
            <span className="ml-2 flex items-center text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded dark:bg-amber-900/20 dark:text-amber-400">
              <Coins className="w-3 h-3 mr-0.5" />{CREDIT_COSTS.julia_sentiment} creditos
            </span>
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Pega un texto, comentario o mencion para analizar su sentimiento con Julia IA.
          </p>
          <textarea
            value={analysisText}
            onChange={(e) => setAnalysisText(e.target.value)}
            placeholder="Pega aqui el texto a analizar..."
            className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm resize-none focus:ring-2 focus:ring-[#01257D]"
          />
          <button
            onClick={handleSentimentAnalysis}
            disabled={analysisLoading || !analysisText.trim()}
            className="mt-3 px-6 py-2 bg-[#01257D] text-white rounded-lg hover:bg-[#013AAA] disabled:opacity-50 font-medium text-sm"
          >
            {analysisLoading ? 'Analizando...' : 'Analizar Sentimiento'}
          </button>

          {analysisResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              {analysisResult.error ? (
                <p className="text-red-600 dark:text-red-400">{analysisResult.error}</p>
              ) : analysisResult.raw ? (
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{analysisResult.raw}</p>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      analysisResult.sentiment === 'positive' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                      : analysisResult.sentiment === 'negative' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
                    }`}>
                      {analysisResult.sentiment === 'positive' ? 'Positivo' : analysisResult.sentiment === 'negative' ? 'Negativo' : 'Neutral'}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Score: <strong>{analysisResult.score?.toFixed(2)}</strong>
                    </span>
                  </div>
                  {analysisResult.explanation && (
                    <p className="text-sm text-gray-700 dark:text-gray-300">{analysisResult.explanation}</p>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      )}

      {activeTab === 'reports' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-[#01257D]" />
            Reporte de Reputacion
            <span className="ml-2 flex items-center text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded dark:bg-amber-900/20 dark:text-amber-400">
              <Coins className="w-3 h-3 mr-0.5" />{CREDIT_COSTS.julia_reputation} creditos
            </span>
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Ingresa el nombre de una persona o marca para generar un reporte de reputacion con Julia IA.
          </p>
          <input
            type="text"
            value={reportName}
            onChange={(e) => setReportName(e.target.value)}
            placeholder="Nombre de persona o marca..."
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-[#01257D]"
          />
          <button
            onClick={handleReputationReport}
            disabled={reportLoading || !reportName.trim()}
            className="mt-3 px-6 py-2 bg-[#01257D] text-white rounded-lg hover:bg-[#013AAA] disabled:opacity-50 font-medium text-sm"
          >
            {reportLoading ? 'Generando reporte...' : 'Generar Reporte'}
          </button>

          {reportResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 space-y-4"
            >
              {reportResult.error ? (
                <p className="text-red-600 dark:text-red-400 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">{reportResult.error}</p>
              ) : reportResult.raw ? (
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">{reportResult.raw}</p>
              ) : (
                <>
                  {/* Score */}
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-600 dark:text-blue-400">Score de Reputacion</p>
                        <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{reportResult.overallScore || 50}/100</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        reportResult.sentiment === 'positive' ? 'bg-green-100 text-green-700' : reportResult.sentiment === 'negative' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {reportResult.sentiment === 'positive' ? 'Positivo' : reportResult.sentiment === 'negative' ? 'Negativo' : 'Neutral'}
                      </span>
                    </div>
                  </div>

                  {/* Summary */}
                  {reportResult.summary && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Resumen</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{reportResult.summary}</p>
                    </div>
                  )}

                  {/* Strengths & Risks */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reportResult.strengths?.length > 0 && (
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">Fortalezas</h4>
                        <ul className="space-y-1">
                          {reportResult.strengths.map((s: string, i: number) => (
                            <li key={i} className="text-sm text-green-700 dark:text-green-400">- {s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {reportResult.risks?.length > 0 && (
                      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <h4 className="font-medium text-red-800 dark:text-red-300 mb-2">Riesgos</h4>
                        <ul className="space-y-1">
                          {reportResult.risks.map((r: string, i: number) => (
                            <li key={i} className="text-sm text-red-700 dark:text-red-400">- {r}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Recommendations */}
                  {reportResult.recommendations?.length > 0 && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Recomendaciones</h4>
                      <ul className="space-y-1">
                        {reportResult.recommendations.map((r: string, i: number) => (
                          <li key={i} className="text-sm text-blue-700 dark:text-blue-400">- {r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </motion.div>
      )}

      {activeTab === 'history' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700"
        >
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <History className="w-5 h-5 mr-2 text-[#01257D]" />
            Historial de Interacciones
          </h2>
          <div className="text-center py-12">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <History className="w-14 h-14 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            </motion.div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">El historial de conversaciones con Julia se mostrara aqui</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Proximamente: historial persistente con busqueda</p>
          </div>
        </motion.div>
      )}

      {/* Info cards mejoradas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {[
          {
            icon: Brain,
            title: 'Analisis Profundo',
            desc: 'Julia analiza sentimientos, tendencias y patrones en tus menciones usando algoritmos avanzados de IA.',
            gradient: 'from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20',
            border: 'border-blue-200 dark:border-blue-700',
            iconBg: 'bg-blue-500',
            iconColor: 'text-white'
          },
          {
            icon: Sparkles,
            title: 'Procesamiento en Tiempo Real',
            desc: 'La red neuronal procesa menciones continuamente, identificando patrones y alertas en tiempo real.',
            gradient: 'from-purple-50 to-violet-100 dark:from-purple-900/20 dark:to-violet-900/20',
            border: 'border-purple-200 dark:border-purple-700',
            iconBg: 'bg-purple-500',
            iconColor: 'text-white'
          },
          {
            icon: Bot,
            title: 'Asistente Inteligente',
            desc: 'Preguntale a Julia sobre tu reputacion, obten insights y recomendaciones personalizadas.',
            gradient: 'from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-900/20',
            border: 'border-emerald-200 dark:border-emerald-700',
            iconBg: 'bg-emerald-500',
            iconColor: 'text-white'
          }
        ].map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 + i * 0.1 }}
            whileHover={{ y: -4, boxShadow: '0 12px 30px rgba(0,0,0,0.08)' }}
            className={`bg-gradient-to-br ${card.gradient} rounded-xl p-6 border ${card.border} transition-shadow cursor-default`}
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className={`p-2.5 rounded-xl ${card.iconBg} shadow-lg`}>
                <card.icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white">{card.title}</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              {card.desc}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
