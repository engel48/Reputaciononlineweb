"use client";

import React from 'react';
import AdvancedSearch from '@/components/dashboard/AdvancedSearch';
import { motion } from 'framer-motion';
import { Users, Building, Crown } from 'lucide-react';
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
      {/* Título de la página */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Búsqueda y Noticias
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Busca personalidades, marcas y mantente al día con las noticias más relevantes
        </p>
      </div>

      {/* SECCIÓN: BUSCADOR DE PERSONAS Y EMPRESAS - COMPLETO */}
      <motion.div
        custom={0}
        initial="hidden"
        animate="visible"
        variants={statsVariants}
      >
        {/* Información de tipos de búsqueda */}
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center space-x-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <Crown className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-purple-900 dark:text-purple-100">Políticos</p>
              <p className="text-xs text-purple-600 dark:text-purple-300">Candidatos, funcionarios</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800">
            <Users className="w-5 h-5 text-pink-600" />
            <div>
              <p className="text-sm font-medium text-pink-900 dark:text-pink-100">Influencers</p>
              <p className="text-xs text-pink-600 dark:text-pink-300">Creadores de contenido</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <Building className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Empresas</p>
              <p className="text-xs text-blue-600 dark:text-blue-300">Marcas, corporaciones</p>
            </div>
          </div>
        </div>

        {/* Buscador avanzado completo con análisis de sentimientos */}
        <AdvancedSearch />
      </motion.div>

      {/* SECCIÓN: MAPA DE MENCIONES EN TIEMPO REAL */}
      <motion.div
        custom={1}
        initial="hidden"
        animate="visible"
        variants={statsVariants}
      >
        <DynamicMencionesMap />
      </motion.div>
    </div>
  );
}
