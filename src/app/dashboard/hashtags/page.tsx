"use client";

import React from 'react';
import HashtagMonitoring from '@/components/hashtags/HashtagMonitoring';
import HashtagGeoMap from '@/components/hashtags/HashtagGeoMap';

export default function HashtagsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
        Monitoreo de Hashtags
      </h1>
      
      <div className="grid grid-cols-1 gap-6">
        {/* Componente de monitoreo de hashtags */}
        <HashtagMonitoring />
        
        {/* Componente de mapa geográfico */}
        <HashtagGeoMap />
      </div>
    </div>
  );
}
