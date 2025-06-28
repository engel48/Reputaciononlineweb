"use client";

import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// Registro de componentes Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

interface SentimentData {
  positive: number;
  neutral: number;
  negative: number;
  total: number;
  trend?: {
    positive: 'up' | 'down' | 'stable';
    neutral: 'up' | 'down' | 'stable';
    negative: 'up' | 'down' | 'stable';
    percentChange: {
      positive: number;
      neutral: number;
      negative: number;
    };
  };
}

interface EnhancedSentimentAnalysisProps {
  data: SentimentData;
  title: string;
  showDetails?: boolean;
  period?: string;
}

const EnhancedSentimentAnalysis: React.FC<EnhancedSentimentAnalysisProps> = ({ 
  data, 
  title, 
  showDetails = true,
  period = 'últimos 30 días'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const positiveBarRef = useRef<HTMLDivElement>(null);
  const neutralBarRef = useRef<HTMLDivElement>(null);
  const negativeBarRef = useRef<HTMLDivElement>(null);
  const [activeView, setActiveView] = useState<'bars' | 'chart'>('bars');

  const positivePercent = Math.round((data.positive / data.total) * 100);
  const neutralPercent = Math.round((data.neutral / data.total) * 100);
  const negativePercent = Math.round((data.negative / data.total) * 100);

  // Configuración para el gráfico de dona
  const chartData = {
    labels: ['Positivo', 'Neutral', 'Negativo'],
    datasets: [
      {
        data: [positivePercent, neutralPercent, negativePercent],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)', // Verde para positivo
          'rgba(107, 114, 128, 0.8)', // Gris para neutral
          'rgba(239, 68, 68, 0.8)', // Rojo para negativo
        ],
        borderColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(107, 114, 128, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
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
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.label}: ${context.raw}%`;
          }
        }
      }
    },
    cutout: '70%',
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Animación de entrada para el contenedor
    gsap.from(container, {
      duration: 0.7,
      y: 20,
      opacity: 0,
      ease: 'power3.out',
      onComplete: animateBars
    });

    function animateBars() {
      if (activeView !== 'bars') return;
      
      if (positiveBarRef.current) {
        gsap.fromTo(positiveBarRef.current, 
          { width: 0 }, 
          { width: `${positivePercent}%`, duration: 1.5, ease: 'power2.out' }
        );
      }
      
      if (neutralBarRef.current) {
        gsap.fromTo(neutralBarRef.current,
          { width: 0 },
          { width: `${neutralPercent}%`, duration: 1.5, ease: 'power2.out' }
        );
      }
      
      if (negativeBarRef.current) {
        gsap.fromTo(negativeBarRef.current,
          { width: 0 },
          { width: `${negativePercent}%`, duration: 1.5, ease: 'power2.out' }
        );
      }
    }
  }, [positivePercent, neutralPercent, negativePercent, activeView]);

  // Obtener el icono de tendencia
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return <TrendingUp size={16} className="text-green-500" />;
    if (trend === 'down') return <TrendingDown size={16} className="text-red-500" />;
    return <Minus size={16} className="text-gray-500" />;
  };

  // Obtener el color de tendencia
  const getTrendColor = (trend: 'up' | 'down' | 'stable', isPositive: boolean) => {
    if (trend === 'up') return isPositive ? 'text-green-500' : 'text-red-500';
    if (trend === 'down') return isPositive ? 'text-red-500' : 'text-green-500';
    return 'text-gray-500';
  };

  return (
    <div 
      ref={containerRef} 
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden"
    >
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            {title}
          </h3>
          
          {/* Selector de vista */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-md p-1">
            <button
              onClick={() => setActiveView('bars')}
              className={`px-3 py-1 text-xs rounded-md ${
                activeView === 'bars' 
                  ? 'bg-white dark:bg-gray-600 shadow-sm' 
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              Barras
            </button>
            <button
              onClick={() => setActiveView('chart')}
              className={`px-3 py-1 text-xs rounded-md ${
                activeView === 'chart' 
                  ? 'bg-white dark:bg-gray-600 shadow-sm' 
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              Gráfico
            </button>
          </div>
        </div>
        
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Análisis de sentimiento para {period}
        </div>
        
        {activeView === 'bars' ? (
          <div className="space-y-6">
            {/* Positivo */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Positivo</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{positivePercent}%</span>
                  {data.trend && (
                    <div className={`ml-2 flex items-center ${getTrendColor(data.trend.positive, true)}`}>
                      {getTrendIcon(data.trend.positive)}
                      <span className="text-xs ml-1">{data.trend.percentChange.positive}%</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div 
                  ref={positiveBarRef} 
                  className="bg-green-500 h-2.5 rounded-full" 
                  style={{ width: `${positivePercent}%` }}
                ></div>
              </div>
              {showDetails && (
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {data.positive.toLocaleString()} menciones
                </div>
              )}
            </div>

            {/* Neutral */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-gray-500 mr-2"></span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Neutral</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{neutralPercent}%</span>
                  {data.trend && (
                    <div className={`ml-2 flex items-center ${getTrendColor(data.trend.neutral, false)}`}>
                      {getTrendIcon(data.trend.neutral)}
                      <span className="text-xs ml-1">{data.trend.percentChange.neutral}%</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div 
                  ref={neutralBarRef} 
                  className="bg-gray-500 h-2.5 rounded-full" 
                  style={{ width: `${neutralPercent}%` }}
                ></div>
              </div>
              {showDetails && (
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {data.neutral.toLocaleString()} menciones
                </div>
              )}
            </div>

            {/* Negativo */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Negativo</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{negativePercent}%</span>
                  {data.trend && (
                    <div className={`ml-2 flex items-center ${getTrendColor(data.trend.negative, false)}`}>
                      {getTrendIcon(data.trend.negative)}
                      <span className="text-xs ml-1">{data.trend.percentChange.negative}%</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div 
                  ref={negativeBarRef} 
                  className="bg-red-500 h-2.5 rounded-full" 
                  style={{ width: `${negativePercent}%` }}
                ></div>
              </div>
              {showDetails && (
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {data.negative.toLocaleString()} menciones
                </div>
              )}
            </div>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="h-64"
          >
            <Doughnut data={chartData} options={chartOptions} />
            
            {showDetails && (
              <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Positivo</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {data.positive.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Neutral</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {data.neutral.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Negativo</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {data.negative.toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default EnhancedSentimentAnalysis;
