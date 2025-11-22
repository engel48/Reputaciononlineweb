'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Clock, User } from 'lucide-react';
import type { NoticiaCardProps } from '@/types/noticias-colombia';

/**
 * Componente para mostrar una noticia individual en formato card
 *
 * Features:
 * - Imagen de la noticia (opcional)
 * - Título, descripción
 * - Metadata: autor, fecha, sitio
 * - Link externo para abrir en nueva pestaña
 * - Animaciones con Framer Motion
 * - Responsive design
 */
export default function NoticiaCard({
  noticia,
  onClick,
  className = '',
  showSitio = true,
  showImagen = true
}: NoticiaCardProps) {

  const getTimeAgo = (publishedAt: string): string => {
    const now = new Date();
    const published = new Date(publishedAt);
    const diffInMinutes = Math.floor((now.getTime() - published.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)} h`;
    return `Hace ${Math.floor(diffInMinutes / 1440)} d`;
  };

  const handleClick = () => {
    if (onClick) {
      onClick(noticia);
    }
  };

  const handleExternalLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(noticia.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer border border-gray-200 dark:border-gray-700 ${className}`}
      onClick={handleClick}
    >
      {/* Imagen de la noticia */}
      {showImagen && noticia.imagen_url && (
        <div className="relative h-48 w-full overflow-hidden bg-gray-200 dark:bg-gray-700">
          <img
            src={noticia.imagen_url}
            alt={noticia.titulo}
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
            onError={(e) => {
              // Si la imagen falla, mostrar placeholder
              (e.target as HTMLImageElement).src = '/placeholder-news.jpg';
            }}
          />

          {/* Badge del sitio en la imagen */}
          {showSitio && (
            <div className="absolute top-2 left-2 bg-white dark:bg-gray-800 bg-opacity-90 px-2 py-1 rounded text-xs font-semibold text-gray-900 dark:text-white">
              {noticia.sitio_nombre}
            </div>
          )}

          {/* Badge de verificado */}
          {noticia.verificada && (
            <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center">
              <span className="mr-1">✓</span>
              Verificada
            </div>
          )}
        </div>
      )}

      {/* Contenido de la card */}
      <div className="p-4">
        {/* Título */}
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 hover:text-[#01257D] dark:hover:text-blue-400 transition-colors">
          {noticia.titulo}
        </h3>

        {/* Descripción */}
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-3">
          {noticia.descripcion}
        </p>

        {/* Tags */}
        {noticia.tags && noticia.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {noticia.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-full text-xs font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Metadata: autor, fecha, sitio */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-3">
          <div className="flex items-center space-x-3">
            {/* Autor */}
            {noticia.autor && (
              <div className="flex items-center space-x-1">
                <User className="w-3 h-3" />
                <span className="truncate max-w-[100px]">{noticia.autor}</span>
              </div>
            )}

            {/* Tiempo */}
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{getTimeAgo(noticia.fecha_publicacion)}</span>
            </div>
          </div>

          {/* Botón link externo */}
          <button
            onClick={handleExternalLink}
            className="flex items-center space-x-1 text-[#01257D] hover:text-[#01257D]/80 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
            title="Abrir en nueva pestaña"
          >
            <span>Leer más</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        {/* Sitio (si no se muestra en la imagen) */}
        {showSitio && !showImagen && (
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Fuente: <span className="font-semibold">{noticia.sitio_nombre}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
