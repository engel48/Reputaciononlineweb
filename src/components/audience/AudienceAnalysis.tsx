"use client";

import React, { useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { motion } from 'framer-motion';

// Registro de componentes Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

// Tipos
interface DemographicData {
  ageGroups: {
    label: string;
    value: number;
    color: string;
  }[];
  genderDistribution: {
    label: string;
    value: number;
    color: string;
  }[];
  locationTop: {
    city: string;
    country: string;
    percentage: number;
  }[];
}

interface Influencer {
  id: string;
  name: string;
  username: string;
  platform: string;
  followers: number;
  engagement: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  recentMention?: string;
}

interface AudienceAnalysisProps {
  demographicData?: DemographicData;
  influencers?: Influencer[];
  isLoading?: boolean;
}

const AudienceAnalysis: React.FC<AudienceAnalysisProps> = ({
  demographicData = demoDemographicData,
  influencers = demoInfluencers,
  isLoading = false
}) => {
  const [activeTab, setActiveTab] = useState<'demographics' | 'influencers'>('demographics');

  // Configurar datos para gráficos
  const ageChartData = {
    labels: demographicData.ageGroups.map(group => group.label),
    datasets: [
      {
        data: demographicData.ageGroups.map(group => group.value),
        backgroundColor: demographicData.ageGroups.map(group => group.color),
        borderWidth: 1
      }
    ]
  };

  const genderChartData = {
    labels: demographicData.genderDistribution.map(item => item.label),
    datasets: [
      {
        data: demographicData.genderDistribution.map(item => item.value),
        backgroundColor: demographicData.genderDistribution.map(item => item.color),
        borderWidth: 1
      }
    ]
  };

  // Determinar color según sentimiento
  const getSentimentColor = (sentiment: 'positive' | 'neutral' | 'negative') => {
    if (sentiment === 'positive') return 'text-green-500';
    if (sentiment === 'negative') return 'text-red-500';
    return 'text-gray-500';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            Análisis de Audiencia
          </h2>
          {isLoading && (
            <div className="animate-spin h-5 w-5 border-2 border-primary-600 border-t-transparent rounded-full"></div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          <button
            onClick={() => setActiveTab('demographics')}
            className={`py-2 px-4 text-sm font-medium ${
              activeTab === 'demographics'
                ? 'border-b-2 border-primary-600 text-primary-600 dark:text-primary-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Demografía
          </button>
          <button
            onClick={() => setActiveTab('influencers')}
            className={`py-2 px-4 text-sm font-medium ${
              activeTab === 'influencers'
                ? 'border-b-2 border-primary-600 text-primary-600 dark:text-primary-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Influencers
          </button>
        </div>

        {/* Contenido de demografía */}
        {activeTab === 'demographics' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Gráfico de edad */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
                  Distribución por Edad
                </h3>
                <div className="h-64">
                  <Doughnut 
                    data={ageChartData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                    }} 
                  />
                </div>
              </div>

              {/* Gráfico de género */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
                  Distribución por Género
                </h3>
                <div className="h-64">
                  <Doughnut 
                    data={genderChartData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                    }} 
                  />
                </div>
              </div>

              {/* Ubicaciones principales */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 md:col-span-2">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
                  Ubicaciones Principales
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {demographicData.locationTop.map((location, index) => (
                    <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                      <h4 className="font-medium text-gray-800 dark:text-white">
                        {location.city}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {location.country}
                      </p>
                      <div className="mt-2 flex items-center">
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div
                            className="bg-primary-600 h-2 rounded-full"
                            style={{ width: `${location.percentage}%` }}
                          ></div>
                        </div>
                        <span className="ml-2 text-xs font-medium text-gray-600 dark:text-gray-300">
                          {location.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Contenido de influencers */}
        {activeTab === 'influencers' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Influencer
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Plataforma
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Seguidores
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Engagement
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Sentimiento
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                  {influencers.map((influencer) => (
                    <tr key={influencer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                            <span className="text-sm font-medium">
                              {influencer.name.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {influencer.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              @{influencer.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {influencer.platform}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {influencer.followers.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {influencer.engagement}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          getSentimentColor(influencer.sentiment)
                        }`}>
                          {influencer.sentiment === 'positive' && 'Positivo'}
                          {influencer.sentiment === 'neutral' && 'Neutro'}
                          {influencer.sentiment === 'negative' && 'Negativo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// Datos de ejemplo para desarrollo
const demoDemographicData: DemographicData = {
  ageGroups: [
    { label: '18-24', value: 15, color: '#10b981' },
    { label: '25-34', value: 30, color: '#3b82f6' },
    { label: '35-44', value: 25, color: '#6366f1' },
    { label: '45-54', value: 18, color: '#8b5cf6' },
    { label: '55+', value: 12, color: '#ec4899' }
  ],
  genderDistribution: [
    { label: 'Masculino', value: 52, color: '#3b82f6' },
    { label: 'Femenino', value: 46, color: '#ec4899' },
    { label: 'No especificado', value: 2, color: '#6b7280' }
  ],
  locationTop: [
    { city: 'Bogotá', country: 'Colombia', percentage: 32 },
    { city: 'Medellín', country: 'Colombia', percentage: 18 },
    { city: 'Cali', country: 'Colombia', percentage: 12 },
    { city: 'Barranquilla', country: 'Colombia', percentage: 8 },
    { city: 'Ciudad de México', country: 'México', percentage: 6 },
    { city: 'Lima', country: 'Perú', percentage: 5 }
  ]
};

const demoInfluencers: Influencer[] = [
  {
    id: 'inf1',
    name: 'Carlos Rodríguez',
    username: 'carlosrodriguez',
    platform: 'X',
    followers: 125000,
    engagement: 3.8,
    sentiment: 'positive',
    recentMention: 'El nuevo proyecto de @ElmerZapata es exactamente lo que necesitábamos. #ReformaEducativa'
  },
  {
    id: 'inf2',
    name: 'María Gómez',
    username: 'mariagomez',
    platform: 'Instagram',
    followers: 89000,
    engagement: 5.2,
    sentiment: 'positive',
    recentMention: 'Apoyando la #ReformaEducativa de @ElmerZapata. ¡Es tiempo de cambios!'
  },
  {
    id: 'inf3',
    name: 'Juan Pérez',
    username: 'juanperez',
    platform: 'X',
    followers: 67000,
    engagement: 2.9,
    sentiment: 'neutral',
    recentMention: 'Analizando las propuestas de la #ReformaEducativa. Hay puntos interesantes y otros cuestionables.'
  },
  {
    id: 'inf4',
    name: 'Laura Martínez',
    username: 'lauramartinez',
    platform: 'Facebook',
    followers: 45000,
    engagement: 4.1,
    sentiment: 'negative',
    recentMention: 'La #ReformaEducativa no aborda los problemas fundamentales del sistema educativo.'
  },
  {
    id: 'inf5',
    name: 'Andrés López',
    username: 'andreslopez',
    platform: 'X',
    followers: 112000,
    engagement: 3.5,
    sentiment: 'positive',
    recentMention: 'Felicitaciones a @ElmerZapata por su visión en la #ReformaEducativa. Necesitamos más líderes así.'
  }
];

export default AudienceAnalysis;
