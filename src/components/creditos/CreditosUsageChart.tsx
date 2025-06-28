import React, { useState } from 'react';
import { useCredits } from '@/context/CreditosContext';
import { motion } from 'framer-motion';

interface ChartData {
  label: string;
  valor: number;
  color: string;
  porcentaje?: number;
  anguloInicio?: number;
  anguloFin?: number;
}

export default function CreditosUsageChart() {
  const { currentBalance, transactions } = useCredits();
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<'semana' | 'mes' | 'año'>('mes');
  
  // Generar datos para el gráfico de dona (distribución por canal)
  const generarDatosCanal = (): ChartData[] => {
    // Calcular el consumo por canal basado en el historial
    const consumosPorCanal: Record<string, number> = {};
    
    // Filtrar por transacciones de tipo egreso (consumo)
    transactions
      .filter(tx => tx.type === 'usage')
      .forEach(tx => {
        const canal = tx.service || 'general';
        if (!consumosPorCanal[canal]) {
          consumosPorCanal[canal] = 0;
        }
        consumosPorCanal[canal] += Math.abs(tx.amount);
      });
    
    // Si no hay datos (historial vacío), mostrar datos de ejemplo
    if (Object.keys(consumosPorCanal).length === 0) {
      consumosPorCanal['facebook'] = 150;
      consumosPorCanal['x'] = 100;
      consumosPorCanal['instagram'] = 75;
      consumosPorCanal['general'] = 50;
    }
    
    // Convertir a formato de gráfico
    return Object.entries(consumosPorCanal).map(([canal, valor]) => {
      // Colores para cada canal
      const colores = {
        facebook: '#1877F2',
        instagram: '#E4405F',
        x: '#000000',
        linkedin: '#0A66C2',
        tiktok: '#000000',
        general: '#00B3B0',
        redes: '#5865F2',
        noticias: '#FF4500',
        monitoreo: '#4B0082',
        reportes: '#008080'
      };
      
      return {
        label: canal,
        valor,
        // @ts-ignore - sabemos que las claves coinciden
        color: colores[canal] || '#00B3B0'
      };
    });
  };
  
  const datosCanal = generarDatosCanal();
  const totalConsumo = datosCanal.reduce((sum, item) => sum + item.valor, 0);
  
  // Cálculo para el gráfico de dona
  const calcularAngulos = (datos: ChartData[]) => {
    const total = datos.reduce((sum, item) => sum + item.valor, 0);
    let anguloAcumulado = 0;
    
    return datos.map(item => {
      const porcentaje = total > 0 ? (item.valor / total) * 100 : 0;
      const angulo = total > 0 ? (item.valor / total) * 360 : 0;
      const resultado = {
        ...item,
        porcentaje,
        anguloInicio: anguloAcumulado,
        anguloFin: anguloAcumulado + angulo
      };
      
      anguloAcumulado += angulo;
      return resultado;
    });
  };
  
  const datosConAngulos = calcularAngulos(datosCanal);
  
  // SVG para el gráfico de dona
  const renderDonutChart = () => {
    const radio = 60;
    const centro = { x: 100, y: 100 };
    
    return (
      <svg width="200" height="200" viewBox="0 0 200 200">
        {/* Círculo de fondo */}
        <circle cx={centro.x} cy={centro.y} r={radio} fill="#f3f4f6" />
        
        {/* Segmentos */}
        {datosConAngulos.map((item, index) => {
          // No mostrar si es 0%
          if (item.porcentaje <= 0) return null;
          
          // Convertir ángulos a radianes
          const anguloInicioRad = (item.anguloInicio - 90) * (Math.PI / 180);
          const anguloFinRad = (item.anguloFin - 90) * (Math.PI / 180);
          
          // Calcular puntos para el path
          const x1 = centro.x + radio * Math.cos(anguloInicioRad);
          const y1 = centro.y + radio * Math.sin(anguloInicioRad);
          const x2 = centro.x + radio * Math.cos(anguloFinRad);
          const y2 = centro.y + radio * Math.sin(anguloFinRad);
          
          // Flag para arco mayor (>180 grados)
          const largeArcFlag = item.anguloFin - item.anguloInicio > 180 ? 1 : 0;
          
          // Path para el segmento
          const path = [
            `M ${centro.x} ${centro.y}`,
            `L ${x1} ${y1}`,
            `A ${radio} ${radio} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            'Z'
          ].join(' ');
          
          return (
            <motion.path
              key={index}
              d={path}
              fill={item.color}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            />
          );
        })}
        
        {/* Círculo interior para efecto dona */}
        <circle cx={centro.x} cy={centro.y} r={radio * 0.6} fill="white" />
        
        {/* Texto en el centro */}
        <text 
          x={centro.x} 
          y={centro.y - 5} 
          textAnchor="middle" 
          fontSize="12"
          fill="#4b5563"
        >
          Total
        </text>
        <text 
          x={centro.x} 
          y={centro.y + 15} 
          textAnchor="middle" 
          fontSize="16"
          fontWeight="bold"
          fill="#00B3B0"
        >
          {totalConsumo}
        </text>
      </svg>
    );
  };
  
  // Filtrar transacciones según el período
  const filtrarTransacciones = (periodo: 'semana' | 'mes' | 'año') => {
    const ahora = new Date();
    const fechaLimite = new Date();
    
    switch (periodo) {
      case 'semana':
        fechaLimite.setDate(ahora.getDate() - 7);
        break;
      case 'mes':
        fechaLimite.setMonth(ahora.getMonth() - 1);
        break;
      case 'año':
        fechaLimite.setFullYear(ahora.getFullYear() - 1);
        break;
    }
    
    return transactions.filter((tx: any) => new Date(tx.date) >= fechaLimite);
  };

  const transaccionesFiltradas = filtrarTransacciones(periodoSeleccionado);
  const creditosUsados = transaccionesFiltradas.filter((tx: any) => tx.type === 'usage')
    .reduce((sum: number, tx: any) => sum + Math.abs(tx.amount), 0);
  
  return (
    <div className="card p-4 sm:p-6">
      <h2 className="heading-secondary mb-4">Uso de Créditos</h2>
      
      {/* Selector de período */}
      <div className="mb-6 flex rounded-md bg-gray-100 p-1 dark:bg-gray-700">
        {(['semana', 'mes', 'año'] as const).map((periodo) => (
          <button
            key={periodo}
            className={`flex-1 rounded-md py-1 text-sm font-medium transition-colors ${periodo === periodoSeleccionado ? 'bg-white text-primary-600 shadow-sm dark:bg-gray-800 dark:text-primary-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
            onClick={() => setPeriodoSeleccionado(periodo)}
          >
            {periodo.charAt(0).toUpperCase() + periodo.slice(1)}
          </button>
        ))}
      </div>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Gráfico de dona */}
        <div>
          <h3 className="mb-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
            Distribución por Canal
          </h3>
          <div className="flex justify-center">{renderDonutChart()}</div>
          
          {/* Leyenda */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {datosCanal.map((item, index) => (
              <div key={index} className="flex items-center">
                <span 
                  className="mr-2 inline-block h-3 w-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs capitalize text-gray-600 dark:text-gray-300">
                  {item.label} ({item.porcentaje && item.porcentaje > 0 ? item.porcentaje.toFixed(1) : 0}%)
                </span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Estadísticas adicionales */}
        <div>
          <h3 className="mb-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
            Estadísticas de Uso
          </h3>
          
          <div className="space-y-3">
            {/* Promedio diario */}
            <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">Promedio Diario</p>
              <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                {Math.round(creditosUsados / 30)} créditos
              </p>
              <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-600">
                <div 
                  className="h-1 rounded-full bg-primary-500" 
                  style={{ width: `${Math.min((creditosUsados / 30) / (creditosUsados / 10) * 100, 100)}%` }}
                />
              </div>
            </div>
            
            {/* Canal más usado */}
            <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">Canal Más Usado</p>
              <p className="text-lg font-semibold capitalize text-gray-700 dark:text-gray-200">
                {datosCanal.length > 0 ? 
                  datosCanal.reduce((max, item) => item.valor > max.valor ? item : max, datosCanal[0]).label : 
                  'N/A'}
              </p>
            </div>
            
            {/* Predicción */}
            <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
              <p className="text-xs text-blue-600 dark:text-blue-400">Predicción</p>
              <p className="text-sm text-blue-800 dark:text-blue-300">
                Con tu uso actual, tus créditos durarán aproximadamente {' '}
                <span className="font-bold">
                  {Math.round(currentBalance / (creditosUsados / 30))} días
                </span>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
