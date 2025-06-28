import React from 'react';
import { motion } from 'framer-motion';

interface ChartData {
  canal: string;
  valor: number;
  color: string;
  porcentaje?: number;
}

export default function ConsumosPorCanalChart() {
  // Datos de ejemplo para el gráfico
  const datosConsumo: ChartData[] = [
    { canal: 'Facebook', valor: 42380, color: '#1877F2' },
    { canal: 'Instagram', valor: 38750, color: '#E4405F' },
    { canal: 'X', valor: 31200, color: '#000000' },
    { canal: 'LinkedIn', valor: 18450, color: '#0A66C2' },
    { canal: 'TikTok', valor: 11600, color: '#000000' }
  ];

  // Calcular el total y los porcentajes
  const total = datosConsumo.reduce((sum, item) => sum + item.valor, 0);
  const datosConPorcentaje = datosConsumo.map(item => ({
    ...item,
    porcentaje: (item.valor / total) * 100
  }));

  // Ordenar por valor (de mayor a menor)
  datosConPorcentaje.sort((a, b) => b.valor - a.valor);

  return (
    <div className="card p-6">
      <h2 className="heading-secondary mb-4">Consumo por Canal</h2>
      <div className="mb-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Total consumido: <span className="font-medium text-gray-900 dark:text-white">{total.toLocaleString('es-CO')} créditos</span>
        </p>
      </div>

      <div className="space-y-4">
        {datosConPorcentaje.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <div className="flex items-center">
              <div className="w-32 truncate text-sm font-medium text-gray-700 dark:text-gray-300">
                {item.canal}
              </div>
              <div className="ml-2 flex-1">
                <div className="h-4 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <motion.div 
                    className="h-4 rounded-full" 
                    style={{ backgroundColor: item.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${item.porcentaje}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  ></motion.div>
                </div>
              </div>
              <div className="ml-4 flex w-32 justify-between text-sm font-medium">
                <span className="text-gray-700 dark:text-gray-300">
                  {item.valor.toLocaleString('es-CO')}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  {item.porcentaje?.toFixed(1)}%
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
