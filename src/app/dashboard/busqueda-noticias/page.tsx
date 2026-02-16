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

      {/* SECCIÓN: BUSCADOR DE PERSONAS Y EMPRESAS - COMPLETO */}
      <motion.div
        custom={0}
        initial="hidden"
        animate="visible"
        variants={statsVariants}
      >
        {/* Información de tipos de búsqueda */}
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: Crown, label: 'Politicos', desc: 'Candidatos, funcionarios', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800', color: 'text-purple-600', textMain: 'text-purple-900 dark:text-purple-100', textSub: 'text-purple-600 dark:text-purple-300' },
            { icon: Users, label: 'Influencers', desc: 'Creadores de contenido', bg: 'bg-pink-50 dark:bg-pink-900/20', border: 'border-pink-200 dark:border-pink-800', color: 'text-pink-600', textMain: 'text-pink-900 dark:text-pink-100', textSub: 'text-pink-600 dark:text-pink-300' },
            { icon: Building, label: 'Empresas', desc: 'Marcas, corporaciones', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', color: 'text-blue-600', textMain: 'text-blue-900 dark:text-blue-100', textSub: 'text-blue-600 dark:text-blue-300' },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
              whileHover={{ y: -3, boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}
              className={`flex items-center space-x-3 p-3 ${item.bg} rounded-xl border ${item.border} cursor-pointer transition-shadow`}
            >
              <item.icon className={`w-5 h-5 ${item.color}`} />
              <div>
                <p className={`text-sm font-medium ${item.textMain}`}>{item.label}</p>
                <p className={`text-xs ${item.textSub}`}>{item.desc}</p>
              </div>
            </motion.div>
          ))}
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
