/**
 * Catálogo único de módulos/funciones que un plan puede incluir.
 *
 * Las `key` son las mismas claves camelCase que se guardan en `plans.features`
 * (JSONB) y que mapea `FEATURE_KEY_TO_PROP` en `src/context/PlanContext.tsx`.
 * Es la fuente de verdad de etiquetas y agrupación, reutilizable por el panel
 * admin (`/admin/planes`) y por la página de planes del usuario (`/dashboard/plan`).
 */

export type PlanFeatureGroup = 'Generales' | 'Avanzadas' | 'Políticas' | 'Límites';

export interface PlanFeatureItem {
  /** Clave camelCase guardada en plans.features (JSONB). */
  key: string;
  /** Etiqueta legible para el admin y la UI de planes. */
  label: string;
  group: PlanFeatureGroup;
  /** Texto de ayuda opcional. */
  hint?: string;
}

export const PLAN_FEATURE_CATALOG: PlanFeatureItem[] = [
  // ── Generales (monitoreo base) ─────────────────────────────────────────
  { key: 'sentimentAnalysis', label: 'Análisis de sentimiento', group: 'Generales' },
  { key: 'realTimeMonitoring', label: 'Monitoreo en tiempo real', group: 'Generales' },
  { key: 'mediaCoverage', label: 'Monitoreo de medios / noticias', group: 'Generales', hint: 'Habilita el módulo de monitoreo de noticias.' },
  { key: 'dataExport', label: 'Exportar datos', group: 'Generales' },
  { key: 'customReports', label: 'Reportes personalizados', group: 'Generales' },
  { key: 'customDashboards', label: 'Dashboards personalizados', group: 'Generales' },

  // ── Avanzadas ──────────────────────────────────────────────────────────
  { key: 'advancedAnalytics', label: 'Analítica avanzada', group: 'Avanzadas' },
  { key: 'predictiveAnalytics', label: 'Analítica predictiva', group: 'Avanzadas' },
  { key: 'competitorAnalysis', label: 'Análisis de competencia', group: 'Avanzadas' },
  { key: 'influencerIdentification', label: 'Identificación de influencers', group: 'Avanzadas' },
  { key: 'crisisManagement', label: 'Gestión de crisis', group: 'Avanzadas' },
  { key: 'automatedReporting', label: 'Reportes automáticos', group: 'Avanzadas' },
  { key: 'apiAccess', label: 'Acceso a API', group: 'Avanzadas' },
  { key: 'integrations', label: 'Integraciones', group: 'Avanzadas' },
  { key: 'multiLanguageSupport', label: 'Soporte multi-idioma', group: 'Avanzadas' },
  { key: 'whiteLabeling', label: 'Marca blanca (white-label)', group: 'Avanzadas' },
  { key: 'teamCollaboration', label: 'Colaboración en equipo', group: 'Avanzadas' },
  { key: 'prioritySupport', label: 'Soporte prioritario', group: 'Avanzadas' },
  { key: 'dedicatedManager', label: 'Gerente de cuenta dedicado', group: 'Avanzadas' },

  // ── Políticas ──────────────────────────────────────────────────────────
  { key: 'voterSentiment', label: 'Sentimiento del electorado', group: 'Políticas' },
  { key: 'campaignTracking', label: 'Seguimiento de campaña', group: 'Políticas' },
  { key: 'politicalInsights', label: 'Insights políticos', group: 'Políticas' },
  { key: 'electionAnalytics', label: 'Analítica electoral', group: 'Políticas' },
  { key: 'opponentTracking', label: 'Seguimiento de oponentes', group: 'Políticas' },
  { key: 'publicOpinionPolls', label: 'Encuestas de opinión', group: 'Políticas' },
  { key: 'speechAnalysis', label: 'Análisis de discursos', group: 'Políticas' },

  // ── Límites (marcadores que vuelven ilimitado un cupo) ─────────────────
  { key: 'unlimitedSearches', label: 'Búsquedas ilimitadas', group: 'Límites' },
  { key: 'unlimitedReports', label: 'Reportes ilimitados', group: 'Límites' },
];

/** Orden de los grupos para render. */
export const PLAN_FEATURE_GROUPS: PlanFeatureGroup[] = ['Generales', 'Avanzadas', 'Políticas', 'Límites'];

/** Catálogo agrupado, listo para iterar en la UI. */
export function planFeaturesByGroup(): { group: PlanFeatureGroup; items: PlanFeatureItem[] }[] {
  return PLAN_FEATURE_GROUPS.map((group) => ({
    group,
    items: PLAN_FEATURE_CATALOG.filter((f) => f.group === group),
  })).filter((g) => g.items.length > 0);
}

/** Etiqueta legible para una key (fallback a la propia key). */
export function planFeatureLabel(key: string): string {
  return PLAN_FEATURE_CATALOG.find((f) => f.key === key)?.label || key;
}
