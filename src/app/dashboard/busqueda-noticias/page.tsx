"use client";

import React from 'react';
import AdvancedSearch from '@/components/dashboard/AdvancedSearch';
import { motion } from 'framer-motion';
import { Users, Building, Crown, Search } from 'lucide-react';
import dynamic from 'next/dynamic';

// Importar el mapa dinámicamente para evitar problemas con SSR
const DynamicMencionesMap = dynamic(() => import('@/components/dashboard/MencionesMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-md">
      <div className="text-gray-500 dark:text-gray-400">Cargando mapa...</div>
    </div>
  ),
});

export default function BusquedaNoticiasPage() {
  const statsVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1]
      }
    })
  };

  return (
    <div className="space-y-6">
      {/* Header con gradiente */}
      <motion.div
        custom={0}
        initial="hidden"
        animate="visible"
        variants={statsVariants}
        className="bg-gradient-to-r from-[#01257D] to-indigo-600 rounded-2xl p-6 mb-6"
      >
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
              <Search className="h-7 w-7 text-white" />
            </motion.div>
          </motion.div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              Busqueda y Noticias
            </h1>
            <p className="text-white/70 text-sm">
              Busca personalidades, marcas y mantente al dia con las noticias mas relevantes
            </p>
          </div>
        </div>
      </motion.div>

      {/* SECCIÓN: BUSCADOR DE PERSONAS Y EMPRESAS - REDISEÑADO */}
      <motion.div
        custom={0}
        initial="hidden"
        animate="visible"
        variants={statsVariants}
      >
        {/* Información de tipos de búsqueda - Cards grandes con gradiente */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Crown, label: 'Politicos', desc: 'Candidatos, funcionarios y figuras publicas', bg: 'bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/20 dark:to-violet-900/20', border: 'border-purple-200 dark:border-purple-800', iconBg: 'bg-purple-500', textMain: 'text-purple-900 dark:text-purple-100', textSub: 'text-purple-600 dark:text-purple-300' },
            { icon: Users, label: 'Influencers', desc: 'Creadores de contenido y lideres de opinion', bg: 'bg-gradient-to-br from-pink-50 to-rose-100 dark:from-pink-900/20 dark:to-rose-900/20', border: 'border-pink-200 dark:border-pink-800', iconBg: 'bg-pink-500', textMain: 'text-pink-900 dark:text-pink-100', textSub: 'text-pink-600 dark:text-pink-300' },
            { icon: Building, label: 'Empresas', desc: 'Marcas, corporaciones y organizaciones', bg: 'bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20', border: 'border-blue-200 dark:border-blue-800', iconBg: 'bg-blue-500', textMain: 'text-blue-900 dark:text-blue-100', textSub: 'text-blue-600 dark:text-blue-300' },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
              whileHover={{ y: -4, boxShadow: '0 12px 30px rgba(0,0,0,0.08)' }}
              className={`p-5 ${item.bg} rounded-xl border ${item.border} cursor-pointer transition-all`}
            >
              <div className="flex items-start space-x-4">
                <div className={`flex-shrink-0 p-3 rounded-xl ${item.iconBg} shadow-lg`}>
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className={`font-bold ${item.textMain}`}>{item.label}</p>
                  <p className={`text-sm mt-0.5 ${item.textSub}`}>{item.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Buscador avanzado completo con análisis de sentimientos */}
        <AdvancedSearch />
      </motion.div>

      {/* SECCIÓN: MAPA DE MENCIONES EN TIEMPO REAL - con wrapper */}
      <motion.div
        custom={1}
        initial="hidden"
        animate="visible"
        variants={statsVariants}
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-blue-50/50 dark:from-gray-800 dark:to-blue-900/10 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-[#01257D] rounded-lg">
                <Search className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Mapa de Menciones en Tiempo Real</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Visualiza la distribucion geografica de las menciones</p>
              </div>
            </div>
          </div>
          <div className="p-0">
            <DynamicMencionesMap />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
