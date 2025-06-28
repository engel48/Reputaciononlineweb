"use client";

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Circle, Tooltip, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Tipos
interface GeoPoint {
  id: string;
  lat: number;
  lng: number;
  city: string;
  country: string;
  count: number;
}

interface LeafletMapProps {
  geoData: GeoPoint[];
  hashtagName: string;
}

const LeafletMap: React.FC<LeafletMapProps> = ({ geoData, hashtagName }) => {
  // Ajustar el tamaño del círculo según el conteo
  const getCircleRadius = (count: number) => {
    const baseSize = 15;
    return Math.max(baseSize, Math.sqrt(count) * 2);
  };

  // Ajustar el color según la intensidad
  const getCircleColor = (count: number) => {
    const max = Math.max(...geoData.map(point => point.count));
    const intensity = count / max;
    
    if (intensity > 0.75) return '#ef4444'; // Rojo intenso
    if (intensity > 0.5) return '#fb923c'; // Naranja
    if (intensity > 0.25) return '#facc15'; // Amarillo
    return '#22c55e'; // Verde
  };

  // Solución para el problema de los iconos de Leaflet en SSR
  useEffect(() => {
    // Solución para el problema de los iconos de Leaflet
    const L = require('leaflet');
    
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    });
  }, []);

  return (
    <MapContainer 
      center={[4.6097, -74.0817]} // Coordenadas centradas en Colombia
      zoom={5} 
      style={{ height: '100%', width: '100%' }}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {geoData.map((point) => (
        <Circle
          key={point.id}
          center={[point.lat, point.lng]}
          radius={getCircleRadius(point.count) * 1000}
          pathOptions={{
            color: getCircleColor(point.count),
            fillColor: getCircleColor(point.count),
            fillOpacity: 0.7
          }}
        >
          <Popup>
            <div>
              <h3 className="font-medium">{point.city}, {point.country}</h3>
              <p><strong>{point.count}</strong> menciones de #{hashtagName}</p>
            </div>
          </Popup>
          <Tooltip>{point.city}: {point.count} menciones</Tooltip>
        </Circle>
      ))}
    </MapContainer>
  );
};

export default LeafletMap;
