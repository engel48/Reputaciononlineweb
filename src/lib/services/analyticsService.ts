// Servicio para proporcionar datos REALES de analytics desde Supabase
// ❌ DATOS SIMULADOS ELIMINADOS - Solo datos reales de la base de datos

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Obtiene métricas reales de reputación desde la base de datos
 */
export const getReputationMetrics = async (userId: string) => {
  try {
    // Consultar estadísticas reales del usuario
    const { data: userStats, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('userId', userId)
      .single();

    if (error || !userStats) {
      return {
        overallScore: 0,
        mentionsCount: 0,
        reachScore: 0,
        engagementRate: 0,
        trend: {
          positive: 0,
          negative: 0,
          neutral: 0
        }
      };
    }

    return {
      overallScore: userStats.influenceScore || 0,
      mentionsCount: userStats.totalMentions || 0,
      reachScore: userStats.reachEstimate || 0,
      engagementRate: userStats.engagementRate || 0,
      trend: {
        positive: userStats.positiveMentions || 0,
        negative: userStats.negativeMentions || 0,
        neutral: userStats.neutralMentions || 0
      }
    };
  } catch (error) {
    console.error('Error obteniendo métricas de reputación:', error);
    return null;
  }
};

/**
 * Obtiene datos de timeline reales desde la base de datos
 */
export const getTimelineData = async (userId: string, period: string = 'week') => {
  try {
    // TODO: Implementar consulta de menciones históricas por período
    // Por ahora retornamos estructura vacía
    return {
      labels: [],
      datasets: []
    };
  } catch (error) {
    console.error('Error obteniendo datos de timeline:', error);
    return null;
  }
};

/**
 * Obtiene datos de sentimiento reales desde la base de datos
 */
export const getSentimentData = async (userId: string) => {
  try {
    const { data: userStats, error } = await supabase
      .from('user_stats')
      .select('positiveMentions, negativeMentions, neutralMentions')
      .eq('userId', userId)
      .single();

    if (error || !userStats) {
      return {
        current: { positive: 0, negative: 0, neutral: 0 },
        historical: [],
        topics: []
      };
    }

    return {
      current: {
        positive: userStats.positiveMentions || 0,
        negative: userStats.negativeMentions || 0,
        neutral: userStats.neutralMentions || 0
      },
      historical: [], // TODO: Implementar historial real
      topics: [] // TODO: Implementar topics reales
    };
  } catch (error) {
    console.error('Error obteniendo datos de sentimiento:', error);
    return null;
  }
};

/**
 * Obtiene menciones reales recientes desde la base de datos
 */
export const getLatestMentions = async (userId: string, limit: number = 10) => {
  try {
    // TODO: Implementar tabla de menciones en Supabase
    // Por ahora retornamos array vacío
    return [];
  } catch (error) {
    console.error('Error obteniendo últimas menciones:', error);
    return [];
  }
};

// Servicio para analytics políticos - DATOS REALES ÚNICAMENTE
export const getPoliticalAnalytics = async (userId: string) => {
  try {
    // TODO: Implementar métricas políticas reales
    return {
      approvalRating: 0,
      demographics: [],
      topIssues: []
    };
  } catch (error) {
    console.error('Error obteniendo analytics políticos:', error);
    return null;
  }
};
