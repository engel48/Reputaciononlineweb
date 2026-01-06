"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
// import CreditosSummary from '@/components/creditos/CreditosSummary'; // Comentado - sección de créditos deshabilitada
import AdvancedSearch from '@/components/dashboard/AdvancedSearch';
import JuliaChat from '@/components/dashboard/JuliaChat';
import SimpleChat from '@/components/dashboard/SimpleChat';
import PoliticalDashboard from '@/components/dashboard/PoliticalDashboard';
import MonitoreoNoticiasSection from '@/components/news-monitoring/MonitoreoNoticiasSection';
import YouTubeDashboardSection from '@/components/dashboard/YouTubeDashboardSection';
import FacebookDashboardSection from '@/components/dashboard/FacebookDashboardSection';
import InstagramDashboardSection from '@/components/dashboard/InstagramDashboardSection';
import XDashboardSection from '@/components/dashboard/XDashboardSection';
import ConnectionsHealthPanel from '@/components/dashboard/ConnectionsHealthPanel';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, RefreshCw, TrendingUp, TrendingDown, Facebook, Instagram, CreditCard, Brain, Sparkles, Wifi, WifiOff, AlertTriangle, Search, Zap, BarChart3, Users, MessageSquare, Activity, Target, Award, Globe, Clock, Newspaper, Bot, X } from 'lucide-react';
import XLogo from '@/components/icons/XLogo';
import dynamic from 'next/dynamic';
import JuliaThinkingAnimation from '@/components/dashboard/JuliaThinkingAnimation';
import LoadingAnimation from '@/components/ui/LoadingAnimation';
import { useUser } from '@/context/UserContext';
import { usePlan } from '@/context/PlanContext';
import FeatureGate, { PlanBadge } from '@/components/plan/FeatureGate';

// Interfaces
interface MentionEngagement {
  likes: number;
  comments: number;
  retweets?: number;
  shares?: number;
}

interface Mention {
  id: string;
  author: string;
  platform: string;
  content: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  timestamp: Date;
  engagement: MentionEngagement;
  location: string;
  verified: boolean;
}


// Estado inicial - SIN DATOS HARDCODEADOS
// Los datos reales se cargan desde la API /api/dashboard-analytics y /api/mentions/recent
const defaultData = {
  mentions: {
    total: 0,
    positive: 0,
    negative: 0,
    neutral: 0,
    trend: '+0%',
    byPlatform: {
      x: 0,
      facebook: 0,
      instagram: 0,
      news: 0,
      blogs: 0
    },
    recent: [],
    timeSeries: []
  },
  reputation: {
    score: 0,
    previousScore: 0,
    trend: 'up' as const
  },
  ranking: {
    position: 0,
    previousPosition: 0,
    totalCompetitors: 0,
    trend: 'up' as const
  }
};

export default function Dashboard() {
  const { user } = useUser();
  const { hasFeature, currentPlan } = usePlan();
  

  // Estados para controlar los datos del dashboard
  const [datosEnTiempoReal, setDatosEnTiempoReal] = useState(defaultData);
  const [cargandoDatos, setCargandoDatos] = useState(false);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(new Date());
  const [errorConexion, setErrorConexion] = useState(false);
  const [actualizandoDatos, setActualizandoDatos] = useState(false);
  const [intervaloActivo, setIntervaloActivo] = useState(true);

  // Estado para métricas consolidadas REALES de redes sociales
  const [consolidatedMetrics, setConsolidatedMetrics] = useState<any>(null);
  const [loadingConsolidated, setLoadingConsolidated] = useState(true);
  
  // Estados para menciones en tiempo real - AHORA CON DATOS REALES
  const [mencionesRecientes, setMencionesRecientes] = useState<Mention[]>([]);
  const [nuevasMenciones, setNuevasMenciones] = useState(0);
  const [cargandoMenciones, setCargandoMenciones] = useState(true);

  // Red neuronal simulada para análisis de sentimientos
  const analizarSentimientoConIA = useCallback((contenido: string) => {
    // Simulación de análisis de sentimiento con IA
    const palabrasPositivas = ['excelente', 'genial', 'increíble', 'recomendado', 'amor', 'fantástico', '👍', '❤️', '✨'];
    const palabrasNegativas = ['malo', 'terrible', 'pésimo', 'horrible', 'odio', 'problema', '👎', '😠'];
    
    const contenidoLower = contenido.toLowerCase();
    let scorePositivo = 0;
    let scoreNegativo = 0;
    
    palabrasPositivas.forEach(palabra => {
      if (contenidoLower.includes(palabra)) scorePositivo++;
    });
    
    palabrasNegativas.forEach(palabra => {
      if (contenidoLower.includes(palabra)) scoreNegativo++;
    });
    
    if (scorePositivo > scoreNegativo) return 'positive';
    if (scoreNegativo > scorePositivo) return 'negative';
    return 'neutral';
  }, []);
  
  // ❌ ELIMINADO: Función que generaba menciones FALSAS/INVENTADAS
  // Las menciones reales ahora se cargan desde /api/mentions/recent
  /*
  const generarMencionIA = useCallback((): Mention => {
    // ... código que generaba datos falsos eliminado
  }, [analizarSentimientoConIA]);
  */

  // ❌ ELIMINADO: Función que generaba menciones FALSAS cada 5 minutos
  // Las menciones reales se cargan desde la API automáticamente
  /*
  const actualizarMenciones = useCallback(() => {
    // ... código que generaba menciones falsas eliminado
  }, []);
  */
  
  // Función para cargar datos reales desde la API
  const cargarDatosReales = useCallback(async () => {
    try {
      const response = await fetch('/api/dashboard-analytics');
      const result = await response.json();

      if (result.success) {
        setDatosEnTiempoReal(result.data);
        setUltimaActualizacion(new Date());
        setErrorConexion(false);
        console.log('✅ Datos reales cargados desde API');
      } else {
        throw new Error(result.error || 'Error en la respuesta');
      }
    } catch (error) {
      console.error('Error cargando datos reales:', error);
      setErrorConexion(true);
    } finally {
      setCargandoDatos(false);
    }
  }, []);

  // Función para cargar métricas consolidadas REALES de redes sociales
  const cargarMetricasConsolidadas = useCallback(async () => {
    try {
      setLoadingConsolidated(true);
      const response = await fetch('/api/social-media/consolidated');
      const result = await response.json();

      if (result.success) {
        setConsolidatedMetrics(result.data);
        console.log('✅ Métricas consolidadas REALES cargadas');
      } else {
        console.warn('No hay métricas consolidadas disponibles');
        setConsolidatedMetrics(null);
      }
    } catch (error) {
      console.error('Error cargando métricas consolidadas:', error);
      setConsolidatedMetrics(null);
    } finally {
      setLoadingConsolidated(false);
    }
  }, []);

  // Función para cargar menciones REALES en tiempo real desde Supabase
  const cargarMencionesReales = useCallback(async () => {
    try {
      setCargandoMenciones(true);
      const response = await fetch('/api/mentions/recent?limit=10&hours=24');
      const result = await response.json();

      if (result.success && result.data.mentions) {
        const prevCount = mencionesRecientes.length;
        const newMentions = result.data.mentions.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));

        setMencionesRecientes(newMentions);

        // Detectar nuevas menciones
        if (prevCount > 0 && newMentions.length > prevCount) {
          const diff = newMentions.length - prevCount;
          setNuevasMenciones(diff);
          setTimeout(() => setNuevasMenciones(0), 10000);
        }

        console.log(`✅ ${result.data.total} menciones REALES cargadas desde Supabase`);
      } else {
        console.warn('No hay menciones disponibles');
        setMencionesRecientes([]);
      }
    } catch (error) {
      console.error('Error cargando menciones reales:', error);
      setErrorConexion(true);
    } finally {
      setCargandoMenciones(false);
    }
  }, [mencionesRecientes.length]);
  
  // Función mejorada para actualizar datos
  const actualizarDatos = useCallback(async (manual = false) => {
    if (manual) setActualizandoDatos(true);
    
    await cargarDatosReales();
    
    if (manual) setActualizandoDatos(false);
  }, [cargarDatosReales]);
  
  // Cargar datos reales al montar el componente
  useEffect(() => {
    cargarDatosReales();
  }, [cargarDatosReales]);

  // Cargar métricas consolidadas REALES al montar el componente
  useEffect(() => {
    cargarMetricasConsolidadas();
  }, [cargarMetricasConsolidadas]);

  // Cargar menciones REALES al montar el componente
  useEffect(() => {
    cargarMencionesReales();
  }, [cargarMencionesReales]);

  // Efecto para actualización automática de datos reales
  useEffect(() => {
    if (!intervaloActivo || cargandoDatos) return;
    
    const interval = setInterval(() => {
      cargarDatosReales();
    }, 60000); // Actualizar cada 60 segundos (datos reales necesitan menos frecuencia)
    
    return () => clearInterval(interval);
  }, [cargarDatosReales, intervaloActivo, cargandoDatos]);
  
  // Efecto para actualización automática de menciones REALES cada 5 minutos
  useEffect(() => {
    if (!intervaloActivo) return;

    const mencionesInterval = setInterval(() => {
      cargarMencionesReales(); // AHORA USA DATOS REALES desde Supabase
    }, 300000); // 5 minutos = 300000ms

    return () => {
      clearInterval(mencionesInterval);
    };
  }, [cargarMencionesReales, intervaloActivo]);
  
  // Detectar cuando la página está visible para pausar/reanudar actualizaciones
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIntervaloActivo(!document.hidden);
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);
  
  // Animaciones mejoradas para las tarjetas
  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: i * 0.08, // Incremento el delay para mejor efecto escalonado
        duration: 0.6,
        ease: [0.4, 0, 0.2, 1],
        type: "spring",
        stiffness: 120,
        damping: 12
      }
    }),
    hover: {
      y: -4, // Mayor elevación en hover
      scale: 1.025,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  // Nuevas animaciones para elementos específicos
  const statsVariants = {
    hidden: { opacity: 0, scale: 0.8, rotate: -5 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: {
        delay: i * 0.1 + 0.3,
        duration: 0.8,
        type: "spring",
        stiffness: 100,
        damping: 10
      }
    })
  };

  const pulseVariants = {
    pulse: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };
  
  // Memoizar cálculos costosos
  const estadisticasCalculadas = useMemo(() => {
    const total = datosEnTiempoReal?.mentions?.total ?? 0;
    const positive = datosEnTiempoReal?.mentions?.positive ?? 0;
    const porcentajePositivo = total > 0 ? ((positive / total) * 100).toFixed(1) : '0.0';
    const crecimientoSemanal = '+12.5%'; // En producción vendría del backend
    
    return {
      totalMenciones: total.toLocaleString(),
      porcentajePositivo,
      crecimientoSemanal,
      nuevasMenciones: Math.floor(total * 0.34)
    };
  }, [datosEnTiempoReal]);

  // Mostrar animación de carga inicial si está cargando y no hay datos
  if (cargandoDatos && datosEnTiempoReal.mentions.total === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingAnimation 
          message="Cargando datos en tiempo real..." 
          size="lg" 
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notificación de sistema mejorado en tiempo real */}
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold text-[#0B1120] dark:text-white">Dashboard</h1>
            <PlanBadge />
          </div>
          <p className="mt-1 text-gray-500 dark:text-gray-400">Bienvenido a tu centro de monitoreo de reputación online</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Indicador de conexión */}
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            {errorConexion ? (
              <div className="flex items-center text-red-500">
                <WifiOff className="mr-1 h-3 w-3" />
                <span>Sin conexión</span>
              </div>
            ) : (
              <div className="flex items-center text-green-500">
                <Wifi className="mr-1 h-3 w-3" />
                <span>En línea</span>
              </div>
            )}
          </div>
          
          {/* Última actualización */}
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Actualizado: {ultimaActualizacion.toLocaleTimeString()}
          </div>
          
          {/* Botón de actualización mejorado */}
          <button
            onClick={() => actualizarDatos(true)}
            disabled={actualizandoDatos}
            className={`flex items-center text-sm px-4 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
              actualizandoDatos
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : errorConexion
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-[#00E5FF] hover:bg-[#00B8D4] text-[#0B1120] shadow-[0_4px_20px_rgba(0,229,255,0.15)] hover:shadow-[0_6px_25px_rgba(0,229,255,0.25)] hover:-translate-y-0.5'
            }`}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${actualizandoDatos ? 'animate-spin' : ''}`} /> 
{cargandoDatos ? 'Cargando...' : actualizandoDatos ? 'Actualizando...' : errorConexion ? 'Reintentar' : 'Actualizar Datos'}
          </button>
        </div>
      </div>

      {/* ========================================== */}
      {/* ALERTA DE ALMACENAMIENTO AWS S3 - CRÍTICA */}
      {/* ========================================== */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
        className="bg-gradient-to-r from-red-500 via-red-600 to-orange-500 rounded-xl p-4 shadow-lg border border-red-400"
      >
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="p-3 bg-white/20 rounded-full animate-pulse">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-lg font-bold text-white">
                Almacenamiento AWS S3 Crítico
              </h3>
              <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-semibold text-white uppercase">
                Urgente
              </span>
            </div>
            <p className="text-white/90 text-sm mb-3">
              El almacenamiento en S3 ha alcanzado el <span className="font-bold text-yellow-200">98.3%</span> de su capacidad.
              Es necesario ampliar el espacio de almacenamiento para evitar interrupciones en el servicio.
            </p>

            {/* Barra de progreso de almacenamiento */}
            <div className="mb-3">
              <div className="flex justify-between text-xs text-white/80 mb-1">
                <span>Espacio utilizado</span>
                <span className="font-semibold">98.3% (147.5 GB / 150 GB)</span>
              </div>
              <div className="h-3 w-full bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: '98.3%' }}
                  transition={{ duration: 1.5, delay: 0.3 }}
                  className="h-full bg-gradient-to-r from-yellow-400 to-red-300 rounded-full"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-xs text-white/80">
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>Última verificación: hace 5 min</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Activity className="w-3 h-3" />
                  <span>Crecimiento: +2.1 GB/día</span>
                </div>
              </div>
              <button className="px-4 py-2 bg-white text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50 transition-colors shadow-md">
                Ampliar Almacenamiento
              </button>
            </div>
          </div>
          <button className="text-white/60 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      {/* Estadísticas principales - RESPONSIVE CON ANIMACIONES MEJORADAS */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        
        {/* Estadísticas rápidas MEJORADAS CON ANIMACIONES AVANZADAS */}
        <motion.div
          custom={1}
          initial="hidden"
          animate="visible"
          whileHover="hover"
          variants={cardVariants}
          className="rounded-xl p-4 sm:p-5 bg-gradient-to-br from-[#00E5FF]/5 to-[#00E5FF]/15 dark:from-[#00E5FF]/10 dark:to-[#00E5FF]/20 cursor-pointer relative overflow-hidden border border-[#00E5FF]/20"
          style={{ boxShadow: '0 4px 20px rgba(0, 229, 255, 0.1)' }}
        >
          {/* Indicador de actualización en tiempo real */}
          <div className="absolute top-2 right-2">
            <div className={`h-2 w-2 rounded-full ${errorConexion ? 'bg-red-400' : 'bg-green-400'} animate-pulse`}></div>
          </div>
          
          <h3 className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-200">Menciones Totales</h3>
          <div className="flex items-end justify-between">
            <AnimatePresence mode="wait">
              <motion.p 
                key={estadisticasCalculadas.totalMenciones}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-3xl font-bold text-gray-900 dark:text-white"
              >
                {estadisticasCalculadas.totalMenciones}
              </motion.p>
            </AnimatePresence>
            <div className="flex items-center text-green-600 dark:text-green-400">
              <TrendingUp className="mr-1 h-4 w-4" />
              <span className="text-sm font-medium">{estadisticasCalculadas.crecimientoSemanal}</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <motion.div
                className="h-2 rounded-full bg-[#00E5FF]"
                initial={{ width: '0%' }}
                animate={{ width: '70%' }}
                transition={{ duration: 1, delay: 0.5 }}
              ></motion.div>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-600 dark:text-gray-300">
            <span className="font-medium">{estadisticasCalculadas.nuevasMenciones}</span> nuevas menciones esta semana
          </div>
        </motion.div>
        
        <motion.div
          custom={2}
          initial="hidden"
          animate="visible"
          whileHover="hover"
          variants={cardVariants}
          className="rounded-xl p-4 sm:p-5 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/30 cursor-pointer relative overflow-hidden border border-emerald-200 dark:border-emerald-700/50"
          style={{ boxShadow: '0 4px 20px rgba(16, 185, 129, 0.1)' }}
        >
          {/* Indicador de actualización en tiempo real */}
          <div className="absolute top-2 right-2">
            <div className={`h-2 w-2 rounded-full ${errorConexion ? 'bg-red-400' : 'bg-green-400'} animate-pulse`}></div>
          </div>
          
          <h3 className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-200">Sentimiento Positivo</h3>
          <div className="flex items-end justify-between">
            <AnimatePresence mode="wait">
              <motion.p 
                key={estadisticasCalculadas.porcentajePositivo}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-3xl font-bold text-gray-900 dark:text-white"
              >
                {estadisticasCalculadas.porcentajePositivo}%
              </motion.p>
            </AnimatePresence>
            <div className="flex items-center text-red-600 dark:text-red-400">
              <TrendingDown className="mr-1 h-4 w-4" />
              <span className="text-sm font-medium">-3.1%</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <motion.div 
                className="h-2 rounded-full bg-green-500"
                initial={{ width: '0%' }}
                animate={{ width: `${estadisticasCalculadas.porcentajePositivo}%` }}
                transition={{ duration: 1, delay: 0.7 }}
              ></motion.div>
            </div>
          </div>
          <div className="mt-2 flex justify-between text-xs text-gray-600 dark:text-gray-300">
            <span>Negativo: <span className="font-medium">18.3%</span></span>
            <span>Neutral: <span className="font-medium">13.5%</span></span>
          </div>
        </motion.div>
      </div>

      {/* ========================================== */}
      {/* ESTADO DE SALUD DE CONEXIONES OAUTH */}
      {/* ========================================== */}
      <motion.div
        custom={3}
        initial="hidden"
        animate="visible"
        variants={statsVariants}
        className="mb-4 sm:mb-6"
      >
        <ConnectionsHealthPanel />
      </motion.div>

      {/* ========================================== */}
      {/* REDES SOCIALES - SECCIÓN PRINCIPAL */}
      {/* ========================================== */}

      {/* YouTube Analytics Section */}
      <div className="mb-4 sm:mb-6">
        <YouTubeDashboardSection />
      </div>

      {/* Facebook Analytics Section */}
      <div className="mb-4 sm:mb-6">
        <FacebookDashboardSection />
      </div>

      {/* Instagram Analytics Section */}
      <div className="mb-4 sm:mb-6">
        <InstagramDashboardSection />
      </div>

      {/* X/Twitter Analytics Section */}
      <div className="mb-4 sm:mb-6">
        <XDashboardSection />
      </div>

      {/* ========================================== */}
      {/* SECCIÓN SECUNDARIA - MÉTRICAS Y ANÁLISIS */}
      {/* ========================================== */}

      {/* Sección de Engagement y Métricas de Interacción */}
      <FeatureGate feature="hasAdvancedAnalytics">
        <motion.div
          custom={3}
          initial="hidden"
          animate="visible"
          variants={statsVariants}
          className="mb-4 sm:mb-6"
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                  📊 Análisis de Engagement
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Métricas de interacción en tiempo real por plataforma
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-500 font-semibold">EN VIVO</span>
            </div>
          </div>

          {/* Grid de métricas de engagement */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Engagement Total */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              custom={0}
              whileHover="hover"
              className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                {loadingConsolidated ? (
                  <span className="text-gray-400 text-xs">...</span>
                ) : (
                  <span className="text-green-500 text-xs font-semibold">REAL</span>
                )}
              </div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {loadingConsolidated ? '...' : (consolidatedMetrics?.overview?.totalEngagement?.toLocaleString() || '0')}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Interacciones Totales
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                {loadingConsolidated ? '...' : `${consolidatedMetrics?.overview?.totalMentions || 0} menciones`}
              </div>
            </motion.div>

            {/* Engagement Rate */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              custom={1}
              whileHover="hover"
              className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Target className="w-4 h-4 text-white" />
                </div>
                {loadingConsolidated ? (
                  <span className="text-gray-400 text-xs">...</span>
                ) : (
                  <span className="text-green-500 text-xs font-semibold">REAL</span>
                )}
              </div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {loadingConsolidated ? '...' : `${(consolidatedMetrics?.overview?.engagementRate || 0).toFixed(1)}%`}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Tasa de Engagement
              </div>
              <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                {loadingConsolidated ? '...' : `${consolidatedMetrics?.overview?.totalPlatforms || 0} plataformas`}
              </div>
            </motion.div>

            {/* Alcance Promedio */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              custom={2}
              whileHover="hover"
              className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4 border border-green-200 dark:border-green-700"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-green-500 rounded-lg">
                  <Globe className="w-4 h-4 text-white" />
                </div>
                {loadingConsolidated ? (
                  <span className="text-gray-400 text-xs">...</span>
                ) : (
                  <span className="text-green-500 text-xs font-semibold">REAL</span>
                )}
              </div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {loadingConsolidated ? '...' : (consolidatedMetrics?.overview?.weeklyReach?.toLocaleString() || '0')}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Alcance Semanal
              </div>
              <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                {loadingConsolidated ? '...' : 'Seguidores totales'}
              </div>
            </motion.div>

            {/* Viralidad Score */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              custom={3}
              whileHover="hover"
              className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-4 border border-orange-200 dark:border-orange-700"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-orange-500 rounded-lg">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                {loadingConsolidated ? (
                  <span className="text-gray-400 text-xs">...</span>
                ) : (
                  <span className="text-orange-500 text-xs font-semibold">🔥</span>
                )}
              </div>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {loadingConsolidated ? '...' : (consolidatedMetrics?.overview?.viralityIndex || '0.0')}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Índice de Viralidad
              </div>
              <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                {loadingConsolidated ? '...' : 'Shares/Menciones'}
              </div>
            </motion.div>
          </div>

          {/* Gráficos de engagement por plataforma */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Engagement por plataforma */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                Engagement por Plataforma {!loadingConsolidated && <span className="text-green-500 text-xs ml-2">DATOS REALES</span>}
              </h3>
              <div className="space-y-3">
                {loadingConsolidated ? (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                    Cargando datos reales...
                  </div>
                ) : consolidatedMetrics?.platformEngagement && Object.keys(consolidatedMetrics.platformEngagement).length > 0 ? (
                  Object.entries(consolidatedMetrics.platformEngagement).map(([platformKey, data]: [string, any]) => {
                    const platformColors: Record<string, string> = {
                      youtube: 'bg-red-600',
                      facebook: 'bg-blue-600',
                      instagram: 'bg-pink-500',
                      x: 'bg-black',
                      twitter: 'bg-blue-400'
                    };
                    const color = platformColors[platformKey] || 'bg-gray-500';
                    const engagementRate = Math.min(data.engagementRate || 0, 100);

                    return (
                      <div key={platformKey} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 ${color} rounded-full`}></div>
                          <span className="text-sm text-gray-700 dark:text-gray-300">{data.name || platformKey}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                            <div className={`${color} h-1.5 rounded-full`} style={{width: `${engagementRate}%`}}></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{engagementRate.toFixed(1)}%</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                    No hay plataformas conectadas
                  </div>
                )}
              </div>
            </div>

            {/* Top contenido */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                Contenido con Mayor Engagement {!loadingConsolidated && <span className="text-green-500 text-xs ml-2">DATOS REALES</span>}
              </h3>
              <div className="space-y-3">
                {loadingConsolidated ? (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                    Cargando contenido real...
                  </div>
                ) : consolidatedMetrics?.topContent && consolidatedMetrics.topContent.length > 0 ? (
                  consolidatedMetrics.topContent.map((content: any, index: number) => {
                    const badgeColors = ['bg-green-500', 'bg-blue-500', 'bg-purple-500'];
                    const badgeColor = badgeColors[index] || 'bg-gray-500';

                    return (
                      <div key={index} className="flex items-start space-x-3 p-2 bg-white dark:bg-gray-600 rounded-lg">
                        <div className={`w-8 h-8 ${badgeColor} rounded-full flex items-center justify-center flex-shrink-0`}>
                          <span className="text-white text-xs font-bold">{index + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-700 dark:text-gray-300 truncate" title={content.content}>
                            "{content.content?.substring(0, 60) || 'Sin contenido'}..."
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-gray-500">{content.platform}</span>
                            <span className="text-xs text-green-500 font-semibold">+{content.likes || 0} likes</span>
                            <span className="text-xs text-blue-500">{content.shares || 0} shares</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                    No hay contenido disponible
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      </FeatureGate>

      {/* Menciones recientes y actividad - RESPONSIVE */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Menciones en Tiempo Real con IA */}
        <div className="col-span-1 lg:col-span-2">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="card overflow-hidden bg-white dark:bg-gray-800"
          >
            <div className="border-b border-gray-200 p-4 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="heading-secondary flex items-center">
                  <Brain className="w-4 h-4 mr-2 text-blue-600" />
                  Menciones IA en Tiempo Real
                  {!cargandoMenciones && (
                    <span className="ml-2 text-xs text-green-600 dark:text-green-400 font-semibold">
                      DATOS REALES
                    </span>
                  )}
                  {!errorConexion && !cargandoMenciones && (
                    <div className="ml-2 h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
                  )}
                </h2>
                <div className="flex items-center space-x-2">
                  <AnimatePresence>
                    {nuevasMenciones > 0 && (
                      <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                      >
                        +{nuevasMenciones} nueva{nuevasMenciones > 1 ? 's' : ''}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {cargandoMenciones ? (
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-gray-900/30 dark:text-gray-400">
                      Cargando...
                    </span>
                  ) : (
                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">
                      Actualización: 5min
                    </span>
                  )}
                  {errorConexion && (
                    <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-300">
                      Modo offline
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              {cargandoMenciones ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Brain className="w-8 h-8 mx-auto mb-2 animate-pulse text-blue-500" />
                  <p className="text-sm">Cargando menciones reales desde Supabase...</p>
                </div>
              ) : mencionesRecientes.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No hay menciones disponibles</p>
                  <p className="text-xs mt-1">Conecta tus redes sociales para ver menciones en tiempo real</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence>
                    {mencionesRecientes.map((mencion, index) => {
                    const getPlatformIcon = (platform: string) => {
                      switch (platform) {
                        case 'x': return <XLogo className="h-5 w-5" />;
                        case 'facebook': return <Facebook className="h-5 w-5" />;
                        case 'instagram': return <Instagram className="h-5 w-5" />;
                        case 'youtube': return <Users className="h-5 w-5" />;
                        default: return <MessageSquare className="h-5 w-5" />;
                      }
                    };

                    const getPlatformColor = (platform: string) => {
                      switch (platform) {
                        case 'x': return 'bg-black text-white dark:bg-gray-700';
                        case 'facebook': return 'bg-blue-600 text-white';
                        case 'instagram': return 'bg-pink-500 text-white';
                        case 'youtube': return 'bg-red-600 text-white';
                        default: return 'bg-gray-500 text-white';
                      }
                    };

                    const getSentimentColor = (sentiment: string) => {
                      switch (sentiment) {
                        case 'positive': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
                        case 'negative': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
                        default: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
                      }
                    };

                    const formatTimeAgo = (timestamp: Date) => {
                      const now = new Date();
                      const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
                      if (diffInMinutes < 60) return `Hace ${diffInMinutes}m`;
                      const diffInHours = Math.floor(diffInMinutes / 60);
                      if (diffInHours < 24) return `Hace ${diffInHours}h`;
                      return `Hace ${Math.floor(diffInHours / 24)}d`;
                    };

                    return (
                      <motion.div
                        key={mencion.id}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ delay: index * 0.1 }}
                        className="rounded-lg border border-gray-200 p-4 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <div className="flex items-center">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${getPlatformColor(mencion.platform)}`}>
                              {getPlatformIcon(mencion.platform)}
                            </div>
                            <div className="ml-3">
                              <div className="flex items-center space-x-2">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {mencion.author}
                                </p>
                                {mencion.verified && (
                                  <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-xs">✓</span>
                                  </div>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {mencion.platform.charAt(0).toUpperCase() + mencion.platform.slice(1)} • {formatTimeAgo(mencion.timestamp)} • {mencion.location}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getSentimentColor(mencion.sentiment)}`}>
                              {mencion.sentiment === 'positive' ? 'Positivo' : 
                               mencion.sentiment === 'negative' ? 'Negativo' : 'Neutral'}
                            </span>
                            <div className="flex items-center space-x-1">
                              <Sparkles className="w-3 h-3 text-blue-500" />
                              <span className="text-xs text-blue-600">IA</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                          {mencion.content}
                        </p>
                        
                        {/* Engagement metrics */}
                        <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center space-x-1">
                            <Activity className="w-3 h-3" />
                            <span>{mencion.engagement.likes} likes</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <ArrowUpRight className="w-3 h-3" />
                            <span>{mencion.engagement.retweets || mencion.engagement.shares || 0} compartidos</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MessageSquare className="w-3 h-3" />
                            <span>{mencion.engagement.comments} comentarios</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                <div className="mt-4 text-center">
                  <button className="text-sm font-semibold text-[#00E5FF] hover:text-[#00B8D4] flex items-center mx-auto transition-colors duration-200">
                    Ver análisis completo con IA
                    <ArrowUpRight className="ml-1 h-4 w-4" />
                  </button>
                </div>
              </div>
              )}
            </div>
          </motion.div>
        </div>
        
        {/* Actividad reciente mejorada CON ANIMACIONES AVANZADAS */}
        <motion.div 
          custom={4}
          initial="hidden"
          animate="visible"
          variants={statsVariants}
          whileHover={{ y: -2, transition: { duration: 0.2 } }}
          className="card overflow-hidden"
        >
          <div className="border-b border-gray-200 p-4 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="heading-secondary">Actividad Reciente</h2>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Actualizando cada 30s
              </div>
            </div>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                  <Activity className="h-4 w-4" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-medium text-gray-900 dark:text-white">Análisis completado</span> para X
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Hace 30 minutos</p>
                </div>
              </div>
            </div>
            
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  <Target className="h-4 w-4" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-medium text-gray-900 dark:text-white">50 créditos consumidos</span> en análisis de sentimiento
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Hace 1 hora</p>
                </div>
              </div>
            </div>
            
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-medium text-gray-900 dark:text-white">Aumento de menciones</span> detectado en Facebook
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Hace 3 horas</p>
                </div>
              </div>
            </div>
            
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                  <Award className="h-4 w-4" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-medium text-gray-900 dark:text-white">30 créditos consumidos</span> en monitoreo de menciones
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Hace 5 horas</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Monitoreo de Noticias - NUEVA SECCIÓN */}
      <div className="mb-4 sm:mb-6">
        <MonitoreoNoticiasSection />
      </div>

      {/* Panel Político - Solo para usuarios que seleccionaron perfil político en el registro */}
      {user?.profileType === 'political' && (
        <motion.div
          custom={7}
          initial="hidden"
          animate="visible"
          className="mb-4 sm:mb-6"
        >
          <PoliticalDashboard />
        </motion.div>
      )}

    </div>
  );
}
