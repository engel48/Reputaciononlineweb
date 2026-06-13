'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Check, User, Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { AvailableSite, ScanFrequency } from '@/types/news-monitoring';
import { COLOMBIAN_NEWS_SITES, SCAN_FREQUENCY_LABELS } from '@/types/news-monitoring';
import { useUser } from '@/context/UserContext';

interface AgregarSitioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (siteId: string, searchTerms: string[], scanFrequency: ScanFrequency) => Promise<void>;
  currentMonitoredSiteIds: string[];
}

export default function AgregarSitioModal({
  isOpen,
  onClose,
  onSubmit,
  currentMonitoredSiteIds,
}: AgregarSitioModalProps) {
  const { user } = useUser();
  const [selectedSite, setSelectedSite] = useState<AvailableSite | null>(null);
  const [scanFrequency, setScanFrequency] = useState<ScanFrequency>('hourly');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrar sitios disponibles (excluir ya monitoreados)
  const availableSites = COLOMBIAN_NEWS_SITES.filter(
    (site) => !currentMonitoredSiteIds.includes(site.id)
  ).filter((site) =>
    searchQuery === '' ||
    site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    site.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Agrupar sitios por categoría
  const sitesByCategory = availableSites.reduce((acc, site) => {
    if (!acc[site.category]) {
      acc[site.category] = [];
    }
    acc[site.category].push(site);
    return acc;
  }, {} as Record<string, AvailableSite[]>);

  const categoryLabels: Record<string, string> = {
    nacional: '🇨🇴 Nacionales',
    regional: '📍 Regionales',
    especializado: '🎯 Especializados',
    digital: '💻 Digitales',
  };

  const handleSubmit = async () => {
    if (!selectedSite) return;

    setIsSubmitting(true);
    try {
      // Se envían términos vacíos - el API los genera automáticamente del nombre del usuario
      await onSubmit(selectedSite.id, [], scanFrequency);
      // Reset form
      setSelectedSite(null);
      setScanFrequency('hourly');
      setSearchQuery('');
      onClose();
    } catch (error) {
      console.error('Error al agregar sitio:', error);
      toast.error('No se pudo agregar el sitio', { description: 'Por favor intenta nuevamente.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedSite(null);
      setScanFrequency('hourly');
      setSearchQuery('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[99999] p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 50 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Activar Monitoreo de Noticias</h2>
                <p className="text-blue-100 mt-1">
                  Selecciona sitios de noticias. El sistema buscará automáticamente tu nombre en ellos.
                </p>
              </div>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[calc(90vh-180px)] overflow-y-auto">
            {/* Paso 1: Seleccionar sitio */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                1. Seleccionar sitio de noticias
              </label>

              {/* Buscador de sitios */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar sitio..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Lista de sitios */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg max-h-64 overflow-y-auto">
                {availableSites.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    {currentMonitoredSiteIds.length >= 50 ? (
                      <p>Ya estás monitoreando todos los sitios disponibles</p>
                    ) : (
                      <p>No se encontraron sitios con "{searchQuery}"</p>
                    )}
                  </div>
                ) : (
                  Object.entries(sitesByCategory).map(([category, sites]) => (
                    <div key={category} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                      <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-2 font-medium text-sm text-gray-700 dark:text-gray-300">
                        {categoryLabels[category]}
                      </div>
                      {sites.map((site) => (
                        <button
                          key={site.id}
                          onClick={() => setSelectedSite(site)}
                          className={`w-full px-4 py-3 flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                            selectedSite?.id === site.id
                              ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600'
                              : ''
                          }`}
                        >
                          <span className="text-2xl">{site.logo}</span>
                          <div className="flex-1 text-left">
                            <p className="font-medium text-gray-900 dark:text-white">{site.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{site.description}</p>
                          </div>
                          {selectedSite?.id === site.id && (
                            <Check className="w-5 h-5 text-blue-600" />
                          )}
                        </button>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Paso 2: Búsqueda automática */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                2. Búsqueda automática
              </label>

              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 dark:bg-green-800/50 rounded-full">
                    <User className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-300">
                      Buscando menciones de: <strong>{user?.name || 'Tu nombre'}</strong>
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      El sistema buscará automáticamente tu nombre en las noticias del sitio seleccionado
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Paso 3: Frecuencia de escaneo */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                3. Frecuencia de escaneo
              </label>

              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(SCAN_FREQUENCY_LABELS) as ScanFrequency[]).map((freq) => (
                  <button
                    key={freq}
                    onClick={() => setScanFrequency(freq)}
                    disabled={isSubmitting}
                    className={`px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                      scanFrequency === freq
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-600 text-blue-700 dark:text-blue-300'
                        : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {SCAN_FREQUENCY_LABELS[freq]}
                  </button>
                ))}
              </div>
            </div>

            {/* Resumen */}
            {selectedSite && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Resumen:</h4>
                <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                  <li>• Sitio: <strong>{selectedSite.name}</strong></li>
                  <li>• Buscando: <strong>"{user?.name || 'Tu nombre'}"</strong></li>
                  <li>• Frecuencia: <strong>{SCAN_FREQUENCY_LABELS[scanFrequency]}</strong></li>
                </ul>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedSite || isSubmitting}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Plus className="w-5 h-5" />
                  </motion.div>
                  <span>Activando...</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  <span>Activar Monitoreo</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
