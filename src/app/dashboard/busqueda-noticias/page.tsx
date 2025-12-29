"use client";

import React, { useState } from 'react';
import SimpleBuscador from '@/components/dashboard/SimpleBuscador';
import AdvancedSearch from '@/components/dashboard/AdvancedSearch';
import NoticiasColombia from '@/components/dashboard/NoticiasColombia';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Globe, Clock, RefreshCw, ArrowUpRight, X as CloseIcon, Users, Building, Crown } from 'lucide-react';
import { useRealTimeNews } from '@/hooks/useRealTimeNews';
import dynamic from 'next/dynamic';

// Importar el mapa dinámicamente para evitar problemas con SSR
const DynamicMencionesMap = dynamic(() => import('@/components/dashboard/MencionesMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-md">
      <div className="text-gray-500 dark:text-gray-400">Cargando mapa...</div>
    </div>
  ),
});

export default function BusquedaNoticiasPage() {
  // Usar hook de noticias en tiempo real
  const {
    news: noticiasReales,
    isLoading: cargandoNoticias,
    error: errorNoticias,
    lastUpdated: ultimaActualizacionNoticias,
    isRealTime: noticiasEnTiempoReal,
    sources: fuentesNoticias,
    isRefreshing: refrescandoNoticias,
    refreshNews: refrescarNoticias,
    getSentimentStats,
    getRecentNews
  } = useRealTimeNews({
    category: 'all',
    limit: 12,
    autoRefresh: true,
    refreshInterval: 3 * 60 * 1000 // 3 minutos
  });

  const [noticiaSeleccionada, setNoticiaSeleccionada] = useState<any>(null);
  const [mostrarModalNoticia, setMostrarModalNoticia] = useState(false);

  const abrirNoticia = (noticia: any) => {
    setNoticiaSeleccionada(noticia);
    setMostrarModalNoticia(true);
  };

  const cerrarModalNoticia = () => {
    setMostrarModalNoticia(false);
    setTimeout(() => setNoticiaSeleccionada(null), 300);
  };

  const statsVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1]
      }
    })
  };

  return (
    <div className="space-y-6">
      {/* Título de la página */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Búsqueda y Noticias
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Busca personalidades, marcas y mantente al día con las noticias más relevantes en tiempo real
        </p>
      </div>

      {/* SECCIÓN: BUSCADOR DE PERSONAS Y EMPRESAS - COMPLETO */}
      <motion.div
        custom={0}
        initial="hidden"
        animate="visible"
        variants={statsVariants}
      >
        {/* Información de tipos de búsqueda */}
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center space-x-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <Crown className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-purple-900 dark:text-purple-100">Políticos</p>
              <p className="text-xs text-purple-600 dark:text-purple-300">Candidatos, funcionarios</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800">
            <Users className="w-5 h-5 text-pink-600" />
            <div>
              <p className="text-sm font-medium text-pink-900 dark:text-pink-100">Influencers</p>
              <p className="text-xs text-pink-600 dark:text-pink-300">Creadores de contenido</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <Building className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Empresas</p>
              <p className="text-xs text-blue-600 dark:text-blue-300">Marcas, corporaciones</p>
            </div>
          </div>
        </div>

        {/* Buscador avanzado completo con análisis de sentimientos */}
        <AdvancedSearch />
      </motion.div>

      {/* SECCIÓN: NOTICIAS DE COLOMBIA EN TIEMPO REAL - 50 SITIOS VERIFICADOS */}
      <motion.div
        custom={1}
        initial="hidden"
        animate="visible"
        variants={statsVariants}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700"
      >
        <NoticiasColombia />
      </motion.div>

      {/* SECCIÓN: MAPA DE MENCIONES EN TIEMPO REAL */}
      <motion.div
        custom={2}
        initial="hidden"
        animate="visible"
        variants={statsVariants}
      >
        <DynamicMencionesMap />
      </motion.div>

      {/* SECCIÓN: NOTICIAS RELEVANTES EN TIEMPO REAL */}
      <motion.div
        custom={3}
        initial="hidden"
        animate="visible"
        variants={statsVariants}
        whileHover={{ scale: 1.002, transition: { duration: 0.3 } }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                📺 Noticias Relevantes en Tiempo Real
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                {noticiasEnTiempoReal
                  ? `Fuentes reales: ${fuentesNoticias.slice(0, 3).join(', ')}`
                  : 'Cargando fuentes en tiempo real...'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {/* Estado de actualización */}
            {cargandoNoticias || refrescandoNoticias ? (
              <div className="flex items-center space-x-2">
                <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />
                <span className="text-xs text-blue-600 font-medium">ACTUALIZANDO</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <div className={`h-2 w-2 rounded-full animate-pulse ${noticiasEnTiempoReal ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span className={`text-xs font-medium ${noticiasEnTiempoReal ? 'text-green-600' : 'text-yellow-600'}`}>
                  {noticiasEnTiempoReal ? 'TIEMPO REAL' : 'DATOS CACHE'}
                </span>
              </div>
            )}

            {/* Última actualización */}
            {ultimaActualizacionNoticias && (
              <span className="text-xs text-gray-500 hidden sm:inline">
                {new Date(ultimaActualizacionNoticias).toLocaleTimeString()}
              </span>
            )}

            {/* Botón de refresh manual */}
            <button
              onClick={refrescarNoticias}
              disabled={refrescandoNoticias}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Refrescar noticias"
            >
              <RefreshCw className={`h-4 w-4 text-gray-500 ${refrescandoNoticias ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tabs para categorías */}
        <div className="flex space-x-1 mb-4 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 overflow-x-auto">
          <button className="flex-1 px-3 py-2 text-sm font-medium rounded-md bg-white dark:bg-gray-800 text-[#01257D] shadow-sm whitespace-nowrap">
            👑 Políticos
          </button>
          <button className="flex-1 px-3 py-2 text-sm font-medium rounded-md text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 whitespace-nowrap">
            ⭐ Influencers
          </button>
          <button className="flex-1 px-3 py-2 text-sm font-medium rounded-md text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 whitespace-nowrap">
            🏢 Empresas
          </button>
        </div>

        {/* Estadísticas de noticias en tiempo real */}
        {noticiasReales.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{noticiasReales.length}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Total Noticias</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-green-600 dark:text-green-400">{getSentimentStats().positive}%</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Positivas</div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-red-600 dark:text-red-400">{getSentimentStats().negative}%</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Negativas</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/20 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-gray-600 dark:text-gray-400">{getRecentNews(6).length}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Últimas 6h</div>
            </div>
          </div>
        )}

        {/* Noticias Grid - Datos Reales en Tiempo Real */}
        {cargandoNoticias && (!noticiasReales || noticiasReales.length === 0) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 animate-pulse">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                </div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded mb-3"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : errorNoticias ? (
          <div className="text-center py-8">
            <div className="text-red-500 mb-2">⚠️ Error cargando noticias</div>
            <div className="text-sm text-gray-500 mb-4">{errorNoticias}</div>
            <button
              onClick={refrescarNoticias}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {noticiasReales.map((noticia, index) => {
              const getSentimentColor = (sentiment: string) => {
                switch (sentiment) {
                  case 'positive': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
                  case 'negative': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
                  default: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
                }
              };

              const getCategoryIcon = (category: string) => {
                switch (category) {
                  case 'política': return '🏛️';
                  case 'economía': return '💰';
                  case 'tecnología': return '💻';
                  case 'cultura': return '🎭';
                  default: return '📰';
                }
              };

              const getTimeAgo = (publishedAt: string) => {
                const now = new Date();
                const published = new Date(publishedAt);
                const diffInMinutes = Math.floor((now.getTime() - published.getTime()) / (1000 * 60));

                if (diffInMinutes < 60) return `Hace ${diffInMinutes}m`;
                if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)}h`;
                return `Hace ${Math.floor(diffInMinutes / 1440)}d`;
              };

              return (
                <motion.div
                  key={noticia.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * (index + 1) }}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.02] bg-white dark:bg-gray-800"
                  onClick={() => abrirNoticia(noticia)}
                >
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="text-lg">{getCategoryIcon(noticia.category)}</div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">{noticia.category}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getSentimentColor(noticia.sentiment)}`}>
                      {noticia.sentiment === 'positive' ? 'Positiva' :
                       noticia.sentiment === 'negative' ? 'Negativa' : 'Neutral'}
                    </span>
                    {noticia.verified && (
                      <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>

                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 hover:text-[#01257D] transition-colors line-clamp-2">
                    {noticia.title}
                  </h4>

                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {noticia.content}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{noticia.source}</span>
                      <span>•</span>
                      <span>{getTimeAgo(noticia.publishedAt)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>Real</span>
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                    📖 Click para leer completa
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        <div className="mt-4 text-center">
          <button className="text-sm font-medium text-[#01257D] hover:text-[#01257D]/90 dark:text-[#01257D] dark:hover:text-[#01257D]/90 flex items-center mx-auto">
            Ver más noticias analizadas
            <ArrowUpRight className="ml-1 h-4 w-4" />
          </button>
        </div>
      </motion.div>

      {/* Modal para Noticias Reales */}
      <AnimatePresence>
        {mostrarModalNoticia && noticiaSeleccionada && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={cerrarModalNoticia}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header del modal */}
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">
                    {noticiaSeleccionada.category === 'política' ? '🏛️' :
                     noticiaSeleccionada.category === 'economía' ? '💰' :
                     noticiaSeleccionada.category === 'tecnología' ? '💻' :
                     noticiaSeleccionada.category === 'cultura' ? '🎭' : '📰'}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {noticiaSeleccionada.title}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-sm font-medium text-[#01257D]">{noticiaSeleccionada.source}</span>
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-gray-500">
                        {new Date(noticiaSeleccionada.publishedAt).toLocaleDateString('es-CO', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={cerrarModalNoticia}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <CloseIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Contenido del modal */}
              <div className="p-6">
                {/* Badges */}
                <div className="flex items-center space-x-2 mb-4">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                    noticiaSeleccionada.sentiment === 'positive'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : noticiaSeleccionada.sentiment === 'negative'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                  }`}>
                    {noticiaSeleccionada.sentiment === 'positive' ? 'Sentimiento Positivo' :
                     noticiaSeleccionada.sentiment === 'negative' ? 'Sentimiento Negativo' : 'Sentimiento Neutral'}
                  </span>
                  <span className="text-xs px-3 py-1 rounded-full font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 capitalize">
                    {noticiaSeleccionada.category}
                  </span>
                  {noticiaSeleccionada.verified && (
                    <span className="text-xs px-3 py-1 rounded-full font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                      ✓ Fuente Verificada
                    </span>
                  )}
                </div>

                {/* Contenido completo */}
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {noticiaSeleccionada.content}
                  </p>
                </div>

                {/* URL de la noticia si existe */}
                {noticiaSeleccionada.url && (
                  <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <a
                      href={noticiaSeleccionada.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[#01257D] hover:underline flex items-center"
                    >
                      🔗 Leer noticia completa en {noticiaSeleccionada.source}
                      <ArrowUpRight className="w-3 h-3 ml-1" />
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
