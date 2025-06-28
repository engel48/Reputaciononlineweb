"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { useUser } from '@/context/UserContext';
import GeneradorReportes from '@/components/creditos/GeneradorReportes';
import { FileText, ChevronRight, Download, BarChart2, User, Calendar, CreditCard } from 'lucide-react';
import Image from 'next/image';

export default function ReportesCreditosPage() {
  const { user } = useUser();

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

  // Reportes predefinidos
  const reportesPredefinidos = [
    {
      id: 'mensual-general',
      titulo: 'Reporte Mensual',
      descripcion: 'Consumo detallado de créditos del último mes',
      icono: <BarChart2 className="h-6 w-6 text-blue-500 dark:text-blue-400" />,
      color: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
    },
    {
      id: 'canales-sociales',
      titulo: 'Consumo por Canales',
      descripcion: 'Desglose de créditos por cada red social',
      icono: <BarChart2 className="h-6 w-6 text-green-500 dark:text-green-400" />,
      color: 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
    },
    {
      id: 'tendencias-trimestre',
      titulo: 'Tendencias Trimestrales',
      descripcion: 'Análisis comparativo de los últimos 3 meses',
      icono: <BarChart2 className="h-6 w-6 text-purple-500 dark:text-purple-400" />,
      color: 'border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/20'
    },
    {
      id: 'reporte-personalizado',
      titulo: 'Reporte Personalizado',
      descripcion: 'Genera un reporte específico con tus datos únicos',
      icono: <User className="h-6 w-6 text-orange-500 dark:text-orange-400" />,
      color: 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20'
    }
  ];

  const generatePersonalizedReport = (reportType: string) => {
    if (!user) return;
    
    // Crear reporte con datos del usuario
    const reportData = {
      usuario: {
        nombre: user.name,
        email: user.email,
        plan: user.plan,
        creditos: user.credits,
        fechaRegistro: user.createdAt
      },
      tipo: reportType,
      fechaGeneracion: new Date().toISOString(),
      logo: '/rol-logo.png'
    };

    console.log('Generando reporte personalizado:', reportData);
    // Aquí se podría implementar la descarga del PDF con estos datos
  };

  return (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header con logo de la plataforma y datos del usuario */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="mb-8"
      >
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              {/* Logo de la plataforma */}
              <div className="flex-shrink-0">
                <Image
                  src="/rol-logo.png"
                  alt="Reputación Online"
                  width={60}
                  height={60}
                  className="rounded-lg"
                />
              </div>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Reportes de Créditos
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Genera y descarga reportes personalizados de tu actividad
                </p>
              </div>
            </div>

            {/* Datos personalizados del usuario */}
            {user && (
              <div className="text-right">
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <User className="h-4 w-4" />
                  <span>{user.name}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <CreditCard className="h-4 w-4" />
                  <span>Plan {user.plan?.charAt(0).toUpperCase() + user.plan?.slice(1)}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <span>{user.credits} créditos disponibles</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Tu00edtulo de la pu00e1gina */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reportes de Créditos</h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Genera informes detallados sobre el consumo de créditos para análisis y optimización.
        </p>
      </motion.div>

      {/* Migas de pan */}
      <motion.div variants={itemVariants} className="flex items-center text-sm text-gray-500 dark:text-gray-400">
        <a href="/dashboard" className="hover:text-primary-600 dark:hover:text-primary-400">Dashboard</a>
        <ChevronRight className="mx-2 h-4 w-4" />
        <a href="/dashboard/creditos" className="hover:text-primary-600 dark:hover:text-primary-400">Créditos</a>
        <ChevronRight className="mx-2 h-4 w-4" />
        <span className="text-gray-700 dark:text-gray-300">Reportes</span>
      </motion.div>

      {/* Reportes predefinidos */}
      <motion.div variants={itemVariants}>
        <div className="card p-6">
          <div className="mb-6 flex items-center">
            <FileText className="mr-3 h-6 w-6 text-primary-600 dark:text-primary-400" />
            <h2 className="heading-secondary">Reportes Predefinidos</h2>
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {reportesPredefinidos.map((reporte) => (
              <div 
                key={reporte.id}
                className={`flex flex-col rounded-lg border p-4 transition-transform hover:-translate-y-1 hover:shadow-md ${reporte.color}`}
              >
                <div className="mb-3 flex items-center">
                  {reporte.icono}
                  <h3 className="ml-2 text-base font-medium text-gray-900 dark:text-white">{reporte.titulo}</h3>
                </div>
                <p className="mb-4 flex-grow text-sm text-gray-700 dark:text-gray-300">{reporte.descripcion}</p>
                <button 
                  onClick={() => generatePersonalizedReport(reporte.id)}
                  className="mt-auto inline-flex items-center justify-center rounded-md bg-[#01257D] hover:bg-[#013AAA] px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors duration-200"
                >
                  <Download className="mr-1.5 h-4 w-4" />
                  Descargar
                </button>
              </div>
            ))}
          </div>
        </div>
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
