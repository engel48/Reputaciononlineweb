"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';

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
  geoData = demoGeoData,
  isLoading = false 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden"
    >
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            Distribución Geográfica #{hashtagName}
          </h2>
          {isLoading && (
            <div className="animate-spin h-5 w-5 border-2 border-primary-600 border-t-transparent rounded-full"></div>
          )}
        </div>
        
        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
            <h3 className="text-xs text-gray-500 dark:text-gray-400">Países</h3>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {Array.from(new Set(geoData.map(point => point.country))).length}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
            <h3 className="text-xs text-gray-500 dark:text-gray-400">Ciudades</h3>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {Array.from(new Set(geoData.map(point => point.city))).length}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
            <h3 className="text-xs text-gray-500 dark:text-gray-400">Total Menciones</h3>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {geoData.reduce((sum, point) => sum + point.count, 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
            <h3 className="text-xs text-gray-500 dark:text-gray-400">Ciudad Principal</h3>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {geoData.sort((a, b) => b.count - a.count)[0].city}
            </p>
          </div>
        </div>
        
        {/* Mapa */}
        <div className="h-96 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
          <MapWithNoSSR geoData={geoData} hashtagName={hashtagName} />
        </div>
        
        {/* Leyenda */}
        <div className="mt-4 flex items-center justify-end space-x-4">
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-1"></span>
            <span className="text-xs text-gray-600 dark:text-gray-300">Alta</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 rounded-full bg-orange-400 mr-1"></span>
            <span className="text-xs text-gray-600 dark:text-gray-300">Media-Alta</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 rounded-full bg-yellow-400 mr-1"></span>
            <span className="text-xs text-gray-600 dark:text-gray-300">Media</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-1"></span>
            <span className="text-xs text-gray-600 dark:text-gray-300">Baja</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Datos de ejemplo para desarrollo
const demoGeoData: GeoPoint[] = [
  { id: 'geo1', lat: 4.6097, lng: -74.0817, city: 'Bogotá', country: 'Colombia', count: 1245 },
  { id: 'geo2', lat: 10.9639, lng: -74.7964, city: 'Barranquilla', country: 'Colombia', count: 865 },
  { id: 'geo3', lat: 3.4516, lng: -76.5320, city: 'Cali', country: 'Colombia', count: 732 },
  { id: 'geo4', lat: 6.2476, lng: -75.5658, city: 'Medellín', country: 'Colombia', count: 978 },
  { id: 'geo5', lat: 7.8890, lng: -72.4967, city: 'Cúcuta', country: 'Colombia', count: 387 },
  { id: 'geo6', lat: 10.3997, lng: -75.5144, city: 'Cartagena', country: 'Colombia', count: 642 },
  { id: 'geo7', lat: 9.0247, lng: -73.2525, city: 'Valledupar', country: 'Colombia', count: 215 },
  { id: 'geo8', lat: 4.5709, lng: -75.7050, city: 'Ibagué', country: 'Colombia', count: 189 },
  { id: 'geo9', lat: 11.2404, lng: -74.2115, city: 'Santa Marta', country: 'Colombia', count: 321 },
  { id: 'geo10', lat: 7.6285, lng: -74.6710, city: 'Bucaramanga', country: 'Colombia', count: 456 },
  { id: 'geo11', lat: 19.4326, lng: -99.1332, city: 'Ciudad de México', country: 'México', count: 467 },
  { id: 'geo12', lat: -12.0464, lng: -77.0428, city: 'Lima', country: 'Perú', count: 352 },
  { id: 'geo13', lat: -33.4489, lng: -70.6693, city: 'Santiago', country: 'Chile', count: 256 },
  { id: 'geo14', lat: -34.6037, lng: -58.3816, city: 'Buenos Aires', country: 'Argentina', count: 312 }
];

export default HashtagGeoMap;
