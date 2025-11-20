"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Globe, MapPin, BarChart3, Users, TrendingUp } from 'lucide-react';

// Importación dinámica del mapa completo para evitar errores de SSR
const MapWithNoSSR = dynamic(
  () => import('./LeafletMap').then((mod) => mod.default),
  { 
    ssr: false,
    loading: () => (
      <div className="h-96 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
        <span className="text-gray-500 dark:text-gray-400">Cargando mapa...</span>
      </div>
    )
  }
);

// Tipos
interface GeoPoint {
  id: string;
  lat: number;
  lng: number;
  city: string;
  country: string;
  count: number;
}

interface HashtagGeoMapProps {
  hashtagName?: string;
  geoData?: GeoPoint[];
  isLoading?: boolean;
}

const HashtagGeoMap: React.FC<HashtagGeoMapProps> = ({
  hashtagName = "ElmerZapata",
  geoData,
  isLoading = false
}) => {
  // Si no hay datos, mostrar mensaje
  if (!geoData || geoData.length === 0) {
    return (
      <div className="border-0 shadow-2xl bg-gradient-to-br from-white via-green-50/30 to-emerald-50/30 dark:from-gray-900 dark:via-green-900/10 dark:to-emerald-900/10 rounded-2xl p-12 text-center">
        <MapPin className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">
          Sin datos geográficos disponibles
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          No hay datos de ubicación para el hashtag #{hashtagName}
        </p>
      </div>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="border-0 shadow-2xl bg-gradient-to-br from-white via-green-50/30 to-emerald-50/30 dark:from-gray-900 dark:via-green-900/10 dark:to-emerald-900/10 rounded-2xl overflow-hidden"
    >
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white p-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-3xl font-bold flex items-center">
            <Globe className="mr-3 h-8 w-8" />
            🌍 Distribución Geográfica #{hashtagName}
          </h2>
          {isLoading && (
            <div className="relative">
              <div className="animate-spin h-8 w-8 border-4 border-white/30 border-t-white rounded-full"></div>
              <MapPin className="absolute inset-0 m-auto h-4 w-4 text-white animate-pulse" />
            </div>
          )}
        </div>
        <p className="text-emerald-100 text-lg">
          📍 Mapa interactivo de menciones por ubicación geográfica
        </p>
      </div>
      <div className="p-8">
        
        {/* Estadísticas mejoradas */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-[#01257D] dark:text-white mb-6 flex items-center">
            <BarChart3 className="mr-3 h-7 w-7 text-emerald-600" />
            📊 Métricas Geográficas
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-blue-900/30 dark:to-indigo-800/30 p-6 rounded-2xl border-2 border-blue-200 dark:border-blue-700 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <Globe className="h-8 w-8 text-blue-600 mb-3" />
              <h3 className="text-sm font-bold text-blue-700 dark:text-blue-300 mb-2">🌍 Países</h3>
              <p className="text-3xl font-bold text-[#01257D] dark:text-white">
                {Array.from(new Set(geoData.map(point => point.country))).length}
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-100 to-emerald-200 dark:from-green-900/30 dark:to-emerald-800/30 p-6 rounded-2xl border-2 border-green-200 dark:border-green-700 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <MapPin className="h-8 w-8 text-green-600 mb-3" />
              <h3 className="text-sm font-bold text-green-700 dark:text-green-300 mb-2">🏢 Ciudades</h3>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {Array.from(new Set(geoData.map(point => point.city))).length}
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-100 to-violet-200 dark:from-purple-900/30 dark:to-violet-800/30 p-6 rounded-2xl border-2 border-purple-200 dark:border-purple-700 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <TrendingUp className="h-8 w-8 text-purple-600 mb-3" />
              <h3 className="text-sm font-bold text-purple-700 dark:text-purple-300 mb-2">💬 Total Menciones</h3>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {geoData.reduce((sum, point) => sum + point.count, 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-gradient-to-br from-orange-100 to-amber-200 dark:from-orange-900/30 dark:to-amber-800/30 p-6 rounded-2xl border-2 border-orange-200 dark:border-orange-700 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <Users className="h-8 w-8 text-orange-600 mb-3" />
              <h3 className="text-sm font-bold text-orange-700 dark:text-orange-300 mb-2">🏆 Ciudad Principal</h3>
              <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                {geoData.sort((a, b) => b.count - a.count)[0].city}
              </p>
            </div>
          </div>
        </div>
        
        {/* Mapa mejorado */}
        <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-[#01257D] dark:text-white mb-6 flex items-center">
            <MapPin className="mr-3 h-6 w-6 text-teal-600" />
            🗺️ Mapa Interactivo de Menciones
          </h3>
          <div className="h-96 bg-gradient-to-br from-blue-50 to-teal-50 dark:from-blue-900/20 dark:to-teal-900/20 rounded-xl overflow-hidden border-2 border-blue-200 dark:border-blue-700 shadow-inner">
            <MapWithNoSSR geoData={geoData} hashtagName={hashtagName} />
          </div>
        </div>
        
        {/* Leyenda mejorada */}
        <div className="mt-8 bg-white/70 dark:bg-gray-800/70 rounded-xl p-6 backdrop-blur-sm">
          <h4 className="text-lg font-bold text-[#01257D] dark:text-white mb-4 flex items-center">
            🎨 Leyenda de Intensidad
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center p-3 bg-gradient-to-r from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 rounded-lg">
              <span className="inline-block w-4 h-4 rounded-full bg-red-500 mr-3 shadow-lg"></span>
              <span className="text-sm font-semibold text-red-700 dark:text-red-300">Alta</span>
            </div>
            <div className="flex items-center p-3 bg-gradient-to-r from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 rounded-lg">
              <span className="inline-block w-4 h-4 rounded-full bg-orange-400 mr-3 shadow-lg"></span>
              <span className="text-sm font-semibold text-orange-700 dark:text-orange-300">Media-Alta</span>
            </div>
            <div className="flex items-center p-3 bg-gradient-to-r from-yellow-100 to-yellow-200 dark:from-yellow-900/30 dark:to-yellow-800/30 rounded-lg">
              <span className="inline-block w-4 h-4 rounded-full bg-yellow-400 mr-3 shadow-lg"></span>
              <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">Media</span>
            </div>
            <div className="flex items-center p-3 bg-gradient-to-r from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 rounded-lg">
              <span className="inline-block w-4 h-4 rounded-full bg-green-500 mr-3 shadow-lg"></span>
              <span className="text-sm font-semibold text-green-700 dark:text-green-300">Baja</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default HashtagGeoMap;
