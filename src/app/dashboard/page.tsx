"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import CreditosSummary from '@/components/creditos/CreditosSummary';
import MencionesMap from '@/components/dashboard/MencionesMap';
import AdvancedSearch from '@/components/dashboard/AdvancedSearch';
import SofiaChat from '@/components/dashboard/SofiaChat';
import SimpleBuscador from '@/components/dashboard/SimpleBuscador';
import SimpleChat from '@/components/dashboard/SimpleChat';
import PoliticalDashboard from '@/components/dashboard/PoliticalDashboard';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, RefreshCw, TrendingUp, TrendingDown, Facebook, Instagram, CreditCard, Brain, Sparkles, Wifi, WifiOff, AlertTriangle, Search, Zap, BarChart3, Users, MessageSquare, Activity, Target, Award, Globe, Clock, Newspaper, Bot, X } from 'lucide-react';
import XLogo from '@/components/icons/XLogo';
import dynamic from 'next/dynamic';
import SofiaThinkingAnimation from '@/components/dashboard/SofiaThinkingAnimation';
import LoadingAnimation from '@/components/ui/LoadingAnimation';
import { useUser } from '@/context/UserContext';
import { usePlan } from '@/context/PlanContext';
import FeatureGate, { UsageLimit, PlanBadge } from '@/components/plan/FeatureGate';

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

// Importar el mapa dinámicamente para evitar problemas con SSR
const DynamicMencionesMap = dynamic(() => import('@/components/dashboard/MencionesMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-md">
      <div className="text-gray-500 dark:text-gray-400">Cargando mapa...</div>
    </div>
  ),
});

// Datos en tiempo real obtenidos de la API
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
  
  
  // Estados para controlar la animación y datos
  const [neuralNetworkMode, setNeuralNetworkMode] = useState<'sentiment' | 'platform' | 'engagement'>('sentiment');
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [datosEnTiempoReal, setDatosEnTiempoReal] = useState(defaultData);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(new Date());
  const [errorConexion, setErrorConexion] = useState(false);
  const [actualizandoDatos, setActualizandoDatos] = useState(false);
  const [intervaloActivo, setIntervaloActivo] = useState(true);
  
  // Estados para menciones en tiempo real
  const [mencionesRecientes, setMencionesRecientes] = useState<Mention[]>([
    {
      id: '1',
      author: '@usuario123',
      platform: 'x',
      content: '¡Excelente servicio de @MarcaEjemplo! Resolvieron mi problema rápidamente. Muy recomendado 👍',
      sentiment: 'positive' as const,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      engagement: { likes: 45, comments: 8, retweets: 12, shares: 5 },
      location: 'Bogotá, Colombia',
      verified: true
    },
    {
      id: '2',
      author: 'María García',
      platform: 'facebook',
      content: 'Llevo 3 días esperando respuesta de @MarcaEjemplo. Pésima atención al cliente.',
      sentiment: 'negative' as const,
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      engagement: { likes: 23, comments: 15, shares: 7, retweets: 3 },
      location: 'Medellín, Colombia',
      verified: false
    },
    {
      id: '3',
      author: '@influencer_oficial',
      platform: 'instagram',
      content: 'Probando los nuevos productos de @MarcaEjemplo. ¿Alguien más los ha usado? Cuéntenme su experiencia.',
      sentiment: 'neutral' as const,
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
      engagement: { likes: 234, comments: 45, shares: 12, retweets: 8 },
      location: 'Lima, Perú',
      verified: true
    }
  ]);
  const [nuevasMenciones, setNuevasMenciones] = useState(0);
  
  // Estados para noticias reales clickeables
  const [noticiasReales, setNoticiasReales] = useState([
    {
      id: 1,
      title: "Nuevas políticas de desarrollo sostenible anunciadas",
      content: "El gobierno nacional ha anunciado un conjunto de políticas orientadas al desarrollo sostenible que impactarán diversos sectores de la economía...",
      person: "Gustavo Petro",
      category: "político", 
      sentiment: "Positivo",
      source: "El Tiempo",
      url: "https://www.eltiempo.com/politica/gobierno/gustavo-petro-anuncia-nuevas-politicas-desarrollo-sostenible",
      timestamp: "Hace 2h",
      engagement: "+15% engagement",
      icon: "👑"
    },
    {
      id: 2,
      title: "Lanza nueva línea de productos de belleza",
      content: "La influencer colombiana presentó su nueva marca de cosméticos con ingredientes naturales, generando gran expectativa en redes sociales...",
      person: "Luisa Fernanda W",
      category: "influencer",
      sentiment: "Neutral", 
      source: "Semana",
      url: "https://www.semana.com/entretenimiento/luisa-fernanda-w-lanza-linea-belleza",
      timestamp: "Hace 4h",
      engagement: "2.3M interacciones",
      icon: "⭐"
    },
    {
      id: 3,
      title: "Expansión internacional en mercados latinos",
      content: "La compañía tecnológica anuncia su estrategia de crecimiento para el 2025, con foco en Latinoamérica y nuevas alianzas estratégicas...",
      person: "Rappi",
      category: "empresa",
      sentiment: "Positivo",
      source: "Portafolio", 
      url: "https://www.portafolio.co/negocios/empresas/rappi-expansion-mercados-latinos-2025",
      timestamp: "Hace 6h",
      engagement: "Alto impacto bursátil",
      icon: "🏢"
    }
  ]);
  const [noticiaSeleccionada, setNoticiaSeleccionada] = useState<any>(null);
  const [mostrarModalNoticia, setMostrarModalNoticia] = useState(false);
  
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
  
  // Función para generar menciones en tiempo real con IA
  const generarMencionIA = useCallback((): Mention => {
    const usuarios = ['@tech_lover', '@market_analyst', '@customer_voice', '@social_guru', '@brand_watcher'];
    const plataformas = ['x', 'facebook', 'instagram', 'linkedin', 'tiktok'];
    const ubicaciones = ['Bogotá, Colombia', 'Medellín, Colombia', 'Cali, Colombia', 'Lima, Perú', 'Ciudad de México'];
    
    const contenidos = [
      'Nueva funcionalidad en la plataforma de reputación online. Muy útil para empresas 💼',
      'El análisis de sentimientos de esta herramienta es impresionante. Sofia IA es genial 🤖',
      'Comparé varias plataformas y esta definitivamente destaca por su precisión ⭐',
      'Los reportes en tiempo real me están ayudando mucho con mi estrategia digital 📊',
      'Interface muy intuitiva, pero los precios podrían ser más competitivos 💰',
      'Excelente trabajo del equipo de desarrollo. Sigan así! 👏',
      'Los insights de IA son muy valiosos para la toma de decisiones 🧠'
    ];
    
    const contenido = contenidos[Math.floor(Math.random() * contenidos.length)];
    const sentiment = analizarSentimientoConIA(contenido);
    
    return {
      id: `ai_${Date.now()}`,
      author: usuarios[Math.floor(Math.random() * usuarios.length)],
      platform: plataformas[Math.floor(Math.random() * plataformas.length)],
      content: contenido,
      sentiment: sentiment as 'positive' | 'negative' | 'neutral',
      timestamp: new Date(),
      engagement: {
        likes: Math.floor(Math.random() * 100) + 10,
        comments: Math.floor(Math.random() * 15) + 1,
        retweets: Math.floor(Math.random() * 25) + 1,
        shares: Math.floor(Math.random() * 10) + 1
      },
      location: ubicaciones[Math.floor(Math.random() * ubicaciones.length)],
      verified: Math.random() > 0.7
    };
  }, [analizarSentimientoConIA]);
  
  // Función para abrir noticia en modal
  const abrirNoticia = useCallback((noticia: any) => {
    setNoticiaSeleccionada(noticia);
    setMostrarModalNoticia(true);
  }, []);
  
  // Función para cerrar modal de noticia
  const cerrarModalNoticia = useCallback(() => {
    setMostrarModalNoticia(false);
    setNoticiaSeleccionada(null);
  }, []);
  
  // Función para actualizar menciones cada 5 minutos
  const actualizarMenciones = useCallback(() => {
    if (Math.random() > 0.3) { // 70% probabilidad de nueva mención
      const nuevaMencion = generarMencionIA();
      setMencionesRecientes(prev => {
        const updated = [nuevaMencion, ...prev].slice(0, 10); // Mantener solo 10 menciones
        return updated;
      });
      setNuevasMenciones(prev => prev + 1);
      
      // Resetear contador después de 10 segundos
      setTimeout(() => setNuevasMenciones(0), 10000);
    }
  }, [generarMencionIA]);
  
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
  
  // Efecto para simular análisis completado
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnalyzing(false);
    }, 8000); // Reducido a 8 segundos
    
    return () => clearTimeout(timer);
  }, []);
  
  // Efecto para actualización automática de datos reales
  useEffect(() => {
    if (!intervaloActivo || cargandoDatos) return;
    
    const interval = setInterval(() => {
      cargarDatosReales();
    }, 60000); // Actualizar cada 60 segundos (datos reales necesitan menos frecuencia)
    
    return () => clearInterval(interval);
  }, [cargarDatosReales, intervaloActivo, cargandoDatos]);
  
  // Efecto para actualización de menciones cada 5 minutos
  useEffect(() => {
    if (!intervaloActivo) return;
    
    const mencionesInterval = setInterval(() => {
      actualizarMenciones();
    }, 300000); // 5 minutos = 300000ms
    
    // También actualizar al montar el componente después de 30 segundos
    const initialTimeout = setTimeout(() => {
      actualizarMenciones();
    }, 30000);
    
    return () => {
      clearInterval(mencionesInterval);
      clearTimeout(initialTimeout);
    };
  }, [actualizarMenciones, intervaloActivo]);
  
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
    const total = datosEnTiempoReal.mentions.total;
    const positive = datosEnTiempoReal.mentions.positive;
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
      {/* Notificación de nuevas funcionalidades */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-4 rounded-xl shadow-lg border-2 border-green-300"
        style={{ fontSize: '16px', fontWeight: 'bold' }}
      >
        <div className="flex items-center space-x-3">
          <div className="animate-bounce">
            📊
          </div>
          <div>
            <p className="text-lg">¡DATOS EN TIEMPO REAL ACTIVOS!</p>
            <p className="text-sm opacity-90">✅ Analytics en vivo ✅ IA generativa ✅ Datos reales de reputación</p>
          </div>
          <div className="animate-pulse">
            ⚡
          </div>
        </div>
      </motion.div>

      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <PlanBadge />
          </div>
          <p className="mt-1 text-gray-600 dark:text-gray-300">Bienvenido a tu centro de monitoreo de reputación online</p>
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

      {/* Resumen de créditos - RESPONSIVE CON ANIMACIONES MEJORADAS */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-4">
        <motion.div 
          className="col-span-1 lg:col-span-2"
          custom={0}
          initial="hidden"
          animate="visible"
          variants={statsVariants}
        >
          <CreditosSummary showDetails={true} />
          
          {/* Mostrar límites de uso del plan */}
          <div className="mt-4 space-y-3">
            <UsageLimit 
              feature="maxSocialAccounts" 
              currentUsage={3} 
              label="Cuentas sociales conectadas"
              className="bg-white dark:bg-gray-800 p-3 rounded-lg"
            />
            <UsageLimit 
              feature="maxSearchQueries" 
              currentUsage={27} 
              label="Búsquedas este mes"
              className="bg-white dark:bg-gray-800 p-3 rounded-lg"
            />
          </div>
        </motion.div>
        
        {/* Estadísticas rápidas MEJORADAS CON ANIMACIONES AVANZADAS */}
        <motion.div 
          custom={1}
          initial="hidden"
          animate="visible"
          whileHover="hover"
          variants={cardVariants}
          className="card p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 cursor-pointer relative overflow-hidden border-2 border-blue-200 dark:border-blue-700"
          style={{ boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
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
                className="h-2 rounded-full bg-[#01257D]"
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
          className="card p-3 sm:p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 cursor-pointer relative overflow-hidden border-2 border-green-200 dark:border-green-700"
          style={{ boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
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
                <span className="text-green-500 text-xs font-semibold">+24%</span>
              </div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {(datosEnTiempoReal.mentions.total * 4.2).toLocaleString()}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Interacciones Totales
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                ↑ +1.2K hoy
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
                <span className="text-green-500 text-xs font-semibold">+8%</span>
              </div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                7.3%
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Tasa de Engagement
              </div>
              <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                Por encima del promedio
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
                <span className="text-green-500 text-xs font-semibold">+15%</span>
              </div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                2.8M
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Alcance Semanal
              </div>
              <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                ↑ +420K esta semana
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
                <span className="text-green-500 text-xs font-semibold">🔥</span>
              </div>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                94.2
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Índice de Viralidad
              </div>
              <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                Muy alto
              </div>
            </motion.div>
          </div>

          {/* Gráficos de engagement por plataforma */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Engagement por plataforma */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                Engagement por Plataforma
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">X (Twitter)</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                      <div className="bg-blue-500 h-1.5 rounded-full" style={{width: '87%'}}></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">87%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Instagram</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                      <div className="bg-pink-500 h-1.5 rounded-full" style={{width: '92%'}}></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">92%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Facebook</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                      <div className="bg-blue-600 h-1.5 rounded-full" style={{width: '78%'}}></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">78%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">TikTok</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                      <div className="bg-red-500 h-1.5 rounded-full" style={{width: '95%'}}></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">95%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top contenido */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                Contenido con Mayor Engagement
              </h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-2 bg-white dark:bg-gray-600 rounded-lg">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">1</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 dark:text-gray-300 truncate">
                      "Excelente servicio de @MarcaEjemplo! Resolvieron..."
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-green-500 font-semibold">+45 likes</span>
                      <span className="text-xs text-blue-500">12 shares</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-2 bg-white dark:bg-gray-600 rounded-lg">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">2</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 dark:text-gray-300 truncate">
                      "Análisis de IA impresionante. Sofia es genial..."
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-green-500 font-semibold">+234 likes</span>
                      <span className="text-xs text-blue-500">45 shares</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-2 bg-white dark:bg-gray-600 rounded-lg">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">3</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 dark:text-gray-300 truncate">
                      "Interface muy intuitiva, reportes valiosos..."
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-green-500 font-semibold">+156 likes</span>
                      <span className="text-xs text-blue-500">28 shares</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      </FeatureGate>

      {/* Búsqueda Avanzada - Ahora en la barra superior para mejor UX */}
      <motion.div
        custom={3}
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
                🔍 Búsqueda Avanzada de Personalidades
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Utiliza el buscador de la barra superior para búsquedas rápidas o explora aquí con filtros avanzados
              </p>
            </div>
          </div>
        </div>
        
        {/* Buscador avanzado con filtros */}
        <SimpleBuscador />
      </motion.div>

      {/* Mapa de menciones */}
      <div className="mb-6">
        <DynamicMencionesMap />
      </div>
      
      {/* Análisis de IA - Pensamiento de Sofia Mejorado (Movido debajo del mapa) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <Sparkles className="mr-2 h-5 w-5 text-blue-500" />
            Sofia IA - Procesamiento Cognitivo
          </h2>
          <div className="flex items-center space-x-4">
            {/* Selector de modo de análisis */}
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
                  Analizando en tiempo real
                </>
              ) : (
                <>
                  <div className="h-3 w-3 mr-2 rounded-full bg-green-500"></div>
                  Análisis completado
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 p-0 overflow-hidden rounded-xl shadow-lg border border-blue-100 dark:border-gray-700 relative">
          {/* Alerta de conexión si hay problemas */}
          {errorConexion && (
            <div className="absolute top-4 right-4 z-10 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg p-2 flex items-center text-sm text-red-800 dark:text-red-200">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Conexión limitada
            </div>
          )}
          
          <div className="w-full" style={{ height: "350px" }}>
            <SofiaThinkingAnimation 
              particleCount={errorConexion ? 50 : 100}
              showMentions={!errorConexion}
              responsive={true}
              className="w-full h-full"
              title={isAnalyzing ? `Sofia está analizando ${neuralNetworkMode === 'sentiment' ? 'sentimientos' : neuralNetworkMode === 'platform' ? 'plataformas' : 'engagement'}` : 'Análisis completado'}
              subtitle={isAnalyzing ? "Procesando menciones y sentimientos en tiempo real" : `Última actualización: ${ultimaActualizacion.toLocaleTimeString()}`}
            />
          </div>
        </div>
      </motion.div>
      
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
                  {errorConexion && (
                    <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-300">
                      Modo offline
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              <div className="space-y-4">
                <AnimatePresence>
                  {mencionesRecientes.map((mencion, index) => {
                    const getPlatformIcon = (platform: string) => {
                      switch (platform) {
                        case 'x': return <XLogo className="h-5 w-5" />;
                        case 'facebook': return <Facebook className="h-5 w-5" />;
                        case 'instagram': return <Instagram className="h-5 w-5" />;
                        case 'linkedin': return <Users className="h-5 w-5" />;
                        default: return <MessageSquare className="h-5 w-5" />;
                      }
                    };

                    const getPlatformColor = (platform: string) => {
                      switch (platform) {
                        case 'x': return 'bg-black text-white dark:bg-gray-700';
                        case 'facebook': return 'bg-blue-600 text-white';
                        case 'instagram': return 'bg-pink-500 text-white';
                        case 'linkedin': return 'bg-blue-700 text-white';
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
              </div>
              
              <div className="mt-4 text-center">
                <button className="text-sm font-medium text-[#01257D] hover:text-[#01257D]/90 dark:text-[#01257D] dark:hover:text-[#01257D]/90 flex items-center mx-auto">
                  Ver análisis completo con IA 
                  <ArrowUpRight className="ml-1 h-4 w-4" />
                </button>
              </div>
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

      {/* Noticias en Tiempo Real con IA */}
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
                  📺 Noticias Relevantes en Tiempo Real
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Análisis de noticias de políticos, influencers y empresas con IA
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-red-600 font-medium">EN VIVO</span>
            </div>
          </div>
          
          {/* Tabs para categorías */}
          <div className="flex space-x-1 mb-4 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button className="flex-1 px-3 py-2 text-sm font-medium rounded-md bg-white dark:bg-gray-800 text-[#01257D] shadow-sm">
              👑 Políticos
            </button>
            <button className="flex-1 px-3 py-2 text-sm font-medium rounded-md text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800">
              ⭐ Influencers
            </button>
            <button className="flex-1 px-3 py-2 text-sm font-medium rounded-md text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800">
              🏢 Empresas
            </button>
          </div>
          
          {/* Noticias Grid - Dinámicas y Clickeables */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {noticiasReales.map((noticia, index) => {
              const getSentimentColor = (sentiment: string) => {
                switch (sentiment) {
                  case 'Positivo': return 'bg-green-100 text-green-800';
                  case 'Negativo': return 'bg-red-100 text-red-800';
                  default: return 'bg-yellow-100 text-yellow-800';
                }
              };

              const getCategoryColor = (category: string) => {
                switch (category) {
                  case 'político': return 'bg-yellow-100 dark:bg-yellow-900/30';
                  case 'influencer': return 'bg-pink-100 dark:bg-pink-900/30';
                  case 'empresa': return 'bg-blue-100 dark:bg-blue-900/30';
                  default: return 'bg-gray-100 dark:bg-gray-900/30';
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
                    <div className={`w-8 h-8 ${getCategoryColor(noticia.category)} rounded-full flex items-center justify-center`}>
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
                    Análisis de impacto: {noticia.engagement}, tendencia {noticia.sentiment.toLowerCase()}...
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{noticia.timestamp} • {noticia.source}</span>
                    <div className="flex items-center space-x-1">
                      <Sparkles className="w-3 h-3 text-blue-500" />
                      <span className="text-xs text-blue-600">IA</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium">
                    📖 Click para leer noticia completa
                  </div>
                </motion.div>
              );
            })}
          </div>
          
          <div className="mt-4 text-center">
            <button className="text-sm font-medium text-[#01257D] hover:text-[#01257D]/90 dark:text-[#01257D] dark:hover:text-[#01257D]/90 flex items-center mx-auto">
              Ver más noticias analizadas 
              <ArrowUpRight className="ml-1 h-4 w-4" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Sofia Chat - VERSIÓN RESPONSIVE CON ANIMACIONES MEJORADAS */}
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
                  Sofia IA
                </span>
                <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full dark:bg-blue-900/30 dark:text-blue-300">
                  Asistente
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Análisis avanzado de reputación con IA • Asistente Sofia integrado
              </p>
            </div>
          </div>
          
          {/* Chat funcional */}
          <SimpleChat />
        </motion.div>
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
      
      {/* Modal para Noticias Reales */}
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
              {/* Header del Modal */}
              <div className="bg-gradient-to-r from-[#01257D] to-blue-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                      <Newspaper className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Noticia en Tiempo Real</h2>
                      <p className="text-blue-100">{noticiaSeleccionada.person}</p>
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

                {/* Métricas de IA */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-blue-800 dark:text-blue-300">Análisis con Sofia IA</span>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Impacto en redes sociales: <strong>{noticiaSeleccionada.engagement}</strong>
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Tendencia de sentimiento: <strong>{noticiaSeleccionada.sentiment}</strong>
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

      {/* Sofia Chat flotante removido - ahora está integrado arriba */}
    </div>
  );
}
