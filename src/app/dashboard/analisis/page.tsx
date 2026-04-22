"use client";

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import {
  TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle,
  Facebook, Instagram, Youtube, Download, Filter, Sparkles, Brain,
  MessageSquare, Heart, Share2, Users, Eye, BarChart3, Globe, Activity, AlertTriangle, BookOpen, Info
} from 'lucide-react';
import XLogo from '@/components/icons/XLogo';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { EmptyMentionsState } from '@/components/ui/EmptyMentionsState';
import { useHasMentionsData } from '@/hooks/useHasMentionsData';

const COLORS = ['#01257D', '#013AAA', '#059669', '#DC2626', '#F59E0B', '#8B5CF6'];

interface PlatformIconProps {
  platform: string;
}

// Componente para mostrar tendencia con icono
interface TrendIndicatorProps {
  value: number;
  suffix?: string;
}

const TrendIndicator = ({ value, suffix = '%' }: TrendIndicatorProps) => {
  if (value > 0) {
    return (
      <div className="flex items-center text-green-500">
        <TrendingUp className="h-4 w-4 mr-1" />
        <span>+{value}{suffix}</span>
      </div>
    );
  } else if (value < 0) {
    return (
      <div className="flex items-center text-red-500">
        <TrendingDown className="h-4 w-4 mr-1" />
        <span>{value}{suffix}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center text-gray-500">
      <Minus className="h-4 w-4 mr-1" />
      <span>Sin cambios</span>
    </div>
  );
};

// Componente para mostrar icono de plataforma
const PlatformIcon: React.FC<PlatformIconProps> = ({ platform }) => {
  switch (platform.toLowerCase()) {
    case 'x':
      return <XLogo className="h-4 w-4" />;
    case 'facebook':
      return <Facebook className="h-4 w-4 text-[#1877F2]" />;
    case 'instagram':
      return <Instagram className="h-4 w-4 text-[#E4405F]" />;
    case 'youtube':
      return <Youtube className="h-4 w-4 text-[#FF0000]" />;
    default:
      return null;
  }
};

export default function AnalisisPage() {
  const { loading: hasDataLoading, hasAnyData } = useHasMentionsData();
  const [activeTab, setActiveTab] = useState('ia-analysis');
  const [socialData, setSocialData] = useState<any>(null);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar datos de análisis desde la API
  useEffect(() => {
    const fetchAnalysisData = async () => {
      try {
        setIsLoading(true);

        // Cargar análisis completo desde dashboard-analytics
        const response = await fetch('/api/dashboard-analytics');
        if (response.ok) {
          const data = await response.json();
          setSocialData(data);
          setAnalysisData(data.sentiment || {});
        }
      } catch (error) {
        console.error('Error cargando datos de análisis:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalysisData();
  }, []);

  // Generar datos de sentimiento desde analysisData o mostrar vacío
  const datosSentimiento = analysisData?.distribution ? [
    { name: 'Positivo', value: analysisData.distribution.positive || 0, color: '#059669' },
    { name: 'Neutro', value: analysisData.distribution.neutral || 0, color: '#01257D' },
    { name: 'Negativo', value: analysisData.distribution.negative || 0, color: '#DC2626' },
  ] : [];

  // Generar datos de plataformas desde socialData o mostrar vacío
  const datosPlataformas = socialData?.platforms ? socialData.platforms.map((p: any) => ({
    name: p.name,
    value: p.mentions || 0,
    color: p.color || '#6B7280'
  })) : [];

  // Generar datos de menciones por fecha
  const datosMenciones = socialData?.timeline || [];

  // Generar datos de evolución de sentimiento
  const datosEvolucionSentimiento = socialData?.sentimentTimeline || [];

  // Animaciones
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <motion.div
      className="container mx-auto py-6 space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Encabezado mejorado */}
      <div className="bg-gradient-to-r from-[#01257D] to-[#013AAA] rounded-2xl p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              className="p-3 bg-white/20 rounded-xl"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <motion.div
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 4 }}
              >
                <BarChart3 className="h-7 w-7 text-white" />
              </motion.div>
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold text-white">Analisis de Reputacion</h1>
              <p className="text-white/70 text-sm">
                Visualiza y analiza los datos de tu reputacion online con Julia IA
              </p>
            </div>
          </div>
          <div className="mt-4 flex space-x-3 md:mt-0" style={{ display: !hasDataLoading && !hasAnyData ? 'none' : undefined }}>
            <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm">
              <Filter className="mr-2 h-4 w-4" />
              Filtrar
            </Button>
            <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>
      </div>

      {/* Empty state si no hay datos */}
      {!hasDataLoading && !hasAnyData && (
        <EmptyMentionsState
          title="Aún no hay datos para analizar"
          description="Conecta tus redes sociales y Julia traerá menciones y sentimiento automáticamente. Los gráficos y análisis aparecerán aquí tan pronto haya actividad detectada."
        />
      )}

      {/* Pestañas de navegación */}
      {(hasDataLoading || hasAnyData) && (
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 bg-white/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 p-1 rounded-xl">
          <TabsTrigger value="ia-analysis" className="data-[state=active]:bg-[#01257D] data-[state=active]:text-white text-gray-600 font-medium px-6 py-2 rounded-lg transition-all">
            <div className="flex items-center">
              <Brain className="mr-1 h-4 w-4" />
              Julia IA
            </div>
          </TabsTrigger>
          <TabsTrigger value="sentimiento" className="data-[state=active]:bg-[#01257D] data-[state=active]:text-white text-gray-600 font-medium px-6 py-2 rounded-lg transition-all">
            Sentimiento
          </TabsTrigger>
          <TabsTrigger value="menciones" className="data-[state=active]:bg-[#01257D] data-[state=active]:text-white text-gray-600 font-medium px-6 py-2 rounded-lg transition-all">
            Menciones
          </TabsTrigger>
          <TabsTrigger value="plataformas" className="data-[state=active]:bg-[#01257D] data-[state=active]:text-white text-gray-600 font-medium px-6 py-2 rounded-lg transition-all">
            Plataformas
          </TabsTrigger>
        </TabsList>
        
        {/* Pestaña de Julia IA (primera) */}
        <TabsContent value="ia-analysis" className="space-y-8">
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-indigo-900/20 dark:via-gray-900 dark:to-cyan-900/20">
              <CardHeader className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white rounded-t-lg pb-8">
                <CardTitle className="flex items-center text-2xl">
                  <Brain className="mr-3 h-8 w-8" />
                  Analisis de Sentimiento con Julia IA
                </CardTitle>
                <CardDescription className="text-indigo-100 text-lg mt-3">
                  Julia IA es nuestra asistente de inteligencia artificial especializada en analisis de reputacion online. Utiliza procesamiento de lenguaje natural avanzado para detectar emociones, sentimientos y tendencias en las menciones de tu marca o perfil.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-80 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl">
                    <div className="relative">
                      <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600"></div>
                      <Brain className="absolute inset-0 m-auto h-8 w-8 text-indigo-600 animate-pulse" />
                    </div>
                    <span className="mt-6 text-lg font-semibold text-indigo-700 dark:text-indigo-300">Julia IA analizando datos...</span>
                    <span className="mt-2 text-sm text-indigo-600 dark:text-indigo-400">Procesando sentimientos y emociones</span>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Metricas de Sentimiento */}
                    <div className="space-y-6">
                      <h3 className="text-xl font-bold text-[#01257D] dark:text-white flex items-center">
                        <BarChart3 className="mr-3 h-6 w-6 text-indigo-600" />
                        Distribucion de Sentimientos
                      </h3>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-5 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl border-l-4 border-green-500 hover:shadow-lg transition-all duration-300">
                          <div className="flex items-center">
                            <div className="w-4 h-4 bg-green-500 rounded-full mr-4 shadow-lg"></div>
                            <span className="font-semibold text-green-800 dark:text-green-200">Positivo</span>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                              {analysisData?.sentimentDistribution?.positive || 0}%
                            </div>
                            <div className="text-sm text-green-700 dark:text-green-300">
                              {Math.round((analysisData?.sentimentDistribution?.positive || 0) * 12.48)} menciones
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-5 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl border-l-4 border-[#01257D] hover:shadow-lg transition-all duration-300">
                          <div className="flex items-center">
                            <div className="w-4 h-4 bg-[#01257D] rounded-full mr-4 shadow-lg"></div>
                            <span className="font-semibold text-[#01257D] dark:text-blue-200">Neutral</span>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-[#01257D] dark:text-blue-400">
                              {analysisData?.sentimentDistribution?.neutral || 0}%
                            </div>
                            <div className="text-sm text-blue-700 dark:text-blue-300">
                              {Math.round((analysisData?.sentimentDistribution?.neutral || 0) * 12.48)} menciones
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-5 bg-gradient-to-r from-red-100 to-rose-100 dark:from-red-900/30 dark:to-rose-900/30 rounded-xl border-l-4 border-red-500 hover:shadow-lg transition-all duration-300">
                          <div className="flex items-center">
                            <div className="w-4 h-4 bg-red-500 rounded-full mr-4 shadow-lg"></div>
                            <span className="font-semibold text-red-800 dark:text-red-200">Negativo</span>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                              {analysisData?.sentimentDistribution?.negative || 0}%
                            </div>
                            <div className="text-sm text-red-700 dark:text-red-300">
                              {Math.round((analysisData?.sentimentDistribution?.negative || 0) * 12.48)} menciones
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Score de Sentimiento */}
                    <div className="space-y-6">
                      <h3 className="text-xl font-bold text-[#01257D] dark:text-white flex items-center">
                        <Brain className="mr-3 h-6 w-6 text-purple-600" />
                        Score de Sentimiento Julia IA
                      </h3>

                      <div className="relative text-center p-8 bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100 dark:from-purple-900/30 dark:via-blue-900/30 dark:to-indigo-900/30 rounded-2xl border-2 border-purple-200 dark:border-purple-700 overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-200 to-blue-200 dark:from-purple-800 dark:to-blue-800 rounded-full -translate-y-16 translate-x-16 opacity-50"></div>
                        <div className="relative z-10">
                          <div className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
                            {analysisData?.averageScore || 0}/10
                          </div>
                          <div className="text-lg text-purple-700 dark:text-purple-300 mb-6 font-semibold">
                            Score promedio de sentimiento
                          </div>
                          <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white text-lg px-6 py-2 shadow-lg">
                            {(analysisData?.averageScore || 0) >= 7 ? 'Excelente' :
                             (analysisData?.averageScore || 0) >= 5 ? 'Bueno' : 'Necesita atencion'}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-4 bg-white/50 dark:bg-gray-800/50 rounded-xl p-6 backdrop-blur-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold text-[#01257D] dark:text-white">Tendencia del mes</span>
                          <span className="flex items-center text-green-600 font-bold text-lg">
                            <TrendingUp className="h-5 w-5 mr-2" />
                            +0.8 puntos
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 shadow-inner">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-blue-500 h-4 rounded-full shadow-lg transition-all duration-1000 ease-out"
                            style={{ width: `${(analysisData?.averageScore || 0) * 10}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                          <span>0</span>
                          <span>5</span>
                          <span>10</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Palabras Clave y Emociones */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-violet-50 via-white to-purple-50 dark:from-violet-900/20 dark:via-gray-900 dark:to-purple-900/20">
              <CardHeader className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white rounded-t-lg pb-6">
                <CardTitle className="flex items-center text-2xl">
                  <MessageSquare className="mr-3 h-7 w-7" />
                  Analisis de Contenido
                </CardTitle>
                <CardDescription className="text-violet-100 text-lg mt-2">
                  Palabras clave y emociones mas frecuentes detectadas por Julia IA
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-[#01257D] dark:text-white mb-6 flex items-center">
                      <Sparkles className="mr-2 h-6 w-6 text-blue-500" />
                      Palabras Clave Principales
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {(analysisData?.topKeywords && analysisData.topKeywords.length > 0) ? (
                        analysisData.topKeywords.map((keyword: string, index: number) => (
                          <Badge key={index} className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                            {keyword}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">Analiza contenido para ver las palabras clave principales</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-[#01257D] dark:text-white mb-6 flex items-center">
                      <Brain className="mr-2 h-6 w-6 text-purple-500" />
                      Emociones Detectadas
                    </h3>
                    <div className="space-y-4">
                      {(analysisData?.topEmotions && analysisData.topEmotions.length > 0) ? (analysisData.topEmotions).map((item: any, index: number) => (
                        <div key={index} className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-4 hover:shadow-lg transition-all duration-300">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-lg font-semibold text-purple-700 dark:text-purple-300">
                              {item.emotion}
                            </span>
                            <span className="text-xl font-bold text-purple-600 dark:text-purple-400">{item.percentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 shadow-inner">
                            <div
                              className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full shadow-lg transition-all duration-1000 ease-out"
                              style={{ width: `${item.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      )) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">Analiza contenido para ver las emociones detectadas</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Metricas de Engagement */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-rose-50 via-white to-orange-50 dark:from-rose-900/20 dark:via-gray-900 dark:to-orange-900/20">
              <CardHeader className="bg-gradient-to-r from-rose-500 via-pink-500 to-orange-500 text-white rounded-t-lg pb-6">
                <CardTitle className="flex items-center text-2xl">
                  <Heart className="mr-3 h-7 w-7" />
                  Metricas de Engagement
                </CardTitle>
                <CardDescription className="text-rose-100 text-lg mt-2">
                  Analisis de interacciones y engagement por plataforma
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-8">
                <div className="grid gap-8 md:grid-cols-3">
                  <div className="text-center p-8 bg-gradient-to-br from-pink-100 to-rose-200 dark:from-pink-900/30 dark:to-rose-800/30 rounded-2xl border-2 border-pink-200 dark:border-pink-700 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                    <Heart className="h-12 w-12 text-pink-500 mx-auto mb-4" />
                    <div className="text-4xl font-bold text-pink-600 dark:text-pink-400 mb-2">
                      {socialData?.totalLikes || 1847}
                    </div>
                    <div className="text-lg font-semibold text-pink-700 dark:text-pink-300">
                      Total Likes
                    </div>
                  </div>

                  <div className="text-center p-8 bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-blue-900/30 dark:to-indigo-800/30 rounded-2xl border-2 border-blue-200 dark:border-blue-700 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                    <Share2 className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                    <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                      {socialData?.totalShares || 523}
                    </div>
                    <div className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                      Total Shares
                    </div>
                  </div>

                  <div className="text-center p-8 bg-gradient-to-br from-green-100 to-emerald-200 dark:from-green-900/30 dark:to-emerald-800/30 rounded-2xl border-2 border-green-200 dark:border-green-700 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                    <MessageSquare className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
                      {socialData?.totalComments || 314}
                    </div>
                    <div className="text-lg font-semibold text-green-700 dark:text-green-300">
                      Total Comments
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Pestana de Sentimiento */}
        <TabsContent value="sentimiento" className="space-y-8">
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
              <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-t-lg pb-6">
                <CardTitle className="flex items-center text-2xl">
                  <Brain className="mr-3 h-7 w-7" />
                  Analisis de Sentimiento con Julia IA
                </CardTitle>
                <CardDescription className="text-emerald-100 text-lg mt-2">
                  Distribucion detallada del sentimiento en las menciones procesadas por IA
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-8">
                <div className="grid gap-8 md:grid-cols-3">
                  <div className="relative overflow-hidden flex flex-col items-center justify-center p-6 bg-gradient-to-br from-green-100 to-emerald-200 dark:from-green-900/30 dark:to-emerald-800/30 rounded-2xl border-2 border-green-200 dark:border-green-700 hover:shadow-xl transition-all duration-300">
                    <div className="absolute top-2 right-2">
                      <Sparkles className="h-5 w-5 text-green-400" />
                    </div>
                    <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                    <h3 className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">65%</h3>
                    <p className="text-lg font-semibold text-green-700 dark:text-green-300 mb-3">Menciones Positivas</p>
                    <div className="flex items-center text-sm">
                      <TrendIndicator value={5} />
                    </div>
                  </div>

                  <div className="relative overflow-hidden flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-blue-900/30 dark:to-indigo-800/30 rounded-2xl border-2 border-blue-200 dark:border-blue-700 hover:shadow-xl transition-all duration-300">
                    <div className="absolute top-2 right-2">
                      <Activity className="h-5 w-5 text-blue-400" />
                    </div>
                    <Minus className="h-12 w-12 text-[#01257D] mb-4" />
                    <h3 className="text-4xl font-bold text-[#01257D] dark:text-blue-400 mb-2">25%</h3>
                    <p className="text-lg font-semibold text-[#01257D] dark:text-blue-300 mb-3">Menciones Neutras</p>
                    <div className="flex items-center text-sm">
                      <TrendIndicator value={-3} />
                    </div>
                  </div>

                  <div className="relative overflow-hidden flex flex-col items-center justify-center p-6 bg-gradient-to-br from-red-100 to-rose-200 dark:from-red-900/30 dark:to-rose-800/30 rounded-2xl border-2 border-red-200 dark:border-red-700 hover:shadow-xl transition-all duration-300">
                    <div className="absolute top-2 right-2">
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                    </div>
                    <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                    <h3 className="text-4xl font-bold text-red-600 dark:text-red-400 mb-2">10%</h3>
                    <p className="text-lg font-semibold text-red-700 dark:text-red-300 mb-3">Menciones Negativas</p>
                    <div className="flex items-center text-sm">
                      <TrendIndicator value={-2} />
                    </div>
                  </div>
                </div>

                <div className="mt-12">
                  <h3 className="text-xl font-bold text-[#01257D] dark:text-white mb-6 flex items-center">
                    <TrendingUp className="mr-2 h-6 w-6" />
                    Evolucion Temporal del Sentimiento
                  </h3>
                  <div className="h-80 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={datosEvolucionSentimiento}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#e5e7eb"
                          opacity={0.6}
                        />
                        <XAxis
                          dataKey="mes"
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                          axisLine={{ stroke: '#01257D', strokeWidth: 2 }}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                          axisLine={{ stroke: '#01257D', strokeWidth: 2 }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#01257D',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
                          }}
                        />
                        <Legend
                          wrapperStyle={{
                            paddingTop: '20px',
                            fontSize: '14px',
                            fontWeight: '600'
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="positivo"
                          stroke="#059669"
                          strokeWidth={4}
                          dot={{ fill: '#059669', strokeWidth: 2, r: 6 }}
                          activeDot={{ r: 8, stroke: '#059669', strokeWidth: 2 }}
                          name="Positivo"
                        />
                        <Line
                          type="monotone"
                          dataKey="neutro"
                          stroke="#01257D"
                          strokeWidth={4}
                          dot={{ fill: '#01257D', strokeWidth: 2, r: 6 }}
                          activeDot={{ r: 8, stroke: '#01257D', strokeWidth: 2 }}
                          name="Neutro"
                        />
                        <Line
                          type="monotone"
                          dataKey="negativo"
                          stroke="#DC2626"
                          strokeWidth={4}
                          dot={{ fill: '#DC2626', strokeWidth: 2, r: 6 }}
                          activeDot={{ r: 8, stroke: '#DC2626', strokeWidth: 2 }}
                          name="Negativo"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Pestana de Menciones */}
        <TabsContent value="menciones" className="space-y-6">
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle>Evolucion de Menciones</CardTitle>
                <CardDescription>Menciones por plataforma en los ultimos 7 meses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={datosMenciones}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="fecha" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="X" stackId="a" fill="#000000" />
                      <Bar dataKey="Facebook" stackId="a" fill="#1877F2" />
                      <Bar dataKey="Instagram" stackId="a" fill="#E4405F" />
                      <Bar dataKey="YouTube" stackId="a" fill="#FF0000" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
              <CardFooter className="border-t bg-gray-50 px-6 py-3 dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-center justify-between w-full">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Total de menciones: <span className="font-medium">{socialData?.data?.mentions?.total?.toLocaleString() || '0'}</span>
                  </div>
                  <Button variant="outline" size="sm">
                    Exportar datos
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Pestana de Plataformas */}
        <TabsContent value="plataformas" className="space-y-6">
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle>Distribucion por Plataformas</CardTitle>
                <CardDescription>Analisis detallado por red social</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={datosPlataformas}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {datosPlataformas.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-4">
                    {datosPlataformas.map((platform: any) => (
                      <div key={platform.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center">
                          <div className="p-2 rounded-full" style={{ backgroundColor: `${platform.color}20` }}>
                            <PlatformIcon platform={platform.name} />
                          </div>
                          <span className="ml-3 font-medium">{platform.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{platform.value}%</div>
                          <div className="text-xs text-gray-500">{Math.round(platform.value * 12.48)} menciones</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
      )}

      {/* Disclaimer - Sobre Julia IA y las estadisticas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="mt-8 p-6 bg-gradient-to-r from-indigo-50 via-blue-50 to-cyan-50 dark:from-indigo-900/10 dark:via-blue-900/10 dark:to-cyan-900/10 rounded-xl border-l-4 border-indigo-500 shadow-sm"
      >
        {/* Header */}
        <div className="flex items-center space-x-2 mb-4">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Brain className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </motion.div>
          <h3 className="text-sm font-bold text-indigo-800 dark:text-indigo-300">
            Sobre Julia IA y las estadisticas
          </h3>
        </div>

        {/* Secciones informativas */}
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <Sparkles className="h-4 w-4 text-indigo-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              <span className="font-semibold text-indigo-700 dark:text-indigo-300">Como analiza Julia IA:</span> Utiliza procesamiento de lenguaje natural (PLN) avanzado, analisis linguistico profundo y modelos de inteligencia artificial entrenados en comprension textual para detectar emociones, sentimientos y tendencias en las menciones.
            </p>
          </div>

          <div className="flex items-start space-x-3">
            <BookOpen className="h-4 w-4 text-indigo-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              <span className="font-semibold text-indigo-700 dark:text-indigo-300">Entrenamiento:</span> Julia IA ha sido entrenada en analisis de lenguaje, lectura comprensiva de textos y manejo del lenguaje en contextos de reputacion digital, comunicacion y medios colombianos.
            </p>
          </div>

          <div className="flex items-start space-x-3">
            <Users className="h-4 w-4 text-indigo-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              <span className="font-semibold text-indigo-700 dark:text-indigo-300">Personalizacion:</span> Para obtener resultados precisos y adaptados a tu contexto, cada usuario debe alimentar a Julia IA con sus propios datos e informacion. Las estadisticas se basan en fuentes publicas y APIs de redes sociales.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 italic border-t border-indigo-200 dark:border-indigo-800 pt-3">
          Los resultados presentados son orientativos y no constituyen asesoria profesional. Los datos provienen de fuentes publicas disponibles al momento de la consulta.
        </p>
      </motion.div>
    </motion.div>
  );
}
