import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Calendar, Filter, BarChart3, ChevronDown, RefreshCw, Target, TrendingUp, Activity } from 'lucide-react';
import { ReportGenerator, ReportData } from '@/lib/reportGenerator';
import { useUser } from '@/context/UserContext';

type FormatoReporte = 'pdf' | 'excel' | 'csv';
type PeriodoReporte = 'semana' | 'mes' | 'trimestre' | 'personalizado';
type TipoReporte = 'consumo' | 'tendencia' | 'canales' | 'completo';

export default function GeneradorReportes() {
  const { user } = useUser();
  
  // Estados para las opciones del reporte
  const [formatoSeleccionado, setFormatoSeleccionado] = useState<FormatoReporte>('pdf');
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<PeriodoReporte>('mes');
  const [tipoReporteSeleccionado, setTipoReporteSeleccionado] = useState<TipoReporte>('completo');
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  const [filtroCanal, setFiltroCanal] = useState<string>('todos');
  const [mostrarOpcionesAvanzadas, setMostrarOpcionesAvanzadas] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  
  // Estado para mostrar la previsualización del reporte
  const [mostrarPrevisualizacion, setMostrarPrevisualizacion] = useState<boolean>(false);
  
  // Variantes de animación
  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
    hover: { scale: 1.02, transition: { duration: 0.2 } }
  };
  
  // Opciones para los selectores
  const formatosReporte: Array<{valor: FormatoReporte, nombre: string, icono: JSX.Element}> = [
    { valor: 'pdf', nombre: 'PDF', icono: <FileText className="h-4 w-4 text-red-500" /> },
    { valor: 'excel', nombre: 'Excel', icono: <FileText className="h-4 w-4 text-green-500" /> },
    { valor: 'csv', nombre: 'CSV', icono: <FileText className="h-4 w-4 text-blue-500" /> }
  ];
  
  const periodosReporte: Array<{valor: PeriodoReporte, nombre: string}> = [
    { valor: 'semana', nombre: 'Últimos 7 días' },
    { valor: 'mes', nombre: 'Últimos 30 días' },
    { valor: 'trimestre', nombre: 'Últimos 90 días' },
    { valor: 'personalizado', nombre: 'Rango personalizado' }
  ];
  
  const tiposReporte: Array<{valor: TipoReporte, nombre: string, descripcion: string}> = [
    { 
      valor: 'consumo', 
      nombre: 'Reporte de Consumo', 
      descripcion: 'Detalle del consumo de créditos por día con totales y promedios.' 
    },
    { 
      valor: 'tendencia', 
      nombre: 'Análisis de Tendencia', 
      descripcion: 'Gráficos y análisis de patrones de consumo a lo largo del tiempo.' 
    },
    { 
      valor: 'canales', 
      nombre: 'Consumo por Canales', 
      descripcion: 'Desglose detallado del consumo por cada canal social con porcentajes.' 
    },
    { 
      valor: 'completo', 
      nombre: 'Reporte Completo', 
      descripcion: 'Informe exhaustivo que incluye todos los tipos de reportes anteriores.' 
    }
  ];
  
  const canales = [
    { valor: 'todos', nombre: 'Todos los canales' },
    { valor: 'facebook', nombre: 'Facebook' },
    { valor: 'instagram', nombre: 'Instagram' },
    { valor: 'x', nombre: 'X' },
    { valor: 'linkedin', nombre: 'LinkedIn' },
    { valor: 'tiktok', nombre: 'TikTok' },
    { valor: 'general', nombre: 'General' }
  ];
  
  // Establecer fechas predeterminadas para el periodo personalizado
  const establecerFechasPredeterminadas = () => {
    const hoy = new Date();
    const fechaFin = hoy.toISOString().split('T')[0];
    
    const fechaInicioObj = new Date(hoy);
    fechaInicioObj.setDate(hoy.getDate() - 30);
    const fechaInicio = fechaInicioObj.toISOString().split('T')[0];
    
    setFechaInicio(fechaInicio);
    setFechaFin(fechaFin);
  };
  
  // Manejar cambio de periodo
  const handleChangePeriodo = (periodo: PeriodoReporte) => {
    setPeriodoSeleccionado(periodo);
    if (periodo === 'personalizado') {
      establecerFechasPredeterminadas();
    }
  };
  
  // Generar el reporte con lógica real
  const generarReporte = async () => {
    setIsGenerating(true);
    
    try {
      // Simular tiempo de generación (opcional)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Preparar datos del reporte
      const reportData: ReportData = {
        tipo: tipoReporteSeleccionado,
        formato: formatoSeleccionado,
        periodo: periodoSeleccionado,
        fechaInicio: fechaInicio || undefined,
        fechaFin: fechaFin || undefined,
        canal: filtroCanal !== 'todos' ? filtroCanal : undefined,
        usuario: user ? {
          nombre: user.name,
          email: user.email,
          plan: user.plan,
          creditos: user.credits
        } : undefined
      };
      
      console.log('Generando reporte con datos reales:', reportData);
      
      // Mostrar previsualización
      setMostrarPrevisualizacion(true);
      
      // Generar y descargar el reporte usando el servicio real
      await ReportGenerator.generateAndDownload(reportData);
      
    } catch (error) {
      console.error('Error generando reporte:', error);
      alert('Error al generar el reporte. Por favor, inténtalo de nuevo.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Obtener nombre del canal seleccionado
  const getNombreCanal = () => {
    const canalEncontrado = canales.find(c => c.valor === filtroCanal);
    return canalEncontrado ? canalEncontrado.nombre : 'Todos los canales';
  };
  
  // Obtener la descripción del periodo
  const getDescripcionPeriodo = () => {
    if (periodoSeleccionado === 'personalizado') {
      return `Del ${fechaInicio} al ${fechaFin}`;
    } else {
      const periodoEncontrado = periodosReporte.find(p => p.valor === periodoSeleccionado);
      return periodoEncontrado ? periodoEncontrado.nombre : '';
    }
  };
  
  // Obtener el nombre del tipo de reporte
  const getNombreTipoReporte = () => {
    const tipoEncontrado = tiposReporte.find(t => t.valor === tipoReporteSeleccionado);
    return tipoEncontrado ? tipoEncontrado.nombre : 'Reporte Completo';
  };

  return (
    <motion.div 
      className="bg-gradient-to-br from-white via-gray-50/50 to-indigo-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-indigo-900/10 rounded-2xl border-0 shadow-2xl overflow-hidden"
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
    >
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-3xl font-bold flex items-center">
            <BarChart3 className="mr-3 h-8 w-8" />
            ⚙️ Generador de Reportes
          </h2>
          {isGenerating && (
            <div className="relative">
              <div className="animate-spin h-8 w-8 border-4 border-white/30 border-t-white rounded-full"></div>
              <Activity className="absolute inset-0 m-auto h-4 w-4 text-white animate-pulse" />
            </div>
          )}
        </div>
        <p className="text-indigo-100 text-lg">
          🎯 Configura y personaliza tus reportes según tus necesidades
        </p>
      </div>
      
      <div className="p-8">
        <div className="space-y-6">
        {/* Tipo de reporte */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Tipo de Reporte
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {tiposReporte.map(tipo => (
              <div 
                key={tipo.valor}
                className={`cursor-pointer rounded-lg border p-4 transition-colors ${tipoReporteSeleccionado === tipo.valor ? 'border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/20' : 'border-gray-200 hover:border-primary-200 hover:bg-primary-50/50 dark:border-gray-700 dark:hover:border-primary-700 dark:hover:bg-primary-900/10'}`}
                onClick={() => setTipoReporteSeleccionado(tipo.valor)}
              >
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">{tipo.nombre}</h3>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{tipo.descripcion}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Periodo y formato */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Periodo */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Periodo de Tiempo
            </label>
            <div className="flex rounded-md bg-gray-100 p-1 dark:bg-gray-700">
              {periodosReporte.map(periodo => (
                <button
                  key={periodo.valor}
                  className={`flex-1 rounded-md py-1 text-xs font-medium transition-colors ${periodoSeleccionado === periodo.valor ? 'bg-white text-primary-600 shadow-sm dark:bg-gray-800 dark:text-primary-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                  onClick={() => handleChangePeriodo(periodo.valor)}
                >
                  {periodo.nombre}
                </button>
              ))}
            </div>
            
            {/* Rango de fechas personalizado */}
            {periodoSeleccionado === 'personalizado' && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="fecha-inicio" className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    id="fecha-inicio"
                    className="mt-1 block w-full rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-primary-400 dark:focus:ring-primary-400"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="fecha-fin" className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                    Fecha Fin
                  </label>
                  <input
                    type="date"
                    id="fecha-fin"
                    className="mt-1 block w-full rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-primary-400 dark:focus:ring-primary-400"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Formato */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Formato de Descarga
            </label>
            <div className="flex space-x-3">
              {formatosReporte.map(formato => (
                <button
                  key={formato.valor}
                  className={`flex flex-1 items-center justify-center rounded-md border py-2 text-sm font-medium transition-colors ${formatoSeleccionado === formato.valor ? 'border-primary-500 bg-primary-50 text-primary-700 dark:border-primary-400 dark:bg-primary-900/20 dark:text-primary-300' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}`}
                  onClick={() => setFormatoSeleccionado(formato.valor)}
                >
                  {formato.icono}
                  <span className="ml-2">{formato.nombre}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Opciones avanzadas */}
        <div>
          <button
            type="button"
            className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            onClick={() => setMostrarOpcionesAvanzadas(!mostrarOpcionesAvanzadas)}
          >
            <ChevronDown className={`mr-2 h-4 w-4 transition-transform ${mostrarOpcionesAvanzadas ? 'rotate-180' : ''}`} />
            Opciones avanzadas
          </button>
          
          {mostrarOpcionesAvanzadas && (
            <motion.div 
              className="mt-3 space-y-4 rounded-md border border-gray-200 p-4 dark:border-gray-700"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
            >
              {/* Filtro por canal */}
              <div>
                <label htmlFor="filtro-canal" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Filtrar por Canal
                </label>
                <select
                  id="filtro-canal"
                  className="mt-1 block w-full rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-primary-400 dark:focus:ring-primary-400"
                  value={filtroCanal}
                  onChange={(e) => setFiltroCanal(e.target.value)}
                >
                  {canales.map(canal => (
                    <option key={canal.valor} value={canal.valor}>{canal.nombre}</option>
                  ))}
                </select>
              </div>
              
              {/* Otras opciones avanzadas podrían añadirse aquí */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="incluir-graficos"
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-primary-400"
                  defaultChecked
                />
                <label htmlFor="incluir-graficos" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Incluir gráficos en el reporte
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="incluir-recomendaciones"
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-primary-400"
                  defaultChecked
                />
                <label htmlFor="incluir-recomendaciones" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Incluir recomendaciones de optimización
                </label>
              </div>
            </motion.div>
          )}
        </div>
        
        {/* Botón para generar mejorado */}
        <div className="flex justify-center mt-8">
          <button
            type="button"
            disabled={isGenerating}
            className={`inline-flex items-center rounded-xl px-8 py-4 text-lg font-bold text-white shadow-xl transition-all duration-300 ${
              isGenerating 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-[#01257D] to-[#013AAA] hover:from-[#013AAA] hover:to-[#01257D] transform hover:scale-105 hover:shadow-2xl'
            }`}
            onClick={generarReporte}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="mr-3 h-6 w-6 animate-spin" />
                🔄 Generando Reporte...
              </>
            ) : (
              <>
                <Download className="mr-3 h-6 w-6" />
                📄 Generar Reporte
              </>
            )}
          </button>
        </div>
        </div>
      </div>
      
      {/* Previsualización del reporte */}
      {mostrarPrevisualizacion && (
        <motion.div 
          className="mt-8 rounded-md border border-gray-200 p-6 dark:border-gray-700"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Previsualización del Reporte</h3>
            <button
              type="button"
              className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              onClick={() => setMostrarPrevisualizacion(false)}
            >
              Cerrar
            </button>
          </div>
          
          <div className="space-y-6">
            {/* Encabezado del reporte */}
            <div className="border-b border-gray-200 pb-4 dark:border-gray-700">
              <h4 className="text-xl font-bold text-gray-900 dark:text-white">{getNombreTipoReporte()}</h4>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <div className="flex items-center">
                  <Calendar className="mr-1 h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span>{getDescripcionPeriodo()}</span>
                </div>
                <div className="flex items-center">
                  <Filter className="mr-1 h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span>{getNombreCanal()}</span>
                </div>
              </div>
            </div>
            
            {/* Resumen de créditos */}
            <div>
              <h5 className="mb-2 text-base font-medium text-gray-900 dark:text-white">Resumen de Créditos</h5>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-md bg-gray-50 p-4 dark:bg-gray-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Consumido</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">10,620</p>
                </div>
                <div className="rounded-md bg-gray-50 p-4 dark:bg-gray-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Promedio Diario</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">354</p>
                </div>
                <div className="rounded-md bg-gray-50 p-4 dark:bg-gray-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Día de Mayor Consumo</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">15 Mayo (982)</p>
                </div>
              </div>
            </div>
            
            {/* Gráfico simplificado */}
            <div>
              <h5 className="mb-2 text-base font-medium text-gray-900 dark:text-white">Tendencia de Consumo</h5>
              <div className="flex h-40 items-end justify-between">
                {Array.from({ length: 10 }).map((_, index) => {
                  const altura = 30 + Math.random() * 70;
                  return (
                    <div key={index} className="group flex w-full flex-col items-center">
                      <div 
                        className="w-full rounded-t bg-primary-500 dark:bg-primary-600 group-hover:bg-primary-600 dark:group-hover:bg-primary-500" 
                        style={{ height: `${altura}%` }}
                      />
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{index + 1}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Tabla de muestra */}
            <div>
              <h5 className="mb-2 text-base font-medium text-gray-900 dark:text-white">Detalle por Canal</h5>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Canal</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Consumo</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Porcentaje</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                    <tr>
                      <td className="whitespace-nowrap px-4 py-2 text-sm font-medium text-gray-900 dark:text-white">Facebook</td>
                      <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-700 dark:text-gray-300">3,840</td>
                      <td className="whitespace-nowrap px-4 py-2 text-right text-sm font-medium text-primary-600 dark:text-primary-400">36.2%</td>
                    </tr>
                    <tr>
                      <td className="whitespace-nowrap px-4 py-2 text-sm font-medium text-gray-900 dark:text-white">X</td>
                      <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-700 dark:text-gray-300">2,560</td>
                      <td className="whitespace-nowrap px-4 py-2 text-right text-sm font-medium text-primary-600 dark:text-primary-400">24.1%</td>
                    </tr>
                    <tr>
                      <td className="whitespace-nowrap px-4 py-2 text-sm font-medium text-gray-900 dark:text-white">Instagram</td>
                      <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-700 dark:text-gray-300">1,920</td>
                      <td className="whitespace-nowrap px-4 py-2 text-right text-sm font-medium text-primary-600 dark:text-primary-400">18.1%</td>
                    </tr>
                    <tr>
                      <td className="whitespace-nowrap px-4 py-2 text-sm font-medium text-gray-900 dark:text-white">Otros</td>
                      <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-700 dark:text-gray-300">2,300</td>
                      <td className="whitespace-nowrap px-4 py-2 text-right text-sm font-medium text-primary-600 dark:text-primary-400">21.6%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Pie de página */}
            <div className="border-t border-gray-200 pt-4 text-center text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
              <p>Este es un ejemplo de previsualización. El reporte generado contendrá información más detallada.</p>
              <p className="mt-1">Generado por Reputación Online - {new Date().toLocaleDateString()}</p>
            </div>
            
            {/* Botón de descarga */}
            <div className="flex justify-center">
              <button
                type="button"
                className="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:bg-primary-500 dark:hover:bg-primary-400"
              >
                <Download className="mr-2 h-4 w-4" />
                Descargar Reporte
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
