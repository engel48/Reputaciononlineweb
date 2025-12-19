"use client";

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Facebook, Instagram, Globe, RefreshCw, AlertCircle } from 'lucide-react';
import XLogo from '@/components/icons/XLogo';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

// Necesitamos arreglar el problema de los iconos en Leaflet con Next.js
import L from 'leaflet';

// Definir iconos para diferentes plataformas
const xIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #000000; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 50%; color: white;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18"></path><path d="M6 6L18 18"></path></svg>
         </div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

const facebookIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #1877F2; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 50%; color: white;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
         </div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

const instagramIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #E4405F; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 50%; color: white;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
         </div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

const defaultIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #6B7280; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 50%; color: white;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
         </div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

// Función para obtener el icono según la plataforma
const getIconByPlatform = (platform: string) => {
  switch (platform.toLowerCase()) {
    case 'x':
      return xIcon;
    case 'facebook':
      return facebookIcon;
    case 'instagram':
      return instagramIcon;
    default:
      return defaultIcon;
  }
};

// Función para obtener el componente de icono según la plataforma
const PlatformIcon = ({ platform }: { platform: string }) => {
  switch (platform.toLowerCase()) {
    case 'x':
      return <XLogo className="h-4 w-4" />;
    case 'facebook':
      return <Facebook className="h-4 w-4 text-[#1877F2]" />;
    case 'instagram':
      return <Instagram className="h-4 w-4 text-[#E4405F]" />;
    default:
      return <Globe className="h-4 w-4 text-[#6B7280]" />;
  }
};

// Tipo para las menciones
interface Mencion {
  id: string;
  author: string;
  content: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  platform: string;
  location: {
    lat: number;
    lng: number;
    name: string;
  };
  timestamp?: string;
}

interface MapStats {
  positive: number;
  negative: number;
  neutral: number;
}

const MencionesMap = () => {
  const [menciones, setMenciones] = useState<Mencion[]>([]);
  const [stats, setStats] = useState<MapStats>({ positive: 0, negative: 0, neutral: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Funcion para cargar menciones desde la API
  const fetchMenciones = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/mentions/map?limit=20&hours=168', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Inicia sesion para ver menciones');
        } else {
          setError('Error al cargar menciones');
        }
        return;
      }

      const data = await response.json();

      if (data.success && data.data) {
        setMenciones(data.data.mentions || []);
        setStats(data.data.stats || { positive: 0, negative: 0, neutral: 0 });
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error('Error fetching map mentions:', err);
      setError('Error de conexion');
    } finally {
      setLoading(false);
    }
  };

  // Cargar menciones al montar el componente
  useEffect(() => {
    fetchMenciones();

    // Actualizar cada 5 minutos
    const interval = setInterval(fetchMenciones, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Posicion central del mapa (Centrado en Latinoamerica)
  const center = [-8.7832, -55.4915]; // Centro geografico de Sudamerica
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative z-[1]"
    >
      <Card className="overflow-hidden shadow-xl border-2 border-gray-200 dark:border-gray-700">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-blue-600" />
                <span>Mapa de Menciones en Tiempo Real</span>
              </CardTitle>
              <CardDescription>
                {menciones.length > 0
                  ? `Distribucion geografica de ${menciones.length} menciones en Latinoamerica`
                  : 'Distribucion geografica de menciones en Latinoamerica'
                }
                {lastUpdated && ` • Ultima actualizacion: ${lastUpdated}`}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchMenciones}
              disabled={loading}
              className="ml-2"
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[450px] w-full relative z-[1]">
            {/* Estado de carga */}
            {loading && menciones.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 z-10">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-gray-400">Cargando menciones...</p>
                </div>
              </div>
            )}

            {/* Estado de error */}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 z-10">
                <div className="text-center">
                  <AlertCircle className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-gray-400">{error}</p>
                  <Button variant="outline" size="sm" onClick={fetchMenciones} className="mt-2">
                    Reintentar
                  </Button>
                </div>
              </div>
            )}

            {/* Estado sin datos */}
            {!loading && !error && menciones.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 z-10">
                <div className="text-center max-w-md px-4">
                  <Globe className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sin menciones aun
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Cuando se detecten menciones en redes sociales o medios de noticias,
                    apareceran aqui en el mapa con su ubicacion geografica.
                  </p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs mt-3">
                    Conecta tus redes sociales y activa el monitoreo de noticias para comenzar.
                  </p>
                </div>
              </div>
            )}

            <MapContainer
              center={[center[0], center[1]]}
              zoom={3}
              style={{ height: '100%', width: '100%', zIndex: 1 }}
              scrollWheelZoom={true}
              zoomControl={true}
              attributionControl={true}
              maxZoom={10}
              minZoom={2}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {menciones.map((mencion) => (
                <Marker
                  key={mencion.id}
                  position={[mencion.location.lat, mencion.location.lng]}
                  icon={getIconByPlatform(mencion.platform)}
                >
                  <Popup>
                    <div className="p-1">
                      <div className="flex items-center mb-2">
                        <PlatformIcon platform={mencion.platform} />
                        <span className="ml-2 font-medium">{mencion.author}</span>
                      </div>
                      <p className="text-sm">{mencion.content}</p>
                      <div className="mt-2 text-xs">
                        <span className={`px-2 py-1 rounded-full ${
                          mencion.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                          mencion.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {mencion.sentiment === 'positive' ? 'Positivo' :
                           mencion.sentiment === 'negative' ? 'Negativo' :
                           'Neutral'}
                        </span>
                        <span className="ml-2 text-gray-500">{mencion.location.name}</span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
          
          {/* Estadisticas y leyenda */}
          <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.positive}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Positivas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.negative}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Negativas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{stats.neutral}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Neutrales</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{menciones.length}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Total</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 justify-center">
              <div className="flex items-center space-x-1">
                <div className="h-3 w-3 rounded-full bg-black"></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">X ({menciones.filter(m => m.platform === 'x').length})</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="h-3 w-3 rounded-full bg-[#1877F2]"></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">Facebook ({menciones.filter(m => m.platform === 'facebook').length})</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="h-3 w-3 rounded-full bg-[#E4405F]"></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">Instagram ({menciones.filter(m => m.platform === 'instagram').length})</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="h-3 w-3 rounded-full bg-gray-500"></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">Noticias ({menciones.filter(m => m.platform === 'news').length})</span>
              </div>
              {menciones.length > 0 && (
                <div className="flex items-center space-x-1">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-600 font-medium">Datos reales</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MencionesMap;
