import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, LineChart, BarChart3, PieChart, Lightbulb, ArrowRight } from 'lucide-react';

export default function RecomendacionesCreditos() {
  // Estado para el período seleccionado
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<'semana' | 'mes' | 'trimestre'>('mes');

  // Datos de ejemplo para las recomendaciones (en un caso real vendrían de la API)
  const datosRecomendaciones = {
    optimizacionUso: [
      {
        id: 'rec1',
        titulo: 'Optimiza tu uso en X',
        descripcion: 'Estás consumiendo más créditos de los necesarios en X. Considera usar filtros más específicos.',
        impacto: 'Alto',
        ahorroPotencial: 1250,
        icono: <LineChart className="h-5 w-5 text-amber-500 dark:text-amber-400" />
      },
      {
        id: 'rec2',
        titulo: 'Horarios de monitoreo',
        descripcion: 'Los datos históricos muestran que tus menciones son más relevantes entre las 10am y 4pm. Configura el monitoreo para esas horas.',
        impacto: 'Medio',
        ahorroPotencial: 850,
        icono: <BarChart3 className="h-5 w-5 text-blue-500 dark:text-blue-400" />
      },
      {
        id: 'rec3',
        titulo: 'Reduce análisis duplicados',
        descripcion: 'Detectamos análisis duplicados de las mismas menciones. Unifica tus búsquedas para evitar gastos innecesarios.',
        impacto: 'Medio',
        ahorroPotencial: 920,
        icono: <PieChart className="h-5 w-5 text-green-500 dark:text-green-400" />
      }
    ],
    planRecomendado: {
      nombre: 'Plan Profesional',
      creditos: 15000,
      precio: 399900,
      razonamiento: 'Basado en tu patrón de consumo de los últimos 3 meses, el Plan Profesional se ajusta mejor a tus necesidades y representa un ahorro del 15% comparado con tu plan actual.'
    },
    tendenciaConsumo: {
      periodoAnterior: periodoSeleccionado === 'semana' ? 1850 : periodoSeleccionado === 'mes' ? 7920 : 21450,
      periodoActual: periodoSeleccionado === 'semana' ? 2230 : periodoSeleccionado === 'mes' ? 8740 : 24150,
      variacion: periodoSeleccionado === 'semana' ? 20.5 : periodoSeleccionado === 'mes' ? 10.4 : 12.6,
      proyeccion: periodoSeleccionado === 'semana' ? 2500 : periodoSeleccionado === 'mes' ? 9600 : 27000
    }
  };

  // Obtener colores según el impacto
  const getImpactoColor = (impacto: string) => {
    switch (impacto.toLowerCase()) {
      case 'alto':
        return 'text-red-600 dark:text-red-400';
      case 'medio':
        return 'text-amber-600 dark:text-amber-400';
      case 'bajo':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  // Obtener texto del período
  const getPeriodoTexto = () => {
    switch (periodoSeleccionado) {
      case 'semana':
        return 'últimos 7 días';
      case 'mes':
        return 'último mes';
      case 'trimestre':
        return 'último trimestre';
      default:
        return 'período seleccionado';
    }
  };

  return (
    <div className="card p-6">
      <div className="mb-6 flex items-center">
        <Lightbulb className="mr-3 h-6 w-6 text-primary-600 dark:text-primary-400" />
        <h2 className="heading-secondary">Recomendaciones Personalizadas</h2>
      </div>

      {/* Selector de período */}
      <div className="mb-6 flex rounded-md bg-gray-100 p-1 dark:bg-gray-700">
        {(['semana', 'mes', 'trimestre'] as const).map((periodo) => (
          <button
            key={periodo}
            className={`flex-1 rounded-md py-1 text-sm font-medium transition-colors ${periodo === periodoSeleccionado ? 'bg-white text-primary-600 shadow-sm dark:bg-gray-800 dark:text-primary-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
            onClick={() => setPeriodoSeleccionado(periodo)}
          >
            {periodo.charAt(0).toUpperCase() + periodo.slice(1)}
          </button>
        ))}
      </div>

      {/* Tendencia de consumo */}
      <div className="mb-6 rounded-md border border-gray-200 p-4 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5 text-gray-500 dark:text-gray-400" />
            <h3 className="text-base font-medium text-gray-900 dark:text-white">Tendencia de Consumo</h3>
          </div>
          <div className={`flex items-center ${datosRecomendaciones.tendenciaConsumo.variacion > 0 ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400'}`}>
            <span className="text-sm font-medium">
              {datosRecomendaciones.tendenciaConsumo.variacion > 0 ? '+' : ''}{datosRecomendaciones.tendenciaConsumo.variacion.toFixed(1)}%
            </span>
            <TrendingUp className={`ml-1 h-4 w-4 ${datosRecomendaciones.tendenciaConsumo.variacion < 0 ? 'rotate-180 transform' : ''}`} />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-md bg-gray-50 p-3 dark:bg-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400">Período Anterior</p>
            <p className="text-base font-medium text-gray-900 dark:text-white">
              {datosRecomendaciones.tendenciaConsumo.periodoAnterior.toLocaleString('es-CO')} créditos
            </p>
          </div>
          <div className="rounded-md bg-gray-50 p-3 dark:bg-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400">{getPeriodoTexto()}</p>
            <p className="text-base font-medium text-gray-900 dark:text-white">
              {datosRecomendaciones.tendenciaConsumo.periodoActual.toLocaleString('es-CO')} créditos
            </p>
          </div>
          <div className="rounded-md bg-blue-50 p-3 dark:bg-blue-900/20">
            <p className="text-xs text-blue-700 dark:text-blue-400">Proyección</p>
            <p className="text-base font-medium text-blue-800 dark:text-blue-300">
              {datosRecomendaciones.tendenciaConsumo.proyeccion.toLocaleString('es-CO')} créditos
            </p>
          </div>
        </div>
      </div>

      {/* Recomendaciones de optimización */}
      <div className="mb-6">
        <h3 className="mb-3 text-lg font-medium text-gray-900 dark:text-white">Optimiza tu Consumo de Créditos</h3>
        <div className="space-y-4">
          {datosRecomendaciones.optimizacionUso.map((recomendacion) => (
            <motion.div
              key={recomendacion.id}
              className="overflow-hidden rounded-md border border-gray-200 dark:border-gray-700"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
            >
              <div className="border-b border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {recomendacion.icono}
                    <h4 className="ml-2 text-base font-medium text-gray-900 dark:text-white">{recomendacion.titulo}</h4>
                  </div>
                  <div className={`rounded-full px-2 py-1 text-xs font-medium ${getImpactoColor(recomendacion.impacto)}`}>
                    Impacto: {recomendacion.impacto}
                  </div>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">{recomendacion.descripcion}</p>
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-sm">
                    <span className="font-medium text-primary-600 dark:text-primary-400">Ahorro potencial: </span>
                    <span className="font-bold text-primary-700 dark:text-primary-300">{recomendacion.ahorroPotencial.toLocaleString('es-CO')} créditos</span>
                  </div>
                  <button className="inline-flex items-center rounded-md border border-transparent bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700 hover:bg-primary-100 dark:bg-primary-900/20 dark:text-primary-300 dark:hover:bg-primary-800/40">
                    Aplicar
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Plan recomendado */}
      <div className="rounded-md border-2 border-primary-100 bg-primary-50 p-4 dark:border-primary-900/50 dark:bg-primary-900/20">
        <h3 className="mb-2 text-lg font-medium text-primary-900 dark:text-primary-300">Plan Recomendado para Ti</h3>
        <div className="mb-3 flex items-baseline">
          <span className="text-2xl font-bold text-primary-800 dark:text-primary-200">{datosRecomendaciones.planRecomendado.nombre}</span>
          <span className="ml-2 text-lg text-primary-700 dark:text-primary-300">
            {datosRecomendaciones.planRecomendado.creditos.toLocaleString('es-CO')} créditos
          </span>
        </div>
        <p className="text-sm text-primary-700 dark:text-primary-300">{datosRecomendaciones.planRecomendado.razonamiento}</p>
        <div className="mt-4">
          <button className="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:bg-primary-500 dark:hover:bg-primary-400">
            Ver detalles del plan
            <ArrowRight className="ml-2 h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
