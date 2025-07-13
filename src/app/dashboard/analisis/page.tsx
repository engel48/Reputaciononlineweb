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
  Facebook, Instagram, Linkedin, Download, Filter, Sparkles, Brain,
  MessageSquare, Heart, Share2, Users, Eye, BarChart3, Globe, Activity, AlertTriangle
} from 'lucide-react';
import XLogo from '@/components/icons/XLogo';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

// Datos de ejemplo para los gráficos - Paleta de la plataforma
const datosSentimiento = [
  { name: 'Positivo', value: 65, color: '#059669' },
  { name: 'Neutro', value: 25, color: '#01257D' },
  { name: 'Negativo', value: 10, color: '#DC2626' },
];

const datosPlataformas = [
  { name: 'X', value: 45, color: '#1F2937' },
  { name: 'Facebook', value: 25, color: '#1877F2' },
  { name: 'Instagram', value: 18, color: '#E4405F' },
  { name: 'LinkedIn', value: 12, color: '#0A66C2' },
];

const datosMenciones = [
  { fecha: 'Ene', X: 65, Facebook: 40, Instagram: 25, LinkedIn: 18 },
  { fecha: 'Feb', X: 59, Facebook: 45, Instagram: 28, LinkedIn: 20 },
  { fecha: 'Mar', X: 80, Facebook: 50, Instagram: 35, LinkedIn: 25 },
  { fecha: 'Abr', X: 81, Facebook: 55, Instagram: 40, LinkedIn: 30 },
  { fecha: 'May', X: 56, Facebook: 48, Instagram: 38, LinkedIn: 28 },
  { fecha: 'Jun', X: 55, Facebook: 42, Instagram: 30, LinkedIn: 25 },
  { fecha: 'Jul', X: 70, Facebook: 47, Instagram: 32, LinkedIn: 26 },
];

const datosEvolucionSentimiento = [
  { mes: 'Ene', positivo: 45, neutro: 40, negativo: 15 },
  { mes: 'Feb', positivo: 50, neutro: 35, negativo: 15 },
  { mes: 'Mar', positivo: 55, neutro: 30, negativo: 15 },
  { mes: 'Abr', positivo: 60, neutro: 30, negativo: 10 },
  { mes: 'May', positivo: 65, neutro: 25, negativo: 10 },
  { mes: 'Jun', positivo: 60, neutro: 30, negativo: 10 },
];

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
    case 'linkedin':
      return <Linkedin className="h-4 w-4 text-[#0A66C2]" />;
    default:
      return null;
  }
};

export default function AnalisisPage() {
  const [activeTab, setActiveTab] = useState('resumen');
  const [socialData, setSocialData] = useState<any>(null);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar datos de social listening
  useEffect(() => {
    const fetchSocialData = async () => {
      try {
        setIsLoading(true);
        
        // Cargar datos de redes sociales conectadas
        const socialResponse = await fetch('/api/social-listening/analysis');
        if (socialResponse.ok) {
          const data = await socialResponse.json();
          setSocialData(data);
        }

        // Cargar análisis de sentimiento
        const analysisResponse = await fetch('/api/social-listening/analysis');
        if (analysisResponse.ok) {
          const analysis = await analysisResponse.json();
          setAnalysisData(analysis);
        }
      } catch (error) {
        console.error('Error cargando datos de análisis:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSocialData();
  }, []);

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
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Análisis de Reputación</h1>
            <p className="text-blue-100">
              📊 Visualiza y analiza los datos de tu reputación online con Julia IA
            </p>
          </div>
          <div className="mt-4 flex space-x-3 md:mt-0">
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

      {/* Pestañas de navegación */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 bg-white/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 p-1 rounded-xl">
          <TabsTrigger value="resumen" className="data-[state=active]:bg-[#01257D] data-[state=active]:text-white text-gray-600 font-medium px-6 py-2 rounded-lg transition-all">
            📊 Resumen
          </TabsTrigger>
          <TabsTrigger value="sentimiento" className="data-[state=active]:bg-[#01257D] data-[state=active]:text-white text-gray-600 font-medium px-6 py-2 rounded-lg transition-all">
            💭 Sentimiento
          </TabsTrigger>
          <TabsTrigger value="menciones" className="data-[state=active]:bg-[#01257D] data-[state=active]:text-white text-gray-600 font-medium px-6 py-2 rounded-lg transition-all">
            📝 Menciones
          </TabsTrigger>
          <TabsTrigger value="plataformas" className="data-[state=active]:bg-[#01257D] data-[state=active]:text-white text-gray-600 font-medium px-6 py-2 rounded-lg transition-all">
            🌐 Plataformas
          </TabsTrigger>
          <TabsTrigger value="ia-analysis" className="data-[state=active]:bg-[#01257D] data-[state=active]:text-white text-gray-600 font-medium px-6 py-2 rounded-lg transition-all">
            <div className="flex items-center">
              <Brain className="mr-1 h-4 w-4" />
              🤖 Julia IA
            </div>
          </TabsTrigger>
        </TabsList>
        
        {/* Pestaña de Resumen */}
        <TabsContent value="resumen" className="space-y-6">
          {/* Tarjetas de métricas mejoradas */}
          <motion.div 
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
            variants={itemVariants}
          >
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-[#01257D] dark:text-blue-300 flex items-center">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Menciones Totales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#01257D] dark:text-white">1,248</div>
                <div className="mt-2 flex items-center text-xs">
                  <TrendIndicator value={12} />
                  <span className="ml-2 text-gray-600 dark:text-gray-300">vs. mes anterior</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-800/20 hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300 flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Sentimiento Positivo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">65%</div>
                <div className="mt-2 flex items-center text-xs">
                  <TrendIndicator value={5} />
                  <span className="ml-2 text-gray-600 dark:text-gray-300">vs. mes anterior</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/20 dark:to-violet-800/20 hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-violet-700 dark:text-violet-300 flex items-center">
                  <Globe className="mr-2 h-4 w-4" />
                  Plataforma Principal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <XLogo className="h-6 w-6 mr-3" />
                  <span className="text-3xl font-bold text-violet-600 dark:text-violet-400">X</span>
                </div>
                <div className="mt-2 flex items-center text-xs">
                  <span className="text-gray-600 dark:text-gray-300">45% del total de menciones</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-800/20 hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300 flex items-center">
                  <Users className="mr-2 h-4 w-4" />
                  Alcance Estimado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">125K</div>
                <div className="mt-2 flex items-center text-xs">
                  <TrendIndicator value={8} />
                  <span className="ml-2 text-gray-600 dark:text-gray-300">vs. mes anterior</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Gráficos principales mejorados */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <motion.div variants={itemVariants}>
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm dark:bg-gray-900/80 hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-emerald-500 to-blue-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center text-lg">
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Análisis de Sentimiento
                  </CardTitle>
                  <CardDescription className="text-emerald-100">
                    Distribución de menciones por sentimiento con Julia IA
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={datosSentimiento}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={90}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          stroke="#ffffff"
                          strokeWidth={3}
                        >
                          {datosSentimiento.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: '#01257D',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                          }}
                        />
                        <Legend 
                          wrapperStyle={{
                            paddingTop: '20px',
                            fontSize: '14px',
                            fontWeight: '500'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm dark:bg-gray-900/80 hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center text-lg">
                    <Globe className="mr-2 h-5 w-5" />
                    Distribución por Plataformas
                  </CardTitle>
                  <CardDescription className="text-purple-100">
                    Menciones por red social y engagement
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={datosPlataformas}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={90}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          stroke="#ffffff"
                          strokeWidth={3}
                        >
                          {datosPlataformas.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: '#01257D',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                          }}
                        />
                        <Legend 
                          wrapperStyle={{
                            paddingTop: '20px',
                            fontSize: '14px',
                            fontWeight: '500'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
          
          {/* Evolución temporal mejorada */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm dark:bg-gray-900/80 hover:shadow-2xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-[#01257D] to-[#013AAA] text-white rounded-t-lg">
                <CardTitle className="flex items-center text-xl">
                  <BarChart3 className="mr-3 h-6 w-6" />
                  Evolución de Menciones
                </CardTitle>
                <CardDescription className="text-blue-100 mt-2">
                  📈 Menciones por plataforma en los últimos 7 meses - Análisis temporal
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-8">
                <div className="h-96 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={datosMenciones}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid 
                        strokeDasharray="3 3" 
                        stroke="#e5e7eb" 
                        opacity={0.5}
                      />
                      <XAxis 
                        dataKey="fecha" 
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
                          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                          fontSize: '14px'
                        }}
                        cursor={{ fill: 'rgba(1, 37, 125, 0.1)' }}
                      />
                      <Legend 
                        wrapperStyle={{
                          paddingTop: '30px',
                          fontSize: '14px',
                          fontWeight: '600'
                        }}
                      />
                      <Bar 
                        dataKey="X" 
                        stackId="a" 
                        fill="#1F2937" 
                        radius={[0, 0, 4, 4]}
                        name="X (Twitter)"
                      />
                      <Bar 
                        dataKey="Facebook" 
                        stackId="a" 
                        fill="#1877F2" 
                        radius={[0, 0, 0, 0]}
                        name="Facebook"
                      />
                      <Bar 
                        dataKey="Instagram" 
                        stackId="a" 
                        fill="#E4405F" 
                        radius={[0, 0, 0, 0]}
                        name="Instagram"
                      />
                      <Bar 
                        dataKey="LinkedIn" 
                        stackId="a" 
                        fill="#0A66C2" 
                        radius={[4, 4, 0, 0]}
                        name="LinkedIn"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
        
        {/* Pestaña de Sentimiento mejorada */}
        <TabsContent value="sentimiento" className="space-y-8">
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
              <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-t-lg pb-6">
                <CardTitle className="flex items-center text-2xl">
                  <Brain className="mr-3 h-7 w-7" />
                  Análisis de Sentimiento con Julia IA
                </CardTitle>
                <CardDescription className="text-emerald-100 text-lg mt-2">
                  🤖 Distribución detallada del sentimiento en las menciones procesadas por IA
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
                    Evolución Temporal del Sentimiento
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
        
        {/* Pestaña de Menciones */}
        <TabsContent value="menciones" className="space-y-6">
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle>Evolución de Menciones</CardTitle>
                <CardDescription>Menciones por plataforma en los últimos 7 meses</CardDescription>
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
                      <Bar dataKey="LinkedIn" stackId="a" fill="#0A66C2" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
              <CardFooter className="border-t bg-gray-50 px-6 py-3 dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-center justify-between w-full">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Total de menciones: <span className="font-medium">1,248</span>
                  </div>
                  <Button variant="outline" size="sm">
                    Exportar datos
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        </TabsContent>
        
        {/* Pestaña de Plataformas */}
        <TabsContent value="plataformas" className="space-y-6">
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle>Distribución por Plataformas</CardTitle>
                <CardDescription>Análisis detallado por red social</CardDescription>
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
                          {datosPlataformas.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="space-y-4">
                    {datosPlataformas.map((platform) => (
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
        
        {/* Pestaña de Análisis de Julia IA */}
        <TabsContent value="ia-analysis" className="space-y-8">
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-indigo-900/20 dark:via-gray-900 dark:to-cyan-900/20">
              <CardHeader className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white rounded-t-lg pb-8">
                <CardTitle className="flex items-center text-2xl">
                  <Brain className="mr-3 h-8 w-8" />
                  🤖 Análisis de Sentimiento con Julia IA
                </CardTitle>
                <CardDescription className="text-indigo-100 text-lg mt-3">
                  ✨ Análisis avanzado utilizando inteligencia artificial para detectar emociones y sentimientos en menciones
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-80 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl">
                    <div className="relative">
                      <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600"></div>
                      <Brain className="absolute inset-0 m-auto h-8 w-8 text-indigo-600 animate-pulse" />
                    </div>
                    <span className="mt-6 text-lg font-semibold text-indigo-700 dark:text-indigo-300">🤖 Julia IA analizando datos...</span>
                    <span className="mt-2 text-sm text-indigo-600 dark:text-indigo-400">Procesando sentimientos y emociones</span>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Métricas de Sentimiento mejoradas */}
                    <div className="space-y-6">
                      <h3 className="text-xl font-bold text-[#01257D] dark:text-white flex items-center">
                        <BarChart3 className="mr-3 h-6 w-6 text-indigo-600" />
                        📊 Distribución de Sentimientos
                      </h3>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-5 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl border-l-4 border-green-500 hover:shadow-lg transition-all duration-300">
                          <div className="flex items-center">
                            <div className="w-4 h-4 bg-green-500 rounded-full mr-4 shadow-lg"></div>
                            <span className="font-semibold text-green-800 dark:text-green-200">Positivo</span>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                              {analysisData?.sentimentDistribution?.positive || 68}%
                            </div>
                            <div className="text-sm text-green-700 dark:text-green-300">
                              {Math.round((analysisData?.sentimentDistribution?.positive || 68) * 12.48)} menciones
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
                              {analysisData?.sentimentDistribution?.neutral || 22}%
                            </div>
                            <div className="text-sm text-blue-700 dark:text-blue-300">
                              {Math.round((analysisData?.sentimentDistribution?.neutral || 22) * 12.48)} menciones
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
                              {analysisData?.sentimentDistribution?.negative || 10}%
                            </div>
                            <div className="text-sm text-red-700 dark:text-red-300">
                              {Math.round((analysisData?.sentimentDistribution?.negative || 10) * 12.48)} menciones
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Score de Sentimiento mejorado */}
                    <div className="space-y-6">
                      <h3 className="text-xl font-bold text-[#01257D] dark:text-white flex items-center">
                        <Brain className="mr-3 h-6 w-6 text-purple-600" />
                        📏 Score de Sentimiento Julia IA
                      </h3>
                      
                      <div className="relative text-center p-8 bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100 dark:from-purple-900/30 dark:via-blue-900/30 dark:to-indigo-900/30 rounded-2xl border-2 border-purple-200 dark:border-purple-700 overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-200 to-blue-200 dark:from-purple-800 dark:to-blue-800 rounded-full -translate-y-16 translate-x-16 opacity-50"></div>
                        <div className="relative z-10">
                          <div className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
                            {analysisData?.averageScore || 7.2}/10
                          </div>
                          <div className="text-lg text-purple-700 dark:text-purple-300 mb-6 font-semibold">
                            Score promedio de sentimiento
                          </div>
                          <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white text-lg px-6 py-2 shadow-lg">
                            ✨ {(analysisData?.averageScore || 7.2) >= 7 ? 'Excelente' : 
                             (analysisData?.averageScore || 7.2) >= 5 ? 'Bueno' : 'Necesita atención'}
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
                            style={{ width: `${(analysisData?.averageScore || 7.2) * 10}%` }}
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
          
          {/* Palabras Clave y Emociones mejoradas */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-violet-50 via-white to-purple-50 dark:from-violet-900/20 dark:via-gray-900 dark:to-purple-900/20">
              <CardHeader className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white rounded-t-lg pb-6">
                <CardTitle className="flex items-center text-2xl">
                  <MessageSquare className="mr-3 h-7 w-7" />
                  📝 Análisis de Contenido
                </CardTitle>
                <CardDescription className="text-violet-100 text-lg mt-2">
                  🤖 Palabras clave y emociones más frecuentes detectadas por Julia IA
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Palabras Clave mejoradas */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-[#01257D] dark:text-white mb-6 flex items-center">
                      <Sparkles className="mr-2 h-6 w-6 text-blue-500" />
                      Palabras Clave Principales
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {(analysisData?.topKeywords || ['excelente', 'calidad', 'servicio', 'recomendado', 'profesional', 'rápido']).map((keyword: string, index: number) => (
                        <Badge key={index} className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                          🏷️ {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  {/* Emociones mejoradas */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-[#01257D] dark:text-white mb-6 flex items-center">
                      <Brain className="mr-2 h-6 w-6 text-purple-500" />
                      Emociones Detectadas
                    </h3>
                    <div className="space-y-4">
                      {(analysisData?.topEmotions || [
                        { emotion: 'Satisfacción', percentage: 45 },
                        { emotion: 'Confianza', percentage: 32 },
                        { emotion: 'Entusiasmo', percentage: 23 },
                        { emotion: 'Preocupación', percentage: 12 }
                      ]).map((item: any, index: number) => (
                        <div key={index} className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-4 hover:shadow-lg transition-all duration-300">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-lg font-semibold text-purple-700 dark:text-purple-300">
                              💭 {item.emotion}
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
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Análisis de Engagement mejorado */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-rose-50 via-white to-orange-50 dark:from-rose-900/20 dark:via-gray-900 dark:to-orange-900/20">
              <CardHeader className="bg-gradient-to-r from-rose-500 via-pink-500 to-orange-500 text-white rounded-t-lg pb-6">
                <CardTitle className="flex items-center text-2xl">
                  <Heart className="mr-3 h-7 w-7" />
                  📱 Métricas de Engagement
                </CardTitle>
                <CardDescription className="text-rose-100 text-lg mt-2">
                  📈 Análisis de interacciones y engagement por plataforma
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
                      💖 Total Likes
                    </div>
                  </div>
                  
                  <div className="text-center p-8 bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-blue-900/30 dark:to-indigo-800/30 rounded-2xl border-2 border-blue-200 dark:border-blue-700 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                    <Share2 className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                    <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                      {socialData?.totalShares || 523}
                    </div>
                    <div className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                      🔄 Total Shares
                    </div>
                  </div>
                  
                  <div className="text-center p-8 bg-gradient-to-br from-green-100 to-emerald-200 dark:from-green-900/30 dark:to-emerald-800/30 rounded-2xl border-2 border-green-200 dark:border-green-700 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                    <MessageSquare className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
                      {socialData?.totalComments || 314}
                    </div>
                    <div className="text-lg font-semibold text-green-700 dark:text-green-300">
                      💬 Total Comments
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
