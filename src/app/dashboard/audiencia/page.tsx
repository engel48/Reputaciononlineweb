"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Users, Target, TrendingUp, Eye, UserCheck } from 'lucide-react';
import AudienceAnalysis from '@/components/audience/AudienceAnalysis';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
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

export default function AudienciaPage() {
  const capabilities = [
    { icon: Target, label: 'Segmentacion', desc: 'Demografia y perfiles' },
    { icon: TrendingUp, label: 'Tendencias', desc: 'Patrones de engagement' },
    { icon: Eye, label: 'Alcance', desc: 'Impacto y visibilidad' },
    { icon: UserCheck, label: 'Influencers', desc: 'Deteccion automatica' },
  ];

  return (
    <motion.div
      className="container mx-auto px-4 py-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Hero con gradiente - sin datos hardcoded */}
      <motion.div
        className="bg-gradient-to-r from-[#01257D] via-purple-600 to-indigo-600 rounded-2xl p-8 mb-8"
        variants={itemVariants}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-3 flex items-center">
              <motion.div
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 4 }}
              >
                <Users className="mr-4 h-9 w-9" />
              </motion.div>
              Analisis de Audiencia
            </h1>
            <p className="text-blue-100 text-base max-w-lg">
              Analiza demografias, comportamiento y detecta influencers clave en tu audiencia. Los datos se actualizan en base a tus redes sociales conectadas.
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {capabilities.map((cap, i) => (
              <motion.div
                key={cap.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
                whileHover={{ y: -4, scale: 1.05, boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}
                className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-3 cursor-pointer border border-white/10 hover:border-white/30 transition-colors"
              >
                <cap.icon className="h-6 w-6 mx-auto text-white mb-1.5" />
                <div className="text-sm font-semibold text-white">{cap.label}</div>
                <div className="text-xs text-blue-200">{cap.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 gap-8"
        variants={itemVariants}
      >
        <AudienceAnalysis />
      </motion.div>
    </motion.div>
  );
}
