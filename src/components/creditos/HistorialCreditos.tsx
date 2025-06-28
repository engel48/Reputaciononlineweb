// @ts-nocheck
// @ts-ignore
import React, { useState, useEffect } from 'react';
// @ts-ignore
import { useCredits, CreditTransaction } from '@/context/CreditosContext';
// @ts-ignore
import { motion } from 'framer-motion';
// @ts-ignore
import { 
  Facebook, Instagram, Linkedin, 
  TrendingUp, TrendingDown, CreditCard, 
  Search, Calendar, Filter, ChevronDown
} from 'lucide-react';
// @ts-ignore
import XLogo from '@/components/icons/XLogo';

// @ts-ignore
type FiltroCanal = 'todos' | 'facebook' | 'instagram' | 'x' | 'linkedin' | 'tiktok' | 'general';
// @ts-ignore
type FiltroTipo = 'todos' | 'ingreso' | 'egreso';

// @ts-ignore
export default function HistorialCreditos() {
  // @ts-ignore
  const { transactions, isLoading } = useCredits();
  // @ts-ignore
  const [filtroCanal, setFiltroCanal] = useState<FiltroCanal>('todos');
  // @ts-ignore
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>('todos');
  // @ts-ignore
  const [busqueda, setBusqueda] = useState('');
  // @ts-ignore
  const [fechaInicio, setFechaInicio] = useState('');
  // @ts-ignore
  const [fechaFin, setFechaFin] = useState('');

  // @ts-ignore
  // Filtrar transacciones basadas en los criterios seleccionados
  // @ts-ignore
  const transaccionesFiltradas = transactions.filter((transaccion: any) => {
    // @ts-ignore
    // Filtro por canal
    // @ts-ignore
    if (filtroCanal !== 'todos' && transaccion.canal && transaccion.canal !== filtroCanal) {
      return false;
    }

    // @ts-ignore
    // Filtro por tipo
    // @ts-ignore
    if (filtroTipo !== 'todos' && transaccion.tipo !== filtroTipo) {
      return false;
    }

    // @ts-ignore
    // Filtro por búsqueda en descripción
    // @ts-ignore
    if (busqueda && !transaccion.descripcion.toLowerCase().includes(busqueda.toLowerCase())) {
      return false;
    }

    // @ts-ignore
    // Filtro por fecha de inicio
    // @ts-ignore
    if (fechaInicio && new Date(transaccion.fecha) < new Date(fechaInicio)) {
      return false;
    }

    // @ts-ignore
    // Filtro por fecha de fin
    // @ts-ignore
    if (fechaFin && new Date(transaccion.fecha) > new Date(fechaFin)) {
      return false;
    }

    return true;
  });

  // @ts-ignore
  // Animación para las filas de la tabla
  // @ts-ignore
  const rowVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.3,
        ease: 'easeOut'
      }
    })
  };

  // @ts-ignore
  // Función para obtener el ícono del canal
  // @ts-ignore
  const getIconoCanal = (canal?: string) => {
    // @ts-ignore
    switch (canal) {
      case 'facebook':
        return <Facebook className="h-4 w-4 text-blue-600" />;
      case 'instagram':
        return <Instagram className="h-4 w-4 text-pink-600" />;
      case 'x':
        return <XLogo className="h-4 w-4" />;
      case 'linkedin':
        return <Linkedin className="h-4 w-4 text-blue-800" />;
      case 'tiktok':
        return <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-black text-xs font-bold text-white">T</span>;
      default:
        return null;
    }
  };

  // @ts-ignore
  // Función para obtener el ícono del tipo de transacción
  // @ts-ignore
  const getIconoTipo = (tipo: string) => {
    // @ts-ignore
    switch (tipo) {
      case 'ingreso':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'egreso':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  // @ts-ignore
  // Función para formatear la fecha
  // @ts-ignore
  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // @ts-ignore
  // Clase CSS según el tipo de transacción
  // @ts-ignore
  const getClaseTransaccion = (tipo: string) => {
    // @ts-ignore
    switch (tipo) {
      case 'ingreso':
        return 'transaction-success';
      case 'egreso':
        return 'transaction-error';
      default:
        return '';
    }
  };

  // @ts-ignore
  // Formatear cantidad según tipo
  // @ts-ignore
  const formatearCantidad = (cantidad: number, tipo: string) => {
    // @ts-ignore
    const esPositivo = tipo === 'ingreso';
    return `${esPositivo ? '+' : '-'}${cantidad.toLocaleString('es-CO')}`;
  };

  return (
    <div className="card overflow-hidden">
      <div className="p-4 sm:p-6">
        <h2 className="heading-secondary mb-4 flex items-center justify-between">
          <span>Historial de Transacciones</span>
          {isLoading && (
            <span className="ml-2 inline-flex h-5 w-5 animate-spin rounded-full border-2 border-t-transparent border-primary-600"></span>
          )}
        </h2>

        {/* Filtros */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por descripción..."
              className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm text-gray-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-400"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Filter className="h-4 w-4 text-gray-400" />
            </div>
            <select
              className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-8 text-sm text-gray-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value as FiltroTipo)}
            >
              <option value="todos">Todos los tipos</option>
              <option value="ingreso">Ingreso</option>
              <option value="egreso">Egreso</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Calendar className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="date"
              placeholder="Fecha desde"
              className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm text-gray-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </div>
        </div>

        {/* Tabla de transacciones */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Descripción</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
              {transaccionesFiltradas.length > 0 ? (
                transaccionesFiltradas.map((tx, index) => (
                  <motion.tr
                    key={tx.id}
                    className={`border-b last:border-b-0 ${getClaseTransaccion(tx.tipo)}`}
                    initial="hidden"
                    animate="visible"
                    variants={rowVariants}
                    custom={index}
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {formatearFecha(tx.fecha)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <div className="flex items-center">
                        {getIconoTipo(tx.tipo)}
                        <span className="ml-2 capitalize">{tx.tipo}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      <div className="flex items-center">
                        {tx.canal && getIconoCanal(tx.canal)}
                        <span className="ml-2">{tx.descripcion}</span>
                      </div>
                    </td>
                    <td className={`whitespace-nowrap px-6 py-4 text-right text-sm font-medium ${tx.tipo === 'ingreso' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {formatearCantidad(tx.monto, tx.tipo)}
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    No se encontraron transacciones con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
