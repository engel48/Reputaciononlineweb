"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  Filler
} from 'chart.js';
import { 
  Search, 
  Calendar, 
  Download, 
  ChevronDown, 
  ChevronUp, 
  Filter, 
  ArrowUpDown 
} from 'lucide-react';

// Registro de componentes Chart.js
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  Filler
);

// Tipos
interface TransaccionCredito {
  id: string;
  fecha: Date;
  tipo: 'consumo' | 'recarga';
  cantidad: number;
  descripcion: string;
  plataforma?: string;
}

interface EnhancedHistorialCreditosProps {
  transacciones: TransaccionCredito[];
  periodo?: 'semana' | 'mes' | 'trimestre' | 'año';
}

export default function EnhancedHistorialCreditos({ 
  transacciones, 
  periodo = 'mes' 
}: EnhancedHistorialCreditosProps) {
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'consumo' | 'recarga'>('todos');
  const [ordenFecha, setOrdenFecha] = useState<'asc' | 'desc'>('desc');
  const [busqueda, setBusqueda] = useState('');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  
  // Filtrar transacciones
  const transaccionesFiltradas = transacciones
    .filter(t => filtroTipo === 'todos' || t.tipo === filtroTipo)
    .filter(t => 
      t.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
      (t.plataforma && t.plataforma.toLowerCase().includes(busqueda.toLowerCase()))
    )
    .sort((a, b) => {
      if (ordenFecha === 'asc') {
        return a.fecha.getTime() - b.fecha.getTime();
      } else {
        return b.fecha.getTime() - a.fecha.getTime();
      }
    });
  
  // Preparar datos para el gráfico
  const prepararDatosGrafico = () => {
    // Agrupar por fecha
    const datosAgrupados = new Map<string, { consumo: number, recarga: number }>();
    
    // Determinar el formato de fecha según el periodo
    const formatoFecha = (fecha: Date) => {
      switch (periodo) {
        case 'semana':
          return fecha.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
        case 'mes':
          return fecha.toLocaleDateString('es-ES', { day: 'numeric' });
        case 'trimestre':
          return fecha.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
        case 'año':
          return fecha.toLocaleDateString('es-ES', { month: 'short' });
        default:
          return fecha.toLocaleDateString('es-ES');
      }
    };
    
    // Agrupar transacciones por fecha
    transacciones.forEach(t => {
      const fechaFormateada = formatoFecha(t.fecha);
      
      if (!datosAgrupados.has(fechaFormateada)) {
        datosAgrupados.set(fechaFormateada, { consumo: 0, recarga: 0 });
      }
      
      const datos = datosAgrupados.get(fechaFormateada)!;
      
      if (t.tipo === 'consumo') {
        datos.consumo += t.cantidad;
      } else {
        datos.recarga += t.cantidad;
      }
    });
    
    // Convertir a arrays para el gráfico
    const labels = Array.from(datosAgrupados.keys());
    const datosConsumo = labels.map(label => datosAgrupados.get(label)!.consumo);
    const datosRecarga = labels.map(label => datosAgrupados.get(label)!.recarga);
    
    return { labels, datosConsumo, datosRecarga };
  };
  
  const { labels, datosConsumo, datosRecarga } = prepararDatosGrafico();
  
  // Configuración del gráfico
  const datosGrafico = {
    labels,
    datasets: [
      {
        label: 'Consumo',
        data: datosConsumo,
        borderColor: 'rgba(239, 68, 68, 1)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Recarga',
        data: datosRecarga,
        borderColor: 'rgba(16, 185, 129, 1)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      }
    ],
  };
  
  const opcionesGrafico = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };
  
  // Calcular totales
  const totalConsumo = transaccionesFiltradas
    .filter(t => t.tipo === 'consumo')
    .reduce((sum, t) => sum + t.cantidad, 0);
    
  const totalRecarga = transaccionesFiltradas
    .filter(t => t.tipo === 'recarga')
    .reduce((sum, t) => sum + t.cantidad, 0);
  
  // Formatear fecha
  const formatearFecha = (fecha: Date) => {
    return fecha.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          Historial de Créditos
        </h2>
        
        {/* Gráfico */}
        <div className="h-64 mb-8">
          <Line data={datosGrafico} options={opcionesGrafico} />
        </div>
        
        {/* Filtros y búsqueda */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="relative flex-grow max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar en historial..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            <button
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className="flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-medium"
            >
              <Filter className="h-4 w-4 mr-1" />
              Filtros
              {mostrarFiltros ? (
                <ChevronUp className="h-4 w-4 ml-1" />
              ) : (
                <ChevronDown className="h-4 w-4 ml-1" />
              )}
            </button>
          </div>
          
          {mostrarFiltros && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="flex flex-wrap gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tipo
                  </label>
                  <div className="flex rounded-md overflow-hidden">
                    <button
                      className={`px-3 py-1 text-xs ${
                        filtroTipo === 'todos' 
                          ? 'bg-primary-600 text-white' 
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                      }`}
                      onClick={() => setFiltroTipo('todos')}
                    >
                      Todos
                    </button>
                    <button
                      className={`px-3 py-1 text-xs ${
                        filtroTipo === 'consumo' 
                          ? 'bg-primary-600 text-white' 
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                      }`}
                      onClick={() => setFiltroTipo('consumo')}
                    >
                      Consumo
                    </button>
                    <button
                      className={`px-3 py-1 text-xs ${
                        filtroTipo === 'recarga' 
                          ? 'bg-primary-600 text-white' 
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                      }`}
                      onClick={() => setFiltroTipo('recarga')}
                    >
                      Recarga
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ordenar por fecha
                  </label>
                  <button
                    className="flex items-center px-3 py-1 bg-gray-200 dark:bg-gray-600 rounded-md text-xs"
                    onClick={() => setOrdenFecha(ordenFecha === 'asc' ? 'desc' : 'asc')}
                  >
                    <Calendar className="h-3 w-3 mr-1" />
                    {ordenFecha === 'asc' ? 'Más antiguos primero' : 'Más recientes primero'}
                    <ArrowUpDown className="h-3 w-3 ml-1" />
                  </button>
                </div>
                
                <div className="ml-auto">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Exportar
                  </label>
                  <button className="flex items-center px-3 py-1 bg-gray-200 dark:bg-gray-600 rounded-md text-xs">
                    <Download className="h-3 w-3 mr-1" />
                    Descargar CSV
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
        
        {/* Resumen */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
            <div className="text-sm text-red-600 dark:text-red-400">Total consumido</div>
            <div className="text-xl font-bold text-red-700 dark:text-red-300">
              {totalConsumo.toLocaleString()}
            </div>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <div className="text-sm text-green-600 dark:text-green-400">Total recargado</div>
            <div className="text-xl font-bold text-green-700 dark:text-green-300">
              {totalRecarga.toLocaleString()}
            </div>
          </div>
        </div>
        
        {/* Tabla de transacciones */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Fecha
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tipo
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Descripción
                </th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Cantidad
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {transaccionesFiltradas.length > 0 ? (
                transaccionesFiltradas.map((transaccion) => (
                  <tr key={transaccion.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatearFecha(transaccion.fecha)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        transaccion.tipo === 'consumo' 
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' 
                          : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      }`}>
                        {transaccion.tipo === 'consumo' ? 'Consumo' : 'Recarga'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {transaccion.descripcion}
                      {transaccion.plataforma && (
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                          ({transaccion.plataforma})
                        </span>
                      )}
                    </td>
                    <td className={`px-4 py-3 text-sm font-medium text-right ${
                      transaccion.tipo === 'consumo' 
                        ? 'text-red-600 dark:text-red-400' 
                        : 'text-green-600 dark:text-green-400'
                    }`}>
                      {transaccion.tipo === 'consumo' ? '-' : '+'}{transaccion.cantidad.toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    No se encontraron transacciones con los filtros actuales.
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
