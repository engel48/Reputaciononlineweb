"use client";

import React, { useState } from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';
import { motion } from 'framer-motion';
import { Facebook, Instagram, Linkedin, Youtube, Globe } from 'lucide-react';
import XLogo from '@/components/icons/XLogo';

// Registro de componentes Chart.js
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

// Tipos
interface PlatformData {
  name: string;
  value: number;
  color: string;
  trend?: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
  };
  history?: {
    date: string;
    count: number;
  }[];
}

interface SocialPlatformAnalysisProps {
  data: PlatformData[];
  title?: string;
  period?: string;
}

const SocialPlatformAnalysis: React.FC<SocialPlatformAnalysisProps> = ({ 
  data, 
  title = "Distribución por Plataformas",
  period = "últimos 30 días"
}) => {
  const [activeView, setActiveView] = useState<'pie' | 'bar'>('pie');
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  // Obtener el icono de la plataforma
  const getPlatformIcon = (name: string) => {
    const iconProps = { size: 16, className: "mr-2" };
    
    switch (name.toLowerCase()) {
      case 'x':
        return <XLogo {...iconProps} className="text-black dark:text-white mr-2" />;
      case 'facebook':
        return <Facebook {...iconProps} className="text-[#1877F2] mr-2" />;
      case 'instagram':
        return <Instagram {...iconProps} className="text-[#E4405F] mr-2" />;
      case 'linkedin':
        return <Linkedin {...iconProps} className="text-[#0A66C2] mr-2" />;
      case 'youtube':
        return <Youtube {...iconProps} className="text-[#FF0000] mr-2" />;
      default:
        return <Globe {...iconProps} className="text-gray-500 mr-2" />;
    }
  };

  // Datos para gráfico de pastel
  const pieChartData = {
    labels: data.map(item => item.name),
    datasets: [
      {
        data: data.map(item => item.value),
        backgroundColor: data.map(item => item.color),
        borderColor: data.map(item => item.color),
        borderWidth: 1,
      },
    ],
  };

  // Opciones para gráfico de pastel
  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
    },
  };

  // Datos para gráfico de barras
  const barChartData = {
    labels: data.map(item => item.name),
    datasets: [
      {
        label: 'Menciones',
        data: data.map(item => item.value),
        backgroundColor: data.map(item => item.color),
        borderColor: data.map(item => item.color),
        borderWidth: 1,
      },
    ],
  };

  // Opciones para gráfico de barras
  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  // Calcular el total de menciones
  const totalMenciones = data.reduce((sum, item) => sum + item.value, 0);

  // Obtener el color de tendencia
  const getTrendColor = (direction: 'up' | 'down' | 'stable') => {
    if (direction === 'up') return 'text-green-500';
    if (direction === 'down') return 'text-red-500';
    return 'text-gray-500';
  };

  // Obtener el icono de tendencia
  const getTrendIcon = (direction: 'up' | 'down' | 'stable') => {
    if (direction === 'up') return '↑';
    if (direction === 'down') return '↓';
    return '→';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            {title}
          </h3>
          
          {/* Selector de vista */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-md p-1">
            <button
              onClick={() => setActiveView('pie')}
              className={`px-3 py-1 text-xs rounded-md ${
                activeView === 'pie' 
                  ? 'bg-white dark:bg-gray-600 shadow-sm' 
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              Circular
            </button>
            <button
              onClick={() => setActiveView('bar')}
              className={`px-3 py-1 text-xs rounded-md ${
                activeView === 'bar' 
                  ? 'bg-white dark:bg-gray-600 shadow-sm' 
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              Barras
            </button>
          </div>
        </div>
        
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Distribución de menciones por plataforma para {period}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Gráfico */}
          <motion.div 
            key={activeView}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="h-64"
          >
            {activeView === 'pie' ? (
              <Pie data={pieChartData} options={pieChartOptions} />
            ) : (
              <Bar data={barChartData} options={barChartOptions} />
            )}
          </motion.div>
          
          {/* Detalles */}
          <div className="space-y-4">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Total: {totalMenciones.toLocaleString()} menciones
            </div>
            
            <div className="space-y-3">
              {data.map((platform) => (
                <div 
                  key={platform.name}
                  className={`p-3 rounded-lg transition-all ${
                    selectedPlatform === platform.name 
                      ? 'bg-gray-100 dark:bg-gray-700' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => setSelectedPlatform(
                    selectedPlatform === platform.name ? null : platform.name
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {getPlatformIcon(platform.name)}
                      <span className="font-medium">{platform.name}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium">{platform.value.toLocaleString()}</span>
                      <span className="text-gray-500 dark:text-gray-400 mx-1">·</span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {Math.round((platform.value / totalMenciones) * 100)}%
                      </span>
                      
                      {platform.trend && (
                        <span className={`ml-2 ${getTrendColor(platform.trend.direction)}`}>
                          {getTrendIcon(platform.trend.direction)} {platform.trend.percentage}%
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Barra de progreso */}
                  <div className="mt-2 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                    <div 
                      className="h-1.5 rounded-full" 
                      style={{ 
                        width: `${(platform.value / totalMenciones) * 100}%`,
                        backgroundColor: platform.color 
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialPlatformAnalysis;
