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
  MessageSquare, Heart, Share2, Users, Eye, BarChart3
} from 'lucide-react';
import XLogo from '@/components/icons/XLogo';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

// Datos de ejemplo para los gráficos
const datosSentimiento = [
  { name: 'Positivo', value: 65, color: '#10b981' },
  { name: 'Neutro', value: 25, color: '#6b7280' },
  { name: 'Negativo', value: 10, color: '#ef4444' },
];

const datosPlataformas = [
  { name: 'X', value: 45, color: '#000000' },
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

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
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Análisis de Reputación</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Visualiza y analiza los datos de tu reputación online
          </p>
        </div>
        <div className="mt-4 flex space-x-3 md:mt-0">
          <Button variant="outline" size="sm" className="flex items-center">
            <Filter className="mr-2 h-4 w-4" />
            Filtrar
          </Button>
          <Button variant="outline" size="sm" className="flex items-center">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Pestañas de navegación */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="sentimiento">Sentimiento</TabsTrigger>
          <TabsTrigger value="menciones">Menciones</TabsTrigger>
          <TabsTrigger value="plataformas">Plataformas</TabsTrigger>
          <TabsTrigger value="ia-analysis">
            <div className="flex items-center">
              <Brain className="mr-1 h-4 w-4" />
              Análisis de IA
            </div>
          </TabsTrigger>
        </TabsList>
        
        {/* Pestaña de Resumen */}
        <TabsContent value="resumen" className="space-y-6">
          {/* Tarjetas de métricas */}
          <motion.div 
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
            variants={itemVariants}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Menciones Totales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,248</div>
                <div className="mt-1 flex items-center text-xs">
                  <TrendIndicator value={12} />
                  <span className="ml-2 text-gray-500">vs. mes anterior</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Sentimiento Positivo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">65%</div>
                <div className="mt-1 flex items-center text-xs">
                  <TrendIndicator value={5} />
                  <span className="ml-2 text-gray-500">vs. mes anterior</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Plataforma Principal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <XLogo className="h-5 w-5 mr-2" />
                  <span className="text-2xl font-bold">X</span>
                </div>
                <div className="mt-1 flex items-center text-xs">
                  <span className="text-gray-500">45% del total de menciones</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Alcance Estimado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">125K</div>
                <div className="mt-1 flex items-center text-xs">
                  <TrendIndicator value={8} />
                  <span className="ml-2 text-gray-500">vs. mes anterior</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Gráficos principales */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle>Análisis de Sentimiento</CardTitle>
                  <CardDescription>Distribución de menciones por sentimiento</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={datosSentimiento}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {datosSentimiento.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle>Distribución por Plataformas</CardTitle>
                  <CardDescription>Menciones por red social</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
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
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
          
          {/* Evolución temporal */}
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
            </Card>
          </motion.div>
        </TabsContent>
        
        {/* Pestaña de Sentimiento */}
        <TabsContent value="sentimiento" className="space-y-6">
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle>Análisis de Sentimiento</CardTitle>
                <CardDescription>Distribución detallada del sentimiento en las menciones</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="flex flex-col items-center justify-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
                    <h3 className="text-xl font-bold text-green-600 dark:text-green-400">65%</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Menciones Positivas</p>
                    <div className="mt-2 flex items-center text-xs">
                      <TrendIndicator value={5} />
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <Minus className="h-8 w-8 text-gray-500 mb-2" />
                    <h3 className="text-xl font-bold text-gray-600 dark:text-gray-400">25%</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Menciones Neutras</p>
                    <div className="mt-2 flex items-center text-xs">
                      <TrendIndicator value={-3} />
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
                    <h3 className="text-xl font-bold text-red-600 dark:text-red-400">10%</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Menciones Negativas</p>
                    <div className="mt-2 flex items-center text-xs">
                      <TrendIndicator value={-2} />
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={datosEvolucionSentimiento}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="positivo" stroke="#10b981" strokeWidth={2} />
                      <Line type="monotone" dataKey="neutro" stroke="#6b7280" strokeWidth={2} />
                      <Line type="monotone" dataKey="negativo" stroke="#ef4444" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
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
        
        {/* Pestaña de Análisis de IA */}
        <TabsContent value="ia-analysis" className="space-y-6">
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sparkles className="mr-2 h-5 w-5 text-blue-500" />
                  Análisis de Sentimiento por IA
                </CardTitle>
                <CardDescription>
                  Análisis avanzado utilizando OpenAI para detectar emociones y sentimientos en menciones
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-3">Analizando datos con IA...</span>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Métricas de Sentimiento */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Distribución de Sentimientos
                      </h3>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                            <span className="font-medium">Positivo</span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-green-600">
                              {analysisData?.sentimentDistribution?.positive || 68}%
                            </div>
                            <div className="text-xs text-gray-500">
                              {Math.round((analysisData?.sentimentDistribution?.positive || 68) * 12.48)} menciones
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-gray-500 rounded-full mr-3"></div>
                            <span className="font-medium">Neutral</span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-gray-600">
                              {analysisData?.sentimentDistribution?.neutral || 22}%
                            </div>
                            <div className="text-xs text-gray-500">
                              {Math.round((analysisData?.sentimentDistribution?.neutral || 22) * 12.48)} menciones
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                            <span className="font-medium">Negativo</span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-red-600">
                              {analysisData?.sentimentDistribution?.negative || 10}%
                            </div>
                            <div className="text-xs text-gray-500">
                              {Math.round((analysisData?.sentimentDistribution?.negative || 10) * 12.48)} menciones
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Score de Sentimiento */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center">
                        <Brain className="mr-2 h-4 w-4" />
                        Score de Sentimiento
                      </h3>
                      
                      <div className="text-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="text-4xl font-bold text-blue-600 mb-2">
                          {analysisData?.averageScore || 7.2}/10
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          Score promedio de sentimiento
                        </div>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          {(analysisData?.averageScore || 7.2) >= 7 ? 'Excelente' : 
                           (analysisData?.averageScore || 7.2) >= 5 ? 'Bueno' : 'Necesita atención'}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Tendencia</span>
                          <span className="flex items-center text-green-600">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            +0.8 este mes
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(analysisData?.averageScore || 7.2) * 10}%` }}
                          ></div>
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="mr-2 h-5 w-5 text-purple-500" />
                  Análisis de Contenido
                </CardTitle>
                <CardDescription>
                  Palabras clave y emociones más frecuentes detectadas por IA
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Palabras Clave */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Palabras Clave Principales</h3>
                    <div className="flex flex-wrap gap-2">
                      {(analysisData?.topKeywords || ['excelente', 'calidad', 'servicio', 'recomendado', 'profesional', 'rápido']).map((keyword: string, index: number) => (
                        <Badge key={index} variant="outline" className="px-3 py-1">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  {/* Emociones */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Emociones Detectadas</h3>
                    <div className="space-y-3">
                      {(analysisData?.topEmotions || [
                        { emotion: 'Satisfacción', percentage: 45 },
                        { emotion: 'Confianza', percentage: 32 },
                        { emotion: 'Entusiasmo', percentage: 23 },
                        { emotion: 'Preocupación', percentage: 12 }
                      ]).map((item: any, index: number) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{item.emotion}</span>
                          <div className="flex items-center">
                            <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-purple-600 h-2 rounded-full" 
                                style={{ width: `${item.percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600">{item.percentage}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Análisis de Engagement */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Heart className="mr-2 h-5 w-5 text-red-500" />
                  Métricas de Engagement
                </CardTitle>
                <CardDescription>
                  Análisis de interacciones y engagement por plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
                    <Heart className="h-8 w-8 text-pink-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold">
                      {socialData?.totalLikes || 1847}
                    </div>
                    <div className="text-sm text-gray-600">Total Likes</div>
                  </div>
                  
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Share2 className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold">
                      {socialData?.totalShares || 523}
                    </div>
                    <div className="text-sm text-gray-600">Total Shares</div>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <MessageSquare className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold">
                      {socialData?.totalComments || 314}
                    </div>
                    <div className="text-sm text-gray-600">Total Comments</div>
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
