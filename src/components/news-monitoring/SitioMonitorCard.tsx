'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  Settings,
  Pause,
  Play,
  Trash2,
  RefreshCw,
  Clock,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import type { MonitoredSite } from '@/types/news-monitoring';
import { SCAN_FREQUENCY_LABELS } from '@/types/news-monitoring';

interface SitioMonitorCardProps {
  sitio: MonitoredSite;
  onViewMentions?: (siteId: string) => void;
  onConfigure?: (sitio: MonitoredSite) => void;
  onToggleActive?: (siteId: string, isActive: boolean) => void;
  onDelete?: (siteId: string) => void;
  onScanNow?: (siteId: string) => void;
  isScanning?: boolean;
}

export default function SitioMonitorCard({
  sitio,
  onViewMentions,
  onConfigure,
  onToggleActive,
  onDelete,
  onScanNow,
  isScanning = false,
}: SitioMonitorCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const formatDate = (date: Date | null) => {
    if (!date) return 'Nunca';

    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Ahora mismo';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)}h`;

    return date.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleToggleActive = () => {
    if (onToggleActive) {
      onToggleActive(sitio.id, !sitio.isActive);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(sitio.id);
      setShowDeleteConfirm(false);
    }
  };

  const handleScanNow = () => {
    if (onScanNow && sitio.isActive) {
      onScanNow(sitio.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`bg-white dark:bg-gray-800 rounded-xl border-2 p-5 transition-all shadow-md hover:shadow-xl ${
        sitio.isActive
          ? 'border-blue-200 dark:border-blue-800'
          : 'border-gray-200 dark:border-gray-700 opacity-75'
      }`}
    >
      {/* Header con logo y estado */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {/* Logo del sitio */}
          <div className="flex-shrink-0 text-4xl">
            {sitio.siteLogo}
          </div>

          {/* Nombre y estado */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {sitio.siteName}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              {sitio.isActive ? (
                <span className="flex items-center space-x-1 text-xs font-medium text-green-600 dark:text-green-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Activo</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span>Pausado</span>
                </span>
              )}

              {/* Indicador de escaneo en progreso */}
              {isScanning && sitio.isActive && (
                <span className="flex items-center space-x-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Escaneando...</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Nuevas menciones badge */}
        {sitio.newMentions > 0 && sitio.isActive && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full w-8 h-8 shadow-lg"
          >
            +{sitio.newMentions}
          </motion.div>
        )}
      </div>

      {/* Términos de búsqueda */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Términos monitoreados:</p>
        <div className="flex flex-wrap gap-1.5">
          {sitio.searchTerms.map((term, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-medium"
            >
              {term}
            </span>
          ))}
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Total menciones</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            {sitio.totalMentions}
            {sitio.newMentions > 0 && (
              <TrendingUp className="w-4 h-4 text-green-500 ml-1" />
            )}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Frecuencia</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {SCAN_FREQUENCY_LABELS[sitio.scanFrequency]}
          </p>
        </div>
      </div>

      {/* Información de última revisión */}
      <div className="mb-4 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
            <Clock className="w-3 h-3" />
            <span>Última revisión:</span>
          </div>
          <span className="font-medium text-gray-900 dark:text-white">
            {formatDate(sitio.lastChecked)}
          </span>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="grid grid-cols-2 gap-2">
        {/* Ver menciones */}
        <button
          onClick={() => onViewMentions && onViewMentions(sitio.id)}
          disabled={sitio.totalMentions === 0}
          className={`flex items-center justify-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            sitio.totalMentions > 0
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>Ver ({sitio.totalMentions})</span>
        </button>

        {/* Configurar */}
        <button
          onClick={() => onConfigure && onConfigure(sitio)}
          className="flex items-center justify-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <Settings className="w-4 h-4" />
          <span>Config</span>
        </button>

        {/* Escanear ahora */}
        <button
          onClick={handleScanNow}
          disabled={!sitio.isActive || isScanning}
          className={`flex items-center justify-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            sitio.isActive && !isScanning
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
          <span>Escanear</span>
        </button>

        {/* Pausar/Activar */}
        <button
          onClick={handleToggleActive}
          className={`flex items-center justify-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            sitio.isActive
              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/50'
              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50'
          }`}
        >
          {sitio.isActive ? (
            <>
              <Pause className="w-4 h-4" />
              <span>Pausar</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>Activar</span>
            </>
          )}
        </button>
      </div>

      {/* Botón eliminar */}
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full flex items-center justify-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Eliminar sitio</span>
          </button>
        ) : (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                <span>¿Estás seguro? Se perderán todas las menciones.</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleDelete}
                  className="px-3 py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors"
                >
                  Sí, eliminar
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Fecha de activación */}
      <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 text-center">
        Activo desde {sitio.activatedAt.toLocaleDateString('es-CO', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
      </div>
    </motion.div>
  );
}
