// Servicio para analytics políticos - DATOS REALES ÚNICAMENTE
// ❌ TODOS LOS DATOS SIMULADOS HAN SIDO ELIMINADOS

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export interface PoliticalMetrics {
  approvalRating: number;
  disapprovalRating: number;
  undecided: number;
  trend: 'up' | 'down' | 'stable';
  changePercentage: number;
  demographics: {
    ageGroup: string;
    approval: number;
  }[];
  topPoliticalIssues: {
    issue: string;
    mentions: number;
    sentiment: number;
    trend: 'up' | 'down' | 'stable';
  }[];
  dataSource: 'real' | 'empty';
  lastUpdated: string;
}

/**
 * Obtiene métricas políticas REALES desde la base de datos
 * NO retorna datos simulados ni usa Math.random()
 */
export const getPoliticalMetrics = async (userId: string): Promise<PoliticalMetrics> => {
  try {
    // TODO: Implementar tabla de métricas políticas en Supabase
    // Por ahora retornamos estructura vacía con indicador claro

    return {
      approvalRating: 0,
      disapprovalRating: 0,
      undecided: 0,
      trend: 'stable',
      changePercentage: 0,
      demographics: [],
      topPoliticalIssues: [],
      dataSource: 'empty', // Indica claramente que no hay datos
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error obteniendo métricas políticas:', error);
    return {
      approvalRating: 0,
      disapprovalRating: 0,
      undecided: 0,
      trend: 'stable',
      changePercentage: 0,
      demographics: [],
      topPoliticalIssues: [],
      dataSource: 'empty',
      lastUpdated: new Date().toISOString()
    };
  }
};

/**
 * Obtiene análisis de sentimiento político REAL
 */
export const getPoliticalSentimentAnalysis = async (userId: string) => {
  try {
    // TODO: Implementar análisis de sentimiento político real
    return {
      positive: 0,
      negative: 0,
      neutral: 0,
      topics: []
    };
  } catch (error) {
    console.error('Error obteniendo análisis de sentimiento político:', error);
    return null;
  }
};

/**
 * Obtiene trending topics políticos REALES
 */
export const getTrendingPoliticalTopics = async (userId: string) => {
  try {
    // TODO: Implementar consulta de topics políticos reales
    return [];
  } catch (error) {
    console.error('Error obteniendo trending topics políticos:', error);
    return [];
  }
};
