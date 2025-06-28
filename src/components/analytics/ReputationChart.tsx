"use client";

import React, { useRef, useEffect } from 'react';
import { Chart, registerables } from 'chart.js';
import { gsap } from 'gsap';

Chart.register(...registerables);

interface ReputationChartProps {
  data: {
    labels?: string[];
    values?: number[];
    previousPeriodValues?: number[];
  };
  title: string;
  showComparison?: boolean;
  type?: 'line' | 'bar';
}

const ReputationChart: React.FC<ReputationChartProps> = ({ 
  data, 
  title, 
  showComparison = false,
  type = 'line'
}) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;
    
    try {
      // Destruir el gráfico anterior si existe
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = chartRef.current.getContext('2d');
      if (!ctx) return;

      const gradientFill = ctx.createLinearGradient(0, 0, 0, 400);
      gradientFill.addColorStop(0, 'rgba(0, 179, 176, 0.4)'); // Color primario con transparencia
      gradientFill.addColorStop(1, 'rgba(0, 179, 176, 0.05)');
      
      // Asegurar que tenemos datos válidos
      const labels = data.labels || [];
      const values = data.values || [];
      const previousValues = data.previousPeriodValues || [];

      const chartData = {
        labels: labels,
        datasets: [
          {
            label: 'Actual',
            data: values,
            borderColor: '#00B3B0', // Color primario
            backgroundColor: type === 'line' ? gradientFill : 'rgba(0, 179, 176, 0.7)',
            borderWidth: 2,
            tension: 0.3,
            pointBackgroundColor: '#00B3B0',
            pointBorderColor: '#fff',
            pointRadius: 4,
            fill: type === 'line',
          },
          ...(showComparison && previousValues.length > 0 ? [{
            label: 'Período Anterior',
            data: previousValues,
            borderColor: '#94A3B8', // Color gris
            backgroundColor: 'rgba(148, 163, 184, 0.2)',
            borderWidth: 2,
            borderDash: [5, 5],
            tension: 0.3,
            pointRadius: 3,
            fill: false,
          }] : [])
        ]
      };

      chartInstance.current = new Chart(ctx, {
        type,
        data: chartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                boxWidth: 12,
                usePointStyle: true,
                pointStyle: 'circle',
                color: '#64748B'
              }
            },
            tooltip: {
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              titleColor: '#000',
              bodyColor: '#64748B',
              borderColor: '#E2E8F0',
              borderWidth: 1,
              padding: 12,
              boxPadding: 6,
              usePointStyle: true,
              callbacks: {
                label: function(context) {
                  let label = context.dataset.label || '';
                  if (label) {
                    label += ': ';
                  }
                  if (context.parsed.y !== null) {
                    label += context.parsed.y;
                  }
                  return label;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(226, 232, 240, 0.6)'
              },
              ticks: {
                color: '#64748B',
                padding: 10,
                font: {
                  size: 11
                }
              }
            },
            x: {
              grid: {
                display: false
              },
              ticks: {
                color: '#64748B',
                padding: 10,
                font: {
                  size: 11
                }
              }
            }
          },
        }
      });

      // Animación con GSAP para la entrada del gráfico
      if (chartContainerRef.current) {
        gsap.from(chartContainerRef.current, {
          duration: 0.8,
          y: 20,
          opacity: 0,
          ease: 'power3.out'
        });
      }
    } catch (error) {
      console.error('Error al crear o animar el gráfico:', error);
      // Asegurarse de que el contenedor es visible aunque falle la animación
      if (chartContainerRef.current) {
        chartContainerRef.current.style.opacity = '1';
      }
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, showComparison, type]);

  return (
    <div ref={chartContainerRef} className="rounded-lg bg-white p-4 shadow-md dark:bg-gray-800">
      <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
      <div className="h-80 w-full">
        <canvas ref={chartRef} />
      </div>
    </div>
  );
};

export default ReputationChart;
