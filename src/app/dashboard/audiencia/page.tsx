"use client";

import React from 'react';
import AudienceAnalysis from '@/components/audience/AudienceAnalysis';

export default function AudienciaPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
        Análisis de Audiencia
      </h1>
      
      <div className="grid grid-cols-1 gap-6">
        {/* Componente de análisis de audiencia */}
        <AudienceAnalysis />
      </div>
    </div>
  );
}
