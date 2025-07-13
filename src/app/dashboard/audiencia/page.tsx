"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Users, Target, TrendingUp, BarChart3, Eye, UserCheck } from 'lucide-react';
import AudienceAnalysis from '@/components/audience/AudienceAnalysis';

export default function AudienciaPage() {
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
      {/* Encabezado heroico */}
      <motion.div 
        className="bg-gradient-to-r from-[#01257D] via-purple-600 to-indigo-600 rounded-2xl p-8 mb-8"
        variants={itemVariants}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-white mb-3 flex items-center">
              <Users className="mr-4 h-10 w-10" />
              Análisis de Audiencia
            </h1>
            <p className="text-blue-100 text-lg mb-6 lg:mb-0">
              👥 Conoce a fondo tu audiencia: demografía, comportamiento e influencers clave
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
            <div className="text-center">
              <Target className="h-8 w-8 mx-auto text-white mb-2" />
              <div className="text-2xl font-bold text-white">87%</div>
              <div className="text-sm text-blue-200">Precisión</div>
            </div>
            <div className="text-center">
              <TrendingUp className="h-8 w-8 mx-auto text-white mb-2" />
              <div className="text-2xl font-bold text-white">+24%</div>
              <div className="text-sm text-blue-200">Crecimiento</div>
            </div>
            <div className="text-center">
              <Eye className="h-8 w-8 mx-auto text-white mb-2" />
              <div className="text-2xl font-bold text-white">1.2M</div>
              <div className="text-sm text-blue-200">Alcance</div>
            </div>
            <div className="text-center">
              <UserCheck className="h-8 w-8 mx-auto text-white mb-2" />
              <div className="text-2xl font-bold text-white">156</div>
              <div className="text-sm text-blue-200">Influencers</div>
            </div>
          </div>
        </div>
      </motion.div>
      
      <motion.div 
        className="grid grid-cols-1 gap-8"
        variants={itemVariants}
      >
        {/* Componente de análisis de audiencia mejorado */}
        <AudienceAnalysis />
      </motion.div>
    </motion.div>
  );
}
