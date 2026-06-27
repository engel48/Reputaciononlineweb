'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Loader2 } from 'lucide-react';

interface DatosUsuario {
  id: string;
  nombre: string;
  disponibles: number;
  gastados: number;
  total: number;
  porcentajeUso: number;
}

export default function CreditosPorUsuarioChart() {
  const supabase = createClientComponentClient();
  const [datosUsuarios, setDatosUsuarios] = useState<DatosUsuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    cargarDatosUsuarios();
  }, []);

  const cargarDatosUsuarios = async () => {
    try {
      setCargando(true);
      setError('');

      // Obtener datos de créditos de usuarios (la columna real es `credits`, no `credits_available`)
      const { data: usuarios, error: errorUsuarios } = await supabase
        .from('users')
        .select('id, name, email, credits');

      if (errorUsuarios) throw errorUsuarios;

      // Obtener transacciones de créditos para calcular gastados
      const { data: transacciones, error: errorTx } = await supabase
        .from('credit_transactions')
        .select('user_id, amount, type');

      if (errorTx) throw errorTx;

      // Calcular créditos gastados por usuario
      const gastadosPorUsuario: Record<string, number> = {};
      transacciones?.forEach((tx) => {
        if (tx.type === 'usage' || tx.type === 'debit') {
          if (!gastadosPorUsuario[tx.user_id]) {
            gastadosPorUsuario[tx.user_id] = 0;
          }
          gastadosPorUsuario[tx.user_id] += Math.abs(tx.amount);
        }
      });

      // Construir datos para la tabla
      const datos = usuarios?.map((usuario: any) => {
        const disponibles = usuario.credits || 0;
        const gastados = gastadosPorUsuario[usuario.id] || 0;
        const total = disponibles + gastados;
        const porcentajeUso = total > 0 ? ((gastados / total) * 100) : 0;

        return {
          id: usuario.id,
          nombre: usuario.name || usuario.email,
          disponibles,
          gastados,
          total,
          porcentajeUso: parseFloat(porcentajeUso.toFixed(1))
        };
      }).filter(u => u.total > 0) || [];

      // Ordenar por total de créditos (mayor a menor)
      datos.sort((a, b) => b.total - a.total);

      setDatosUsuarios(datos);
    } catch (error) {
      console.error('Error cargando datos de usuarios:', error);
      setError('Error al cargar datos de usuarios');
    } finally {
      setCargando(false);
    }
  };

  // Obtener color basado en el porcentaje de uso
  const getColorPorcentaje = (porcentaje: number) => {
    if (porcentaje > 80) return 'text-red-600 dark:text-red-600';
    if (porcentaje > 50) return 'text-amber-600 dark:text-amber-600';
    return 'text-green-600 dark:text-green-600';
  };

  if (cargando) {
    return (
      <div className="card p-6">
        <h2 className="heading-secondary mb-4">Créditos por Usuario</h2>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          <span className="ml-3 text-gray-600 dark:text-gray-500">Cargando datos...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6">
        <h2 className="heading-secondary mb-4">Créditos por Usuario</h2>
        <div className="text-center py-12 text-red-600 dark:text-red-600">
          {error}
        </div>
      </div>
    );
  }

  if (datosUsuarios.length === 0) {
    return (
      <div className="card p-6">
        <h2 className="heading-secondary mb-4">Créditos por Usuario</h2>
        <div className="text-center py-12 text-gray-500 dark:text-gray-500">
          No hay datos de créditos disponibles
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h2 className="heading-secondary mb-4">Créditos por Usuario</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-200">
          <thead className="bg-gray-50 dark:bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-500">Usuario</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-500">Disponibles</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-500">Gastados</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-500">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-500">% Uso</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-500">Distribución</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-200 dark:bg-gray-900">
            {datosUsuarios.map((usuario, index) => (
              <motion.tr
                key={usuario.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-100"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-900">
                  {usuario.nombre}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-600">
                  {usuario.disponibles.toLocaleString('es-CO')}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-600">
                  {usuario.gastados.toLocaleString('es-CO')}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-primary-600 dark:text-primary-400">
                  {usuario.total.toLocaleString('es-CO')}
                </td>
                <td className={`whitespace-nowrap px-6 py-4 text-sm font-medium ${getColorPorcentaje(usuario.porcentajeUso)}`}>
                  {usuario.porcentajeUso}%
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="h-4 w-full max-w-xs overflow-hidden rounded-full bg-gray-200 dark:bg-gray-100">
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
          <span className="text-xs text-gray-600 dark:text-gray-600">Créditos Gastados</span>
        </div>
        <div className="flex items-center">
          <div className="mr-2 h-3 w-3 rounded-full bg-green-500 dark:bg-green-600"></div>
          <span className="text-xs text-gray-600 dark:text-gray-600">Créditos Disponibles</span>
        </div>
      </div>
    </div>
  );
}
