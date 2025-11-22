'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Newspaper, AlertCircle, Clock, Loader2 } from 'lucide-react';
import SelectorSitiosNoticias from './SelectorSitiosNoticias';
import NoticiaCard from './NoticiaCard';
import type {
  NoticiasColombiaProps,
  NoticiasColombiaState,
  SitioNoticiasColombia,
  NoticiaColombia,
  CategoriaSitioNoticia
} from '@/types/noticias-colombia';

/**
 * Componente principal: Noticias de Colombia en Tiempo Real
 *
 * Features:
 * - Selector de 50 sitios de noticias colombianos
 * - Carga en tiempo real mediante scraping
 * - Filtros por categoría y búsqueda
 * - Grid responsive de noticias
 * - Loading states y error handling
 * - Refresh manual
 * - Lazy loading / Paginación
 */
export default function NoticiasColombia({
  className = '',
  showSelector = true,
  sitioInicial,
  categoriaInicial,
  limite = 20
}: NoticiasColombiaProps) {

  // Estado principal
  const [state, setState] = useState<NoticiasColombiaState>({
    sitioSeleccionado: sitioInicial || null,
    noticias: [],
    loading: false,
    error: null,
    lastUpdate: null,
    categoriaFiltro: categoriaInicial || 'todas',
    busqueda: '',
    paginaActual: 1,
    noticiasPorPagina: limite
  });

  // Estado para sitios disponibles
  const [sitios, setSitios] = useState<SitioNoticiasColombia[]>([]);
  const [loadingSitios, setLoadingSitios] = useState(true);

  // Cargar lista de sitios al montar
  useEffect(() => {
    cargarSitios();
  }, []);

  // Cargar noticias cuando cambia el sitio seleccionado
  useEffect(() => {
    if (state.sitioSeleccionado) {
      cargarNoticias(state.sitioSeleccionado);
    }
  }, [state.sitioSeleccionado]);

  /**
   * Carga la lista de sitios de noticias desde la API
   */
  const cargarSitios = async () => {
    try {
      setLoadingSitios(true);
      const response = await fetch('/api/noticias-colombia/sitios');
      const data = await response.json();

      if (data.success) {
        setSitios(data.sitios);

        // Si no hay sitio seleccionado, seleccionar el primero por defecto
        if (!state.sitioSeleccionado && data.sitios.length > 0) {
          setState(prev => ({
            ...prev,
            sitioSeleccionado: data.sitios[0].id
          }));
        }
      } else {
        throw new Error(data.error || 'Error al cargar sitios');
      }
    } catch (error: any) {
      console.error('Error cargando sitios:', error);
      setState(prev => ({
        ...prev,
        error: 'No se pudieron cargar los sitios de noticias'
      }));
    } finally {
      setLoadingSitios(false);
    }
  };

  /**
   * Carga las noticias del sitio seleccionado
   */
  const cargarNoticias = async (sitioId: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch(`/api/noticias-colombia/scrape?sitio=${sitioId}`);
      const data = await response.json();

      if (data.success) {
        setState(prev => ({
          ...prev,
          noticias: data.noticias,
          loading: false,
          lastUpdate: new Date(data.scraped_at),
          paginaActual: 1 // Reset pagination
        }));
      } else {
        throw new Error(data.error || 'Error al cargar noticias');
      }
    } catch (error: any) {
      console.error('Error cargando noticias:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'No se pudieron cargar las noticias'
      }));
    }
  };

  /**
   * Maneja el refresh manual de noticias
   */
  const handleRefresh = useCallback(() => {
    if (state.sitioSeleccionado) {
      cargarNoticias(state.sitioSeleccionado);
    }
  }, [state.sitioSeleccionado]);

  /**
   * Maneja cambio de sitio
   */
  const handleSitioChange = (sitioId: string) => {
    setState(prev => ({ ...prev, sitioSeleccionado: sitioId }));
  };

  /**
   * Maneja cambio de categoría
   */
  const handleCategoriaChange = (categoria: CategoriaSitioNoticia | 'todas') => {
    setState(prev => ({ ...prev, categoriaFiltro: categoria, paginaActual: 1 }));
  };

  /**
   * Maneja cambio de búsqueda
   */
  const handleBusquedaChange = (busqueda: string) => {
    setState(prev => ({ ...prev, busqueda, paginaActual: 1 }));
  };

  /**
   * Noticias a mostrar en la página actual
   */
  const noticiasPaginadas = state.noticias.slice(
    0,
    state.paginaActual * state.noticiasPorPagina
  );

  const hayMasNoticias = state.noticias.length > noticiasPaginadas.length;

  /**
   * Carga más noticias (lazy loading)
   */
  const cargarMasNoticias = () => {
    setState(prev => ({
      ...prev,
      paginaActual: prev.paginaActual + 1
    }));
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg">
            <Newspaper className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Noticias de Colombia en Tiempo Real
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              50 sitios de noticias colombianos verificados
            </p>
          </div>
        </div>

        {/* Indicador de última actualización y botón refresh */}
        <div className="flex items-center space-x-3">
          {state.lastUpdate && (
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <Clock className="w-4 h-4" />
              <span>{state.lastUpdate.toLocaleTimeString()}</span>
            </div>
          )}

          <button
            onClick={handleRefresh}
            disabled={state.loading}
            className="flex items-center space-x-2 px-4 py-2 bg-[#01257D] hover:bg-[#01257D]/90 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${state.loading ? 'animate-spin' : ''}`} />
            <span>{state.loading ? 'Cargando...' : 'Actualizar'}</span>
          </button>
        </div>
      </div>

      {/* Selector de sitios */}
      {showSelector && (
        <SelectorSitiosNoticias
          sitios={sitios}
          sitioSeleccionado={state.sitioSeleccionado}
          onSitioChange={handleSitioChange}
          categoriaFiltro={state.categoriaFiltro}
          onCategoriaChange={handleCategoriaChange}
          busqueda={state.busqueda}
          onBusquedaChange={handleBusquedaChange}
          loading={loadingSitios}
        />
      )}

      {/* Estados: Loading, Error, Empty, Success */}
      <div className="mt-6">
        {/* Loading skeleton */}
        {state.loading && state.noticias.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 animate-pulse">
                <div className="h-48 bg-gray-300 dark:bg-gray-700 rounded mb-4"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {state.error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-2">
              Error al cargar noticias
            </h3>
            <p className="text-red-700 dark:text-red-300 mb-4">{state.error}</p>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Empty state */}
        {!state.loading && !state.error && state.noticias.length === 0 && (
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
            <Newspaper className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No hay noticias disponibles
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Selecciona un sitio de noticias para comenzar
            </p>
          </div>
        )}

        {/* Grid de noticias */}
        {!state.loading && !state.error && state.noticias.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {noticiasPaginadas.map((noticia, index) => (
                  <motion.div
                    key={noticia.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <NoticiaCard noticia={noticia} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Botón "Ver más" */}
            {hayMasNoticias && (
              <div className="mt-8 text-center">
                <button
                  onClick={cargarMasNoticias}
                  className="px-6 py-3 bg-white dark:bg-gray-800 border-2 border-[#01257D] dark:border-blue-400 text-[#01257D] dark:text-blue-400 rounded-lg hover:bg-[#01257D] hover:text-white dark:hover:bg-blue-400 dark:hover:text-white transition-colors font-semibold"
                >
                  Ver más noticias ({state.noticias.length - noticiasPaginadas.length} restantes)
                </button>
              </div>
            )}

            {/* Indicador de total */}
            <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
              Mostrando {noticiasPaginadas.length} de {state.noticias.length} noticias
            </div>
          </>
        )}
      </div>
    </div>
  );
}
