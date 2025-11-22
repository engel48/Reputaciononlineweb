'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, X, Newspaper, ChevronDown } from 'lucide-react';
import type { SelectorSitiosNoticiasProps, CategoriaSitioNoticia } from '@/types/noticias-colombia';

/**
 * Componente Selector de Sitios de Noticias Colombianos
 *
 * Features:
 * - Dropdown con 50 sitios de noticias
 * - Filtro por categoría (Nacional, Regional, Digital, etc.)
 * - Búsqueda por nombre
 * - Vista de grid con logos
 * - Estados de loading
 * - Responsive design
 */
export default function SelectorSitiosNoticias({
  sitios,
  sitioSeleccionado,
  onSitioChange,
  categoriaFiltro,
  onCategoriaChange,
  busqueda,
  onBusquedaChange,
  loading = false
}: SelectorSitiosNoticiasProps) {

  const [dropdownAbierto, setDropdownAbierto] = useState(false);
  const [vistaGrid, setVistaGrid] = useState(false);

  // Mapeo de categorías a español
  const categoriasEspañol: Record<CategoriaSitioNoticia | 'todas', string> = {
    todas: 'Todas',
    nacional: 'Nacional',
    regional: 'Regional',
    digital: 'Digital',
    economico: 'Económico',
    deportivo: 'Deportivo',
    alternativo: 'Alternativo',
    internacional: 'Internacional'
  };

  // Filtrar sitios según búsqueda y categoría
  const sitiosFiltrados = useMemo(() => {
    return sitios.filter(sitio => {
      const coincideBusqueda = sitio.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                               sitio.descripcion?.toLowerCase().includes(busqueda.toLowerCase());

      const coincideCategoria = categoriaFiltro === 'todas' || sitio.categoria === categoriaFiltro;

      return coincideBusqueda && coincideCategoria;
    });
  }, [sitios, busqueda, categoriaFiltro]);

  // Obtener sitio seleccionado actual
  const sitioActual = sitios.find(s => s.id === sitioSeleccionado);

  // Categorías disponibles
  const categorias: (CategoriaSitioNoticia | 'todas')[] = [
    'todas',
    'nacional',
    'regional',
    'digital',
    'economico',
    'deportivo',
    'alternativo',
    'internacional'
  ];

  const handleSeleccionarSitio = (sitioId: string) => {
    onSitioChange(sitioId);
    setDropdownAbierto(false);
  };

  return (
    <div className="w-full">
      {/* Barra de controles */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        {/* Selector principal (dropdown) */}
        <div className="flex-1 relative">
          <button
            onClick={() => setDropdownAbierto(!dropdownAbierto)}
            disabled={loading}
            className="w-full flex items-center justify-between bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 hover:border-[#01257D] dark:hover:border-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center space-x-3">
              <Newspaper className="w-5 h-5 text-[#01257D] dark:text-blue-400" />
              <div className="text-left">
                <div className="font-semibold text-gray-900 dark:text-white">
                  {sitioActual ? sitioActual.nombre : 'Selecciona un sitio de noticias'}
                </div>
                {sitioActual && sitioActual.descripcion && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[300px]">
                    {sitioActual.descripcion}
                  </div>
                )}
              </div>
            </div>
            <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${dropdownAbierto ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown con sitios */}
          <AnimatePresence>
            {dropdownAbierto && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl max-h-96 overflow-y-auto"
              >
                {/* Búsqueda dentro del dropdown */}
                <div className="sticky top-0 bg-white dark:bg-gray-800 p-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar sitio..."
                      value={busqueda}
                      onChange={(e) => onBusquedaChange(e.target.value)}
                      className="w-full pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#01257D] dark:focus:ring-blue-400"
                    />
                    {busqueda && (
                      <button
                        onClick={() => onBusquedaChange('')}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Lista de sitios */}
                <div className="p-2">
                  {sitiosFiltrados.length > 0 ? (
                    sitiosFiltrados.map((sitio) => (
                      <button
                        key={sitio.id}
                        onClick={() => handleSeleccionarSitio(sitio.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                          sitio.id === sitioSeleccionado ? 'bg-blue-50 dark:bg-blue-900/30 border border-[#01257D] dark:border-blue-400' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 dark:text-white">{sitio.nombre}</div>
                            {sitio.descripcion && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{sitio.descripcion}</div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                              {categoriasEspañol[sitio.categoria]}
                            </span>
                            {sitio.verificado && (
                              <span className="text-blue-500">✓</span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Newspaper className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No se encontraron sitios</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Filtro por categoría */}
        <div className="w-full md:w-64">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={categoriaFiltro}
              onChange={(e) => onCategoriaChange(e.target.value as CategoriaSitioNoticia | 'todas')}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#01257D] dark:focus:ring-blue-400 appearance-none cursor-pointer"
            >
              {categorias.map((cat) => (
                <option key={cat} value={cat}>
                  {categoriasEspañol[cat]}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Información de resultados */}
      {busqueda || categoriaFiltro !== 'todas' ? (
        <div className="mb-3 text-sm text-gray-600 dark:text-gray-400">
          Mostrando {sitiosFiltrados.length} de {sitios.length} sitios
          {busqueda && ` · Búsqueda: "${busqueda}"`}
          {categoriaFiltro !== 'todas' && ` · Categoría: ${categoriasEspañol[categoriaFiltro]}`}
        </div>
      ) : null}
    </div>
  );
}
