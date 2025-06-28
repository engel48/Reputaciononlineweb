"use client";

import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData
} from 'chart.js';
import { motion } from 'framer-motion';

// Registro de componentes Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Tipos
interface HashtagData {
  id: string;
  name: string;
  count: number;
  trend: 'up' | 'down' | 'stable';
  percentChange: number;
  history: {
    date: string;
    count: number;
  }[];
  platforms: {
    name: string;
    count: number;
    percentage: number;
  }[];
}

interface HashtagMonitoringProps {
  hashtags?: HashtagData[];
  isLoading?: boolean;
}

const HashtagMonitoring: React.FC<HashtagMonitoringProps> = ({ 
  hashtags = demoHashtags, 
  isLoading = false 
}) => {
  const [selectedHashtag, setSelectedHashtag] = useState<HashtagData | null>(
    hashtags && hashtags.length > 0 ? hashtags[0] : null
  );
  const [chartData, setChartData] = useState<ChartData<'line'> | null>(null);
  
  // Cambiar datos del gráfico cuando cambie el hashtag seleccionado
  useEffect(() => {
    if (selectedHashtag) {
      setChartData({
        labels: selectedHashtag.history.map(item => 
          new Date(item.date).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short'
          })
        ),
        datasets: [
          {
            label: `#${selectedHashtag.name}`,
            data: selectedHashtag.history.map(item => item.count),
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            tension: 0.1,
            fill: true
          }
        ]
      });
    }
  }, [selectedHashtag]);

  // Determinar color según tendencia
  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return 'text-green-500';
    if (trend === 'down') return 'text-red-500';
    return 'text-gray-500';
  };

  // Determinar icono según tendencia
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return '↑';
    if (trend === 'down') return '↓';
    return '→';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            Monitoreo de Hashtags
          </h2>
          {isLoading && (
            <div className="animate-spin h-5 w-5 border-2 border-primary-600 border-t-transparent rounded-full"></div>
          )}
        </div>
        
        {/* Selector de hashtags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {hashtags.map((hashtag) => (
            <button
              key={hashtag.id}
              onClick={() => setSelectedHashtag(hashtag)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                selectedHashtag?.id === hashtag.id
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              #{hashtag.name}
            </button>
          ))}
        </div>
        
        {/* Información del hashtag seleccionado */}
        {selectedHashtag && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <motion.div 
                key={`count-${selectedHashtag.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
              >
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Menciones Totales
                </h3>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {selectedHashtag.count.toLocaleString()}
                </p>
                <div className={`mt-2 flex items-center ${getTrendColor(selectedHashtag.trend)}`}>
                  <span className="text-sm font-semibold">
                    {getTrendIcon(selectedHashtag.trend)} {selectedHashtag.percentChange}%
                  </span>
                  <span className="text-xs ml-2 text-gray-500 dark:text-gray-400">
                    vs. período anterior
                  </span>
                </div>
              </motion.div>
              
              <motion.div 
                key={`platforms-${selectedHashtag.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 col-span-2"
              >
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                  Distribución por Plataforma
                </h3>
                <div className="space-y-2">
                  {selectedHashtag.platforms.map((platform) => (
                    <div key={platform.name} className="w-full">
                      <div className="flex justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {platform.name}
                        </span>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          {platform.count.toLocaleString()} ({platform.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div 
                          className="bg-primary-600 h-2 rounded-full"
                          style={{ width: `${platform.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
            
            {/* Gráfico de tendencia */}
            <motion.div
              key={`chart-${selectedHashtag.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-6 h-64"
            >
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                Evolución Temporal
              </h3>
              {chartData && <Line data={chartData} options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: true,
                  },
                  title: {
                    display: false,
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                  }
                }
              }} />}
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

// Datos de ejemplo para desarrollo
const demoHashtags: HashtagData[] = [
  {
    id: 'ht1',
    name: 'ElmerZapata',
    count: 4582,
    trend: 'up',
    percentChange: 14.5,
    history: [
      { date: '2025-05-29T00:00:00', count: 320 },
      { date: '2025-05-30T00:00:00', count: 425 },
      { date: '2025-05-31T00:00:00', count: 380 },
      { date: '2025-06-01T00:00:00', count: 510 },
      { date: '2025-06-02T00:00:00', count: 590 },
      { date: '2025-06-03T00:00:00', count: 680 },
      { date: '2025-06-04T00:00:00', count: 788 },
      { date: '2025-06-05T00:00:00', count: 889 }
    ],
    platforms: [
      { name: 'X', count: 2846, percentage: 62 },
      { name: 'Instagram', count: 921, percentage: 20 },
      { name: 'Facebook', count: 598, percentage: 13 },
      { name: 'TikTok', count: 217, percentage: 5 }
    ]
  },
  {
    id: 'ht2',
    name: 'ReformaEducativa',
    count: 2187,
    trend: 'up',
    percentChange: 7.2,
    history: [
      { date: '2025-05-29T00:00:00', count: 160 },
      { date: '2025-05-30T00:00:00', count: 210 },
      { date: '2025-05-31T00:00:00', count: 180 },
      { date: '2025-06-01T00:00:00', count: 245 },
      { date: '2025-06-02T00:00:00', count: 310 },
      { date: '2025-06-03T00:00:00', count: 385 },
      { date: '2025-06-04T00:00:00', count: 420 },
      { date: '2025-06-05T00:00:00', count: 450 }
    ],
    platforms: [
      { name: 'X', count: 987, percentage: 45 },
      { name: 'Facebook', count: 743, percentage: 34 },
      { name: 'Instagram', count: 324, percentage: 15 },
      { name: 'TikTok', count: 133, percentage: 6 }
    ]
  },
  {
    id: 'ht3',
    name: 'NuevaLeyFiscal',
    count: 1586,
    trend: 'down',
    percentChange: 12.8,
    history: [
      { date: '2025-05-29T00:00:00', count: 280 },
      { date: '2025-05-30T00:00:00', count: 325 },
      { date: '2025-05-31T00:00:00', count: 290 },
      { date: '2025-06-01T00:00:00', count: 210 },
      { date: '2025-06-02T00:00:00', count: 185 },
      { date: '2025-06-03T00:00:00', count: 135 },
      { date: '2025-06-04T00:00:00', count: 120 },
      { date: '2025-06-05T00:00:00', count: 105 }
    ],
    platforms: [
      { name: 'X', count: 896, percentage: 57 },
      { name: 'Facebook', count: 382, percentage: 24 },
      { name: 'Instagram', count: 157, percentage: 10 },
      { name: 'Blogs', count: 151, percentage: 9 }
    ]
  },
  {
    id: 'ht4',
    name: 'CambioClimatico',
    count: 3214,
    trend: 'up',
    percentChange: 23.4,
    history: [
      { date: '2025-05-29T00:00:00', count: 245 },
      { date: '2025-05-30T00:00:00', count: 310 },
      { date: '2025-05-31T00:00:00', count: 375 },
      { date: '2025-06-01T00:00:00', count: 420 },
      { date: '2025-06-02T00:00:00', count: 510 },
      { date: '2025-06-03T00:00:00', count: 580 },
      { date: '2025-06-04T00:00:00', count: 630 },
      { date: '2025-06-05T00:00:00', count: 685 }
    ],
    platforms: [
      { name: 'X', count: 1385, percentage: 43 },
      { name: 'Instagram', count: 982, percentage: 31 },
      { name: 'Facebook', count: 546, percentage: 17 },
      { name: 'TikTok', count: 301, percentage: 9 }
    ]
  }
];

export default HashtagMonitoring;
