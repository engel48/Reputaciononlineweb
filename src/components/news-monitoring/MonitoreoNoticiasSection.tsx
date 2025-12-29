'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  RefreshCw,
  Download,
  Newspaper,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import NewsResultCard, { NewsResult } from './NewsResultCard';
import type { SentimentFilter, DateFilter } from '@/types/news-monitoring';

interface SentimentSummary {
  positive: number;
  negative: number;
  neutral: number;
  averageScore: number;
}

export default function MonitoreoNoticiasSection() {
  // Estados de busqueda
  const [keyword, setKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<NewsResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [sentimentSummary, setSentimentSummary] = useState<SentimentSummary | null>(null);

  // Filtros
  const [sentimentFilter, setSentimentFilter] = useState<SentimentFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');

  // Estadisticas de la BD
  const [dbStats, setDbStats] = useState<{
    totalNews: number;
    lastScraped: string | null;
    lastSource: string | null;
  } | null>(null);

  // Cargar estadisticas al montar
  useEffect(() => {
    loadDatabaseStats();
  }, []);

  const loadDatabaseStats = async () => {
    try {
      const response = await fetch('/api/scraping/run', {
        method: 'GET',
      });
      const data = await response.json();
      if (data.success) {
        setDbStats(data.database);
      }
    } catch (error) {
      console.error('Error cargando stats:', error);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!keyword.trim()) {
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      // Construir parametros de busqueda
      const params = new URLSearchParams({
        keyword: keyword.trim(),
        limit: '50',
      });

      if (sentimentFilter !== 'all') {
        params.append('sentiment', sentimentFilter);
      }

      // Calcular fechas segun filtro
      if (dateFilter !== 'all') {
        const now = new Date();
        let dateFrom: Date;

        switch (dateFilter) {
          case 'today':
            dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'week':
            dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          default:
            dateFrom = new Date(0);
        }

        params.append('dateFrom', dateFrom.toISOString());
      }

      const response = await fetch(`/api/news-monitoring/search?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setSearchResults(data.results || []);
        setTotalResults(data.total || 0);
        setSentimentSummary(data.sentimentSummary || null);
      } else {
        setSearchResults([]);
        setTotalResults(0);
        setSentimentSummary(null);
      }
    } catch (error) {
      console.error('Error en busqueda:', error);
      setSearchResults([]);
      setTotalResults(0);
    } finally {
      setIsSearching(false);
    }
  };

  // Re-ejecutar busqueda cuando cambian los filtros
  useEffect(() => {
    if (hasSearched && keyword.trim()) {
      handleSearch();
    }
  }, [sentimentFilter, dateFilter]);

  const handleExport = () => {
    if (searchResults.length === 0) return;

    // Crear CSV
    const headers = ['Titulo', 'Fuente', 'Fecha', 'Sentimiento', 'URL'];
    const rows = searchResults.map(news => [
      `"${news.title.replace(/"/g, '""')}"`,
      news.source,
      new Date(news.publishedAt).toLocaleDateString('es-CO'),
      news.sentiment,
      news.articleUrl,
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `noticias-${keyword}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Filtrar resultados localmente (ya vienen filtrados del servidor, pero por si acaso)
  const filteredResults = searchResults;

  return (
    <div className="space-y-6">
      {/* Header con buscador */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-lg"
      >
        <div className="flex items-center space-x-4 mb-4">
          <div className="p-3 bg-white bg-opacity-20 rounded-lg">
            <Newspaper className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Monitoreo de Noticias - Colombia</h2>
            <p className="text-blue-100 mt-1">
              Busca noticias en medios colombianos por palabra clave
            </p>
          </div>
        </div>

        {/* Barra de busqueda */}
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Escribe una palabra clave (ej: corrupcion, economia, elecciones...)"
              className="w-full pl-12 pr-4 py-3 rounded-lg text-gray-900 bg-white placeholder-gray-400 focus:ring-2 focus:ring-blue-300 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching || !keyword.trim()}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              isSearching || !keyword.trim()
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-white text-blue-700 hover:bg-blue-50 shadow-lg hover:shadow-xl'
            }`}
          >
            {isSearching ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Buscando...</span>
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span>Buscar</span>
              </>
            )}
          </button>
        </form>

        {/* Info de la BD */}
        {dbStats && (
          <div className="mt-4 flex items-center gap-4 text-sm text-blue-100">
            <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
              {dbStats.totalNews.toLocaleString()} noticias en base de datos
            </span>
            {dbStats.lastScraped && (
              <span>
                Ultima actualizacion: {new Date(dbStats.lastScraped).toLocaleString('es-CO')}
              </span>
            )}
          </div>
        )}
      </motion.div>

      {/* Estadisticas de resultados */}
      {sentimentSummary && searchResults.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-4"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalResults}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Resultados</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 shadow-md border border-green-200 dark:border-green-800">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {sentimentSummary.positive}
            </div>
            <div className="text-xs text-green-700 dark:text-green-300 mt-1">Positivas</div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 shadow-md border border-red-200 dark:border-red-800">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {sentimentSummary.negative}
            </div>
            <div className="text-xs text-red-700 dark:text-red-300 mt-1">Negativas</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/20 rounded-lg p-4 shadow-md border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
              {sentimentSummary.neutral}
            </div>
            <div className="text-xs text-gray-700 dark:text-gray-300 mt-1">Neutrales</div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 shadow-md border border-blue-200 dark:border-blue-800">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {(sentimentSummary.averageScore * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">Score Promedio</div>
          </div>
        </motion.div>
      )}

      {/* Resultados de busqueda */}
      {hasSearched && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
              Resultados de Busqueda
              {searchResults.length > 0 && (
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                  ({searchResults.length} de {totalResults})
                </span>
              )}
            </h3>

            <div className="flex items-center space-x-3">
              {/* Filtros */}
              <select
                value={sentimentFilter}
                onChange={(e) => setSentimentFilter(e.target.value as SentimentFilter)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos</option>
                <option value="positive">Positivo</option>
                <option value="negative">Negativo</option>
                <option value="neutral">Neutral</option>
              </select>

              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todas las fechas</option>
                <option value="today">Hoy</option>
                <option value="week">Ultima semana</option>
                <option value="month">Ultimo mes</option>
              </select>

              <button
                onClick={handleExport}
                disabled={searchResults.length === 0}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  searchResults.length === 0
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Download className="w-4 h-4" />
                <span>Exportar CSV</span>
              </button>
            </div>
          </div>

          {/* Estado de carga */}
          {isSearching ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
              <Loader2 className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
              <p className="text-gray-600 dark:text-gray-300">
                Buscando noticias con "{keyword}"...
              </p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No se encontraron noticias
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                No hay noticias que coincidan con "{keyword}" en la base de datos.
              </p>
              <p className="text-sm text-gray-400">
                Intenta con otros terminos de busqueda o ejecuta el scraping para actualizar la base de datos.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {filteredResults.map((news, index) => (
                  <NewsResultCard
                    key={news.id}
                    news={news}
                    index={index}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* Estado inicial - sin busqueda */}
      {!hasSearched && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
          <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Busca noticias por palabra clave
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Escribe un termino de busqueda arriba para encontrar noticias relacionadas
            en medios colombianos como El Tiempo, Semana, El Heraldo y mas.
          </p>
        </div>
      )}
    </div>
  );
}
