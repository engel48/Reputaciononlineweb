'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  RefreshCw,
  Download,
  Filter,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Newspaper,
} from 'lucide-react';
import MencionCard from './MencionCard';
import SitioMonitorCard from './SitioMonitorCard';
import AgregarSitioModal from './AgregarSitioModal';
import ConfigurarSitioModal from './ConfigurarSitioModal';
import type {
  MonitoredSite,
  Mention,
  ScanFrequency,
  SentimentFilter,
  DateFilter,
} from '@/types/news-monitoring';
import { MAX_MONITORED_SITES } from '@/types/news-monitoring';
import { useUser } from '@/context/UserContext';

export default function MonitoreoNoticiasSection() {
  const { user } = useUser();

  // Estados
  const [sitiosMonitoreados, setSitiosMonitoreados] = useState<MonitoredSite[]>([]);
  const [mencionesRecientes, setMencionesRecientes] = useState<Mention[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [scanningS iteId, setScanningSiteId] = useState<string | null>(null);

  // Modales
  const [showAgregarModal, setShowAgregarModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedSitio, setSelectedSitio] = useState<MonitoredSite | null>(null);

  // Filtros
  const [sentimentFilter, setSentimentFilter] = useState<SentimentFilter>('all');
  const [siteFilter, setSiteFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');

  // Cargar datos iniciales
  useEffect(() => {
    loadMonitoredSites();
    loadMentions();
  }, []);

  const loadMonitoredSites = async () => {
    try {
      setLoading(true);

      // Obtener token de autenticación
      const token = localStorage.getItem('token') || '';

      const response = await fetch('/api/news-monitoring/user-sites', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success && data.data?.sites) {
        setSitiosMonitoreados(
          data.data.sites.map((site: any) => ({
            id: site.id,
            userId: user?.id || '',
            siteId: site.siteId,
            siteName: site.siteName,
            siteLogo: '📰', // Logo por defecto
            siteUrl: site.siteUrl || '',
            searchTerms: site.searchTerms || [],
            scanFrequency: (site.checkFrequencyMinutes === 15 ? 'every15min' :
                           site.checkFrequencyMinutes === 60 ? 'hourly' :
                           site.checkFrequencyMinutes === 360 ? 'every6hours' : 'daily') as ScanFrequency,
            isActive: site.isActive,
            totalMentions: 0, // TODO: Obtener de stats
            newMentions: 0,
            lastChecked: site.lastCheckedAt ? new Date(site.lastCheckedAt) : null,
            activatedAt: new Date(site.createdAt),
            createdAt: new Date(site.createdAt),
            updatedAt: new Date(site.createdAt),
          }))
        );
      }
    } catch (error) {
      console.error('Error cargando sitios monitoreados:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMentions = async () => {
    try {
      const token = localStorage.getItem('token') || '';

      const response = await fetch('/api/news-monitoring/mentions?limit=20', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success && data.data?.mentions) {
        setMencionesRecientes(
          data.data.mentions.map((mention: any) => ({
            id: mention.id,
            monitoredSiteId: mention.monitoredSiteId,
            siteId: mention.siteId,
            siteName: mention.siteName || 'Sitio',
            siteLogo: '📰',
            articleTitle: mention.articleTitle,
            articleUrl: mention.articleUrl,
            articleContent: mention.articleContent || '',
            mentionContext: mention.mentionContext,
            sentiment: mention.sentiment as 'positive' | 'negative' | 'neutral',
            sentimentScore: mention.sentimentScore || 0,
            publishedDate: new Date(mention.publishedDate),
            discoveredAt: new Date(mention.discoveredAt),
            isRead: mention.isRead || false,
            matchedTerm: mention.matchedTerm || '',
            author: mention.author,
            imageUrl: mention.imageUrl,
          }))
        );
      }
    } catch (error) {
      console.error('Error cargando menciones:', error);
    }
  };

  const handleAgregarSitio = async (
    siteId: string,
    searchTerms: string[],
    scanFrequency: ScanFrequency
  ) => {
    try {
      const token = localStorage.getItem('token') || '';

      // Convertir frecuencia a minutos
      const checkFrequencyMinutes =
        scanFrequency === 'every15min' ? 15 :
        scanFrequency === 'hourly' ? 60 :
        scanFrequency === 'every6hours' ? 360 : 1440;

      const response = await fetch('/api/news-monitoring/activate-site', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          siteId,
          searchTerms,
          checkFrequencyMinutes,
        }),
      });

      const data = await response.json();

      if (data.success) {
        await loadMonitoredSites();
        setShowAgregarModal(false);
      } else {
        throw new Error(data.error?.message || 'Error al activar sitio');
      }
    } catch (error: any) {
      console.error('Error:', error);
      alert(error.message || 'Error al agregar sitio');
      throw error;
    }
  };

  const handleConfigureSitio = (sitio: MonitoredSite) => {
    setSelectedSitio(sitio);
    setShowConfigModal(true);
  };

  const handleSaveConfig = async (
    siteId: string,
    searchTerms: string[],
    scanFrequency: ScanFrequency
  ) => {
    try {
      const token = localStorage.getItem('token') || '';

      const checkFrequencyMinutes =
        scanFrequency === 'every15min' ? 15 :
        scanFrequency === 'hourly' ? 60 :
        scanFrequency === 'every6hours' ? 360 : 1440;

      const response = await fetch(`/api/news-monitoring/update-site/${siteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ searchTerms, checkFrequencyMinutes }),
      });

      const data = await response.json();

      if (data.success) {
        await loadMonitoredSites();
        setShowConfigModal(false);
        setSelectedSitio(null);
      } else {
        throw new Error(data.error?.message || 'Error al actualizar');
      }
    } catch (error: any) {
      console.error('Error:', error);
      alert(error.message || 'Error al guardar configuración');
      throw error;
    }
  };

  const handleToggleActive = async (siteId: string, isActive: boolean) => {
    try {
      const token = localStorage.getItem('token') || '';

      const response = await fetch(`/api/news-monitoring/toggle-active/${siteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive }),
      });

      const data = await response.json();

      if (data.success) {
        await loadMonitoredSites();
      }
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      alert('Error al cambiar el estado del sitio');
    }
  };

  const handleDeleteSitio = async (siteId: string) => {
    try {
      const token = localStorage.getItem('token') || '';

      const response = await fetch(`/api/news-monitoring/deactivate-site/${siteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        await loadMonitoredSites();
        await loadMentions();
      }
    } catch (error) {
      console.error('Error al eliminar sitio:', error);
      alert('Error al eliminar el sitio');
    }
  };

  const handleScanNow = async (siteId: string) => {
    try {
      setIsScanning(true);
      setScanningSiteId(siteId);

      const token = localStorage.getItem('token') || '';

      const response = await fetch('/api/news-monitoring/scan-now', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ monitoredSiteId: siteId }),
      });

      const data = await response.json();

      if (data.success) {
        await loadMonitoredSites();
        await loadMentions();
      }
    } catch (error) {
      console.error('Error al escanear:', error);
      alert('Error al realizar el escaneo');
    } finally {
      setIsScanning(false);
      setScanningSiteId(null);
    }
  };

  const handleViewMentions = (siteId: string) => {
    setSiteFilter(siteFilter === siteId ? null : siteId);
  };

  const handleMarkAsRead = async (mentionId: string) => {
    try {
      const token = localStorage.getItem('token') || '';

      const response = await fetch(`/api/news-monitoring/mark-read/${mentionId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setMencionesRecientes((prev) =>
          prev.map((m) => (m.id === mentionId ? { ...m, isRead: true } : m))
        );
      }
    } catch (error) {
      console.error('Error al marcar como leído:', error);
    }
  };

  const handleExportMentions = () => {
    // TODO: Implementar exportación a CSV/PDF
    alert('Función de exportación en desarrollo');
  };

  // Filtrar menciones
  const filteredMentions = mencionesRecientes.filter((mention) => {
    if (sentimentFilter !== 'all' && mention.sentiment !== sentimentFilter) return false;
    if (siteFilter && mention.monitoredSiteId !== siteFilter) return false;

    if (dateFilter !== 'all') {
      const now = new Date();
      const mentionDate = new Date(mention.discoveredAt);
      const diffInDays = Math.floor(
        (now.getTime() - mentionDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (dateFilter === 'today' && diffInDays > 0) return false;
      if (dateFilter === 'week' && diffInDays > 7) return false;
      if (dateFilter === 'month' && diffInDays > 30) return false;
    }

    return true;
  });

  // Calcular estadísticas
  const stats = {
    totalMentions: mencionesRecientes.length,
    positive: mencionesRecientes.filter((m) => m.sentiment === 'positive').length,
    negative: mencionesRecientes.filter((m) => m.sentiment === 'negative').length,
    neutral: mencionesRecientes.filter((m) => m.sentiment === 'neutral').length,
    unread: mencionesRecientes.filter((m) => !m.isRead).length,
  };

  const canAddMoreSites = sitiosMonitoreados.length < MAX_MONITORED_SITES;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-lg"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
              <Newspaper className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Monitoreo de Noticias - Colombia</h2>
              <p className="text-blue-100 mt-1">
                Monitorea 50 sitios de noticias colombianos en tiempo real
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAgregarModal(true)}
            disabled={!canAddMoreSites}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
              canAddMoreSites
                ? 'bg-white text-blue-700 hover:bg-blue-50 shadow-lg hover:shadow-xl'
                : 'bg-gray-400 text-gray-700 cursor-not-allowed opacity-50'
            }`}
          >
            <Plus className="w-5 h-5" />
            <span>Agregar Sitio</span>
          </button>
        </div>

        {/* Contador de sitios */}
        <div className="mt-4 flex items-center space-x-2 text-sm">
          <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
            {sitiosMonitoreados.length}/{MAX_MONITORED_SITES} Sitios Monitoreados
          </span>
          {!canAddMoreSites && (
            <span className="flex items-center space-x-1 text-amber-200">
              <AlertCircle className="w-4 h-4" />
              <span>Límite alcanzado</span>
            </span>
          )}
        </div>
      </motion.div>

      {/* Estadísticas */}
      {stats.totalMentions > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-4"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalMentions}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 shadow-md border border-green-200 dark:border-green-800">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.positive}
            </div>
            <div className="text-xs text-green-700 dark:text-green-300 mt-1">Positivas</div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 shadow-md border border-red-200 dark:border-red-800">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {stats.negative}
            </div>
            <div className="text-xs text-red-700 dark:text-red-300 mt-1">Negativas</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/20 rounded-lg p-4 shadow-md border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
              {stats.neutral}
            </div>
            <div className="text-xs text-gray-700 dark:text-gray-300 mt-1">Neutrales</div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 shadow-md border border-blue-200 dark:border-blue-800">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.unread}
            </div>
            <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">Sin leer</div>
          </div>
        </motion.div>
      )}

      {/* Sitios Monitoreados */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
            📰 Mis Sitios Monitoreados
            {sitiosMonitoreados.length > 0 && (
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                ({sitiosMonitoreados.length})
              </span>
            )}
          </h3>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-5 animate-pulse"
              >
                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : sitiosMonitoreados.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
            <Newspaper className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No tienes sitios monitoreados
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Comienza agregando sitios de noticias para monitorear menciones en tiempo real
            </p>
            <button
              onClick={() => setShowAgregarModal(true)}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Agregar Primer Sitio</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {sitiosMonitoreados.map((sitio) => (
                <SitioMonitorCard
                  key={sitio.id}
                  sitio={sitio}
                  onViewMentions={handleViewMentions}
                  onConfigure={handleConfigureSitio}
                  onToggleActive={handleToggleActive}
                  onDelete={handleDeleteSitio}
                  onScanNow={handleScanNow}
                  isScanning={isScanning && scanningSiteId === sitio.id}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Menciones Recientes */}
      {mencionesRecientes.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
              🔔 Menciones Recientes
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                ({filteredMentions.length})
              </span>
            </h3>

            <div className="flex items-center space-x-3">
              {/* Filtros */}
              <select
                value={sentimentFilter}
                onChange={(e) => setSentimentFilter(e.target.value as SentimentFilter)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos</option>
                <option value="positive">Positivo</option>
                <option value="negative">Negativo</option>
                <option value="neutral">Neutral</option>
              </select>

              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todas las fechas</option>
                <option value="today">Hoy</option>
                <option value="week">Última semana</option>
                <option value="month">Último mes</option>
              </select>

              <button
                onClick={handleExportMentions}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Exportar</span>
              </button>
            </div>
          </div>

          {filteredMentions.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                No hay menciones con los filtros seleccionados
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {filteredMentions.map((mencion) => (
                  <MencionCard
                    key={mencion.id}
                    mencion={mencion}
                    onMarkAsRead={handleMarkAsRead}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* Modales */}
      <AgregarSitioModal
        isOpen={showAgregarModal}
        onClose={() => setShowAgregarModal(false)}
        onSubmit={handleAgregarSitio}
        currentMonitoredSiteIds={sitiosMonitoreados.map((s) => s.siteId)}
      />

      <ConfigurarSitioModal
        isOpen={showConfigModal}
        sitio={selectedSitio}
        onClose={() => {
          setShowConfigModal(false);
          setSelectedSitio(null);
        }}
        onSave={handleSaveConfig}
      />
    </div>
  );
}
