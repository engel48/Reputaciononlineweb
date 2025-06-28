"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, TrendingUp, TrendingDown, Users, Building, Crown, MapPin, Clock, BarChart3, MessageCircle, ThumbsUp, ThumbsDown, Minus, Sparkles, Brain, RefreshCw } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface SearchResult {
  id: string;
  name: string;
  type: 'político' | 'influencer' | 'empresa';
  country: string;
  category: string;
  followers: number;
  platforms: string[];
}

interface SentimentAnalysis {
  overall_sentiment: {
    positive: number;
    negative: number;
    neutral: number;
  };
  total_mentions: number;
  platforms: Array<{
    platform: string;
    mentions: number;
    sentiment: {
      positive: number;
      negative: number;
      neutral: number;
    };
    engagement: number;
    trending_topics: string[];
  }>;
  reputation_score: number;
  trend: 'up' | 'down';
  key_insights: string[];
  recent_mentions: Array<{
    author: string;
    content: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    platform: string;
    timestamp: string;
  }>;
  ai_insights?: any;
}

const COLORS = {
  positive: '#10B981',
  negative: '#EF4444',
  neutral: '#6B7280'
};

export default function AdvancedSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'político' | 'influencer' | 'empresa'>('all');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedPersonality, setSelectedPersonality] = useState<SearchResult | null>(null);
  const [analysis, setAnalysis] = useState<SentimentAnalysis | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [suggestions, setSuggestions] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setSuggestions('');
    
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        ...(searchType !== 'all' && { type: searchType }),
        country: 'Colombia'
      });
      
      const response = await fetch(`/api/search?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setSearchResults(data.results || []);
        if (data.suggestions) {
          setSuggestions(data.suggestions);
        }
      }
    } catch (error) {
      console.error('Error en búsqueda:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAnalyze = async (personality: SearchResult) => {
    setSelectedPersonality(personality);
    setIsAnalyzing(true);
    setAnalysis(null);
    
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ personalityId: personality.id }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAnalysis(data.analysis);
      }
    } catch (error) {
      console.error('Error en análisis:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'político': return <Crown className="w-4 h-4" />;
      case 'influencer': return <Users className="w-4 h-4" />;
      case 'empresa': return <Building className="w-4 h-4" />;
      default: return <Search className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'político': return 'text-purple-600 bg-purple-100';
      case 'influencer': return 'text-pink-600 bg-pink-100';
      case 'empresa': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-100';
      case 'negative': return 'text-red-600 bg-red-100';
      case 'neutral': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const pieData = analysis ? [
    { name: 'Positivo', value: analysis.overall_sentiment.positive, color: COLORS.positive },
    { name: 'Negativo', value: analysis.overall_sentiment.negative, color: COLORS.negative },
    { name: 'Neutral', value: analysis.overall_sentiment.neutral, color: COLORS.neutral },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header de búsqueda */}
      <motion.div 
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-[#01257D] to-blue-600 rounded-lg">
              <Search className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Búsqueda Avanzada
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Encuentra influencers, políticos y empresas de Latinoamérica
              </p>
            </div>
          </div>
          
          <motion.button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm">Filtros</span>
          </motion.button>
        </div>

        {/* Barra de búsqueda */}
        <div className="relative">
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Buscar personalidades, empresas..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#01257D] focus:border-[#01257D] dark:bg-gray-700 dark:text-white text-lg"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
            
            <motion.button
              onClick={handleSearch}
              disabled={isSearching}
              className="px-6 py-3 bg-gradient-to-r from-[#01257D] to-blue-600 text-white rounded-xl hover:from-[#013AAA] hover:to-blue-700 disabled:opacity-50 font-semibold"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isSearching ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                'Buscar'
              )}
            </motion.button>
          </div>
        </div>

        {/* Filtros */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="flex flex-wrap gap-2">
                {['all', 'político', 'influencer', 'empresa'].map((type) => (
                  <motion.button
                    key={type}
                    onClick={() => setSearchType(type as any)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      searchType === type
                        ? 'bg-[#01257D] text-white'
                        : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-500'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(type)}
                      <span className="capitalize">{type === 'all' ? 'Todos' : type}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Resultados de búsqueda */}
      <AnimatePresence>
        {searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Resultados de búsqueda ({searchResults.length})
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map((result, index) => (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleAnalyze(result)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {result.name}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {result.category}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(result.type)}`}>
                      {result.type}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="w-4 h-4 mr-1" />
                      {result.country}
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Users className="w-4 h-4 mr-1" />
                      {formatNumber(result.followers)} seguidores
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {result.platforms.map((platform) => (
                        <span
                          key={platform}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-600 text-xs rounded"
                        >
                          {platform}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <button className="w-full px-3 py-2 bg-[#01257D] text-white rounded-lg hover:bg-[#013AAA] transition-colors text-sm font-medium">
                      Analizar Reputación
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sugerencias de IA */}
      <AnimatePresence>
        {suggestions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4"
          >
            <div className="flex items-start space-x-3">
              <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Sugerencias de IA
                </h4>
                <p className="text-blue-700 dark:text-blue-300 text-sm whitespace-pre-wrap">
                  {suggestions}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Análisis de sentimientos */}
      <AnimatePresence>
        {selectedPersonality && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-r from-[#01257D] to-blue-600 rounded-xl">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Análisis de Reputación
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    {selectedPersonality.name} - {selectedPersonality.type}
                  </p>
                </div>
              </div>
              
              {isAnalyzing && (
                <div className="flex items-center space-x-2 text-[#01257D]">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Analizando...</span>
                </div>
              )}
            </div>

            {analysis && (
              <div className="space-y-6">
                {/* Score general */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <motion.div
                    className="p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-600 dark:text-green-400">Score de Reputación</p>
                        <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                          {analysis.reputation_score}/100
                        </p>
                      </div>
                      <div className={`p-2 rounded-lg ${analysis.trend === 'up' ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700'}`}>
                        {analysis.trend === 'up' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-600 dark:text-blue-400">Total Menciones</p>
                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                          {formatNumber(analysis.total_mentions)}
                        </p>
                      </div>
                      <MessageCircle className="w-8 h-8 text-blue-600" />
                    </div>
                  </motion.div>

                  <motion.div
                    className="p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-600 dark:text-green-400">Sentimiento Positivo</p>
                        <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                          {analysis.overall_sentiment.positive}%
                        </p>
                      </div>
                      <ThumbsUp className="w-8 h-8 text-green-600" />
                    </div>
                  </motion.div>

                  <motion.div
                    className="p-4 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-red-600 dark:text-red-400">Sentimiento Negativo</p>
                        <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                          {analysis.overall_sentiment.negative}%
                        </p>
                      </div>
                      <ThumbsDown className="w-8 h-8 text-red-600" />
                    </div>
                  </motion.div>
                </div>

                {/* Gráficos */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Gráfico de sentimientos */}
                  <motion.div
                    className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                      Distribución de Sentimientos
                    </h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </motion.div>

                  {/* Análisis por plataforma */}
                  <motion.div
                    className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                      Análisis por Plataforma
                    </h4>
                    <div className="space-y-3">
                      {analysis.platforms.map((platform, index) => (
                        <motion.div
                          key={platform.platform}
                          className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.7 + index * 0.1 }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {platform.platform}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {formatNumber(platform.mentions)} menciones
                            </span>
                          </div>
                          <div className="flex space-x-2">
                            <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: `${platform.sentiment.positive}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {platform.sentiment.positive}% positivo
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </div>

                {/* Insights y menciones recientes */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Key Insights */}
                  <motion.div
                    className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    <div className="flex items-center space-x-2 mb-4">
                      <Sparkles className="w-5 h-5 text-[#01257D]" />
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        Insights Clave
                      </h4>
                    </div>
                    <div className="space-y-2">
                      {analysis.key_insights.map((insight, index) => (
                        <motion.div
                          key={index}
                          className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-800 dark:text-blue-200"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.9 + index * 0.1 }}
                        >
                          • {insight}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Menciones recientes */}
                  <motion.div
                    className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                  >
                    <div className="flex items-center space-x-2 mb-4">
                      <Clock className="w-5 h-5 text-[#01257D]" />
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        Menciones Recientes
                      </h4>
                    </div>
                    <div className="space-y-3">
                      {analysis.recent_mentions.map((mention, index) => (
                        <motion.div
                          key={index}
                          className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 1.0 + index * 0.1 }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm text-gray-900 dark:text-white">
                              @{mention.author}
                            </span>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded-full text-xs ${getSentimentColor(mention.sentiment)}`}>
                                {mention.sentiment}
                              </span>
                              <span className="text-xs text-gray-500">
                                {mention.platform}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {mention.content}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}