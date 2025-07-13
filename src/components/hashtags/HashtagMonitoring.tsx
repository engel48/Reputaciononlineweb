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
import { Hash, TrendingUp, TrendingDown, BarChart3, Activity } from 'lucide-react';

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
  
  // Cambiar datos del gráfico cuando cambie el hashtag seleccionado - Paleta de la plataforma
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
            borderColor: '#01257D',
            backgroundColor: 'rgba(1, 37, 125, 0.1)',
            pointBackgroundColor: '#01257D',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 3,
            pointRadius: 6,
            pointHoverRadius: 8,
            tension: 0.4,
            fill: true,
            borderWidth: 3
          }
        ]
      });
    }
  }, [selectedHashtag]);

  // Determinar color según tendencia - Paleta de la plataforma
  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return 'text-emerald-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-[#01257D]';
  };

  // Determinar icono según tendencia
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return '↑';
    if (trend === 'down') return '↓';
    return '→';
  };

  return (
    <div className="border-0 shadow-2xl bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 dark:from-gray-900 dark:via-blue-900/10 dark:to-indigo-900/10 rounded-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white p-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-3xl font-bold flex items-center">
            <Hash className="mr-3 h-8 w-8" />
            📊 Monitoreo de Hashtags
          </h2>
          {isLoading && (
            <div className="relative">
              <div className="animate-spin h-8 w-8 border-4 border-white/30 border-t-white rounded-full"></div>
              <Activity className="absolute inset-0 m-auto h-4 w-4 text-white animate-pulse" />
            </div>
          )}
        </div>
        <p className="text-blue-100 text-lg">
          🔥 Seguimiento en tiempo real de hashtags trending en LATAM
        </p>
      </div>
      <div className="p-8">
        
        {/* Selector de hashtags mejorado */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-[#01257D] dark:text-white mb-4 flex items-center">
            <Hash className="mr-2 h-6 w-6 text-purple-600" />
            Hashtags Monitoreados
          </h3>
          <div className="flex flex-wrap gap-3">
            {hashtags.map((hashtag) => (
              <button
                key={hashtag.id}
                onClick={() => setSelectedHashtag(hashtag)}
                className={`relative px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
                  selectedHashtag?.id === hashtag.id
                    ? 'bg-gradient-to-r from-[#01257D] to-[#013AAA] text-white shadow-lg'
                    : 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 shadow-md hover:shadow-lg'
                }`}
              >
                <span className="flex items-center">
                  <Hash className="mr-1 h-4 w-4" />
                  {hashtag.name}
                  {selectedHashtag?.id === hashtag.id && (
                    <TrendingUp className="ml-2 h-4 w-4" />
                  )}
                </span>
                {hashtag.trend === 'up' && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                )}
                {hashtag.trend === 'down' && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                )}
              </button>
            ))}
          </div>
        </div>
        
        {/* Información del hashtag seleccionado */}
        {selectedHashtag && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <motion.div 
                key={`count-${selectedHashtag.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="relative overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-blue-900/30 dark:to-indigo-800/30 rounded-2xl p-6 border-2 border-blue-200 dark:border-blue-700 hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <div className="absolute top-2 right-2">
                  <BarChart3 className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-[#01257D] dark:text-blue-300 mb-3 flex items-center">
                  <Activity className="mr-2 h-5 w-5" />
                  Menciones Totales
                </h3>
                <p className="text-4xl font-bold text-[#01257D] dark:text-white mb-4">
                  {selectedHashtag.count.toLocaleString()}
                </p>
                <div className={`flex items-center text-lg font-semibold ${getTrendColor(selectedHashtag.trend)}`}>
                  {selectedHashtag.trend === 'up' ? (
                    <TrendingUp className="mr-2 h-5 w-5" />
                  ) : selectedHashtag.trend === 'down' ? (
                    <TrendingDown className="mr-2 h-5 w-5" />
                  ) : (
                    <Activity className="mr-2 h-5 w-5" />
                  )}
                  <span>{selectedHashtag.percentChange}%</span>
                  <span className="text-sm ml-2 text-gray-600 dark:text-gray-300 font-normal">
                    vs. período anterior
                  </span>
                </div>
              </motion.div>
              
              <motion.div 
                key={`platforms-${selectedHashtag.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="relative overflow-hidden bg-gradient-to-br from-purple-100 to-pink-200 dark:from-purple-900/30 dark:to-pink-800/30 rounded-2xl p-6 border-2 border-purple-200 dark:border-purple-700 col-span-2 hover:shadow-xl transition-all duration-300"
              >
                <div className="absolute top-2 right-2">
                  <Hash className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-[#01257D] dark:text-white mb-6 flex items-center">
                  🌐 Distribución por Plataforma
                </h3>
                <div className="space-y-4">
                  {selectedHashtag.platforms.map((platform, index) => {
                    const colors = ['#01257D', '#8B5CF6', '#059669', '#F59E0B'];
                    const bgColors = ['rgba(1, 37, 125, 0.1)', 'rgba(139, 92, 246, 0.1)', 'rgba(5, 150, 105, 0.1)', 'rgba(245, 158, 11, 0.1)'];
                    return (
                      <div key={platform.name} className="bg-white/70 dark:bg-gray-800/70 rounded-xl p-4 hover:shadow-lg transition-all duration-300">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                            📱 {platform.name}
                          </span>
                          <div className="text-right">
                            <span className="text-xl font-bold" style={{ color: colors[index % colors.length] }}>
                              {platform.count.toLocaleString()}
                            </span>
                            <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                              ({platform.percentage}%)
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 shadow-inner">
                          <div 
                            className="h-3 rounded-full shadow-lg transition-all duration-1000 ease-out"
                            style={{ 
                              width: `${platform.percentage}%`,
                              backgroundColor: colors[index % colors.length]
                            }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </div>
            
            {/* Gráfico de tendencia mejorado */}
            <motion.div
              key={`chart-${selectedHashtag.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-8"
            >
              <div className="bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-2xl p-6 border-2 border-indigo-200 dark:border-indigo-700">
                <h3 className="text-2xl font-bold text-[#01257D] dark:text-white mb-6 flex items-center">
                  <TrendingUp className="mr-3 h-7 w-7 text-indigo-600" />
                  📈 Evolución Temporal
                </h3>
                <div className="h-80 bg-white/70 dark:bg-gray-800/70 rounded-xl p-4">
                  {chartData && <Line data={chartData} options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: true,
                        position: 'top',
                        labels: {
                          usePointStyle: true,
                          pointStyle: 'circle',
                          font: {
                            size: 14,
                            weight: 'bold'
                          },
                          color: '#01257D'
                        }
                      },
                      title: {
                        display: false,
                      },
                      tooltip: {
                        backgroundColor: '#01257D',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#013AAA',
                        borderWidth: 2,
                        cornerRadius: 12,
                        displayColors: true,
                        titleFont: {
                          size: 14,
                          weight: 'bold'
                        },
                        bodyFont: {
                          size: 13
                        }
                      }
                    },
                    scales: {
                      x: {
                        grid: {
                          color: 'rgba(1, 37, 125, 0.1)',
                          lineWidth: 1
                        },
                        ticks: {
                          color: '#01257D',
                          font: {
                            size: 12,
                            weight: 'bold'
                          }
                        }
                      },
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: 'rgba(1, 37, 125, 0.1)',
                          lineWidth: 1
                        },
                        ticks: {
                          color: '#01257D',
                          font: {
                            size: 12,
                            weight: 'bold'
                          }
                        }
                      }
                    },
                    elements: {
                      line: {
                        tension: 0.4
                      },
                      point: {
                        hoverRadius: 10,
                        hoverBorderWidth: 3
                      }
                    }
                  }} />}
                </div>
              </div>
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
