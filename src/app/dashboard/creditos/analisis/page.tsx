"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import RecomendacionesCreditos from '@/components/creditos/RecomendacionesCreditos';
import CreditosUsageChart from '@/components/creditos/CreditosUsageChart';
import { BarChart3, ChevronRight, PieChart, TrendingUp, Loader2 } from 'lucide-react';

export default function AnalisisCreditosPage() {
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

  const [datosConsumoCanales, setDatosConsumoCanales] = useState<Array<{ canal: string; consumo: number; porcentaje: number }>>([]);
  const [datosConsumoPorAccion, setDatosConsumoPorAccion] = useState<Array<{ accion: string; consumo: number; porcentaje: number }>>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      setCargando(true);
      try {
        const response = await fetch('/api/dashboard-analytics');
        if (response.ok) {
          const data = await response.json();
          if (data.creditUsage) {
            setDatosConsumoCanales(data.creditUsage.byChannel || []);
            setDatosConsumoPorAccion(data.creditUsage.byAction || []);
          }
        }
      } catch (error) {
        console.error('Error cargando datos de analisis:', error);
      } finally {
        setCargando(false);
      }
    };
    cargarDatos();
  }, []);

  return (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header con gradiente */}
      <motion.div variants={itemVariants} className="bg-gradient-to-r from-[#01257D] to-indigo-600 rounded-2xl p-6">
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
              <TrendingUp className="h-7 w-7 text-white" />
            </motion.div>
          </motion.div>
          <div>
            <h1 className="text-2xl font-bold text-white">Analisis de Uso de Creditos</h1>
            <p className="text-white/70 text-sm">
              Analiza como estas utilizando tus creditos y descubre oportunidades para optimizar tu consumo
            </p>
          </div>
        </div>
      </motion.div>

      {/* Migas de pan */}
      <motion.div variants={itemVariants}>
        <nav className="flex items-center text-sm text-gray-500 dark:text-gray-400 bg-white/70 dark:bg-gray-800/70 rounded-xl p-4 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
          <a href="/dashboard" className="hover:text-[#01257D] dark:hover:text-blue-400 font-medium transition-colors duration-200">Dashboard</a>
          <ChevronRight className="mx-2 h-4 w-4" />
          <a href="/dashboard/creditos" className="hover:text-[#01257D] dark:hover:text-blue-400 font-medium transition-colors duration-200">Creditos</a>
          <ChevronRight className="mx-2 h-4 w-4" />
          <span className="text-[#01257D] dark:text-white font-semibold">Analisis</span>
        </nav>
      </motion.div>

      {/* Gráfico de uso de créditos */}
      <motion.div variants={itemVariants}>
        <CreditosUsageChart />
      </motion.div>

      {/* Consumo por canal */}
      <motion.div variants={itemVariants}>
        <motion.div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm" whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
          <div className="mb-6 flex items-center">
            <BarChart3 className="mr-3 h-6 w-6 text-primary-600 dark:text-primary-400" />
            <h2 className="heading-secondary">Consumo por Canal</h2>
          </div>

          {cargando ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 text-[#01257D] animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-500">Cargando datos...</p>
            </div>
          ) : datosConsumoCanales.length > 0 ? (
            <>
              <div className="space-y-4">
                {datosConsumoCanales.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.canal}</span>
                      <div className="flex items-center">
                        <span className="mr-2 text-sm font-medium text-gray-900 dark:text-white">
                          {item.consumo.toLocaleString('es-CO')}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {item.porcentaje}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                      <motion.div
                        className="h-full bg-gradient-to-r from-[#01257D] to-indigo-500 rounded-full"
                        style={{ width: `${item.porcentaje}%` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${item.porcentaje}%` }}
                        transition={{ duration: 0.8, delay: index * 0.1 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-md bg-gray-50 p-4 dark:bg-gray-800">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Total de creditos consumidos: </span>
                  {datosConsumoCanales.reduce((sum, item) => sum + item.consumo, 0).toLocaleString('es-CO')}
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-10">
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
                <BarChart3 className="h-14 w-14 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              </motion.div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">Sin datos de consumo por canal</p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Los datos apareceran cuando uses creditos</p>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Consumo por acción */}
      <motion.div variants={itemVariants}>
        <motion.div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm" whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
          <div className="mb-6 flex items-center">
            <PieChart className="mr-3 h-6 w-6 text-primary-600 dark:text-primary-400" />
            <h2 className="heading-secondary">Consumo por Tipo de Acción</h2>
          </div>

          {cargando ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 text-[#01257D] animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-500">Cargando datos...</p>
            </div>
          ) : datosConsumoPorAccion.length > 0 ? (
            <div className="space-y-4">
              {datosConsumoPorAccion.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.accion}</span>
                    <div className="flex items-center">
                      <span className="mr-2 text-sm font-medium text-gray-900 dark:text-white">
                        {item.consumo.toLocaleString('es-CO')}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {item.porcentaje}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <motion.div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                      style={{ width: `${item.porcentaje}%` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${item.porcentaje}%` }}
                      transition={{ duration: 0.8, delay: index * 0.1 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
                <PieChart className="h-14 w-14 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              </motion.div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">Sin datos de consumo por accion</p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Los datos apareceran cuando uses creditos</p>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Recomendaciones */}
      <motion.div variants={itemVariants}>
        <RecomendacionesCreditos />
      </motion.div>

      {/* Botones de acción */}
      <motion.div variants={itemVariants} className="flex justify-end space-x-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex items-center rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
        >
          Exportar Analisis
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex items-center rounded-xl bg-[#01257D] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#013AAA] transition-colors"
        >
          Aplicar Recomendaciones
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
