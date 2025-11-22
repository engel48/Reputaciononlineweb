'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Save, BarChart3, Clock, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { MonitoredSite, ScanFrequency } from '@/types/news-monitoring';
import { SCAN_FREQUENCY_LABELS } from '@/types/news-monitoring';

interface ConfigurarSitioModalProps {
  isOpen: boolean;
  sitio: MonitoredSite | null;
  onClose: () => void;
  onSave: (siteId: string, searchTerms: string[], scanFrequency: ScanFrequency) => Promise<void>;
}

export default function ConfigurarSitioModal({
  isOpen,
  sitio,
  onClose,
  onSave,
}: ConfigurarSitioModalProps) {
  const [searchTerms, setSearchTerms] = useState<string[]>([]);
  const [currentTerm, setCurrentTerm] = useState('');
  const [scanFrequency, setScanFrequency] = useState<ScanFrequency>('hourly');
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'stats'>('config');

  // Mock data para estadísticas (en producción vendría de la API)
  const mockDailyStats = [
    { date: '15 Nov', menciones: 3, positivas: 2, negativas: 1 },
    { date: '16 Nov', menciones: 5, positivas: 3, negativas: 2 },
    { date: '17 Nov', menciones: 2, positivas: 1, negativas: 1 },
    { date: '18 Nov', menciones: 7, positivas: 5, negativas: 2 },
    { date: '19 Nov', menciones: 4, positivas: 3, negativas: 1 },
    { date: '20 Nov', menciones: 6, positivas: 4, negativas: 2 },
    { date: '21 Nov', menciones: 8, positivas: 6, negativas: 2 },
  ];

  useEffect(() => {
    if (sitio) {
      setSearchTerms([...sitio.searchTerms]);
      setScanFrequency(sitio.scanFrequency);
    }
  }, [sitio]);

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

  const handleSave = async () => {
    if (!sitio || searchTerms.length === 0) return;

    setIsSaving(true);
    try {
      await onSave(sitio.id, searchTerms, scanFrequency);
      onClose();
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      alert('Error al guardar la configuración. Por favor intenta nuevamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      setActiveTab('config');
      onClose();
    }
  };

  if (!isOpen || !sitio) return null;

  const hasChanges =
    JSON.stringify(searchTerms) !== JSON.stringify(sitio.searchTerms) ||
    scanFrequency !== sitio.scanFrequency;

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
              <div className="flex items-center space-x-3">
                <span className="text-4xl">{sitio.siteLogo}</span>
                <div>
                  <h2 className="text-2xl font-bold">Configurar Monitoreo</h2>
                  <p className="text-blue-100 mt-1">{sitio.siteName}</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isSaving}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex space-x-2 mt-4">
              <button
                onClick={() => setActiveTab('config')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'config'
                    ? 'bg-white text-blue-700'
                    : 'bg-blue-700/30 text-white hover:bg-blue-700/50'
                }`}
              >
                ⚙️ Configuración
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'stats'
                    ? 'bg-white text-blue-700'
                    : 'bg-blue-700/30 text-white hover:bg-blue-700/50'
                }`}
              >
                📊 Estadísticas
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[calc(90vh-240px)] overflow-y-auto">
            {activeTab === 'config' ? (
              <>
                {/* Términos de búsqueda */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Términos de búsqueda {searchTerms.length > 0 && (
                      <span className="text-blue-600 dark:text-blue-400">({searchTerms.length})</span>
                    )}
                  </label>

                  <div className="flex space-x-2 mb-3">
                    <input
                      type="text"
                      value={currentTerm}
                      onChange={(e) => setCurrentTerm(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Agregar nuevo término..."
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isSaving}
                    />
                    <button
                      onClick={handleAddTerm}
                      disabled={!currentTerm.trim() || isSaving}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Agregar</span>
                    </button>
                  </div>

                  {/* Lista de términos */}
                  {searchTerms.length > 0 ? (
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
                            disabled={isSaving}
                            className="hover:bg-blue-200 dark:hover:bg-blue-800/50 rounded p-0.5 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                      Debe haber al menos un término de búsqueda
                    </p>
                  )}
                </div>

                {/* Frecuencia de escaneo */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Frecuencia de escaneo
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    {(Object.keys(SCAN_FREQUENCY_LABELS) as ScanFrequency[]).map((freq) => (
                      <button
                        key={freq}
                        onClick={() => setScanFrequency(freq)}
                        disabled={isSaving}
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

                {/* Información del sitio */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Información del Monitoreo
                  </h4>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex justify-between">
                      <span>Última revisión:</span>
                      <span className="font-medium">
                        {sitio.lastChecked
                          ? sitio.lastChecked.toLocaleString('es-CO')
                          : 'Nunca'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total menciones:</span>
                      <span className="font-medium">{sitio.totalMentions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Activo desde:</span>
                      <span className="font-medium">
                        {sitio.activatedAt.toLocaleDateString('es-CO')}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Estadísticas */}
                <div className="space-y-6">
                  {/* Métricas generales */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {sitio.totalMentions}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Total Menciones
                      </div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {Math.round((sitio.totalMentions || 0) * 0.65)}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Positivas (65%)
                      </div>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {Math.round((sitio.totalMentions || 0) * 0.35)}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Negativas (35%)
                      </div>
                    </div>
                  </div>

                  {/* Gráfico de menciones por día */}
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Menciones por Día (Últimos 7 días)
                    </h4>
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={mockDailyStats}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
                          <YAxis stroke="#9CA3AF" fontSize={12} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1F2937',
                              border: 'none',
                              borderRadius: '8px',
                              color: '#fff',
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="menciones"
                            stroke="#3B82F6"
                            strokeWidth={2}
                            dot={{ fill: '#3B82F6' }}
                          />
                          <Line
                            type="monotone"
                            dataKey="positivas"
                            stroke="#10B981"
                            strokeWidth={2}
                            dot={{ fill: '#10B981' }}
                          />
                          <Line
                            type="monotone"
                            dataKey="negativas"
                            stroke="#EF4444"
                            strokeWidth={2}
                            dot={{ fill: '#EF4444' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Historial de escaneos */}
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Historial de Escaneos
                    </h4>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="p-3 text-sm text-gray-600 dark:text-gray-300 space-y-2">
                        <div className="flex justify-between">
                          <span>Total escaneos realizados:</span>
                          <span className="font-medium">47</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Promedio menciones/escaneo:</span>
                          <span className="font-medium">
                            {sitio.totalMentions > 0 ? (sitio.totalMentions / 47).toFixed(1) : '0'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Mejor día:</span>
                          <span className="font-medium">21 Nov (8 menciones)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
            <div>
              {hasChanges && activeTab === 'config' && (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  ⚠️ Tienes cambios sin guardar
                </p>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleClose}
                disabled={isSaving}
                className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                {activeTab === 'stats' ? 'Cerrar' : 'Cancelar'}
              </button>
              {activeTab === 'config' && (
                <button
                  onClick={handleSave}
                  disabled={searchTerms.length === 0 || isSaving || !hasChanges}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSaving ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <Save className="w-5 h-5" />
                      </motion.div>
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>Guardar Cambios</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
