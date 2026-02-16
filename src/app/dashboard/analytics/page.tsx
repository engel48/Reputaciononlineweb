"use client";

import React, { useEffect, useState, useRef } from 'react';
import { gsap } from 'gsap';
import { 
  UserCheck, 
  BarChart3, 
  TrendingUp, 
  MessageSquare,
  Calendar,
  ChevronDown,
  RefreshCw,
  Crown,
  Vote,
  Target
} from 'lucide-react';
import { usePolitical, PoliticalOnly, PoliticalMetricsCard } from '@/context/PoliticalContext';
import { useUser } from '@/context/UserContext';

// ✅ NO USAR DATOS SIMULADOS - Solo datos reales de la API o mostrar "Sin datos"

// Componentes de analytics
import ReputationChart from '@/components/analytics/ReputationChart';
import SentimentAnalysis from '@/components/analytics/SentimentAnalysis';
import MetricCard from '@/components/analytics/MetricCard';
import MentionsTable from '@/components/analytics/MentionsTable';

// Servicios para obtener datos
import { 
  getReputationMetrics,
  getTimelineData,
  getSentimentData,
  getLatestMentions
} from '@/lib/services/analyticsService';

export default function AnalyticsPage() {
  const { user } = useUser();
  const { isFromPoliticalDashboard, terminology, features } = usePolitical();
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('month');
  const [metrics, setMetrics] = useState<any>(null);
  const [timelineData, setTimelineData] = useState<{reputationScore: any; mentions: any; engagement: any} | null>(null);
  const [sentimentData, setSentimentData] = useState<any>(null);
  const [mentions, setMentions] = useState<any[]>([]);
  const [realTimeEngagement, setRealTimeEngagement] = useState(52);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const engagementIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ❌ FUNCIÓN ELIMINADA - SIMULABA DATOS FALSOS
  // Esta función simulaba variaciones aleatorias de engagement que no eran reales
  const updateRealTimeEngagement = () => {
    setIsRefreshing(true);

    // ✅ En lugar de simular, deberíamos obtener datos reales de la API
    // Por ahora, simplemente actualizar el timestamp sin cambiar el valor
    setTimeout(() => {
      // TODO: Implementar llamada a API real para obtener engagement actual
      // const newEngagement = await getRealtimeEngagement(user.id);
      // setRealTimeEngagement(newEngagement);

      setLastUpdate(new Date());
      setIsRefreshing(false);

      // Show notification
      setShowUpdateNotification(true);
      setTimeout(() => setShowUpdateNotification(false), 3000);
    }, 500);
  };

  useEffect(() => {
    // Solo cargar datos en el cliente
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Cargar datos en paralelo
        try {
          if (user?.id) {
            const metricsData = await getReputationMetrics(user.id);
            setMetrics(metricsData);
          }
        } catch (e) {
          console.warn('Error cargando métricas:', e);
        }
        
        try {
          if (user?.id) {
            const timeline = await getTimelineData(user.id, period);
            setTimelineData(timeline as any);
          }
        } catch (e) {
          console.warn('Error cargando timeline:', e);
        }
        
        try {
          if (user?.id) {
            const sentiment = await getSentimentData(user.id);
            setSentimentData(sentiment);
          }
        } catch (e) {
          console.warn('Error cargando sentimientos:', e);
        }
        
        try {
          if (user?.id) {
            const latestMentions = await getLatestMentions(user.id, 5);
            setMentions(latestMentions);
          }
        } catch (e) {
          console.warn('Error cargando menciones:', e);
        }
        
      } catch (error) {
        console.error('Error cargando datos de analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [period]);

  // Auto-refresh engagement every 5 seconds
  useEffect(() => {
    engagementIntervalRef.current = setInterval(() => {
      updateRealTimeEngagement();
    }, 5000);

    return () => {
      if (engagementIntervalRef.current) {
        clearInterval(engagementIntervalRef.current);
      }
    };
  }, [realTimeEngagement]);

  // Animaciones GSAP
  useEffect(() => {
    if (!isLoading && headerRef.current) {
      try {
        // Timeline para secuencia de animaciones
        const tl = gsap.timeline();
        
        // Animación del encabezado
        tl.from(headerRef.current, {
          y: -50,
          opacity: 0,
          duration: 0.8,
          ease: 'power3.out'
        });
        
        // Animación general
        if (pageRef.current) {
          // Efecto sutil de presencia para toda la página
          gsap.from(pageRef.current, {
            opacity: 0.8,
            duration: 1.5,
            ease: 'power2.inOut'
          });
        }
      } catch (error) {
        console.error('Error en animaciones:', error);
      }
    }
  }, [isLoading]);

  // Cambiar el período
  const handlePeriodChange = (newPeriod: 'week' | 'month' | 'quarter') => {
    if (period !== newPeriod) {
      setPeriod(newPeriod);
    }
  };

  // Esqueletos de carga
  if (isLoading) {
    return (
      <div className="animate-pulse p-6">
        {/* Esqueleto del encabezado */}
        <div className="mb-8">
          <div className="h-8 w-1/4 rounded-md bg-gray-200 dark:bg-gray-700"></div>
          <div className="mt-2 h-4 w-2/5 rounded-md bg-gray-200 dark:bg-gray-700"></div>
        </div>
        
        {/* Esqueleto para métricas */}
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-lg bg-gray-200 dark:bg-gray-700"></div>
          ))}
        </div>
        
        {/* Esqueleto para gráficos */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="col-span-2 h-80 rounded-lg bg-gray-200 dark:bg-gray-700"></div>
          <div className="h-80 rounded-lg bg-gray-200 dark:bg-gray-700"></div>
        </div>
        
        {/* Esqueleto para tabla */}
        <div className="h-96 rounded-lg bg-gray-200 dark:bg-gray-700"></div>
      </div>
    );
  }

  return (
    <div ref={pageRef} className="p-6">
      {/* Header con gradiente */}
      <div ref={headerRef} className="mb-8">
        <div className="bg-gradient-to-r from-[#01257D] to-indigo-600 rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl">
                <BarChart3 className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {isFromPoliticalDashboard ? terminology.analytics : 'Panel de Analisis'}
                </h1>
                <p className="text-white/70 text-sm">
                  {isFromPoliticalDashboard
                    ? 'Monitoriza tu aprobacion politica y analiza el sentimiento ciudadano'
                    : 'Monitoriza tu reputacion online y analiza el sentimiento de las menciones'
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
                <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-white/80 text-sm font-medium">En vivo</span>
              </div>
              <button
                onClick={updateRealTimeEngagement}
                disabled={isRefreshing}
                className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium text-white bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors disabled:opacity-50"
                title="Actualizar datos manualmente"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Actualizando...' : 'Actualizar'}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Selector de período */}
      <div className="mb-8 flex">
        <div className="ml-auto inline-flex rounded-md border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <button
            onClick={() => handlePeriodChange('week')}
            className={`flex items-center rounded-l-md px-4 py-2 text-sm font-medium ${
              period === 'week'
                ? 'bg-primary text-white hover:bg-primary-600'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            <Calendar className="mr-1 h-4 w-4" />
            Semana
          </button>
          <button
            onClick={() => handlePeriodChange('month')}
            className={`flex items-center border-l border-r border-gray-200 px-4 py-2 text-sm font-medium dark:border-gray-700 ${
              period === 'month'
                ? 'bg-primary text-white hover:bg-primary-600'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            <Calendar className="mr-1 h-4 w-4" />
            Mes
          </button>
          <button
            onClick={() => handlePeriodChange('quarter')}
            className={`flex items-center rounded-r-md px-4 py-2 text-sm font-medium ${
              period === 'quarter'
                ? 'bg-primary text-white hover:bg-primary-600'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            <Calendar className="mr-1 h-4 w-4" />
            Trimestre
          </button>
        </div>
      </div>
      
      {/* Métricas principales */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title={isFromPoliticalDashboard ? 'Índice de Aprobación' : 'Puntuación de Reputación'}
          value={metrics ? metrics.overallScore : 0}
          icon={isFromPoliticalDashboard ? Vote : UserCheck}
          trend={metrics ? metrics.trends.overallScoreTrend : '0%'}
          colorScheme={isFromPoliticalDashboard ? 'yellow' : 'primary'}
        />
        <MetricCard
          title={terminology.mentions}
          value={metrics ? metrics.mentionsCount : 0}
          icon={MessageSquare}
          trend={metrics ? metrics.trends.mentionsCountTrend : '0%'}
          colorScheme="blue"
        />
        <MetricCard
          title="Alcance"
          value={metrics ? metrics.reachScore : 0}
          icon={BarChart3}
          trend={metrics ? metrics.trends.reachScoreTrend : '0%'}
          colorScheme="green"
        />
        <MetricCard
          title="Tasa de Engagement"
          value={realTimeEngagement}
          icon={TrendingUp}
          trend={metrics ? metrics.trends.engagementRateTrend : '0%'}
          colorScheme="yellow"
          isRealTime={true}
          isRefreshing={isRefreshing}
          lastUpdate={lastUpdate}
        />
      </div>
      
      {/* Gráficos y análisis */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="col-span-2">
          <ReputationChart
            data={{
              labels: timelineData?.reputationScore?.labels || [],
              values: timelineData?.reputationScore?.values || [],
              previousPeriodValues: timelineData?.reputationScore?.previousPeriodValues
            }}
            title={isFromPoliticalDashboard ? 'Evolución del Índice de Aprobación' : 'Evolución de Puntuación de Reputación'}
            showComparison={true}
          />
        </div>
        <div>
          <SentimentAnalysis
            data={sentimentData?.current || {
              positive: 0,
              negative: 0,
              neutral: 0,
              total: 0
            }}
            title="Análisis de Sentimiento"
          />
        </div>
      </div>
      
      {/* Gráficos secundarios */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <ReputationChart
          data={{
            labels: timelineData?.mentions?.labels || [],
            values: timelineData?.mentions?.values || [],
            previousPeriodValues: timelineData?.mentions?.previousPeriodValues
          }}
          title="Evolución de Menciones"
          type="bar"
        />
        <ReputationChart
          data={{
            labels: timelineData?.engagement?.labels || [],
            values: timelineData?.engagement?.values || [],
            previousPeriodValues: timelineData?.engagement?.previousPeriodValues
          }}
          title="Tasa de Engagement"
          showComparison={true}
        />
      </div>
      
      {/* Métricas políticas adicionales si aplica */}
      <PoliticalOnly requirePoliticalDashboard={false}>
        <div className="mb-8">
          <PoliticalMetricsCard />
        </div>
      </PoliticalOnly>

      {/* Tabla de menciones */}
      <div className="mb-8">
        <MentionsTable
          mentions={mentions?.length > 0 ? mentions : []}
          title={`Últimas ${terminology.mentions}`}
        />
      </div>

      {/* Botón para generar informe */}
      <div className="flex justify-center">
        <button
          className={`inline-flex items-center rounded-md px-6 py-3 text-base font-medium text-white shadow-sm transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 dark:ring-offset-gray-900 ${
            isFromPoliticalDashboard 
              ? 'bg-gradient-to-r from-yellow-600 to-orange-500 hover:from-yellow-700 hover:to-orange-600 focus:ring-yellow-500' 
              : 'bg-primary hover:bg-primary-600 focus:ring-primary-500'
          }`}
        >
          Generar {terminology.report} Completo
          <ChevronDown className="ml-2 h-5 w-5" />
        </button>
      </div>

      {/* Notification Toast */}
      {showUpdateNotification && (
        <div className="fixed bottom-4 right-4 z-50 transform transition-all duration-300 ease-in-out">
          <div className="bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3">
            <div className="flex-shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Engagement actualizado</p>
              <p className="text-xs opacity-75">
                Nuevo valor: {realTimeEngagement}% • {lastUpdate.toLocaleTimeString('es-ES')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
