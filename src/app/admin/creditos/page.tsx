"use client";

import React from 'react';
import { motion } from 'framer-motion';
import ConsumosPorCanalChart from '@/components/admin/ConsumosPorCanalChart';
import TendenciaUsoChart from '@/components/admin/TendenciaUsoChart';
import CreditosPorUsuarioChart from '@/components/admin/CreditosPorUsuarioChart';
import PrediccionUsoChart from '@/components/admin/PrediccionUsoChart';
import { Search, Download, Filter, Users, CreditCard, Plus } from 'lucide-react';

export default function AdminCreditosPage() {
  // Animación para los componentes de la página
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

  // Estadísticas resumen
  const estadisticas = [
    {
      titulo: 'Total Créditos Asignados',
      valor: '1,245,780',
      icono: <CreditCard className="h-5 w-5 text-primary-600 dark:text-primary-400" />
    },
    {
      titulo: 'Total Créditos Consumidos',
      valor: '845,350',
      icono: <CreditCard className="h-5 w-5 text-red-600 dark:text-red-400" />
    },
    {
      titulo: 'Usuarios Activos',
      valor: '145',
      icono: <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
    }
  ];

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Título de la página */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Créditos</h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Administra los créditos de todos los usuarios, visualiza métricas y genera reportes.
        </p>
      </div>

      {/* Estadísticas resumen */}
      <motion.div 
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
        variants={itemVariants}
      >
        {estadisticas.map((stat, index) => (
          <div key={index} className="card flex items-center p-4">
            <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              {stat.icono}
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{stat.titulo}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.valor}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Barra de acciones */}
      <motion.div 
        className="flex flex-wrap items-center justify-between gap-4"
        variants={itemVariants}
      >
        {/* Búsqueda y filtros */}
        <div className="flex flex-1 flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por usuario, transacción, etc."
              className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-400"
            />
          </div>

          <button className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
            <Filter className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
            Filtrar
          </button>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-3">
          <button className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
            <Download className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
            Exportar Reporte
          </button>

          <button className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:bg-primary-500 dark:hover:bg-primary-400">
            <Plus className="mr-2 h-4 w-4" />
            Asignar Créditos
          </button>
        </div>
      </motion.div>

      {/* Gráficos y análisis */}
      <motion.div className="grid grid-cols-1 gap-6 lg:grid-cols-2" variants={itemVariants}>
        <ConsumosPorCanalChart />
        <TendenciaUsoChart />
      </motion.div>

      <motion.div variants={itemVariants}>
        <CreditosPorUsuarioChart />
      </motion.div>

      <motion.div variants={itemVariants}>
        <PrediccionUsoChart />
      </motion.div>

      {/* Tabla de transacciones recientes */}
      <motion.div className="card overflow-hidden" variants={itemVariants}>
        <div className="border-b border-gray-200 p-4 dark:border-gray-700">
          <h2 className="heading-secondary">Transacciones Recientes</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Usuario</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Canal</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Descripción</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Fecha</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Cantidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
              {[
                {
                  usuario: 'Carlos Rodríguez',
                  tipo: 'consumo',
                  canal: 'Facebook',
                  descripcion: 'Análisis de sentimiento',
                  fecha: '29/05/2025 10:45',
                  cantidad: -1250,
                  clase: 'text-red-600 dark:text-red-400'
                },
                {
                  usuario: 'María López',
                  tipo: 'asignacion',
                  canal: 'General',
                  descripcion: 'Plan Profesional',
                  fecha: '28/05/2025 15:20',
                  cantidad: 15000,
                  clase: 'text-green-600 dark:text-green-400'
                },
                {
                  usuario: 'Juan Martínez',
                  tipo: 'consumo',
                  canal: 'X',
                  descripcion: 'Monitoreo de menciones',
                  fecha: '28/05/2025 11:30',
                  cantidad: -850,
                  clase: 'text-red-600 dark:text-red-400'
                },
                {
                  usuario: 'Ana Gómez',
                  tipo: 'consumo',
                  canal: 'Instagram',
                  descripcion: 'Análisis de tendencias',
                  fecha: '27/05/2025 16:15',
                  cantidad: -920,
                  clase: 'text-red-600 dark:text-red-400'
                },
                {
                  usuario: 'Pedro Sánchez',
                  tipo: 'compra',
                  canal: 'General',
                  descripcion: 'Plan Básico',
                  fecha: '27/05/2025 09:40',
                  cantidad: 5000,
                  clase: 'text-green-600 dark:text-green-400'
                }
              ].map((transaccion, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{transaccion.usuario}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400 capitalize">{transaccion.tipo}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{transaccion.canal}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{transaccion.descripcion}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{transaccion.fecha}</td>
                  <td className={`whitespace-nowrap px-6 py-4 text-right text-sm font-medium ${transaccion.clase}`}>
                    {transaccion.cantidad > 0 ? '+' : ''}{transaccion.cantidad.toLocaleString('es-CO')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-gray-200 p-4 text-center dark:border-gray-700">
          <button className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
            Ver todas las transacciones
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
