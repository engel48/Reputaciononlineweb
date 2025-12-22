"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import PoliticalDashboard from '@/components/dashboard/PoliticalDashboard';
import CreditosSummary from '@/components/creditos/CreditosSummary';
import AdvancedSearch from '@/components/dashboard/AdvancedSearch';
import JuliaChat from '@/components/dashboard/JuliaChat';
import SimpleBuscador from '@/components/dashboard/SimpleBuscador';
import SimpleChat from '@/components/dashboard/SimpleChat';
import XLogo from '@/components/icons/XLogo';
import dynamic from 'next/dynamic';
import JuliaThinkingAnimation from '@/components/dashboard/JuliaThinkingAnimation';
import LoadingAnimation from '@/components/ui/LoadingAnimation';

import { 
  Crown, Users, TrendingUp, Target, AlertTriangle, ArrowLeft, BarChart3, Activity, Globe, Shield,
  ArrowUpRight, RefreshCw, TrendingDown, Facebook, Instagram, CreditCard, Brain, Sparkles, 
  Wifi, WifiOff, Search, Zap, MessageSquare, Award, Clock, Newspaper, Bot, X 
} from 'lucide-react';

// Interfaces (mismo que dashboard normal)
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

// Importar el mapa dinámicamente para evitar problemas con SSR
const DynamicMencionesMap = dynamic(() => import('@/components/dashboard/MencionesMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-md">
      <div className="text-gray-500 dark:text-gray-400">Cargando mapa...</div>
    </div>
  ),
});

// Datos por defecto (mismo que dashboard normal)
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

export default function DashboardPolitico() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  
  // Estados del dashboard normal
  const [neuralNetworkMode, setNeuralNetworkMode] = useState<'sentiment' | 'platform' | 'engagement'>('sentiment');
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [datosEnTiempoReal, setDatosEnTiempoReal] = useState(defaultData);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(new Date());
  const [errorConexion, setErrorConexion] = useState(false);
  const [actualizandoDatos, setActualizandoDatos] = useState(false);
  const [intervaloActivo, setIntervaloActivo] = useState(true);

  // Estados para menciones en tiempo real (mismo que dashboard normal)
  const [mencionesRecientes, setMencionesRecientes] = useState<Mention[]>([]);
  const [nuevasMenciones, setNuevasMenciones] = useState(0);

  // Estados para noticias políticas y métricas
  const [noticiasReales, setNoticiasReales] = useState<any[]>([]);
  const [noticiaSeleccionada, setNoticiaSeleccionada] = useState<any>(null);
  const [mostrarModalNoticia, setMostrarModalNoticia] = useState(false);
  const [politicalMetrics, setPoliticalMetrics] = useState<any>(null);

  // Redirigir si no es usuario político
  useEffect(() => {
    if (!isLoading && user && user.profileType !== 'political') {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  // Funciones del dashboard normal
  const analizarSentimientoConIA = useCallback((contenido: string) => {
    const palabrasPositivas = ['excelente', 'genial', 'increíble', 'recomendado', 'amor', 'fantástico', 'propuesta', 'reforma', '👍', '❤️', '✨'];
    const palabrasNegativas = ['malo', 'terrible', 'pésimo', 'horrible', 'odio', 'problema', 'corrupción', '👎', '😠'];
    
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

  // Función para cargar métricas políticas reales
  const cargarMetricasPoliticas = useCallback(async () => {
    try {
      const response = await fetch('/api/political-analytics');
      const result = await response.json();

      if (result.success && result.data) {
        setPoliticalMetrics(result.data);
        console.log('✅ Métricas políticas REALES cargadas:', result.data);
      } else {
        console.warn('⚠️ No hay métricas políticas disponibles');
        setPoliticalMetrics({
          approval_rating: 0,
          disapproval_rating: 0,
          undecided: 0,
          voting_intention: 0,
          political_reach: 0,
          engagement_index: 0,
          approval_trend: 0,
          demographic_breakdown: [],
          top_topics: [],
          platform_engagement: {}
        });
      }
    } catch (error) {
      console.error('❌ Error cargando métricas políticas:', error);
      setPoliticalMetrics({
        approval_rating: 0,
        disapproval_rating: 0,
        undecided: 0,
        voting_intention: 0,
        political_reach: 0,
        engagement_index: 0,
        approval_trend: 0,
        demographic_breakdown: [],
        top_topics: [],
        platform_engagement: {}
      });
    }
  }, []);

  // Funciones para noticias
  const abrirNoticia = useCallback((noticia: any) => {
    setNoticiaSeleccionada(noticia);
    setMostrarModalNoticia(true);
  }, []);

  const cerrarModalNoticia = useCallback(() => {
    setMostrarModalNoticia(false);
    setNoticiaSeleccionada(null);
  }, []);

  // Función para cargar menciones políticas reales
  const cargarMencionesPolíticas = useCallback(async () => {
    try {
      const response = await fetch('/api/mentions/recent?category=political&limit=10');
      const result = await response.json();

      if (result.success && result.data?.mentions) {
        setMencionesRecientes(result.data.mentions);
        console.log('✅ Menciones políticas REALES cargadas');
      } else {
        setMencionesRecientes([]);
      }
    } catch (error) {
      console.error('❌ Error cargando menciones políticas:', error);
      setMencionesRecientes([]);
    }
  }, []);

  // Función para cargar noticias políticas reales
  const cargarNoticiasPolíticas = useCallback(async () => {
    try {
      const response = await fetch('/api/news/political?limit=12');
      const result = await response.json();

      if (result.success && result.data?.news) {
        setNoticiasReales(result.data.news);
        console.log('✅ Noticias políticas REALES cargadas');
      } else {
        setNoticiasReales([]);
      }
    } catch (error) {
      console.error('❌ Error cargando noticias políticas:', error);
      setNoticiasReales([]);
    }
  }, []);

  // Función para cargar datos reales desde la API
  const cargarDatosReales = useCallback(async () => {
    try {
      const response = await fetch('/api/dashboard-analytics');
      const result = await response.json();
      
      if (result.success) {
        setDatosEnTiempoReal(result.data);
        setUltimaActualizacion(new Date());
        setErrorConexion(false);
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

  // Función mejorada para actualizar datos
  const actualizarDatos = useCallback(async (manual = false) => {
    if (manual) setActualizandoDatos(true);
    await cargarDatosReales();
    if (manual) setActualizandoDatos(false);
  }, [cargarDatosReales]);

  // Efectos - Cargar datos iniciales
  useEffect(() => {
    cargarDatosReales();
    cargarMetricasPoliticas();
    cargarMencionesPolíticas();
    cargarNoticiasPolíticas();
  }, [cargarDatosReales, cargarMetricasPoliticas, cargarMencionesPolíticas, cargarNoticiasPolíticas]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnalyzing(false);
    }, 8000);

    return () => clearTimeout(timer);
  }, []);

  // Auto-actualización de datos generales cada minuto
  useEffect(() => {
    if (!intervaloActivo || cargandoDatos) return;

    const interval = setInterval(() => {
      cargarDatosReales();
    }, 60000);

    return () => clearInterval(interval);
  }, [cargarDatosReales, intervaloActivo, cargandoDatos]);

  // Auto-actualización de métricas políticas cada minuto
  useEffect(() => {
    if (!intervaloActivo) return;

    const interval = setInterval(() => {
      cargarMetricasPoliticas();
    }, 60000);

    return () => clearInterval(interval);
  }, [cargarMetricasPoliticas, intervaloActivo]);

  // Auto-actualización de menciones políticas cada 30 segundos
  useEffect(() => {
    if (!intervaloActivo) return;

    const interval = setInterval(() => {
      cargarMencionesPolíticas();
    }, 30000);

    return () => clearInterval(interval);
  }, [cargarMencionesPolíticas, intervaloActivo]);

  // Auto-actualización de noticias políticas cada 2 minutos
  useEffect(() => {
    if (!intervaloActivo) return;

    const interval = setInterval(() => {
      cargarNoticiasPolíticas();
    }, 120000);

    return () => clearInterval(interval);
  }, [cargarNoticiasPolíticas, intervaloActivo]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIntervaloActivo(!document.hidden);
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Animaciones
  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: i * 0.08,
        duration: 0.6,
        ease: [0.4, 0, 0.2, 1],
        type: "spring",
        stiffness: 120,
        damping: 12
      }
    }),
    hover: {
      y: -4,
      scale: 1.025,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

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

  // Memoizar cálculos costosos
  const estadisticasCalculadas = useMemo(() => {
    const total = datosEnTiempoReal.mentions.total;
    const positive = datosEnTiempoReal.mentions.positive;
    const porcentajePositivo = total > 0 ? ((positive / total) * 100).toFixed(1) : '0.0';
    const crecimientoSemanal = '+18.7%'; // Políticos tienden a tener más engagement
    
    return {
      totalMenciones: total.toLocaleString(),
      porcentajePositivo,
      crecimientoSemanal,
      nuevasMenciones: Math.floor(total * 0.45) // Más menciones para políticos
    };
  }, [datosEnTiempoReal]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingAnimation 
          message="Cargando dashboard político..." 
          size="lg" 
        />
      </div>
    );
  }

  if (!user || user.profileType !== 'political') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-800 dark:text-red-300 mb-2">
              Acceso Restringido
            </h2>
            <p className="text-red-600 dark:text-red-400 mb-4">
              Este dashboard está disponible solo para usuarios con perfil político.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center px-4 py-2 bg-[#01257D] text-white rounded-lg hover:bg-[#013AAA] transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Ir al Dashboard Principal
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar animación de carga inicial si está cargando y no hay datos
  if (cargandoDatos && datosEnTiempoReal.mentions.total === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingAnimation 
          message="Cargando datos políticos en tiempo real..." 
          size="lg" 
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Encabezado específico para políticos */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-yellow-600 via-yellow-500 to-orange-500 text-white p-6 rounded-xl shadow-lg"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-full">
              <Crown className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Dashboard Político Completo</h1>
              <p className="text-yellow-100">
                Bienvenido, {user.name} - Todas las funciones + herramientas políticas especializadas
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-90">Perfil verificado</div>
            <div className="flex items-center text-lg font-semibold">
              <Shield className="w-5 h-5 mr-2" />
              Político
            </div>
          </div>
        </div>
      </motion.div>

      {/* Notificación de funcionalidades políticas */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white p-4 rounded-xl shadow-lg border-2 border-yellow-300"
        style={{ fontSize: '16px', fontWeight: 'bold' }}
      >
        <div className="flex items-center space-x-3">
          <div className="animate-bounce">
            👑
          </div>
          <div>
            <p className="text-lg">¡FUNCIONES POLÍTICAS ESPECIALIZADAS + TODO LO NORMAL ACTIVAS!</p>
            <p className="text-sm opacity-90">✅ Dashboard completo normal ✅ Análisis de aprobación ✅ Intención de voto ✅ Monitoreo político ✅ Julia IA especializada</p>
          </div>
          <div className="animate-pulse">
            🗳️
          </div>
        </div>
      </motion.div>

      {/* Métricas políticas destacadas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Aprobación</p>
              <p className="text-3xl font-bold">
                {politicalMetrics?.approval_rating?.toFixed(1) || '0'}%
              </p>
            </div>
            {(politicalMetrics?.approval_trend || 0) >= 0 ? (
              <TrendingUp className="w-8 h-8 text-blue-200" />
            ) : (
              <TrendingDown className="w-8 h-8 text-blue-200" />
            )}
          </div>
          <div className="mt-2 text-sm text-blue-100">
            {politicalMetrics?.approval_trend >= 0 ? '+' : ''}{politicalMetrics?.approval_trend?.toFixed(1) || '0'}% vs mes anterior
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Intención de Voto</p>
              <p className="text-3xl font-bold">
                {politicalMetrics?.voting_intention?.toFixed(1) || '0'}%
              </p>
            </div>
            <Target className="w-8 h-8 text-green-200" />
          </div>
          <div className="mt-2 text-sm text-green-100">
            {politicalMetrics?.voting_intention > 0 ? 'Tendencia positiva' : 'Sin datos disponibles'}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Alcance Político</p>
              <p className="text-3xl font-bold">
                {politicalMetrics?.political_reach ? (politicalMetrics.political_reach / 1000000).toFixed(1) + 'M' : '0'}
              </p>
            </div>
            <Globe className="w-8 h-8 text-purple-200" />
          </div>
          <div className="mt-2 text-sm text-purple-100">
            Votantes potenciales
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">Engagement Político</p>
              <p className="text-3xl font-bold">
                {politicalMetrics?.engagement_index?.toFixed(1) || '0'}%
              </p>
            </div>
            <Activity className="w-8 h-8 text-orange-200" />
          </div>
          <div className="mt-2 text-sm text-orange-100">
            {politicalMetrics?.engagement_index > 50 ? 'Por encima del promedio' : 'Sin datos disponibles'}
          </div>
        </motion.div>
      </div>

      {/* Encabezado normal del dashboard pero adaptado para políticos */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Herramientas Completas de Reputación</h2>
          <p className="mt-1 text-gray-600 dark:text-gray-300">Todas las funcionalidades normales + herramientas políticas especializadas</p>
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
            className={`flex items-center text-sm px-4 py-2 rounded-lg transition-all duration-200 ${
              actualizandoDatos
                ? 'bg-gray-400 cursor-not-allowed'
                : errorConexion
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-[#01257D] hover:bg-[#01257D]/90'
            } text-white`}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${actualizandoDatos ? 'animate-spin' : ''}`} /> 
            {cargandoDatos ? 'Cargando...' : actualizandoDatos ? 'Actualizando...' : errorConexion ? 'Reintentar' : 'Actualizar Datos'}
          </button>
        </div>
      </div>

      {/* Resumen de créditos */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-4">
        <motion.div 
          className="col-span-1 lg:col-span-2"
          custom={0}
          initial="hidden"
          animate="visible"
          variants={statsVariants}
        >
          <CreditosSummary showDetails={true} />
        </motion.div>
        
        {/* Estadísticas rápidas adaptadas para políticos */}
        <motion.div 
          custom={1}
          initial="hidden"
          animate="visible"
          whileHover="hover"
          variants={cardVariants}
          className="card p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 cursor-pointer relative overflow-hidden border-2 border-blue-200 dark:border-blue-700"
          style={{ boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
        >
          <div className="absolute top-2 right-2">
            <div className={`h-2 w-2 rounded-full ${errorConexion ? 'bg-red-400' : 'bg-green-400'} animate-pulse`}></div>
          </div>
          
          <h3 className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-200">Menciones Políticas</h3>
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
                className="h-2 rounded-full bg-[#01257D]"
                initial={{ width: '0%' }}
                animate={{ width: '85%' }}
                transition={{ duration: 1, delay: 0.5 }}
              ></motion.div>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-600 dark:text-gray-300">
            <span className="font-medium">{estadisticasCalculadas.nuevasMenciones}</span> menciones políticas esta semana
          </div>
        </motion.div>
        
        <motion.div
          custom={2}
          initial="hidden"
          animate="visible"
          whileHover="hover"
          variants={cardVariants}
          className="card p-3 sm:p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 cursor-pointer relative overflow-hidden border-2 border-green-200 dark:border-green-700"
          style={{ boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
        >
          <div className="absolute top-2 right-2">
            <div className={`h-2 w-2 rounded-full ${errorConexion ? 'bg-red-400' : 'bg-green-400'} animate-pulse`}></div>
          </div>

          <h3 className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-200">Aprobación Ciudadana</h3>
          <div className="flex items-end justify-between">
            <AnimatePresence mode="wait">
              <motion.p
                key={politicalMetrics?.approval_rating || 0}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-3xl font-bold text-gray-900 dark:text-white"
              >
                {politicalMetrics?.approval_rating?.toFixed(1) || '0'}%
              </motion.p>
            </AnimatePresence>
            <div className={`flex items-center ${(politicalMetrics?.approval_trend || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {(politicalMetrics?.approval_trend || 0) >= 0 ? (
                <TrendingUp className="mr-1 h-4 w-4" />
              ) : (
                <TrendingDown className="mr-1 h-4 w-4" />
              )}
              <span className="text-sm font-medium">
                {politicalMetrics?.approval_trend >= 0 ? '+' : ''}{politicalMetrics?.approval_trend?.toFixed(1) || '0'}%
              </span>
            </div>
          </div>
          <div className="mt-4">
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <motion.div
                className="h-2 rounded-full bg-green-500"
                initial={{ width: '0%' }}
                animate={{ width: `${politicalMetrics?.approval_rating || 0}%` }}
                transition={{ duration: 1, delay: 0.7 }}
              ></motion.div>
            </div>
          </div>
          <div className="mt-2 flex justify-between text-xs text-gray-600 dark:text-gray-300">
            <span>Desaprobación: <span className="font-medium">
              {politicalMetrics?.disapproval_rating?.toFixed(1) || '0'}%
            </span></span>
            <span>Indecisos: <span className="font-medium">
              {politicalMetrics?.undecided?.toFixed(1) || '0'}%
            </span></span>
          </div>
        </motion.div>
      </div>

      {/* TODAS las secciones del dashboard normal */}
      
      {/* Sección de Engagement */}
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
                  📊 Análisis de Engagement Político
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Métricas de interacción política en tiempo real
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-500 font-semibold">EN VIVO</span>
            </div>
          </div>

          {/* Grid de métricas políticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
                <span className="text-green-500 text-xs font-semibold">
                  {datosEnTiempoReal.mentions.total > 0 ? '+' : ''}
                  {Math.floor(datosEnTiempoReal.mentions.total * 0.34)}
                </span>
              </div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {datosEnTiempoReal.mentions.total.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Interacciones Políticas
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                {datosEnTiempoReal.mentions.total > 0 ? 'Datos en tiempo real' : 'Sin interacciones'}
              </div>
            </motion.div>

            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              custom={1}
              whileHover="hover"
              className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4 border border-green-200 dark:border-green-700"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-green-500 rounded-lg">
                  <Target className="w-4 h-4 text-white" />
                </div>
                <span className="text-green-500 text-xs font-semibold">
                  {politicalMetrics?.voting_intention > 0 ? 'Activo' : '--'}
                </span>
              </div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {politicalMetrics?.voting_intention?.toFixed(1) || '0'}%
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Intención de Voto
              </div>
              <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                {politicalMetrics?.voting_intention > 0 ? 'Tendencia positiva' : 'Sin datos disponibles'}
              </div>
            </motion.div>

            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              custom={2}
              whileHover="hover"
              className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Globe className="w-4 h-4 text-white" />
                </div>
                <span className="text-green-500 text-xs font-semibold">
                  {politicalMetrics?.political_reach > 0 ? 'Activo' : '--'}
                </span>
              </div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {politicalMetrics?.political_reach ? (politicalMetrics.political_reach / 1000000).toFixed(1) + 'M' : '0'}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Alcance Político
              </div>
              <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                {politicalMetrics?.political_reach > 0 ? 'Votantes potenciales' : 'Sin datos disponibles'}
              </div>
            </motion.div>

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
                <span className="text-green-500 text-xs font-semibold">
                  {politicalMetrics?.engagement_index > 75 ? '🔥' : politicalMetrics?.engagement_index > 0 ? 'Activo' : '--'}
                </span>
              </div>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {politicalMetrics?.engagement_index?.toFixed(1) || '0'}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Índice de Influencia
              </div>
              <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                {politicalMetrics?.engagement_index > 75 ? 'Muy alto' : politicalMetrics?.engagement_index > 0 ? 'Medio' : 'Sin datos'}
              </div>
            </motion.div>
          </div>

          {/* Gráficos de engagement por plataforma */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Engagement por plataforma */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                Engagement Político por Plataforma
              </h3>
              {politicalMetrics?.platform_engagement && Object.keys(politicalMetrics.platform_engagement).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(politicalMetrics.platform_engagement).map(([platform, percentage]: [string, any]) => {
                    const platformColors: Record<string, string> = {
                      x: 'bg-blue-500',
                      facebook: 'bg-blue-600',
                      instagram: 'bg-pink-500',
                      youtube: 'bg-red-500'
                    };
                    return (
                      <div key={platform} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 ${platformColors[platform] || 'bg-gray-500'} rounded-full`}></div>
                          <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                            {platform === 'x' ? 'X (Twitter)' : platform}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                            <div
                              className={`${platformColors[platform] || 'bg-gray-500'} h-1.5 rounded-full`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {percentage}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <BarChart3 className="mx-auto h-12 w-12 mb-3 opacity-50" />
                  <p className="text-sm">No hay datos de engagement por plataforma</p>
                  <p className="text-xs mt-2">Conecta tus redes sociales para ver estadísticas</p>
                </div>
              )}
            </div>

            {/* Top contenido político */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                Contenido Político con Mayor Engagement
              </h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-2 bg-white dark:bg-gray-600 rounded-lg">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">1</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 dark:text-gray-300 truncate">
                      "Propuesta educativa excelente del candidato..."
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-green-500 font-semibold">+245 likes</span>
                      <span className="text-xs text-blue-500">52 shares</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-2 bg-white dark:bg-gray-600 rounded-lg">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">2</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 dark:text-gray-300 truncate">
                      "Debate presidencial muy interesante ayer..."
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-green-500 font-semibold">+634 likes</span>
                      <span className="text-xs text-blue-500">145 shares</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-2 bg-white dark:bg-gray-600 rounded-lg">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">3</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 dark:text-gray-300 truncate">
                      "Análisis político: necesitamos transparencia..."
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-green-500 font-semibold">+356 likes</span>
                      <span className="text-xs text-blue-500">89 shares</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Búsqueda Avanzada */}
      <motion.div
        custom={4}
        initial="hidden"
        animate="visible"
        variants={statsVariants}
        whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
        className="mb-4 sm:mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-[#01257D] to-blue-600 rounded-lg">
              <Search className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                🔍 Búsqueda Avanzada Política
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Búsqueda especializada para figuras políticas y candidatos
              </p>
            </div>
          </div>
        </div>
        
        <SimpleBuscador />
      </motion.div>

      {/* Mapa de menciones */}
      <div className="mb-6">
        <DynamicMencionesMap />
      </div>
      
      {/* Análisis de IA - Julia */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <Sparkles className="mr-2 h-5 w-5 text-blue-500" />
            Julia IA - Análisis Político Cognitivo
          </h2>
          <div className="flex items-center space-x-4">
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              {['sentiment', 'platform', 'engagement'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setNeuralNetworkMode(mode as any)}
                  className={`px-3 py-1 text-xs rounded-md transition-all duration-200 ${
                    neuralNetworkMode === mode
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {mode === 'sentiment' ? 'Sentimiento' : mode === 'platform' ? 'Plataforma' : 'Engagement'}
                </button>
              ))}
            </div>
            
            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
              {isAnalyzing ? (
                <>
                  <span className="relative flex h-3 w-3 mr-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                  </span>
                  Analizando política en tiempo real
                </>
              ) : (
                <>
                  <div className="h-3 w-3 mr-2 rounded-full bg-green-500"></div>
                  Análisis político completado
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 p-0 overflow-hidden rounded-xl shadow-lg border border-blue-100 dark:border-gray-700 relative">
          {errorConexion && (
            <div className="absolute top-4 right-4 z-10 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg p-2 flex items-center text-sm text-red-800 dark:text-red-200">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Conexión limitada
            </div>
          )}
          
          <div className="w-full" style={{ height: "350px" }}>
            <JuliaThinkingAnimation 
              particleCount={errorConexion ? 50 : 100}
              showMentions={!errorConexion}
              responsive={true}
              className="w-full h-full"
              title={isAnalyzing ? `Julia está analizando ${neuralNetworkMode === 'sentiment' ? 'sentimientos políticos' : neuralNetworkMode === 'platform' ? 'plataformas políticas' : 'engagement político'}` : 'Análisis político completado'}
              subtitle={isAnalyzing ? "Procesando menciones políticas y sentimientos en tiempo real" : `Última actualización: ${ultimaActualizacion.toLocaleTimeString()}`}
            />
          </div>
        </div>
      </motion.div>
      
      {/* Menciones recientes políticas y actividad */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Menciones en Tiempo Real Políticas */}
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
                  Menciones Políticas IA en Tiempo Real
                  {!errorConexion && (
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
                  <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">
                    Actualización: 5min
                  </span>
                </div>
              </div>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              {mencionesRecientes.length > 0 ? (
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
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <MessageSquare className="mx-auto h-16 w-16 mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No hay menciones políticas disponibles</p>
                  <p className="text-sm">Conecta tus redes sociales para comenzar a recopilar menciones</p>
                </div>
              )}

              {mencionesRecientes.length > 0 && (
                <div className="mt-4 text-center">
                  <button className="text-sm font-medium text-[#01257D] hover:text-[#01257D]/90 dark:text-[#01257D] dark:hover:text-[#01257D]/90 flex items-center mx-auto">
                    Ver análisis político completo con IA
                    <ArrowUpRight className="ml-1 h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
        
        {/* Actividad reciente política */}
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
              <h2 className="heading-secondary">Actividad Política</h2>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Actualizando cada 30s
              </div>
            </div>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                  <Crown className="h-4 w-4" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-medium text-gray-900 dark:text-white">Análisis de aprobación</span> completado
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Hace 15 minutos</p>
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
                    <span className="font-medium text-gray-900 dark:text-white">85 créditos consumidos</span> en análisis político
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Hace 45 minutos</p>
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
                    <span className="font-medium text-gray-900 dark:text-white">Incremento en menciones</span> detectado en X
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Hace 1 hora</p>
                </div>
              </div>
            </div>
            
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                  <Globe className="h-4 w-4" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-medium text-gray-900 dark:text-white">65 créditos consumidos</span> en alcance político
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Hace 2 horas</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Noticias Políticas en Tiempo Real */}
      <div className="mb-4 sm:mb-6">
        <motion.div
          custom={5}
          initial="hidden"
          animate="visible"
          variants={statsVariants}
          whileHover={{ scale: 1.002, transition: { duration: 0.3 } }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                  📺 Noticias Políticas en Tiempo Real
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Análisis especializado de noticias políticas con IA
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-red-600 font-medium">POLÍTICO EN VIVO</span>
            </div>
          </div>
          
          {/* Noticias Grid - Políticas */}
          {noticiasReales.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {noticiasReales.map((noticia, index) => {
                  const getSentimentColor = (sentiment: string) => {
                    switch (sentiment) {
                      case 'Positivo': return 'bg-green-100 text-green-800';
                      case 'Negativo': return 'bg-red-100 text-red-800';
                      default: return 'bg-yellow-100 text-yellow-800';
                    }
                  };

                  return (
                    <motion.div
                      key={noticia.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * (index + 1) }}
                      className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.02]"
                      onClick={() => abrirNoticia(noticia)}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                          <span className="text-sm">{noticia.icon}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{noticia.person}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getSentimentColor(noticia.sentiment)}`}>
                          {noticia.sentiment}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 hover:text-[#01257D] transition-colors">
                        {noticia.title}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                        Análisis político: {noticia.engagement}, impacto {noticia.sentiment.toLowerCase()}...
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{noticia.timestamp} • {noticia.source}</span>
                        <div className="flex items-center space-x-1">
                          <Sparkles className="w-3 h-3 text-blue-500" />
                          <span className="text-xs text-blue-600">IA</span>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium">
                        📖 Click para leer noticia política completa
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="mt-4 text-center">
                <button className="text-sm font-medium text-[#01257D] hover:text-[#01257D]/90 dark:text-[#01257D] dark:hover:text-[#01257D]/90 flex items-center mx-auto">
                  Ver más noticias políticas analizadas
                  <ArrowUpRight className="ml-1 h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-16 text-gray-500 dark:text-gray-400">
              <Newspaper className="mx-auto h-20 w-20 mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No hay noticias políticas disponibles</p>
              <p className="text-sm">Las noticias políticas aparecerán aquí cuando estén disponibles</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Julia Chat político */}
      <div className="mb-4 sm:mb-6">
        <motion.div
          custom={6}
          initial="hidden"
          animate="visible"
          variants={statsVariants}
          whileHover={{ scale: 1.005, transition: { duration: 0.3 } }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="relative">
              <div className="p-3 bg-gradient-to-r from-[#01257D] via-purple-600 to-blue-600 rounded-xl shadow-lg">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <span className="bg-gradient-to-r from-[#01257D] to-purple-600 bg-clip-text text-transparent">
                  Julia IA Política
                </span>
                <span className="ml-2 text-sm bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full dark:bg-yellow-900/30 dark:text-yellow-300">
                  Especializada
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Asistente especializado en análisis político • Julia IA + Modelos Políticos
              </p>
            </div>
          </div>
          
          <SimpleChat />
        </motion.div>
      </div>

      {/* Componente principal de dashboard político especializado */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <PoliticalDashboard />
      </motion.div>

      {/* Análisis político específico adicional */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
      >
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <BarChart3 className="w-6 h-6 mr-2 text-[#01257D]" />
          Análisis Político Avanzado Especializado
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tendencias por demografía */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Aprobación por Demografía
            </h3>
            {politicalMetrics?.demographic_breakdown && politicalMetrics.demographic_breakdown.length > 0 ? (
              <div className="space-y-3">
                {politicalMetrics.demographic_breakdown.map((demo: any, index: number) => {
                  const colors = ['bg-blue-600', 'bg-green-600', 'bg-purple-600', 'bg-orange-600'];
                  return (
                    <div key={demo.age_group || index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {demo.age_group || `Grupo ${index + 1}`}
                      </span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`${colors[index % colors.length]} h-2 rounded-full`}
                            style={{ width: `${demo.approval || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{demo.approval?.toFixed(0) || 0}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Users className="mx-auto h-12 w-12 mb-3 opacity-50" />
                <p className="text-sm">No hay datos demográficos disponibles</p>
                <p className="text-xs mt-2">Los análisis aparecerán aquí cuando haya datos suficientes</p>
              </div>
            )}
          </div>

          {/* Temas principales */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Temas Políticos Más Mencionados
            </h3>
            {politicalMetrics?.top_topics && politicalMetrics.top_topics.length > 0 ? (
              <div className="space-y-3">
                {politicalMetrics.top_topics.map((topic: any, index: number) => {
                  const colors = [
                    'text-green-600 dark:text-green-400',
                    'text-blue-600 dark:text-blue-400',
                    'text-purple-600 dark:text-purple-400',
                    'text-orange-600 dark:text-orange-400'
                  ];
                  return (
                    <div key={topic.topic || index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-sm font-medium">{topic.topic || `Tema ${index + 1}`}</span>
                      <span className={`text-sm ${colors[index % colors.length]}`}>
                        {topic.percentage >= 0 ? '+' : ''}{topic.percentage?.toFixed(0) || 0}%
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <MessageSquare className="mx-auto h-12 w-12 mb-3 opacity-50" />
                <p className="text-sm">No hay temas políticos identificados</p>
                <p className="text-xs mt-2">Los temas más mencionados aparecerán aquí</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
      
      {/* Modal para Noticias Políticas */}
      <AnimatePresence>
        {mostrarModalNoticia && noticiaSeleccionada && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[99999] p-4"
            onClick={cerrarModalNoticia}
          >
            <motion.div
              initial={{ scale: 0.3, opacity: 0, y: 100 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.3, opacity: 0, y: 100 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header del Modal Político */}
              <div className="bg-gradient-to-r from-yellow-600 to-orange-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                      <Newspaper className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Noticia Política en Tiempo Real</h2>
                      <p className="text-yellow-100">{noticiaSeleccionada.person}</p>
                    </div>
                  </div>
                  <button
                    onClick={cerrarModalNoticia}
                    className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Contenido del Modal */}
              <div className="p-6 max-h-[calc(85vh-140px)] overflow-y-auto">
                <div className="flex items-center space-x-2 mb-4">
                  <span className="text-2xl">{noticiaSeleccionada.icon}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{noticiaSeleccionada.person}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    noticiaSeleccionada.sentiment === 'Positivo' ? 'bg-green-100 text-green-800' :
                    noticiaSeleccionada.sentiment === 'Negativo' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {noticiaSeleccionada.sentiment}
                  </span>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {noticiaSeleccionada.title}
                </h1>

                <div className="flex items-center space-x-4 mb-6 text-sm text-gray-500">
                  <span>{noticiaSeleccionada.timestamp}</span>
                  <span>•</span>
                  <span>{noticiaSeleccionada.source}</span>
                  <span>•</span>
                  <span>{noticiaSeleccionada.engagement}</span>
                </div>

                <div className="prose dark:prose-dark max-w-none mb-6">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {noticiaSeleccionada.content}
                  </p>
                </div>

                {/* Métricas de IA Política */}
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <Sparkles className="w-5 h-5 text-yellow-600" />
                    <span className="font-semibold text-yellow-800 dark:text-yellow-300">Análisis Político con Julia IA</span>
                  </div>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Impacto político: <strong>{noticiaSeleccionada.engagement}</strong>
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Tendencia de aprobación: <strong>{noticiaSeleccionada.sentiment}</strong>
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Relevancia electoral: <strong>Alta</strong>
                  </p>
                </div>

                {/* Botones de Acción */}
                <div className="flex items-center space-x-3">
                  <a
                    href={noticiaSeleccionada.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 bg-[#01257D] text-white px-4 py-2 rounded-lg hover:bg-[#013AAA] transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                    <span>Ver Noticia Original</span>
                  </a>
                  <button
                    onClick={cerrarModalNoticia}
                    className="px-4 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}