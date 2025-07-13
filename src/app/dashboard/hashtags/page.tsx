"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Hash, TrendingUp, Globe, Activity } from 'lucide-react';
import HashtagMonitoring from '@/components/hashtags/HashtagMonitoring';
import HashtagGeoMap from '@/components/hashtags/HashtagGeoMap';

export default function HashtagsPage() {
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
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <motion.div
      className="container mx-auto px-4 py-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Encabezado mejorado */}
      <motion.div 
        className="bg-gradient-to-r from-[#01257D] to-[#013AAA] rounded-2xl p-8 mb-8"
        variants={itemVariants}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-3 flex items-center">
              <Hash className="mr-3 h-10 w-10" />
              Monitoreo de Hashtags
            </h1>
            <p className="text-blue-100 text-lg">
              📊 Análisis en tiempo real de tendencias y distribución geográfica
            </p>
          </div>
          <div className="mt-6 md:mt-0 grid grid-cols-3 gap-4">
            <div className="text-center">
              <TrendingUp className="h-8 w-8 mx-auto text-white mb-2" />
              <div className="text-2xl font-bold text-white">+12%</div>
              <div className="text-sm text-blue-200">Crecimiento</div>
            </div>
            <div className="text-center">
              <Activity className="h-8 w-8 mx-auto text-white mb-2" />
              <div className="text-2xl font-bold text-white">24h</div>
              <div className="text-sm text-blue-200">Monitoreo</div>
            </div>
            <div className="text-center">
              <Globe className="h-8 w-8 mx-auto text-white mb-2" />
              <div className="text-2xl font-bold text-white">LATAM</div>
              <div className="text-sm text-blue-200">Cobertura</div>
            </div>
          </div>
        </div>
      </motion.div>
      
      <div className="grid grid-cols-1 gap-8">
        {/* Componente de monitoreo de hashtags */}
        <motion.div variants={itemVariants}>
          <HashtagMonitoring />
        </motion.div>
        
        {/* Componente de mapa geográfico */}
        <motion.div variants={itemVariants}>
          <HashtagGeoMap />
        </motion.div>
      </div>
    </motion.div>
  );
}
