import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, TrendingUp, AlertTriangle } from 'lucide-react';

type Periodo = 'mes' | 'trimestre' | 'semestre';

export default function PrediccionUsoChart() {
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<Periodo>('trimestre');
  
  // Fechas para el gráfico de predicción
  const obtenerMeses = (cantidad: number) => {
    const fechaActual = new Date();
    const meses = [];
    
    for (let i = 0; i < cantidad; i++) {
      const fecha = new Date(fechaActual);
      fecha.setMonth(fechaActual.getMonth() + i);
      meses.push(fecha.toLocaleDateString('es-CO', { month: 'short' }));
    }
    
    return meses;
  };
  
  // Configurar datos según el periodo seleccionado
  const configPeriodos = {
    mes: { meses: obtenerMeses(1), proyectados: [48000] },
    trimestre: { meses: obtenerMeses(3), proyectados: [48000, 52500, 58000] },
    semestre: { meses: obtenerMeses(6), proyectados: [48000, 52500, 58000, 63500, 68000, 74500] }
  };
  
  const datosPeriodo = configPeriodos[periodoSeleccionado];
  
  // Calcular valores históricos (últimos 3 meses)
  const datosHistoricos = [32000, 38500, 44000];
  const mesesHistoricos = [
    new Date(new Date().setMonth(new Date().getMonth() - 3)).toLocaleDateString('es-CO', { month: 'short' }),
    new Date(new Date().setMonth(new Date().getMonth() - 2)).toLocaleDateString('es-CO', { month: 'short' }),
    new Date(new Date().setMonth(new Date().getMonth() - 1)).toLocaleDateString('es-CO', { month: 'short' })
  ];
  
  // Calcular el valor máximo para escalar el gráfico
  const valorMaximo = Math.max(
    ...datosHistoricos,
    ...datosPeriodo.proyectados
  ) * 1.2; // Añadir 20% de espacio
  
  // Calcular altura de las barras en píxeles
  const alturaMaxima = 200;
  
  // Calcular estadísticas de crecimiento
  const crecimientoMensualPromedio = 10; // Ejemplo: 10%
  const consumoActual = datosHistoricos[datosHistoricos.length - 1];
  const consumoFinal = datosPeriodo.proyectados[datosPeriodo.proyectados.length - 1];
  const crecimientoTotal = ((consumoFinal - consumoActual) / consumoActual) * 100;
  
  return (
    <div className="card p-6">
      <h2 className="heading-secondary mb-4">Predicción de Uso</h2>
      
      {/* Selector de período */}
      <div className="mb-6 flex rounded-md bg-gray-100 p-1 dark:bg-gray-700">
        {(['mes', 'trimestre', 'semestre'] as const).map((periodo) => (
          <button
            key={periodo}
            className={`flex-1 rounded-md py-1 text-sm font-medium transition-colors ${periodo === periodoSeleccionado ? 'bg-white text-primary-600 shadow-sm dark:bg-gray-800 dark:text-primary-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
            onClick={() => setPeriodoSeleccionado(periodo)}
          >
            {periodo.charAt(0).toUpperCase() + periodo.slice(1)}
          </button>
        ))}
      </div>
      
      {/* Alerta de predicción */}
      <div className="mb-6 rounded-md bg-amber-50 p-3 dark:bg-amber-900/20">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              Esta predicción se basa en patrones históricos y puede variar. Se proyecta un crecimiento promedio de {crecimientoMensualPromedio}% mensual.
            </p>
          </div>
        </div>
      </div>
      
      {/* Gráfico de líneas */}
      <div className="mt-8 h-64">
        <div className="relative h-full w-full">
          {/* Líneas de referencia horizontales */}
          {[0.25, 0.5, 0.75, 1].map((ratio) => (
            <div 
              key={ratio}
              className="absolute left-0 right-0 border-t border-gray-200 dark:border-gray-700"
              style={{ bottom: `${ratio * 100}%` }}
            >
              <span className="absolute -top-3 -left-10 text-xs text-gray-500 dark:text-gray-400">
                {Math.round(valorMaximo * ratio).toLocaleString('es-CO')}
              </span>
            </div>
          ))}
          
          {/* Área histórica */}
          <div className="absolute bottom-0 left-0 right-0 top-0 flex items-end justify-between pr-10">
            {/* Datos históricos */}
            {datosHistoricos.map((valor, index) => (
              <div key={`hist-${index}`} className="flex w-full flex-col items-center">
                <motion.div
                  className="relative w-10 rounded-t bg-gray-300 dark:bg-gray-600"
                  style={{ height: `${(valor / valorMaximo) * alturaMaxima}px` }}
                  initial={{ height: 0 }}
                  animate={{ height: `${(valor / valorMaximo) * alturaMaxima}px` }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 transform text-xs text-gray-500 dark:text-gray-400">
                    {valor.toLocaleString('es-CO')}
                  </span>
                </motion.div>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">{mesesHistoricos[index]}</div>
              </div>
            ))}
            
            {/* Línea divisoria */}
            <div className="h-full w-px bg-gray-300 dark:bg-gray-600"></div>
            
            {/* Datos proyectados */}
            {datosPeriodo.proyectados.map((valor, index) => (
              <div key={`proj-${index}`} className="flex w-full flex-col items-center">
                <motion.div
                  className="relative w-10 rounded-t bg-primary-500 dark:bg-primary-600"
                  style={{ height: `${(valor / valorMaximo) * alturaMaxima}px` }}
                  initial={{ height: 0 }}
                  animate={{ height: `${(valor / valorMaximo) * alturaMaxima}px` }}
                  transition={{ duration: 0.5, delay: (index + 3) * 0.1 }} // +3 para empezar después de los históricos
                >
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 transform text-xs font-medium text-primary-600 dark:text-primary-400">
                    {valor.toLocaleString('es-CO')}
                  </span>
                </motion.div>
                <div className="mt-2 text-xs font-medium text-primary-600 dark:text-primary-400">{datosPeriodo.meses[index]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Leyenda */}
      <div className="mt-6 flex justify-center space-x-6">
        <div className="flex items-center">
          <div className="mr-2 h-3 w-3 rounded-full bg-gray-300 dark:bg-gray-600"></div>
          <span className="text-xs text-gray-600 dark:text-gray-300">Histórico</span>
        </div>
        <div className="flex items-center">
          <div className="mr-2 h-3 w-3 rounded-full bg-primary-500 dark:bg-primary-600"></div>
          <span className="text-xs text-gray-600 dark:text-gray-300">Proyectado</span>
        </div>
      </div>
      
      {/* Métricas de predicción */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
          <div className="flex items-center">
            <Calendar className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            <p className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">Periodo Proyectado</p>
          </div>
          <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
            {periodoSeleccionado === 'mes' ? '1 mes' : periodoSeleccionado === 'trimestre' ? '3 meses' : '6 meses'}
          </p>
        </div>
        
        <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
          <div className="flex items-center">
            <TrendingUp className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            <p className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">Crecimiento Proyectado</p>
          </div>
          <p className="mt-2 text-lg font-semibold text-primary-600 dark:text-primary-400">
            +{crecimientoTotal.toFixed(1)}%
          </p>
        </div>
      </div>
      
      {/* Recomendación */}
      <div className="mt-6 rounded-md bg-blue-50 p-4 dark:bg-blue-900/20">
        <h3 className="text-sm font-medium text-blue-700 dark:text-blue-400">Recomendación</h3>
        <p className="mt-1 text-sm text-blue-600 dark:text-blue-300">
          Basado en la proyección de uso, se recomienda preparar un plan de asignación de créditos de al menos {Math.round(consumoFinal * 1.1).toLocaleString('es-CO')} créditos para los próximos {periodoSeleccionado === 'mes' ? '30 días' : periodoSeleccionado === 'trimestre' ? '90 días' : '180 días'}.  
        </p>
      </div>
    </div>
  );
}
