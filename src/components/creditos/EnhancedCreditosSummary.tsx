// @ts-nocheck

"use client";

import React, { useState, useEffect } from 'react';
import { useCreditosContext, HistorialTransaccion } from '@/context/CreditosContext';
import { motion } from 'framer-motion';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { CreditCard, AlertTriangle, TrendingUp, TrendingDown, Calendar, Clock } from 'lucide-react';

// Registro de componentes Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

interface EnhancedCreditosSummaryProps {
  showDetails?: boolean;
  showChart?: boolean;
}

export default function EnhancedCreditosSummary({ 
  showDetails = true, 
  showChart = true 
}: EnhancedCreditosSummaryProps) {
  // Obtener datos del contexto
  const { 
    disponibles, 
    gastados, 
    totalAsignado, 
    isLoading: cargandoCreditos,
    historial
  } = useCreditosContext();
  
  const [animateValue, setAnimateValue] = useState(0);
  const [showAlert, setShowAlert] = useState(false);
  
  const total = disponibles + gastados;
  const porcentajeDisponible = total > 0 ? (disponibles / total) * 100 : 0;
  const porcentajeGastado = total > 0 ? (gastados / total) * 100 : 0;
  
  // Calcular la tasa de consumo diario promedio
  const consumoDiario = historial && historial.length > 1 
    ? Math.round(historial.reduce((sum: number, item: HistorialTransaccion) => sum + item.monto, 0) / historial.length)
    : 0;
  
  // Estimar días restantes basado en el consumo diario
  const diasRestantes = consumoDiario > 0 ? Math.round(disponibles / consumoDiario) : 0;
  
  // Determinar si mostrar alerta de créditos bajos
  useEffect(() => {
    if (porcentajeDisponible < 20) {
      setShowAlert(true);
    } else {
      setShowAlert(false);
    }
  }, [porcentajeDisponible]);
  
  // Animación del valor de créditos disponibles
  useEffect(() => {
    const duration = 1500;
    const frameDuration = 1000 / 60;
    const totalFrames = Math.round(duration / frameDuration);
    let frame = 0;
    
    const counter = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      const currentValue = Math.round(progress * disponibles);
      
      setAnimateValue(currentValue);
      
      if (frame === totalFrames) {
        clearInterval(counter);
      }
    }, frameDuration);
    
    return () => clearInterval(counter);
  }, [disponibles]);

  // Determinar el color de la barra de progreso según el nivel de créditos
  const getProgressColor = () => {
    if (porcentajeDisponible < 20) return 'bg-red-500';
    if (porcentajeDisponible < 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Datos para el gráfico de dona
  const chartData = {
    labels: ['Disponibles', 'Gastados'],
    datasets: [
      {
        data: [disponibles, gastados],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)', // Verde para disponibles
          'rgba(239, 68, 68, 0.8)', // Rojo para gastados
        ],
        borderColor: [
          'rgba(16, 185, 129, 1)',
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
            return `${context.label}: ${context.raw.toLocaleString()}`;
          }
        }
      }
    },
    cutout: '70%',
  };

  // Calcular la tendencia de uso (aumentando o disminuyendo)
  const calcularTendencia = () => {
    if (!historial || historial.length < 4) return null;
    
    const ultimosDias = historial.slice(-4);
    const primerMitad = ultimosDias.slice(0, 2).reduce((sum: number, item: HistorialTransaccion) => sum + item.monto, 0);
    const segundaMitad = ultimosDias.slice(-2).reduce((sum: number, item: HistorialTransaccion) => sum + item.monto, 0);
    
    const diferencia = segundaMitad - primerMitad;
    const porcentaje = Math.round((diferencia / primerMitad) * 100);
    
    return {
      direccion: diferencia > 0 ? 'up' : diferencia < 0 ? 'down' : 'stable',
      porcentaje: Math.abs(porcentaje)
    };
  };
  
  const tendencia = calcularTendencia();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
            <CreditCard className="mr-2 h-5 w-5 text-primary-600" />
            Resumen de Créditos
          </h2>
          {cargandoCreditos && (
            <div className="animate-spin h-5 w-5 border-2 border-primary-600 border-t-transparent rounded-full"></div>
          )}
        </div>
        
        {/* Alerta de créditos bajos */}
        {showAlert && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-start"
          >
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-300">
                Créditos bajos
              </p>
              <p className="text-xs text-red-600 dark:text-red-400">
                Te quedan menos del 20% de tus créditos disponibles. Considera recargar pronto.
              </p>
            </div>
          </motion.div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Gráfico y contador principal */}
          <div>
            {showChart ? (
              <div className="h-48">
                <Doughnut data={chartData} options={chartOptions} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48">
                <div className="text-4xl font-bold text-gray-900 dark:text-white">
                  {animateValue.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Créditos disponibles
                </div>
              </div>
            )}
          </div>
          
          {/* Detalles y métricas */}
          <div className="space-y-4">
            {/* Disponibles vs. Gastados */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Disponibles</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {disponibles.toLocaleString()} ({Math.round(porcentajeDisponible)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${porcentajeDisponible}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Gastados</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {gastados.toLocaleString()} ({Math.round(porcentajeGastado)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full" 
                  style={{ width: `${porcentajeGastado}%` }}
                ></div>
              </div>
            </div>
            
            {/* Métricas adicionales */}
            {showDetails && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-1">
                    <Clock className="h-4 w-4 mr-1" />
                    Consumo diario
                  </div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {consumoDiario.toLocaleString()}
                  </div>
                  {tendencia && (
                    <div className={`text-xs flex items-center ${
                      tendencia.direccion === 'up' ? 'text-red-500' : 
                      tendencia.direccion === 'down' ? 'text-green-500' : 
                      'text-gray-500'
                    }`}>
                      {tendencia.direccion === 'up' ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : tendencia.direccion === 'down' ? (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      ) : null}
                      {tendencia.porcentaje}% vs. periodo anterior
                    </div>
                  )}
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-1">
                    <Calendar className="h-4 w-4 mr-1" />
                    Días estimados
                  </div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {diasRestantes}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Al ritmo actual
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Botón de acción */}
        <div className="mt-6">
          <button className="w-full py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors">
            Comprar más créditos
          </button>
        </div>
      </div>
    </div>
  );
}
