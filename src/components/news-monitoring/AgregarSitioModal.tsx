'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Search, Check } from 'lucide-react';
import type { AvailableSite, ScanFrequency } from '@/types/news-monitoring';
import { COLOMBIAN_NEWS_SITES, SCAN_FREQUENCY_LABELS } from '@/types/news-monitoring';

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
  const [selectedSite, setSelectedSite] = useState<AvailableSite | null>(null);
  const [searchTerms, setSearchTerms] = useState<string[]>([]);
  const [currentTerm, setCurrentTerm] = useState('');
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

  const handleAddTerm = () => {
    const trimmedTerm = currentTerm.trim();
    if (trimmedTerm && !searchTerms.includes(trimmedTerm)) {
      setSearchTerms([...searchTerms, trimmedTerm]);
      setCurrentTerm('');
    }
  };

  const handleRemoveTerm = (index: number) => {
    setSearchTerms(searchTerms.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTerm();
    }
  };

  const handleSubmit = async () => {
    if (!selectedSite || searchTerms.length === 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit(selectedSite.id, searchTerms, scanFrequency);
      // Reset form
      setSelectedSite(null);
      setSearchTerms([]);
      setCurrentTerm('');
      setScanFrequency('hourly');
      setSearchQuery('');
      onClose();
    } catch (error) {
      console.error('Error al agregar sitio:', error);
      alert('Error al agregar el sitio. Por favor intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedSite(null);
      setSearchTerms([]);
      setCurrentTerm('');
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
                <h2 className="text-2xl font-bold">Activar Sitio del Catálogo</h2>
                <p className="text-blue-100 mt-1">
                  Selecciona sitios verificados de nuestro catálogo y configura tus términos de búsqueda
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

            {/* Paso 2: Términos de búsqueda */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                2. Términos de búsqueda {searchTerms.length > 0 && (
                  <span className="text-blue-600 dark:text-blue-400">({searchTerms.length})</span>
                )}
              </label>

              <div className="flex space-x-2 mb-3">
                <input
                  type="text"
                  value={currentTerm}
                  onChange={(e) => setCurrentTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ej: Juan Pérez, Mi Empresa SA..."
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isSubmitting}
                />
                <button
                  onClick={handleAddTerm}
                  disabled={!currentTerm.trim() || isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar</span>
                </button>
              </div>

              {/* Lista de términos agregados */}
              {searchTerms.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {searchTerms.map((term, index) => (
                    <motion.div
                      key={index}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="flex items-center space-x-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-lg"
                    >
                      <span className="text-sm font-medium">{term}</span>
                      <button
                        onClick={() => handleRemoveTerm(index)}
                        disabled={isSubmitting}
                        className="hover:bg-blue-200 dark:hover:bg-blue-800/50 rounded p-0.5 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}

              {searchTerms.length === 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                  Agrega al menos un término para monitorear
                </p>
              )}
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
            {selectedSite && searchTerms.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Resumen:</h4>
                <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                  <li>• Sitio: <strong>{selectedSite.name}</strong></li>
                  <li>• Términos: <strong>{searchTerms.join(', ')}</strong></li>
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
              disabled={!selectedSite || searchTerms.length === 0 || isSubmitting}
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
