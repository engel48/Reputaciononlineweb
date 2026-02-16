/**
 * Configuracion centralizada de costos de creditos por accion
 * Fuente unica de verdad para toda la plataforma
 */

export const CREDIT_COSTS = {
  // Busquedas
  search_basic: 2,           // Por resultado (dentro de 30 dias)
  search_extended: 5,        // Por resultado (>30 dias de antiguedad)

  // Monitoreo
  monitoring_hourly: 3,      // Por keyword por ciclo horario
  monitoring_daily: 1,       // Por keyword por ciclo diario
  monitoring_setup: 5,       // Costo unico al agregar keyword

  // Reportes
  report_basic: 20,          // Reporte basico
  report_advanced: 50,       // Reporte avanzado con IA
  report_export_pdf: 10,     // Exportar a PDF

  // Julia IA
  julia_chat: 1,             // Por mensaje de chat
  julia_sentiment: 3,        // Analisis de sentimiento
  julia_person_search: 5,    // Busqueda de persona
  julia_content_gen: 5,      // Generacion de contenido
  julia_reputation: 10,      // Analisis completo de reputacion
  julia_crisis_response: 5,  // Respuesta sugerida a crisis
  julia_summarize: 3,        // Resumen de noticias

  // Redes sociales
  social_sync: 2,            // Sincronizacion por plataforma
  unified_search: 3,         // Busqueda unificada por consulta
} as const;

export type CreditAction = keyof typeof CREDIT_COSTS;

/**
 * Calcula el costo de busqueda segun rango de fechas y cantidad de resultados
 */
export function getSearchCost(daysBack: number, resultCount: number): number {
  const costPerResult = daysBack > 30
    ? CREDIT_COSTS.search_extended
    : CREDIT_COSTS.search_basic;
  return costPerResult * resultCount;
}

/**
 * Estima el costo antes de ejecutar (para mostrar en UI)
 */
export function estimateCost(action: CreditAction, quantity: number = 1): number {
  return CREDIT_COSTS[action] * quantity;
}

/**
 * Obtiene etiqueta legible para una accion
 */
export function getActionLabel(action: CreditAction): string {
  const labels: Record<CreditAction, string> = {
    search_basic: 'Busqueda (0-30 dias)',
    search_extended: 'Busqueda (>30 dias)',
    monitoring_hourly: 'Monitoreo por hora',
    monitoring_daily: 'Monitoreo diario',
    monitoring_setup: 'Alta de keyword',
    report_basic: 'Reporte basico',
    report_advanced: 'Reporte avanzado',
    report_export_pdf: 'Exportar PDF',
    julia_chat: 'Chat con Julia',
    julia_sentiment: 'Analisis de sentimiento',
    julia_person_search: 'Busqueda de persona',
    julia_content_gen: 'Generacion de contenido',
    julia_reputation: 'Analisis de reputacion',
    julia_crisis_response: 'Respuesta a crisis',
    julia_summarize: 'Resumen de noticias',
    social_sync: 'Sync red social',
    unified_search: 'Busqueda unificada',
  };
  return labels[action];
}

/**
 * Obtiene todos los costos agrupados por categoria (para tabla en UI)
 */
export function getCostsByCategory(): { category: string; items: { action: CreditAction; label: string; cost: number }[] }[] {
  return [
    {
      category: 'Busquedas',
      items: [
        { action: 'search_basic', label: getActionLabel('search_basic'), cost: CREDIT_COSTS.search_basic },
        { action: 'search_extended', label: getActionLabel('search_extended'), cost: CREDIT_COSTS.search_extended },
        { action: 'unified_search', label: getActionLabel('unified_search'), cost: CREDIT_COSTS.unified_search },
      ]
    },
    {
      category: 'Monitoreo',
      items: [
        { action: 'monitoring_hourly', label: getActionLabel('monitoring_hourly'), cost: CREDIT_COSTS.monitoring_hourly },
        { action: 'monitoring_daily', label: getActionLabel('monitoring_daily'), cost: CREDIT_COSTS.monitoring_daily },
        { action: 'monitoring_setup', label: getActionLabel('monitoring_setup'), cost: CREDIT_COSTS.monitoring_setup },
      ]
    },
    {
      category: 'Julia IA',
      items: [
        { action: 'julia_chat', label: getActionLabel('julia_chat'), cost: CREDIT_COSTS.julia_chat },
        { action: 'julia_sentiment', label: getActionLabel('julia_sentiment'), cost: CREDIT_COSTS.julia_sentiment },
        { action: 'julia_person_search', label: getActionLabel('julia_person_search'), cost: CREDIT_COSTS.julia_person_search },
        { action: 'julia_content_gen', label: getActionLabel('julia_content_gen'), cost: CREDIT_COSTS.julia_content_gen },
        { action: 'julia_reputation', label: getActionLabel('julia_reputation'), cost: CREDIT_COSTS.julia_reputation },
        { action: 'julia_crisis_response', label: getActionLabel('julia_crisis_response'), cost: CREDIT_COSTS.julia_crisis_response },
        { action: 'julia_summarize', label: getActionLabel('julia_summarize'), cost: CREDIT_COSTS.julia_summarize },
      ]
    },
    {
      category: 'Reportes',
      items: [
        { action: 'report_basic', label: getActionLabel('report_basic'), cost: CREDIT_COSTS.report_basic },
        { action: 'report_advanced', label: getActionLabel('report_advanced'), cost: CREDIT_COSTS.report_advanced },
        { action: 'report_export_pdf', label: getActionLabel('report_export_pdf'), cost: CREDIT_COSTS.report_export_pdf },
      ]
    },
  ];
}
