"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useUser } from '@/context/UserContext';
import { FileText, ChevronRight, Download, BarChart2, User, Calendar, CreditCard, RefreshCw, TrendingUp, Activity, Newspaper } from 'lucide-react';
import { ReportGenerator, ReportData } from '@/lib/reportGenerator';
import Image from 'next/image';
import { toast } from 'sonner';

export default function ReportesCreditosPage() {
  const { user } = useUser();
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  // Configuración de animaciones
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
      transition: { duration: 0.5 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
    hover: { scale: 1.02, transition: { duration: 0.2 } }
  };

  // Reportes predefinidos con diseño mejorado
  const reportesPredefinidos = [
    {
      id: 'mensual-general',
      titulo: 'Reporte Mensual',
      descripcion: 'Consumo detallado de créditos del último mes',
      icono: <BarChart2 className="h-6 w-6" />,
      color: '#01257D',
      bgGradient: 'from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20',
      borderColor: 'border-blue-200 dark:border-blue-700',
      stats: 'Ver detalle',
    },
    {
      id: 'canales-sociales',
      titulo: 'Consumo por Canales',
      descripcion: 'Desglose de créditos por cada red social',
      icono: <BarChart2 className="h-6 w-6" />,
      color: '#059669',
      bgGradient: 'from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-900/20',
      borderColor: 'border-emerald-200 dark:border-emerald-700',
      stats: 'Ver detalle',
    },
    {
      id: 'tendencias-trimestre',
      titulo: 'Tendencias Trimestrales',
      descripcion: 'Analisis comparativo de los ultimos 3 meses',
      icono: <BarChart2 className="h-6 w-6" />,
      color: '#8B5CF6',
      bgGradient: 'from-purple-50 to-violet-100 dark:from-purple-900/20 dark:to-violet-900/20',
      borderColor: 'border-purple-200 dark:border-purple-700',
      stats: 'Ver detalle',
    },
    {
      id: 'noticias-tiempo-real',
      titulo: 'Noticias en Tiempo Real',
      descripcion: 'Resumen de noticias recientes monitoreadas en los ultimos 7 dias',
      icono: <Newspaper className="h-6 w-6" />,
      color: '#0891B2',
      bgGradient: 'from-cyan-50 to-sky-100 dark:from-cyan-900/20 dark:to-sky-900/20',
      borderColor: 'border-cyan-200 dark:border-cyan-700',
      stats: 'Ultimos 7 dias',
      isNew: true
    }
  ];

  const generatePersonalizedReport = async (reportType: string) => {
    if (!user) return;
    
    setIsGenerating(true);
    setSelectedReport(reportType);
    
    try {
      // Mapear tipos de reporte
      const tipoReporte = reportType === 'mensual-general' ? 'completo' :
                         reportType === 'canales-sociales' ? 'canales' :
                         reportType === 'tendencias-trimestre' ? 'tendencia' :
                         'completo';

      // Crear reporte con datos reales del usuario
      const reportData: ReportData = {
        tipo: tipoReporte as any,
        formato: 'pdf',
        periodo: reportType === 'tendencias-trimestre' ? 'trimestre' : 'mes',
        usuario: {
          nombre: user.name,
          email: user.email,
          plan: user.plan,
          creditos: user.credits
        }
      };

      console.log('Generando reporte personalizado:', reportData);
      
      // Generar y descargar usando el servicio real
      await ReportGenerator.generateAndDownload(reportData);
      toast.success('Reporte generado', { description: 'La descarga comenzará en un momento.' });

    } catch (error) {
      console.error('Error generando reporte:', error);
      toast.error('No se pudo generar el reporte', { description: 'Por favor, inténtalo de nuevo.' });
    } finally {
      setIsGenerating(false);
      setSelectedReport(null);
    }
  };

  return (
    <motion.div
      className="container mx-auto px-4 py-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header heroico mejorado */}
      <motion.div 
        className="bg-gradient-to-r from-[#01257D] via-purple-600 to-indigo-600 rounded-2xl p-8 mb-8"
        variants={itemVariants}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-3 flex items-center">
              <motion.div
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 4 }}
              >
                <FileText className="mr-4 h-9 w-9" />
              </motion.div>
              Reportes de Creditos
            </h1>
            <p className="text-blue-100 text-base mb-6 lg:mb-0">
              Genera reportes personalizados con analisis detallado de consumo
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
            <div className="text-center">
              <BarChart2 className="h-8 w-8 mx-auto text-white mb-2" />
              <div className="text-2xl font-bold text-white">--</div>
              <div className="text-sm text-blue-200">Reportes</div>
            </div>
            <div className="text-center">
              <TrendingUp className="h-8 w-8 mx-auto text-white mb-2" />
              <div className="text-2xl font-bold text-white">--</div>
              <div className="text-sm text-blue-200">Eficiencia</div>
            </div>
            <div className="text-center">
              <Activity className="h-8 w-8 mx-auto text-white mb-2" />
              <div className="text-2xl font-bold text-white">{user?.credits || 0}</div>
              <div className="text-sm text-blue-200">Créditos</div>
            </div>
            <div className="text-center">
              <User className="h-8 w-8 mx-auto text-white mb-2" />
              <div className="text-lg font-bold text-white">{user?.plan || 'Basic'}</div>
              <div className="text-sm text-blue-200">Plan</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Migas de pan mejoradas */}
      <motion.div variants={itemVariants} className="mb-8">
        <nav className="flex items-center text-sm text-gray-500 dark:text-gray-400 bg-white/70 dark:bg-gray-800/70 rounded-xl p-4 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
          <a href="/dashboard" className="hover:text-[#01257D] dark:hover:text-blue-400 font-medium transition-colors duration-200">
            Dashboard
          </a>
          <ChevronRight className="mx-2 h-4 w-4" />
          <a href="/dashboard/creditos" className="hover:text-[#01257D] dark:hover:text-blue-400 font-medium transition-colors duration-200">
            Creditos
          </a>
          <ChevronRight className="mx-2 h-4 w-4" />
          <span className="text-[#01257D] dark:text-white font-semibold">
            Reportes
          </span>
        </nav>
      </motion.div>

      {/* Reportes predefinidos mejorados */}
      <motion.div variants={itemVariants}>
        <motion.div 
          className="bg-gradient-to-br from-white via-gray-50/50 to-blue-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-blue-900/10 rounded-2xl border-0 shadow-2xl overflow-hidden"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover="hover"
        >
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white p-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold flex items-center">
                <FileText className="mr-3 h-7 w-7" />
                Reportes Predefinidos
              </h2>
              {isGenerating && (
                <div className="relative">
                  <div className="animate-spin h-8 w-8 border-4 border-white/30 border-t-white rounded-full"></div>
                  <Activity className="absolute inset-0 m-auto h-4 w-4 text-white animate-pulse" />
                </div>
              )}
            </div>
            <p className="text-emerald-100 text-base">
              Selecciona el tipo de reporte que necesitas generar
            </p>
          </div>
          
          <div className="p-8">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {reportesPredefinidos.map((reporte, index) => (
                <motion.div 
                  key={reporte.id}
                  className={`relative overflow-hidden bg-gradient-to-br ${reporte.bgGradient} rounded-2xl p-6 border-2 ${reporte.borderColor} hover:shadow-xl transition-all duration-300 cursor-pointer`}
                  whileHover={{ y: -4, boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => generatePersonalizedReport(reporte.id)}
                >
                  {/* Badge NUEVO */}
                  {(reporte as any).isNew && (
                    <motion.div
                      className="absolute top-2 right-2 bg-cyan-500 text-white text-xs font-bold px-2 py-0.5 rounded-full"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      NUEVO
                    </motion.div>
                  )}

                  {/* Header del reporte */}
                  <div className="flex items-center mb-4">
                    <div
                      className="h-12 w-12 rounded-xl flex items-center justify-center text-white shadow-lg"
                      style={{ backgroundColor: reporte.color }}
                    >
                      {reporte.icono}
                    </div>
                    <div className="ml-3 flex-1">
                      <h3 className="font-bold text-[#01257D] dark:text-white text-lg">
                        {reporte.titulo}
                      </h3>
                    </div>
                  </div>

                  {/* Descripción */}
                  <p className="text-gray-700 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                    {reporte.descripcion}
                  </p>

                  {/* Estadísticas */}
                  <div className="bg-white/70 dark:bg-gray-700/70 rounded-xl p-3 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Estado</span>
                      <span className="text-sm font-bold" style={{ color: reporte.color }}>
                        {reporte.stats}
                      </span>
                    </div>
                  </div>

                  {/* Botón de descarga */}
                  <button 
                    disabled={isGenerating}
                    className={`w-full inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-bold text-white shadow-lg transition-all duration-300 ${
                      isGenerating && selectedReport === reporte.id
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'hover:shadow-xl transform hover:scale-105'
                    }`}
                    style={{ 
                      backgroundColor: isGenerating && selectedReport === reporte.id ? '#6B7280' : reporte.color 
                    }}
                  >
                    {isGenerating && selectedReport === reporte.id ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Descargar
                      </>
                    )}
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Historial de reportes */}
      <motion.div variants={itemVariants} className="mt-8">
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
          whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}
        >
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 mr-3">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Historial de Reportes</h2>
            </div>
          </div>

          <div className="text-center py-10">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <FileText className="h-14 w-14 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            </motion.div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">No hay reportes generados aun</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Genera tu primer reporte desde las opciones de arriba</p>
          </div>
        </motion.div>
      </motion.div>

    </motion.div>
  );
}
