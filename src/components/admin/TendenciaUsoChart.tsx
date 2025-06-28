import React, { useState } from 'react';
import { motion } from 'framer-motion';

type Periodo = 'semana' | 'mes' | 'trimestre';

interface DatosTendencia {
  fecha: string;
  consumo: number;
  recarga: number;
}

export default function TendenciaUsoChart() {
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<Periodo>('mes');
  
  // Datos de ejemplo para diferentes periodos
  const datosPorPeriodo: Record<Periodo, DatosTendencia[]> = {
    semana: [
      { fecha: 'Lun', consumo: 1250, recarga: 0 },
      { fecha: 'Mar', consumo: 1830, recarga: 0 },
      { fecha: 'Mié', consumo: 2140, recarga: 5000 },
      { fecha: 'Jue', consumo: 1680, recarga: 0 },
      { fecha: 'Vie', consumo: 2410, recarga: 0 },
      { fecha: 'Sáb', consumo: 980, recarga: 0 },
      { fecha: 'Dom', consumo: 750, recarga: 0 },
    ],
    mes: [
      { fecha: 'Sem 1', consumo: 9750, recarga: 15000 },
      { fecha: 'Sem 2', consumo: 12350, recarga: 0 },
      { fecha: 'Sem 3', consumo: 14860, recarga: 10000 },
      { fecha: 'Sem 4', consumo: 11280, recarga: 0 },
    ],
    trimestre: [
      { fecha: 'Ene', consumo: 45800, recarga: 60000 },
      { fecha: 'Feb', consumo: 38950, recarga: 25000 },
      { fecha: 'Mar', consumo: 42750, recarga: 50000 },
      { fecha: 'Abr', consumo: 48350, recarga: 30000 },
      { fecha: 'May', consumo: 52150, recarga: 70000 },
      { fecha: 'Jun', consumo: 49300, recarga: 45000 },
    ],
  };
  
  const datosMostrados = datosPorPeriodo[periodoSeleccionado];
  
  // Encontrar el valor máximo para escalar el gráfico
  const valorMaximo = Math.max(
    ...datosMostrados.map(d => Math.max(d.consumo, d.recarga))
  );
  
  // Altura máxima de las barras en píxeles
  const alturaMaxima = 200;
  
  // Calcular estadísticas
  const totalConsumo = datosMostrados.reduce((sum, item) => sum + item.consumo, 0);
  const totalRecarga = datosMostrados.reduce((sum, item) => sum + item.recarga, 0);
  const promedioConsumo = totalConsumo / datosMostrados.length;
  
  return (
    <div className="card p-6">
      <h2 className="heading-secondary mb-4">Tendencia de Uso de Créditos</h2>
      
      {/* Selector de período */}
      <div className="mb-6 flex rounded-md bg-gray-100 p-1 dark:bg-gray-700">
        {(['semana', 'mes', 'trimestre'] as const).map((periodo) => (
          <button
            key={periodo}
            className={`flex-1 rounded-md py-1 text-sm font-medium transition-colors ${periodo === periodoSeleccionado ? 'bg-white text-primary-600 shadow-sm dark:bg-gray-800 dark:text-primary-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
            onClick={() => setPeriodoSeleccionado(periodo)}
          >
            {periodo === 'semana' ? 'Semana' : periodo === 'mes' ? 'Mes' : 'Trimestre'}
          </button>
        ))}
      </div>
      
      {/* Gráfico de barras */}
      <div className="mt-8 h-64">
        <div className="flex h-full items-end justify-between">
          {datosMostrados.map((dato, index) => (
            <div key={index} className="flex w-full flex-col items-center">
              <div className="relative flex w-full justify-center space-x-1">
                {/* Barra de consumo */}
                <motion.div
                  className="w-4 rounded-t bg-red-500 dark:bg-red-600"
                  style={{ 
                    height: `${(dato.consumo / valorMaximo) * alturaMaxima}px`,
                  }}
                  initial={{ height: 0 }}
                  animate={{ height: `${(dato.consumo / valorMaximo) * alturaMaxima}px` }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                />
                
                {/* Barra de recarga */}
                {dato.recarga > 0 && (
                  <motion.div
                    className="w-4 rounded-t bg-green-500 dark:bg-green-600"
                    style={{ 
                      height: `${(dato.recarga / valorMaximo) * alturaMaxima}px`,
                    }}
                    initial={{ height: 0 }}
                    animate={{ height: `${(dato.recarga / valorMaximo) * alturaMaxima}px` }}
                    transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
                  />
                )}
              </div>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">{dato.fecha}</div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Leyenda */}
      <div className="mt-4 flex justify-center space-x-6">
        <div className="flex items-center">
          <div className="mr-2 h-3 w-3 rounded-full bg-red-500 dark:bg-red-600"></div>
          <span className="text-xs text-gray-600 dark:text-gray-300">Consumo</span>
        </div>
        <div className="flex items-center">
          <div className="mr-2 h-3 w-3 rounded-full bg-green-500 dark:bg-green-600"></div>
          <span className="text-xs text-gray-600 dark:text-gray-300">Recarga</span>
        </div>
      </div>
      
      {/* Estadísticas */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Consumido</p>
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
            {totalConsumo.toLocaleString('es-CO')}
          </p>
        </div>
        
        <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Recargado</p>
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
            {totalRecarga.toLocaleString('es-CO')}
          </p>
        </div>
        
        <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">Promedio Diario</p>
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
            {Math.round(promedioConsumo).toLocaleString('es-CO')}
          </p>
        </div>
      </div>
    </div>
  );
}
