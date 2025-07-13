"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useUser } from '@/context/UserContext';
import GeneradorReportes from '@/components/creditos/GeneradorReportes';
import { FileText, ChevronRight, Download, BarChart2, User, Calendar, CreditCard, RefreshCw, TrendingUp, Activity } from 'lucide-react';
import { ReportGenerator, ReportData } from '@/lib/reportGenerator';
import Image from 'next/image';

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
      stats: '2,450 créditos',
      emoji: '📊'
    },
    {
      id: 'canales-sociales',
      titulo: 'Consumo por Canales',
      descripcion: 'Desglose de créditos por cada red social',
      icono: <BarChart2 className="h-6 w-6" />,
      color: '#059669',
      bgGradient: 'from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-900/20',
      borderColor: 'border-emerald-200 dark:border-emerald-700',
      stats: '7 canales activos',
      emoji: '📱'
    },
    {
      id: 'tendencias-trimestre',
      titulo: 'Tendencias Trimestrales',
      descripcion: 'Análisis comparativo de los últimos 3 meses',
      icono: <BarChart2 className="h-6 w-6" />,
      color: '#8B5CF6',
      bgGradient: 'from-purple-50 to-violet-100 dark:from-purple-900/20 dark:to-violet-900/20',
      borderColor: 'border-purple-200 dark:border-purple-700',
      stats: '+18% crecimiento',
      emoji: '📈'
    },
    {
      id: 'reporte-personalizado',
      titulo: 'Reporte Personalizado',
      descripcion: 'Genera un reporte específico con tus datos únicos',
      icono: <User className="h-6 w-6" />,
      color: '#F59E0B',
      bgGradient: 'from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20',
      borderColor: 'border-amber-200 dark:border-amber-700',
      stats: 'Configuración flexible',
      emoji: '⚙️'
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
      
    } catch (error) {
      console.error('Error generando reporte:', error);
      alert('Error al generar el reporte. Por favor, inténtalo de nuevo.');
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
            <h1 className="text-4xl font-bold text-white mb-3 flex items-center">
              <FileText className="mr-4 h-10 w-10" />
              📄 Reportes de Créditos
            </h1>
            <p className="text-blue-100 text-lg mb-6 lg:mb-0">
              📊 Genera reportes personalizados con análisis detallado de consumo
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
            <div className="text-center">
              <BarChart2 className="h-8 w-8 mx-auto text-white mb-2" />
              <div className="text-2xl font-bold text-white">156</div>
              <div className="text-sm text-blue-200">Reportes</div>
            </div>
            <div className="text-center">
              <TrendingUp className="h-8 w-8 mx-auto text-white mb-2" />
              <div className="text-2xl font-bold text-white">+23%</div>
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
            🏠 Dashboard
          </a>
          <ChevronRight className="mx-2 h-4 w-4" />
          <a href="/dashboard/creditos" className="hover:text-[#01257D] dark:hover:text-blue-400 font-medium transition-colors duration-200">
            💳 Créditos
          </a>
          <ChevronRight className="mx-2 h-4 w-4" />
          <span className="text-[#01257D] dark:text-white font-semibold">
            📄 Reportes
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
              <h2 className="text-3xl font-bold flex items-center">
                <FileText className="mr-3 h-8 w-8" />
                📄 Reportes Predefinidos
              </h2>
              {isGenerating && (
                <div className="relative">
                  <div className="animate-spin h-8 w-8 border-4 border-white/30 border-t-white rounded-full"></div>
                  <Activity className="absolute inset-0 m-auto h-4 w-4 text-white animate-pulse" />
                </div>
              )}
            </div>
            <p className="text-emerald-100 text-lg">
              🎯 Selecciona el tipo de reporte que necesitas generar
            </p>
          </div>
          
          <div className="p-8">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {reportesPredefinidos.map((reporte, index) => (
                <motion.div 
                  key={reporte.id}
                  className={`relative overflow-hidden bg-gradient-to-br ${reporte.bgGradient} rounded-2xl p-6 border-2 ${reporte.borderColor} hover:shadow-xl transition-all duration-300 cursor-pointer`}
                  whileHover={{ scale: 1.05, rotate: 1 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => generatePersonalizedReport(reporte.id)}
                >
                  {/* Header del reporte */}
                  <div className="flex items-center mb-4">
                    <div 
                      className="h-12 w-12 rounded-full flex items-center justify-center text-white shadow-lg"
                      style={{ backgroundColor: reporte.color }}
                    >
                      <span className="text-xl">{reporte.emoji}</span>
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
      <motion.div variants={itemVariants}>
        <div className="card p-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="mr-3 h-6 w-6 text-primary-600 dark:text-primary-400" />
              <h2 className="heading-secondary">Historial de Reportes</h2>
            </div>
            <a href="#" className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
              Ver todos
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Periodo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Fecha</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                {[
                  {
                    nombre: 'Reporte Mensual Mayo 2025',
                    tipo: 'Completo',
                    periodo: '01/05/2025 - 31/05/2025',
                    fecha: '31/05/2025'
                  },
                  {
                    nombre: 'Análisis de Canales Sociales',
                    tipo: 'Canales',
                    periodo: 'Abril 2025',
                    fecha: '30/04/2025'
                  },
                  {
                    nombre: 'Reporte de Optimización',
                    tipo: 'Eficiencia',
                    periodo: 'Q1 2025',
                    fecha: '01/04/2025'
                  },
                  {
                    nombre: 'Tendencias Trimestrales',
                    tipo: 'Tendencia',
                    periodo: 'Ene - Mar 2025',
                    fecha: '01/04/2025'
                  },
                  {
                    nombre: 'Consumo por Tipo de Acción',
                    tipo: 'Acciones',
                    periodo: 'Marzo 2025',
                    fecha: '31/03/2025'
                  }
                ].map((reporte, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{reporte.nombre}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{reporte.tipo}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{reporte.periodo}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{reporte.fecha}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <button className="mr-2 inline-flex items-center text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
                        <Download className="h-4 w-4" />
                      </button>
                      <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                        <FileText className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {/* Generador de reportes personalizados */}
      <motion.div variants={itemVariants}>
        <GeneradorReportes />
      </motion.div>
    </motion.div>
  );
}
