import React from 'react';
import { motion } from 'framer-motion';

interface DatosUsuario {
  id: string;
  nombre: string;
  disponibles: number;
  gastados: number;
  total: number;
  porcentajeUso: number;
}

export default function CreditosPorUsuarioChart() {
  // Datos de ejemplo para los usuarios
  const datosUsuarios: DatosUsuario[] = [
    {
      id: 'u1',
      nombre: 'Carlos Rodríguez',
      disponibles: 18250,
      gastados: 25840,
      total: 44090,
      porcentajeUso: 58.6
    },
    {
      id: 'u2',
      nombre: 'María López',
      disponibles: 12740,
      gastados: 18650,
      total: 31390,
      porcentajeUso: 59.4
    },
    {
      id: 'u3',
      nombre: 'Juan Martínez',
      disponibles: 28450,
      gastados: 12470,
      total: 40920,
      porcentajeUso: 30.5
    },
    {
      id: 'u4',
      nombre: 'Ana Gómez',
      disponibles: 5320,
      gastados: 9830,
      total: 15150,
      porcentajeUso: 64.9
    },
    {
      id: 'u5',
      nombre: 'Pedro Sánchez',
      disponibles: 31450,
      gastados: 7620,
      total: 39070,
      porcentajeUso: 19.5
    },
    {
      id: 'u6',
      nombre: 'Laura Torres',
      disponibles: 24680,
      gastados: 15370,
      total: 40050,
      porcentajeUso: 38.4
    },
  ];

  // Ordenar por total de créditos (mayor a menor)
  const usuariosOrdenados = [...datosUsuarios].sort((a, b) => b.total - a.total);

  // Encontrar el máximo de créditos para escalar el gráfico
  const maxCreditos = Math.max(...usuariosOrdenados.map(u => u.total));

  // Obtener color basado en el porcentaje de uso
  const getColorPorcentaje = (porcentaje: number) => {
    if (porcentaje > 80) return 'text-red-600 dark:text-red-400';
    if (porcentaje > 50) return 'text-amber-600 dark:text-amber-400';
    return 'text-green-600 dark:text-green-400';
  };

  return (
    <div className="card p-6">
      <h2 className="heading-secondary mb-4">Créditos por Usuario</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Usuario</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Disponibles</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Gastados</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">% Uso</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Distribución</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
            {usuariosOrdenados.map((usuario, index) => (
              <motion.tr 
                key={usuario.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                  {usuario.nombre}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                  {usuario.disponibles.toLocaleString('es-CO')}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                  {usuario.gastados.toLocaleString('es-CO')}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-primary-600 dark:text-primary-400">
                  {usuario.total.toLocaleString('es-CO')}
                </td>
                <td className={`whitespace-nowrap px-6 py-4 text-sm font-medium ${getColorPorcentaje(usuario.porcentajeUso)}`}>
                  {usuario.porcentajeUso}%
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="h-4 w-full max-w-xs overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <div className="flex h-full">
                      <motion.div
                        className="h-full bg-red-500 dark:bg-red-600"
                        style={{ width: `${usuario.porcentajeUso}%` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${usuario.porcentajeUso}%` }}
                        transition={{ duration: 0.8, delay: index * 0.1 }}
                      />
                      <motion.div
                        className="h-full bg-green-500 dark:bg-green-600"
                        style={{ width: `${100 - usuario.porcentajeUso}%` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${100 - usuario.porcentajeUso}%` }}
                        transition={{ duration: 0.8, delay: index * 0.1 + 0.2 }}
                      />
                    </div>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Leyenda */}
      <div className="mt-4 flex justify-end space-x-6">
        <div className="flex items-center">
          <div className="mr-2 h-3 w-3 rounded-full bg-red-500 dark:bg-red-600"></div>
          <span className="text-xs text-gray-600 dark:text-gray-300">Créditos Gastados</span>
        </div>
        <div className="flex items-center">
          <div className="mr-2 h-3 w-3 rounded-full bg-green-500 dark:bg-green-600"></div>
          <span className="text-xs text-gray-600 dark:text-gray-300">Créditos Disponibles</span>
        </div>
      </div>
    </div>
  );
}
