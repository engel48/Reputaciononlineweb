"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, MessageCircle, ThumbsUp, ThumbsDown, Brain, Globe, Calendar, Users, BarChart3, PieChart, Activity, AlertCircle, CheckCircle, Clock, RefreshCw, Sparkles } from 'lucide-react';

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  personalityName: string;
  onAnalyze: (name: string) => Promise<any>;
}

export default function AnalysisModal({ isOpen, onClose, personalityName, onAnalyze }: AnalysisModalProps) {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && personalityName) {
      performAnalysis();
    }
  }, [isOpen, personalityName]);

  const performAnalysis = async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const result = await onAnalyze(personalityName);
      setAnalysis(result);
    } catch (err) {
      setError('Error al realizar el análisis. Por favor, inténtalo de nuevo.');
      console.error('Error en análisis:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-100 border-green-200';
      case 'negative': return 'text-red-600 bg-red-100 border-red-200';
      case 'neutral': return 'text-gray-600 bg-gray-100 border-gray-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Fecha reciente';
    }
  };

  const handleClose = () => {
    setAnalysis(null);
    setLoading(false);
    setError(null);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      e.preventDefault();
      e.stopPropagation();
      handleClose();
    }
  };

  const handleEscapeKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'hidden';
    } else {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[99999] p-4"
          onClick={handleBackdropClick}
        >
        <motion.div
          initial={{ scale: 0.3, opacity: 0, y: 100 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.3, opacity: 0, y: 100 }}
          transition={{ type: "spring", stiffness: 200, damping: 20, duration: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden relative z-[100000]"
          onClick={(e) => e.stopPropagation()}
          style={{ 
            minHeight: "80vh",
            minWidth: "90vw",
            maxWidth: "95vw"
          }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#01257D] to-blue-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Análisis de Reputación Online con Datos Reales</h2>
                  <p className="text-blue-100">{personalityName}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-200">Búsqueda en tiempo real activa</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {analysis?.real_data && (
                  <div className="flex items-center space-x-1 bg-green-500 bg-opacity-20 px-3 py-1 rounded-full">
                    <Globe className="w-4 h-4" />
                    <span className="text-xs">Datos Reales</span>
                  </div>
                )}
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors group"
                  title="Cerrar ventana (ESC)"
                >
                  <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-200" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[calc(90vh-120px)] overflow-y-auto">
            {loading && (
              <div className="p-12 text-center">
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <RefreshCw className="w-12 h-12 text-[#01257D] animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 bg-[#01257D] bg-opacity-20 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Analizando reputación online...
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Realizando scraping en tiempo real de redes sociales y noticias
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                        <span>Buscando en Google News...</span>
                      </div>
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        <span>Analizando redes sociales...</span>
                      </div>
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                        <span>Procesando con Sofia IA...</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="p-8 text-center">
                <div className="flex flex-col items-center space-y-4">
                  <AlertCircle className="w-12 h-12 text-red-500" />
                  <div>
                    <h3 className="text-lg font-semibold text-red-600 mb-2">Error en el análisis</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
                    <button
                      onClick={performAnalysis}
                      className="px-4 py-2 bg-[#01257D] text-white rounded-lg hover:bg-[#013AAA] transition-colors"
                    >
                      Reintentar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {analysis && !loading && (
              <div className="p-6 space-y-6">
                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-700"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-600 dark:text-green-400">Score de Reputación</p>
                        <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                          {analysis.analysis?.reputation_score || 'N/A'}/100
                        </p>
                      </div>
                      <BarChart3 className="w-8 h-8 text-green-600" />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-700"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-600 dark:text-blue-400">Total Menciones</p>
                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                          {analysis.analysis?.total_mentions || 0}
                        </p>
                      </div>
                      <MessageCircle className="w-8 h-8 text-blue-600" />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-700"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-600 dark:text-green-400">Sentimiento Positivo</p>
                        <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                          {analysis.analysis?.overall_sentiment?.positive || 0}%
                        </p>
                      </div>
                      <ThumbsUp className="w-8 h-8 text-green-600" />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg border border-red-200 dark:border-red-700"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-red-600 dark:text-red-400">Sentimiento Negativo</p>
                        <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                          {analysis.analysis?.overall_sentiment?.negative || 0}%
                        </p>
                      </div>
                      <ThumbsDown className="w-8 h-8 text-red-600" />
                    </div>
                  </motion.div>
                </div>

                {/* Sources Analysis */}
                {analysis.analysis?.sources && analysis.analysis.sources.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <Activity className="w-5 h-5 mr-2 text-[#01257D]" />
                      Análisis por Fuentes
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {analysis.analysis.sources.map((source: any, index: number) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.6 + index * 0.1 }}
                          className="bg-white dark:bg-gray-600 p-4 rounded-lg border border-gray-200 dark:border-gray-500"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-gray-900 dark:text-white">{source.source}</h4>
                            <span className="text-sm text-gray-500 dark:text-gray-400">{source.mentions} menciones</span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                  className="bg-green-500 h-2 rounded-full"
                                  style={{ width: `${source.sentiment?.positive || 0}%` }}
                                />
                              </div>
                              <span className="text-xs text-green-600">{source.sentiment?.positive || 0}%</span>
                            </div>
                            {source.recent_mentions && source.recent_mentions.length > 0 && (
                              <div className="mt-3">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Mención reciente:</p>
                                <p className="text-xs text-gray-700 dark:text-gray-300 truncate">
                                  {source.recent_mentions[0].title}
                                </p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Key Insights */}
                {analysis.analysis?.key_insights && analysis.analysis.key_insights.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-700"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <div className="flex items-center space-x-1 mr-2">
                        <div className="p-1.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                          <Brain className="w-4 h-4 text-white" />
                        </div>
                        <div className="p-1 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                          <Sparkles className="w-3 h-3 text-yellow-600 dark:text-yellow-400" />
                        </div>
                      </div>
                      Insights Clave (Sofia IA)
                    </h3>
                    <div className="space-y-3">
                      {analysis.analysis.key_insights.map((insight: string, index: number) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.8 + index * 0.1 }}
                          className="flex items-start space-x-3 p-3 bg-white dark:bg-gray-700 rounded-lg border border-blue-200 dark:border-blue-600"
                        >
                          <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-700 dark:text-gray-300">{insight}</p>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Recent Mentions */}
                {analysis.analysis?.news_analysis && analysis.analysis.news_analysis.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <Globe className="w-5 h-5 mr-2 text-[#01257D]" />
                      Noticias Reales en Tiempo Real
                      <div className="ml-2 flex items-center space-x-1 bg-green-100 dark:bg-green-900 px-2 py-1 rounded-full">
                        <div className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-green-700 dark:text-green-300 font-medium">LIVE</span>
                      </div>
                    </h3>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {analysis.analysis.news_analysis.slice(0, 5).map((news: any, index: number) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 1.0 + index * 0.1 }}
                          className="p-3 bg-white dark:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-500"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                                {news.title}
                              </h4>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                {news.content?.substring(0, 100)}...
                              </p>
                              <div className="flex items-center space-x-2 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                <span>{formatDate(news.date)}</span>
                                <span>•</span>
                                <span className="font-medium">{news.source}</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Data Source Info */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1 }}
                  className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700"
                >
                  <div className="flex items-center space-x-2 text-sm">
                    <Globe className="w-4 h-4 text-purple-600" />
                    <span className="font-medium text-purple-800 dark:text-purple-300">
                      {analysis.real_data ? 'Datos obtenidos mediante scraping real en internet' : 'Análisis simulado con IA'}
                    </span>
                  </div>
                  {analysis.sources_scraped && (
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                      Fuentes analizadas: {analysis.sources_scraped.join(', ')}
                    </p>
                  )}
                </motion.div>
              </div>
            )}
          </div>
        </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}