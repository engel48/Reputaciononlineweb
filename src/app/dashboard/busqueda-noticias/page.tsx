"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
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
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-[#01257D] to-blue-600 rounded-xl">
            <Search className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Búsqueda y Noticias
          </h1>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 ml-14">
          Visualiza las menciones en el mapa en tiempo real
        </p>
      </div>

      {/* SECCIÓN: MAPA DE MENCIONES EN TIEMPO REAL */}
      <motion.div
        custom={0}
        initial="hidden"
        animate="visible"
        variants={statsVariants}
      >
        <DynamicMencionesMap />
      </motion.div>
    </div>
  );
}
