"use client";

import React, { useState, useEffect } from 'react';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement } from 'chart.js';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Target, TrendingUp, BarChart3, Eye, UserCheck, Star, MapPin, Calendar, Filter, Download, RefreshCw, Heart, MessageSquare, Share2 } from 'lucide-react';

// Registro de componentes Chart.js
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement);

// Tipos
interface DemographicData {
  ageGroups: {
    label: string;
    value: number;
    color: string;
  }[];
  genderDistribution: {
    label: string;
    value: number;
    color: string;
  }[];
  locationTop: {
    city: string;
    country: string;
    percentage: number;
  }[];
}

interface Influencer {
  id: string;
  name: string;
  username: string;
  platform: string;
  followers: number;
  engagement: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  recentMention?: string;
}

interface AudienceAnalysisProps {
  demographicData?: DemographicData;
  influencers?: Influencer[];
  isLoading?: boolean;
}

const AudienceAnalysis: React.FC<AudienceAnalysisProps> = ({
  demographicData = demoDemographicData,
  influencers = demoInfluencers,
  isLoading = false
}) => {
  const [activeTab, setActiveTab] = useState<'demographics' | 'influencers' | 'engagement' | 'trends'>('demographics');
  const [selectedMetric, setSelectedMetric] = useState<'age' | 'gender' | 'location'>('age');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '3m'>('30d');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null);

  // Datos de engagement por tiempo
  const engagementData = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Engagement Rate',
        data: [3.2, 4.1, 3.8, 4.5, 5.2, 4.8],
        borderColor: '#01257D',
        backgroundColor: 'rgba(1, 37, 125, 0.1)',
        tension: 0.4,
        pointRadius: 6,
        pointHoverRadius: 8,
        borderWidth: 3
      }
    ]
  };

  // Datos de crecimiento de audiencia
  const audienceGrowthData = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Nuevos Seguidores',
        data: [1200, 1890, 2340, 1950, 2800, 3200],
        backgroundColor: '#059669',
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  };

  // Configurar datos para gráficos mejorados - Paleta de la plataforma
  const ageChartData = {
    labels: demographicData.ageGroups.map(group => group.label),
    datasets: [
      {
        data: demographicData.ageGroups.map(group => group.value),
        backgroundColor: ['#01257D', '#013AAA', '#059669', '#8B5CF6', '#F59E0B'],
        borderWidth: 3,
        borderColor: '#ffffff',
        hoverOffset: 15
      }
    ]
  };

  const genderChartData = {
    labels: demographicData.genderDistribution.map(item => item.label),
    datasets: [
      {
        data: demographicData.genderDistribution.map(item => item.value),
        backgroundColor: ['#01257D', '#EC4899', '#6B7280'],
        borderWidth: 3,
        borderColor: '#ffffff',
        hoverOffset: 15
      }
    ]
  };

  // Refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsRefreshing(false);
  };

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
    hover: { scale: 1.02, transition: { duration: 0.2 } }
  };

  // Determinar color según sentimiento - Paleta de la plataforma
  const getSentimentColor = (sentiment: 'positive' | 'neutral' | 'negative') => {
    if (sentiment === 'positive') return 'text-emerald-600';
    if (sentiment === 'negative') return 'text-red-600';
    return 'text-[#01257D]';
  };

  const getSentimentBg = (sentiment: 'positive' | 'neutral' | 'negative') => {
    if (sentiment === 'positive') return 'bg-emerald-100 dark:bg-emerald-900/30';
    if (sentiment === 'negative') return 'bg-red-100 dark:bg-red-900/30';
    return 'bg-blue-100 dark:bg-blue-900/30';
  };

  return (
    <div className="space-y-8">
      {/* Header con controles interactivos */}
      <motion.div 
        className="bg-gradient-to-br from-white via-purple-50/30 to-indigo-50/30 dark:from-gray-900 dark:via-purple-900/10 dark:to-indigo-900/10 rounded-2xl border-0 shadow-2xl overflow-hidden"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover="hover"
      >
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center mb-2">
                <BarChart3 className="mr-3 h-7 w-7" />
                📈 Analytics Interactivo
              </h2>
              <p className="text-purple-100">
                Explora tu audiencia con gráficos dinámicos y filtros avanzados
              </p>
            </div>
            <div className="mt-6 lg:mt-0 flex flex-wrap gap-3">
              {/* Time Range Selector */}
              <div className="flex bg-white/20 rounded-lg p-1">
                {(['7d', '30d', '3m'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      timeRange === range
                        ? 'bg-white text-purple-600 shadow-lg'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    {range === '7d' ? '7 días' : range === '30d' ? '30 días' : '3 meses'}
                  </button>
                ))}
              </div>
              
              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Actualizando...' : 'Actualizar'}
              </button>
              
              {/* Export Button */}
              <button className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center">
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Tabs */}
        <div className="p-6 pb-0">
          <div className="flex flex-wrap gap-2 mb-6">
            {[
              { id: 'demographics', label: '👥 Demografía', icon: Users },
              { id: 'influencers', label: '🌟 Influencers', icon: Star },
              { id: 'engagement', label: '💬 Engagement', icon: Heart },
              { id: 'trends', label: '📈 Tendencias', icon: TrendingUp }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`relative px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-[#01257D] to-[#013AAA] text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div
                      className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full"
                      layoutId="activeTab"
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Contenido de demografía */}
        {activeTab === 'demographics' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="p-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Gráfico de edad mejorado */}
              <motion.div 
                className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border-2 border-blue-200 dark:border-blue-700 hover:shadow-xl transition-all duration-300"
                whileHover={{ scale: 1.02 }}
              >
                <h3 className="text-xl font-bold text-[#01257D] dark:text-white mb-4 flex items-center">
                  <Users className="mr-2 h-6 w-6 text-blue-600" />
                  👥 Distribución por Edad
                </h3>
                <div className="h-72 bg-white/70 dark:bg-gray-800/70 rounded-xl p-4">
                  <Doughnut 
                    data={ageChartData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: {
                            padding: 20,
                            usePointStyle: true,
                            font: { size: 12, weight: 'bold' },
                            color: '#01257D'
                          }
                        },
                        tooltip: {
                          backgroundColor: '#01257D',
                          titleColor: '#ffffff',
                          bodyColor: '#ffffff',
                          borderColor: '#013AAA',
                          borderWidth: 2,
                          cornerRadius: 12
                        }
                      }
                    }} 
                  />
                </div>
              </motion.div>

              {/* Gráfico de género mejorado */}
              <motion.div 
                className="bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border-2 border-purple-200 dark:border-purple-700 hover:shadow-xl transition-all duration-300"
                whileHover={{ scale: 1.02 }}
              >
                <h3 className="text-xl font-bold text-[#01257D] dark:text-white mb-4 flex items-center">
                  <UserCheck className="mr-2 h-6 w-6 text-purple-600" />
                  ⚧️ Distribución por Género
                </h3>
                <div className="h-72 bg-white/70 dark:bg-gray-800/70 rounded-xl p-4">
                  <Doughnut 
                    data={genderChartData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: {
                            padding: 20,
                            usePointStyle: true,
                            font: { size: 12, weight: 'bold' },
                            color: '#01257D'
                          }
                        },
                        tooltip: {
                          backgroundColor: '#01257D',
                          titleColor: '#ffffff',
                          bodyColor: '#ffffff',
                          borderColor: '#013AAA',
                          borderWidth: 2,
                          cornerRadius: 12
                        }
                      }
                    }} 
                  />
                </div>
              </motion.div>

              {/* Ubicaciones principales mejoradas */}
              <motion.div 
                className="bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-900/20 rounded-2xl p-6 border-2 border-emerald-200 dark:border-emerald-700 md:col-span-2 hover:shadow-xl transition-all duration-300"
                whileHover={{ scale: 1.01 }}
              >
                <h3 className="text-xl font-bold text-[#01257D] dark:text-white mb-6 flex items-center">
                  <MapPin className="mr-2 h-6 w-6 text-emerald-600" />
                  🌍 Ubicaciones Principales
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {demographicData.locationTop.map((location, index) => {
                    const colors = ['#01257D', '#8B5CF6', '#059669', '#F59E0B', '#EF4444', '#06B6D4'];
                    return (
                      <motion.div 
                        key={index} 
                        className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-600"
                        whileHover={{ scale: 1.05, rotate: 1 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-bold text-gray-800 dark:text-white text-lg">
                            📍 {location.city}
                          </h4>
                          <span 
                            className="text-2xl font-bold"
                            style={{ color: colors[index % colors.length] }}
                          >
                            {location.percentage}%
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                          {location.country}
                        </p>
                        <div className="relative">
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3 shadow-inner">
                            <motion.div
                              className="h-3 rounded-full shadow-lg"
                              style={{ backgroundColor: colors[index % colors.length] }}
                              initial={{ width: 0 }}
                              animate={{ width: `${location.percentage}%` }}
                              transition={{ delay: 0.5 + index * 0.1, duration: 1 }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Contenido de influencers mejorado */}
        {activeTab === 'influencers' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="p-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {influencers.map((influencer, index) => {
                const platforms = {
                  'X': { color: '#01257D', emoji: '🔗' },
                  'Instagram': { color: '#E4405F', emoji: '📸' },
                  'Facebook': { color: '#1877F2', emoji: '👥' },
                  'LinkedIn': { color: '#0A66C2', emoji: '💼' },
                  'TikTok': { color: '#FF0050', emoji: '🎵' }
                };
                const platformInfo = platforms[influencer.platform as keyof typeof platforms] || { color: '#6B7280', emoji: '📱' };
                return (
                  <motion.div
                    key={influencer.id}
                    className="bg-gradient-to-br from-white via-gray-50/50 to-blue-50/30 dark:from-gray-800 dark:via-gray-700/50 dark:to-blue-900/10 rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-600 hover:shadow-xl transition-all duration-300 cursor-pointer"
                    whileHover={{ scale: 1.03, rotate: 1 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => setSelectedInfluencer(influencer)}
                  >
                    {/* Header del influencer */}
                    <div className="flex items-center mb-4">
                      <div className="relative">
                        <div 
                          className="h-14 w-14 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg"
                          style={{ backgroundColor: platformInfo.color }}
                        >
                          {influencer.name.charAt(0)}
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 rounded-full p-1 shadow-lg">
                          <span className="text-sm">{platformInfo.emoji}</span>
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                          {influencer.name}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                          @{influencer.username}
                        </p>
                      </div>
                    </div>

                    {/* Métricas */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-white/70 dark:bg-gray-700/70 rounded-xl p-3 text-center">
                        <Users className="h-5 w-5 mx-auto text-blue-600 mb-1" />
                        <div className="text-lg font-bold text-[#01257D] dark:text-white">
                          {influencer.followers.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Seguidores</div>
                      </div>
                      <div className="bg-white/70 dark:bg-gray-700/70 rounded-xl p-3 text-center">
                        <Heart className="h-5 w-5 mx-auto text-pink-600 mb-1" />
                        <div className="text-lg font-bold text-[#01257D] dark:text-white">
                          {influencer.engagement}%
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Engagement</div>
                      </div>
                    </div>

                    {/* Sentimiento */}
                    <div className="mb-4">
                      <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${getSentimentBg(influencer.sentiment)} ${getSentimentColor(influencer.sentiment)}`}>
                        {influencer.sentiment === 'positive' && '😊 Positivo'}
                        {influencer.sentiment === 'neutral' && '😐 Neutro'}
                        {influencer.sentiment === 'negative' && '😞 Negativo'}
                      </div>
                    </div>

                    {/* Mención reciente */}
                    {influencer.recentMention && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-3 border border-blue-200 dark:border-blue-700">
                        <div className="flex items-start">
                          <MessageSquare className="h-4 w-4 text-blue-600 mt-1 mr-2 flex-shrink-0" />
                          <p className="text-sm text-gray-700 dark:text-gray-300 italic line-clamp-3">
                            "{influencer.recentMention}"
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Plataforma */}
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {platformInfo.emoji} {influencer.platform}
                        </span>
                        <button className="text-xs bg-[#01257D] text-white px-3 py-1 rounded-full hover:bg-[#013AAA] transition-colors duration-200">
                          Ver Detalles
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Contenido de engagement */}
        {activeTab === 'engagement' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="p-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Gráfico de engagement rate */}
              <motion.div 
                className="bg-gradient-to-br from-pink-50 to-rose-100 dark:from-pink-900/20 dark:to-rose-900/20 rounded-2xl p-6 border-2 border-pink-200 dark:border-pink-700"
                whileHover={{ scale: 1.02 }}
              >
                <h3 className="text-xl font-bold text-[#01257D] dark:text-white mb-6 flex items-center">
                  <Heart className="mr-3 h-6 w-6 text-pink-600" />
                  📊 Evolución del Engagement
                </h3>
                <div className="h-80 bg-white/70 dark:bg-gray-800/70 rounded-xl p-4">
                  <Line data={engagementData} options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: true,
                        position: 'top',
                        labels: {
                          usePointStyle: true,
                          font: { size: 14, weight: 'bold' },
                          color: '#01257D'
                        }
                      },
                      tooltip: {
                        backgroundColor: '#01257D',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#013AAA',
                        borderWidth: 2,
                        cornerRadius: 12
                      }
                    },
                    scales: {
                      x: {
                        grid: { color: 'rgba(1, 37, 125, 0.1)' },
                        ticks: { color: '#01257D', font: { weight: 'bold' } }
                      },
                      y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(1, 37, 125, 0.1)' },
                        ticks: { color: '#01257D', font: { weight: 'bold' } }
                      }
                    }
                  }} />
                </div>
              </motion.div>

              {/* Métricas de engagement */}
              <motion.div 
                className="space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border-2 border-blue-200 dark:border-blue-700">
                  <h4 className="text-lg font-bold text-[#01257D] dark:text-white mb-4 flex items-center">
                    <MessageSquare className="mr-2 h-5 w-5 text-blue-600" />
                    💬 Métricas de Interacción
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-[#01257D] dark:text-white">4.8%</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Rate Promedio</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-emerald-600">+12%</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">vs. Mes Anterior</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-900/20 rounded-2xl p-6 border-2 border-emerald-200 dark:border-emerald-700">
                  <h4 className="text-lg font-bold text-[#01257D] dark:text-white mb-4 flex items-center">
                    <TrendingUp className="mr-2 h-5 w-5 text-emerald-600" />
                    📈 Tipos de Interacción
                  </h4>
                  <div className="space-y-3">
                    {[
                      { label: '❤️ Likes', value: 65, color: '#EF4444' },
                      { label: '💬 Comentarios', value: 20, color: '#3B82F6' },
                      { label: '🔄 Shares', value: 15, color: '#059669' }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.label}</span>
                        <div className="flex items-center">
                          <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mr-3">
                            <motion.div
                              className="h-2 rounded-full"
                              style={{ backgroundColor: item.color }}
                              initial={{ width: 0 }}
                              animate={{ width: `${item.value}%` }}
                              transition={{ delay: 0.5 + index * 0.1, duration: 1 }}
                            />
                          </div>
                          <span className="text-sm font-bold" style={{ color: item.color }}>
                            {item.value}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Contenido de tendencias */}
        {activeTab === 'trends' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="p-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Gráfico de crecimiento de audiencia */}
              <motion.div 
                className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border-2 border-green-200 dark:border-green-700"
                whileHover={{ scale: 1.02 }}
              >
                <h3 className="text-xl font-bold text-[#01257D] dark:text-white mb-6 flex items-center">
                  <TrendingUp className="mr-3 h-6 w-6 text-emerald-600" />
                  📈 Crecimiento de Audiencia
                </h3>
                <div className="h-80 bg-white/70 dark:bg-gray-800/70 rounded-xl p-4">
                  <Bar data={audienceGrowthData} options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: true,
                        position: 'top',
                        labels: {
                          usePointStyle: true,
                          font: { size: 14, weight: 'bold' },
                          color: '#01257D'
                        }
                      },
                      tooltip: {
                        backgroundColor: '#059669',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#10B981',
                        borderWidth: 2,
                        cornerRadius: 12
                      }
                    },
                    scales: {
                      x: {
                        grid: { color: 'rgba(5, 150, 105, 0.1)' },
                        ticks: { color: '#059669', font: { weight: 'bold' } }
                      },
                      y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(5, 150, 105, 0.1)' },
                        ticks: { color: '#059669', font: { weight: 'bold' } }
                      }
                    }
                  }} />
                </div>
              </motion.div>

              {/* Predicciones y tendencias */}
              <motion.div 
                className="space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="bg-gradient-to-br from-violet-50 to-purple-100 dark:from-violet-900/20 dark:to-purple-900/20 rounded-2xl p-6 border-2 border-violet-200 dark:border-violet-700">
                  <h4 className="text-lg font-bold text-[#01257D] dark:text-white mb-4 flex items-center">
                    <Target className="mr-2 h-5 w-5 text-violet-600" />
                    🎯 Predicciones
                  </h4>
                  <div className="space-y-4">
                    <div className="bg-white/70 dark:bg-gray-700/70 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Próximo mes</span>
                        <span className="text-lg font-bold text-emerald-600">+18%</span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Crecimiento estimado de audiencia</div>
                    </div>
                    <div className="bg-white/70 dark:bg-gray-700/70 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Engagement</span>
                        <span className="text-lg font-bold text-blue-600">5.2%</span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Rate proyectado para junio</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-900/20 dark:to-amber-900/20 rounded-2xl p-6 border-2 border-orange-200 dark:border-orange-700">
                  <h4 className="text-lg font-bold text-[#01257D] dark:text-white mb-4 flex items-center">
                    <Eye className="mr-2 h-5 w-5 text-orange-600" />
                    🔍 Insights Clave
                  </h4>
                  <div className="space-y-3">
                    {[
                      { emoji: '⏰', text: 'Mejor horario: 7:00 PM - 9:00 PM' },
                      { emoji: '📅', text: 'Días más activos: Martes y Jueves' },
                      { emoji: '📱', text: 'Plataforma líder: Instagram (42%)' },
                      { emoji: '👥', text: 'Audiencia principal: 25-34 años' }
                    ].map((insight, index) => (
                      <motion.div 
                        key={index}
                        className="flex items-center p-3 bg-white/70 dark:bg-gray-700/70 rounded-lg"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                      >
                        <span className="text-lg mr-3">{insight.emoji}</span>
                        <span className="text-sm text-gray-700 dark:text-gray-300">{insight.text}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

// Datos de ejemplo para desarrollo
const demoDemographicData: DemographicData = {
  ageGroups: [
    { label: '18-24', value: 15, color: '#10b981' },
    { label: '25-34', value: 30, color: '#3b82f6' },
    { label: '35-44', value: 25, color: '#6366f1' },
    { label: '45-54', value: 18, color: '#8b5cf6' },
    { label: '55+', value: 12, color: '#ec4899' }
  ],
  genderDistribution: [
    { label: 'Masculino', value: 52, color: '#3b82f6' },
    { label: 'Femenino', value: 46, color: '#ec4899' },
    { label: 'No especificado', value: 2, color: '#6b7280' }
  ],
  locationTop: [
    { city: 'Bogotá', country: 'Colombia', percentage: 32 },
    { city: 'Medellín', country: 'Colombia', percentage: 18 },
    { city: 'Cali', country: 'Colombia', percentage: 12 },
    { city: 'Barranquilla', country: 'Colombia', percentage: 8 },
    { city: 'Ciudad de México', country: 'México', percentage: 6 },
    { city: 'Lima', country: 'Perú', percentage: 5 }
  ]
};

const demoInfluencers: Influencer[] = [
  {
    id: 'inf1',
    name: 'Carlos Rodríguez',
    username: 'carlosrodriguez',
    platform: 'X',
    followers: 125000,
    engagement: 3.8,
    sentiment: 'positive',
    recentMention: 'El nuevo proyecto de @ElmerZapata es exactamente lo que necesitábamos. #ReformaEducativa'
  },
  {
    id: 'inf2',
    name: 'María Gómez',
    username: 'mariagomez',
    platform: 'Instagram',
    followers: 89000,
    engagement: 5.2,
    sentiment: 'positive',
    recentMention: 'Apoyando la #ReformaEducativa de @ElmerZapata. ¡Es tiempo de cambios!'
  },
  {
    id: 'inf3',
    name: 'Juan Pérez',
    username: 'juanperez',
    platform: 'X',
    followers: 67000,
    engagement: 2.9,
    sentiment: 'neutral',
    recentMention: 'Analizando las propuestas de la #ReformaEducativa. Hay puntos interesantes y otros cuestionables.'
  },
  {
    id: 'inf4',
    name: 'Laura Martínez',
    username: 'lauramartinez',
    platform: 'Facebook',
    followers: 45000,
    engagement: 4.1,
    sentiment: 'negative',
    recentMention: 'La #ReformaEducativa no aborda los problemas fundamentales del sistema educativo.'
  },
  {
    id: 'inf5',
    name: 'Andrés López',
    username: 'andreslopez',
    platform: 'X',
    followers: 112000,
    engagement: 3.5,
    sentiment: 'positive',
    recentMention: 'Felicitaciones a @ElmerZapata por su visión en la #ReformaEducativa. Necesitamos más líderes así.'
  }
];

export default AudienceAnalysis;
