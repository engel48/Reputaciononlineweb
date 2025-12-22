'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Eye, Calendar, User, MapPin } from 'lucide-react';
import type { Mention } from '@/types/news-monitoring';

interface MencionCardProps {
  mencion: Mention;
  onMarkAsRead?: (id: string) => void;
  onOpenArticle?: (url: string) => void;
}

export default function MencionCard({ mencion, onMarkAsRead, onOpenArticle }: MencionCardProps) {
  const getSentimentBadge = () => {
    switch (mencion.sentiment) {
      case 'positive':
        return {
          bg: 'bg-green-100 dark:bg-green-900/30',
          text: 'text-green-800 dark:text-green-300',
          border: 'border-green-200 dark:border-green-800',
          label: 'Positivo',
          icon: '🟢',
        };
      case 'negative':
        return {
          bg: 'bg-red-100 dark:bg-red-900/30',
          text: 'text-red-800 dark:text-red-300',
          border: 'border-red-200 dark:border-red-800',
          label: 'Negativo',
          icon: '🔴',
        };
      default:
        return {
          bg: 'bg-gray-100 dark:bg-gray-700/30',
          text: 'text-gray-800 dark:text-gray-300',
          border: 'border-gray-200 dark:border-gray-700',
          label: 'Neutral',
          icon: '⚪',
        };
    }
  };

  const sentiment = getSentimentBadge();

  const formatTimeAgo = (dateInput: Date | string | null | undefined) => {
    if (!dateInput) return 'Fecha no disponible';

    // Convertir a Date si es string
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) return 'Fecha no disponible';

    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 0) return 'Hace un momento';
    if (diffInMinutes < 1) return 'Hace un momento';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)}h`;
    const days = Math.floor(diffInMinutes / 1440);
    return `Hace ${days} ${days === 1 ? 'día' : 'días'}`;
  };

  const highlightTerm = (text: string, term: string) => {
    if (!term) return text;

    const regex = new RegExp(`(${term})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const handleOpenArticle = () => {
    if (onOpenArticle) {
      onOpenArticle(mencion.articleUrl);
    } else {
      window.open(mencion.articleUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMarkAsRead) {
      onMarkAsRead(mencion.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
      className={`bg-white dark:bg-gray-800 rounded-lg border p-4 transition-all cursor-pointer ${
        mencion.isRead
          ? 'border-gray-200 dark:border-gray-700 opacity-75'
          : 'border-blue-200 dark:border-blue-800 shadow-md'
      }`}
      onClick={handleOpenArticle}
    >
      {/* Header: Sitio y Sentimiento */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          {/* Logo del sitio */}
          <div className="flex-shrink-0 text-2xl">
            {mencion.siteLogo}
          </div>

          {/* Nombre del sitio y fecha */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              {mencion.siteName}
            </h4>
            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              <Calendar className="w-3 h-3" />
              <span>{formatTimeAgo(mencion.publishedDate)}</span>
              <span>•</span>
              <span>{formatTimeAgo(mencion.discoveredAt)} detectado</span>
            </div>
          </div>
        </div>

        {/* Badge de sentimiento */}
        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full border ${sentiment.bg} ${sentiment.text} ${sentiment.border}`}>
          <span className="text-xs">{sentiment.icon}</span>
          <span className="text-xs font-medium">{sentiment.label}</span>
        </div>
      </div>

      {/* Título del artículo */}
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-2">
        {mencion.articleTitle}
      </h3>

      {/* Contexto con término resaltado */}
      <div className="mb-3">
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
          {highlightTerm(mencion.mentionContext, mencion.matchedTerm)}
        </p>
      </div>

      {/* Término coincidente */}
      {mencion.matchedTerm && (
        <div className="mb-3">
          <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-medium">
            🔍 Término: "{mencion.matchedTerm}"
          </span>
        </div>
      )}

      {/* Autor si está disponible */}
      {mencion.author && (
        <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 mb-3">
          <User className="w-3 h-3" />
          <span>Por {mencion.author}</span>
        </div>
      )}

      {/* Footer: Acciones */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          {/* Score de sentimiento */}
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Score: <span className="font-medium">{mencion.sentimentScore.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Botón marcar como leído */}
          {!mencion.isRead && onMarkAsRead && (
            <button
              onClick={handleMarkAsRead}
              className="flex items-center space-x-1 px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
            >
              <Eye className="w-3 h-3" />
              <span>Marcar leído</span>
            </button>
          )}

          {/* Botón ver artículo */}
          <button
            onClick={handleOpenArticle}
            className="flex items-center space-x-1 px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-md transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Ver artículo</span>
          </button>
        </div>
      </div>

      {/* Indicador de no leído */}
      {!mencion.isRead && (
        <div className="absolute top-2 right-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
        </div>
      )}
    </motion.div>
  );
}
