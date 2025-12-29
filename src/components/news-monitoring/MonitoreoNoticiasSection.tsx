'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  RefreshCw,
  Download,
  Newspaper,
  AlertCircle,
  Loader2,
  Trash2,
  Eye,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  X,
  CheckCircle,
  Bell,
} from 'lucide-react';
import NewsResultCard, { NewsResult } from './NewsResultCard';

interface MonitoredKeyword {
  id: string;
  keyword: string;
  is_active: boolean;
  check_frequency_minutes: number;
  last_checked_at: string | null;
  total_mentions: number;
  unread_mentions: number;
  created_at: string;
}

interface KeywordMention {
  id: string;
  article_title: string;
  article_url: string;
  article_content: string;
  source: string;
  published_at: string;
  discovered_at: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentiment_score: number;
  is_read: boolean;
}

interface MentionStats {
  total: number;
  positive: number;
  negative: number;
  neutral: number;
  unread: number;
}

export default function MonitoreoNoticiasSection() {
  // Estados principales
  const [keywords, setKeywords] = useState<MonitoredKeyword[]>([]);
  const [selectedKeyword, setSelectedKeyword] = useState<MonitoredKeyword | null>(null);
  const [mentions, setMentions] = useState<KeywordMention[]>([]);
  const [mentionStats, setMentionStats] = useState<MentionStats | null>(null);

  // Estados de UI
  const [newKeyword, setNewKeyword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingKeyword, setIsAddingKeyword] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isLoadingMentions, setIsLoadingMentions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Estadisticas de la BD
  const [dbStats, setDbStats] = useState<{
    totalNews: number;
    lastScraped: string | null;
  } | null>(null);

  // Cargar keywords al montar
  useEffect(() => {
    loadKeywords();
    loadDatabaseStats();
  }, []);

  // Cargar menciones cuando se selecciona una keyword
  useEffect(() => {
    if (selectedKeyword) {
      loadMentions(selectedKeyword.id);
    } else {
      setMentions([]);
      setMentionStats(null);
    }
  }, [selectedKeyword]);

  const loadDatabaseStats = async () => {
    try {
      const response = await fetch('/api/scraping/run', { method: 'GET' });
      const data = await response.json();
      if (data.success) {
        setDbStats(data.database);
      }
    } catch (error) {
      console.error('Error cargando stats:', error);
    }
  };

  const loadKeywords = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/news-monitoring/keywords', {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        setKeywords(data.keywords || []);
      } else {
        setError(data.error);
      }
    } catch (error: any) {
      setError('Error cargando palabras clave');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMentions = async (keywordId: string) => {
    try {
      setIsLoadingMentions(true);
      const response = await fetch(`/api/news-monitoring/keywords/monitor?keywordId=${keywordId}`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        setMentions(data.mentions || []);
        setMentionStats(data.stats);
      }
    } catch (error) {
      console.error('Error cargando menciones:', error);
    } finally {
      setIsLoadingMentions(false);
    }
  };

  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim() || newKeyword.trim().length < 2) return;

    try {
      setIsAddingKeyword(true);
      setError(null);

      const response = await fetch('/api/news-monitoring/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ keyword: newKeyword.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        setNewKeyword('');
        setSuccessMessage(`"${newKeyword}" agregada. Buscando noticias...`);
        await loadKeywords();

        // Ejecutar monitoreo inicial para esta keyword
        await handleMonitorKeyword(data.keyword.id);

        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(data.error);
      }
    } catch (error: any) {
      setError('Error agregando palabra clave');
    } finally {
      setIsAddingKeyword(false);
    }
  };

  const handleDeleteKeyword = async (keywordId: string) => {
    if (!confirm('¿Eliminar esta palabra clave y todas sus menciones?')) return;

    try {
      const response = await fetch(`/api/news-monitoring/keywords?id=${keywordId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        if (selectedKeyword?.id === keywordId) {
          setSelectedKeyword(null);
        }
        await loadKeywords();
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Error eliminando palabra clave');
    }
  };

  const handleMonitorKeyword = async (keywordId?: string) => {
    try {
      setIsMonitoring(true);

      const response = await fetch('/api/news-monitoring/keywords/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ keywordId }),
      });

      const data = await response.json();

      if (data.success) {
        await loadKeywords();
        if (selectedKeyword) {
          await loadMentions(selectedKeyword.id);
        }
        setSuccessMessage(data.message);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Error ejecutando monitoreo');
    } finally {
      setIsMonitoring(false);
    }
  };

  const handleMarkAsRead = async (mentionId: string) => {
    try {
      await fetch('/api/news-monitoring/keywords/monitor', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ mentionId }),
      });

      setMentions(prev =>
        prev.map(m => m.id === mentionId ? { ...m, is_read: true } : m)
      );
    } catch (error) {
      console.error('Error marcando como leido:', error);
    }
  };

  const handleExport = () => {
    if (mentions.length === 0) return;

    const headers = ['Titulo', 'Fuente', 'Fecha', 'Sentimiento', 'URL'];
    const rows = mentions.map(m => [
      `"${m.article_title.replace(/"/g, '""')}"`,
      m.source,
      new Date(m.published_at).toLocaleDateString('es-CO'),
      m.sentiment,
      m.article_url,
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `menciones-${selectedKeyword?.keyword}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `hace ${diffMins}m`;
    if (diffHours < 24) return `hace ${diffHours}h`;
    return `hace ${diffDays}d`;
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'negative': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
              <Newspaper className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Monitoreo de Noticias - Colombia</h2>
              <p className="text-blue-100 mt-1">
                Agrega palabras clave para monitorear automaticamente cada hora
              </p>
            </div>
          </div>

          <button
            onClick={() => handleMonitorKeyword()}
            disabled={isMonitoring || keywords.length === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              isMonitoring || keywords.length === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-white text-blue-700 hover:bg-blue-50'
            }`}
          >
            {isMonitoring ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <RefreshCw className="w-5 h-5" />
            )}
            <span>{isMonitoring ? 'Monitoreando...' : 'Actualizar Todo'}</span>
          </button>
        </div>

        {/* Agregar nueva keyword */}
        <form onSubmit={handleAddKeyword} className="flex gap-3">
          <div className="flex-1 relative">
            <Plus className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="Escribe una palabra clave para monitorear (ej: Petro, economia, Ecopetrol...)"
              className="w-full pl-12 pr-4 py-3 rounded-lg text-gray-900 bg-white placeholder-gray-400 focus:ring-2 focus:ring-blue-300 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isAddingKeyword || !newKeyword.trim()}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              isAddingKeyword || !newKeyword.trim()
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-white text-blue-700 hover:bg-blue-50 shadow-lg'
            }`}
          >
            {isAddingKeyword ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
            <span>Agregar</span>
          </button>
        </form>

        {/* Info de la BD */}
        {dbStats && (
          <div className="mt-4 flex items-center gap-4 text-sm text-blue-100">
            <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
              {dbStats.totalNews.toLocaleString()} noticias en base de datos
            </span>
            <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
              {keywords.length}/20 palabras monitoreadas
            </span>
          </div>
        )}
      </motion.div>

      {/* Mensajes de error/exito */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)}>
              <X className="w-5 h-5 text-red-500" />
            </button>
          </motion.div>
        )}

        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2 text-green-700"
          >
            <CheckCircle className="w-5 h-5" />
            <span>{successMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Layout de dos columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda: Lista de keywords */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Palabras Monitoreadas
              </h3>
            </div>

            {isLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
              </div>
            ) : keywords.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No hay palabras monitoreadas</p>
                <p className="text-sm">Agrega una arriba para comenzar</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[500px] overflow-y-auto">
                {keywords.map((kw) => (
                  <div
                    key={kw.id}
                    onClick={() => setSelectedKeyword(kw)}
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedKeyword?.id === kw.id
                        ? 'bg-blue-50 dark:bg-blue-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {kw.keyword}
                          </span>
                          {kw.unread_mentions > 0 && (
                            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                              {kw.unread_mentions}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                          <span>{kw.total_mentions} menciones</span>
                          {kw.last_checked_at && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTimeAgo(kw.last_checked_at)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteKeyword(kw.id);
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Columna derecha: Menciones de la keyword seleccionada */}
        <div className="lg:col-span-2">
          {selectedKeyword ? (
            <div className="space-y-4">
              {/* Header de menciones */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Menciones de "{selectedKeyword.keyword}"
                  </h3>
                  {mentionStats && (
                    <p className="text-sm text-gray-500">
                      {mentionStats.total} menciones encontradas
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleMonitorKeyword(selectedKeyword.id)}
                    disabled={isMonitoring}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    {isMonitoring ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    <span>Actualizar</span>
                  </button>
                  <button
                    onClick={handleExport}
                    disabled={mentions.length === 0}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Exportar</span>
                  </button>
                </div>
              </div>

              {/* Stats de sentimiento */}
              {mentionStats && mentionStats.total > 0 && (
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {mentionStats.total}
                    </div>
                    <div className="text-xs text-gray-500">Total</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200">
                    <div className="text-xl font-bold text-green-600">{mentionStats.positive}</div>
                    <div className="text-xs text-green-700">Positivas</div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200">
                    <div className="text-xl font-bold text-red-600">{mentionStats.negative}</div>
                    <div className="text-xs text-red-700">Negativas</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/20 rounded-lg p-3 border border-gray-200">
                    <div className="text-xl font-bold text-gray-600">{mentionStats.neutral}</div>
                    <div className="text-xs text-gray-500">Neutrales</div>
                  </div>
                </div>
              )}

              {/* Lista de menciones */}
              {isLoadingMentions ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                  <Loader2 className="w-10 h-10 animate-spin mx-auto text-blue-500" />
                  <p className="mt-3 text-gray-500">Cargando menciones...</p>
                </div>
              ) : mentions.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
                  <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No hay menciones aun
                  </h4>
                  <p className="text-gray-500 mb-4">
                    Haz clic en "Actualizar" para buscar noticias con "{selectedKeyword.keyword}"
                  </p>
                  <button
                    onClick={() => handleMonitorKeyword(selectedKeyword.id)}
                    disabled={isMonitoring}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Buscar Noticias
                  </button>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {mentions.map((mention) => (
                    <motion.div
                      key={mention.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`bg-white dark:bg-gray-800 rounded-xl border-2 p-4 transition-all ${
                        mention.is_read
                          ? 'border-gray-200 dark:border-gray-700'
                          : 'border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/10'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 text-sm">
                            <span className="font-medium text-blue-600">{mention.source}</span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(mention.published_at).toLocaleDateString('es-CO')}
                            </span>
                          </div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                            {mention.article_title}
                          </h4>
                          {mention.article_content && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
                              {mention.article_content}
                            </p>
                          )}
                          <div className="flex items-center gap-3">
                            <a
                              href={mention.article_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              Ver articulo completo →
                            </a>
                            {!mention.is_read && (
                              <button
                                onClick={() => handleMarkAsRead(mention.id)}
                                className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1"
                              >
                                <Eye className="w-4 h-4" />
                                Marcar como leido
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700">
                          {getSentimentIcon(mention.sentiment)}
                          <span className="text-xs capitalize">{mention.sentiment === 'positive' ? 'Positivo' : mention.sentiment === 'negative' ? 'Negativo' : 'Neutral'}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
              <Newspaper className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Selecciona una palabra clave
              </h3>
              <p className="text-gray-500">
                {keywords.length > 0
                  ? 'Haz clic en una palabra de la lista para ver sus menciones'
                  : 'Agrega una palabra clave arriba para comenzar a monitorear noticias'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
