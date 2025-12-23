"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Newspaper, Share2, Hash, TrendingUp, TrendingDown, Minus,
  Filter, RefreshCw, Loader2, AlertCircle, BarChart3,
  Facebook, Instagram, Twitter, Youtube
} from 'lucide-react';
import UnifiedSearchInput from '@/components/dashboard/UnifiedSearchInput';
import UnifiedMentionCard from '@/components/dashboard/UnifiedMentionCard';

interface SearchResult {
  id: string;
  type: 'news' | 'social' | 'hashtag';
  platform: string;
  author?: string;
  title?: string;
  content: string;
  url?: string;
  imageUrl?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  sentimentScore?: number;
  engagement?: {
    likes?: number;
    shares?: number;
    comments?: number;
    views?: number;
  };
  createdAt: string;
  source?: string;
}

interface Stats {
  total: number;
  byType: {
    news: number;
    social: number;
    hashtags: number;
  };
  bySentiment: {
    positive: number;
    negative: number;
    neutral: number;
  };
  byPlatform: Record<string, number>;
}

type TabType = 'all' | 'news' | 'social' | 'hashtags';

const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'Todo', icon: <BarChart3 className="h-4 w-4" /> },
  { id: 'news', label: 'Noticias', icon: <Newspaper className="h-4 w-4" /> },
  { id: 'social', label: 'Redes Sociales', icon: <Share2 className="h-4 w-4" /> },
  { id: 'hashtags', label: 'Hashtags', icon: <Hash className="h-4 w-4" /> }
];

const platformFilters = [
  { id: '', label: 'Todas', icon: null },
  { id: 'facebook', label: 'Facebook', icon: <Facebook className="h-4 w-4" /> },
  { id: 'instagram', label: 'Instagram', icon: <Instagram className="h-4 w-4" /> },
  { id: 'x', label: 'X', icon: <Twitter className="h-4 w-4" /> },
  { id: 'youtube', label: 'YouTube', icon: <Youtube className="h-4 w-4" /> }
];

const sentimentFilters = [
  { id: '', label: 'Todos', color: 'bg-gray-100 text-gray-600' },
  { id: 'positive', label: 'Positivo', color: 'bg-green-100 text-green-700' },
  { id: 'neutral', label: 'Neutro', color: 'bg-gray-100 text-gray-600' },
  { id: 'negative', label: 'Negativo', color: 'bg-red-100 text-red-700' }
];

export default function MonitoreoPage() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabType) || 'all';

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Función de búsqueda
  const performSearch = useCallback(async (query: string, type: string) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        query,
        type: type === 'all' ? activeTab : type,
        limit: '50'
      });

      if (platformFilter) params.append('platform', platformFilter);
      if (sentimentFilter) params.append('sentiment', sentimentFilter);

      const response = await fetch(`/api/monitoring/unified-search?${params}`);
      const data = await response.json();

      if (data.success) {
        setResults(data.data.results);
        setStats(data.data.stats);
      } else {
        setError(data.error || 'Error en la búsqueda');
        setResults([]);
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, platformFilter, sentimentFilter]);

  // Cargar datos iniciales
  useEffect(() => {
    performSearch('', activeTab);
  }, [activeTab, platformFilter, sentimentFilter]);

  // Manejar búsqueda desde el input
  const handleSearch = (query: string, detectedType: string) => {
    setSearchQuery(query);
    if (detectedType !== 'all' && detectedType !== activeTab) {
      // Cambiar a la pestaña detectada
      if (detectedType === 'social') setActiveTab('social');
      else if (detectedType === 'hashtags') setActiveTab('hashtags');
    }
    performSearch(query, detectedType);
  };

  // Cambiar pestaña
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    // Actualizar URL sin recargar
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.pushState({}, '', url.toString());
  };

  // Filtrar resultados según la pestaña activa
  const filteredResults = results.filter(r => {
    if (activeTab === 'all') return true;
    if (activeTab === 'news') return r.type === 'news';
    if (activeTab === 'social') return r.type === 'social';
    if (activeTab === 'hashtags') return r.type === 'hashtag';
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Centro de Monitoreo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitorea menciones en noticias, redes sociales y hashtags en tiempo real
          </p>
        </div>

        {/* Buscador Universal */}
        <div className="mb-8">
          <UnifiedSearchInput
            onSearch={handleSearch}
            loading={loading}
            className="max-w-3xl"
          />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all
                ${activeTab === tab.id
                  ? 'bg-[#00E5FF] text-white shadow-lg shadow-cyan-500/25'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
            >
              {tab.icon}
              {tab.label}
              {stats && (
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs
                  ${activeTab === tab.id
                    ? 'bg-white/20'
                    : 'bg-gray-100 dark:bg-gray-700'
                  }`}
                >
                  {tab.id === 'all' ? stats.total :
                   tab.id === 'news' ? stats.byType.news :
                   tab.id === 'social' ? stats.byType.social :
                   stats.byType.hashtags}
                </span>
              )}
            </button>
          ))}

          {/* Botón de filtros */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm ml-auto transition-all
              ${showFilters
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
              }`}
          >
            <Filter className="h-4 w-4" />
            Filtros
          </button>

          {/* Botón de refrescar */}
          <button
            onClick={() => performSearch(searchQuery, activeTab)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-all"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Panel de filtros */}
        {showFilters && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Filtro de plataforma */}
              {activeTab !== 'news' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Plataforma
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {platformFilters.map((pf) => (
                      <button
                        key={pf.id}
                        onClick={() => setPlatformFilter(pf.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                          ${platformFilter === pf.id
                            ? 'bg-[#00E5FF] text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                      >
                        {pf.icon}
                        {pf.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Filtro de sentimiento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sentimiento
                </label>
                <div className="flex flex-wrap gap-2">
                  {sentimentFilters.map((sf) => (
                    <button
                      key={sf.id}
                      onClick={() => setSentimentFilter(sf.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                        ${sentimentFilter === sf.id
                          ? 'bg-[#00E5FF] text-white'
                          : `${sf.color} hover:opacity-80`
                        }`}
                    >
                      {sf.id === 'positive' && <TrendingUp className="h-3.5 w-3.5" />}
                      {sf.id === 'negative' && <TrendingDown className="h-3.5 w-3.5" />}
                      {sf.id === 'neutral' && <Minus className="h-3.5 w-3.5" />}
                      {sf.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Estadísticas rápidas */}
        {stats && stats.total > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#00E5FF]/10 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-[#00E5FF]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total menciones</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.bySentiment.positive}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Positivas</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <Minus className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.bySentiment.neutral}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Neutras</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.bySentiment.negative}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Negativas</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Resultados */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <Loader2 className="h-10 w-10 animate-spin text-[#00E5FF] mb-4" />
              <p>Buscando menciones...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-red-500">
              <AlertCircle className="h-10 w-10 mb-4" />
              <p>{error}</p>
              <button
                onClick={() => performSearch(searchQuery, activeTab)}
                className="mt-4 px-4 py-2 bg-[#00E5FF] text-white rounded-lg hover:bg-[#00B8D4]"
              >
                Reintentar
              </button>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <Newspaper className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No se encontraron menciones</p>
              <p className="text-sm">Intenta con otra búsqueda o cambia los filtros</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredResults.map((result) => (
                <UnifiedMentionCard key={result.id} {...result} />
              ))}
            </div>
          )}
        </div>

        {/* Cargar más */}
        {filteredResults.length > 0 && filteredResults.length >= 50 && (
          <div className="text-center mt-8">
            <button
              onClick={() => {/* TODO: Implementar paginación */}}
              className="px-6 py-3 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium"
            >
              Cargar más resultados
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
