"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Target, Newspaper, Users, Building, Crown } from 'lucide-react';
import AdvancedSearch from '@/components/dashboard/AdvancedSearch';
import BusquedaPersonasPage from '@/app/dashboard/busqueda-personas/page';

type Tab = 'personas' | 'noticias';

export default function BusquedaPage() {
  const [tab, setTab] = useState<Tab>('personas');

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-[#01257D] to-indigo-600 rounded-2xl p-6"
      >
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/20 rounded-xl">
            <Search className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Búsqueda</h1>
            <p className="text-white/70 text-sm">
              Busca personas, empresas y marcas, y mantente al día con las noticias más relevantes
            </p>
          </div>
        </div>
      </motion.div>

      {/* Pestañas */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setTab('personas')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === 'personas'
              ? 'border-[#01257D] text-[#01257D] dark:text-[#00E5FF] dark:border-[#00E5FF]'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <Target className="h-4 w-4" />
          Personas y Empresas
        </button>
        <button
          onClick={() => setTab('noticias')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === 'noticias'
              ? 'border-[#01257D] text-[#01257D] dark:text-[#00E5FF] dark:border-[#00E5FF]'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <Newspaper className="h-4 w-4" />
          Noticias
        </button>
      </div>

      {tab === 'personas' ? (
        <BusquedaPersonasPage />
      ) : (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          {/* Tipos de búsqueda */}
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: Crown, label: 'Politicos', desc: 'Candidatos, funcionarios y figuras publicas', bg: 'bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/20 dark:to-violet-900/20', border: 'border-purple-200 dark:border-purple-800', iconBg: 'bg-purple-500', textMain: 'text-purple-900 dark:text-purple-100', textSub: 'text-purple-600 dark:text-purple-300' },
              { icon: Users, label: 'Influencers', desc: 'Creadores de contenido y lideres de opinion', bg: 'bg-gradient-to-br from-pink-50 to-rose-100 dark:from-pink-900/20 dark:to-rose-900/20', border: 'border-pink-200 dark:border-pink-800', iconBg: 'bg-pink-500', textMain: 'text-pink-900 dark:text-pink-100', textSub: 'text-pink-600 dark:text-pink-300' },
              { icon: Building, label: 'Empresas', desc: 'Marcas, corporaciones y organizaciones', bg: 'bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20', border: 'border-blue-200 dark:border-blue-800', iconBg: 'bg-blue-500', textMain: 'text-blue-900 dark:text-blue-100', textSub: 'text-blue-600 dark:text-blue-300' },
            ].map((item) => (
              <div key={item.label} className={`p-5 ${item.bg} rounded-xl border ${item.border} transition-all`}>
                <div className="flex items-start space-x-4">
                  <div className={`flex-shrink-0 p-3 rounded-xl ${item.iconBg} shadow-lg`}>
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className={`font-bold ${item.textMain}`}>{item.label}</p>
                    <p className={`text-sm mt-0.5 ${item.textSub}`}>{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Buscador avanzado con análisis de sentimientos */}
          <AdvancedSearch />
        </motion.div>
      )}
    </div>
  );
}
