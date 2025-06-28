"use client";

import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  colorScheme?: 'primary' | 'blue' | 'green' | 'red' | 'yellow';
  isRefreshing?: boolean;
  lastUpdate?: Date;
  isRealTime?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  colorScheme = 'primary',
  isRefreshing = false,
  lastUpdate,
  isRealTime = false
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const valueRef = useRef<HTMLDivElement>(null);

  const colorMap = {
    primary: {
      light: 'bg-primary-50 text-primary-600',
      dark: 'dark:bg-primary-900/20 dark:text-primary-400',
      icon: 'text-primary-600 dark:text-primary-400'
    },
    blue: {
      light: 'bg-blue-50 text-blue-600',
      dark: 'dark:bg-blue-900/20 dark:text-blue-400',
      icon: 'text-blue-600 dark:text-blue-400'
    },
    green: {
      light: 'bg-green-50 text-green-600',
      dark: 'dark:bg-green-900/20 dark:text-green-400',
      icon: 'text-green-600 dark:text-green-400'
    },
    red: {
      light: 'bg-red-50 text-red-600',
      dark: 'dark:bg-red-900/20 dark:text-red-400',
      icon: 'text-red-600 dark:text-red-400'
    },
    yellow: {
      light: 'bg-yellow-50 text-yellow-600',
      dark: 'dark:bg-yellow-900/20 dark:text-yellow-400',
      icon: 'text-yellow-600 dark:text-yellow-400'
    }
  };

  useEffect(() => {
    if (!cardRef.current) return;

    // Animación de entrada para la tarjeta
    gsap.from(cardRef.current, {
      duration: 0.6,
      y: 20,
      opacity: 0,
      ease: 'power2.out'
    });
  }, []);

  // Separate effect for value updates
  useEffect(() => {
    if (valueRef.current) {
      try {
        // For real-time updates, animate value change
        if (isRealTime) {
          gsap.to(valueRef.current, {
            textContent: value,
            duration: 0.8,
            ease: 'power2.out',
            snap: { textContent: 0.1 },
            onUpdate: function() {
              if (valueRef.current) {
                const numValue = Number(this.targets()[0].textContent) || 0;
                valueRef.current.innerHTML = numValue.toLocaleString();
              }
            }
          });
        } else {
          // Initial animation from 0
          gsap.from(valueRef.current, {
            textContent: 0,
            duration: 1.5,
            delay: 0.3,
            ease: 'power1.out',
            snap: { textContent: 1 },
            onUpdate: function() {
              if (valueRef.current) {
                const numValue = Number(this.targets()[0].textContent) || 0;
                valueRef.current.innerHTML = numValue.toLocaleString();
              }
            }
          });
        }
      } catch (error) {
        console.error('Error en animación de MetricCard:', error);
        // Asegurarse de que el valor se muestra aunque la animación falle
        if (valueRef.current) {
          valueRef.current.innerHTML = (value || 0).toLocaleString();
        }
      }
    }
  }, [value, isRealTime]);

  return (
    <div 
      ref={cardRef}
      className={`rounded-lg bg-white p-6 shadow-md transition-all hover:shadow-lg dark:bg-gray-800 ${
        isRealTime ? 'relative overflow-hidden' : ''
      }`}
    >
      {/* Real-time indicator */}
      {isRealTime && (
        <div className="absolute top-2 right-2 flex items-center space-x-1">
          <div className={`h-2 w-2 rounded-full ${
            isRefreshing ? 'bg-blue-500 animate-pulse' : 'bg-green-500'
          }`}></div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {isRefreshing ? 'Actualizando...' : 'En vivo'}
          </span>
        </div>
      )}
      
      <div className="flex items-center">
        <div className={`mr-4 flex h-12 w-12 items-center justify-center rounded-lg ${colorMap[colorScheme].light} ${colorMap[colorScheme].dark} ${
          isRefreshing ? 'animate-pulse' : ''
        }`}>
          <Icon className={`h-6 w-6 ${colorMap[colorScheme].icon}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            {lastUpdate && isRealTime && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {lastUpdate.toLocaleTimeString('es-ES', { 
                  hour: '2-digit', 
                  minute: '2-digit', 
                  second: '2-digit' 
                })}
              </span>
            )}
          </div>
          <div className="mt-1 flex items-end">
            <div 
              ref={valueRef}
              className="text-2xl font-bold text-gray-900 dark:text-white"
            >
              0
            </div>
            {isRealTime && (
              <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">%</span>
            )}

            {trend && (
              <div className={`ml-2 flex items-center text-sm font-medium ${trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                <span>{trend.value}%</span>
                <svg 
                  className={`ml-1 h-3 w-3 ${trend.isPositive ? 'rotate-0' : 'rotate-180'}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
