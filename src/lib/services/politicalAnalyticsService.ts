// Servicio para métricas políticas que se integra con el sistema existente
// Este servicio será usado cuando se tengan datos reales de APIs políticas

interface PoliticalMetricsData {
  approval: number;
  votingIntention: number;
  politicalReach: number;
  politicalEngagement: number;
  demographicApproval: {
    young: number;
    middle: number;
    senior: number;
  };
  topPoliticalIssues: Array<{
    issue: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    mentions: number;
    trend: number;
  }>;
  lastUpdated: Date;
  dataSource: 'real' | 'simulated';
}

// Función para obtener métricas políticas reales
export async function getPoliticalMetrics(userId: string): Promise<PoliticalMetricsData> {
  try {
    // TODO: Implementar llamada a API real cuando esté disponible
    const response = await fetch(`/api/political-analytics/${userId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch political metrics');
    }
    
    const data = await response.json();
    return {
      ...data,
      dataSource: 'real',
      lastUpdated: new Date()
    };
  } catch (error) {
    console.warn('Using simulated political metrics:', error);
    // Retornar datos simulados mientras no haya API real
    return getSimulatedPoliticalMetrics();
  }
}

// Función para obtener datos simulados (temporal)
function getSimulatedPoliticalMetrics(): PoliticalMetricsData {
  // Generar variaciones realistas
  const baseApproval = 72.4;
  const variation = (Math.random() - 0.5) * 5; // ±2.5%
  
  return {
    approval: Math.round((baseApproval + variation) * 10) / 10,
    votingIntention: Math.round((68.1 + variation * 0.8) * 10) / 10,
    politicalReach: Math.floor(2800000 + Math.random() * 200000),
    politicalEngagement: Math.round((94.2 + variation * 0.3) * 10) / 10,
    demographicApproval: {
      young: Math.round(68 + variation),
      middle: Math.round(74 + variation * 0.7),
      senior: Math.round(76 + variation * 0.5)
    },
    topPoliticalIssues: [
      { 
        issue: 'Política Económica', 
        sentiment: 'positive', 
        mentions: Math.floor(1234 + Math.random() * 100), 
        trend: 23 + Math.floor(Math.random() * 5) 
      },
      { 
        issue: 'Educación Pública', 
        sentiment: 'positive', 
        mentions: Math.floor(987 + Math.random() * 80), 
        trend: 18 + Math.floor(Math.random() * 3) 
      },
      { 
        issue: 'Reforma Tributaria', 
        sentiment: 'neutral', 
        mentions: Math.floor(856 + Math.random() * 60), 
        trend: 15 + Math.floor(Math.random() * 4) 
      },
      { 
        issue: 'Seguridad Ciudadana', 
        sentiment: 'negative', 
        mentions: Math.floor(743 + Math.random() * 50), 
        trend: 12 + Math.floor(Math.random() * 3) 
      }
    ],
    lastUpdated: new Date(),
    dataSource: 'simulated'
  };
}

// Función para análisis político de menciones
export function analyzePoliticalSentiment(mentions: any[]): {
  politicalSentiment: number;
  keyTopics: string[];
  controversialIssues: string[];
} {
  // TODO: Implementar análisis real con IA cuando esté disponible
  return {
    politicalSentiment: 75.5,
    keyTopics: ['economía', 'educación', 'salud'],
    controversialIssues: ['reforma tributaria', 'seguridad']
  };
}

// Función para obtener tendencias políticas históricas
export async function getPoliticalTrends(
  userId: string, 
  period: 'week' | 'month' | 'quarter' | 'year'
): Promise<{
  labels: string[];
  approval: number[];
  votingIntention: number[];
}> {
  try {
    // TODO: Implementar con datos reales
    const response = await fetch(`/api/political-analytics/${userId}/trends?period=${period}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch political trends');
    }
    
    return await response.json();
  } catch (error) {
    // Datos simulados temporales
    const points = period === 'week' ? 7 : period === 'month' ? 30 : period === 'quarter' ? 90 : 365;
    const labels = generateDateLabels(points);
    const approval = generateTrendData(72.4, points, 2);
    const votingIntention = generateTrendData(68.1, points, 1.5);
    
    return { labels, approval, votingIntention };
  }
}

// Helpers para generar datos simulados
function generateDateLabels(count: number): string[] {
  const labels = [];
  const now = new Date();
  
  for (let i = count - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    labels.push(date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }));
  }
  
  return labels;
}

function generateTrendData(base: number, count: number, volatility: number): number[] {
  const data = [];
  let current = base;
  
  for (let i = 0; i < count; i++) {
    const change = (Math.random() - 0.5) * volatility;
    current = Math.max(0, Math.min(100, current + change));
    data.push(Math.round(current * 10) / 10);
  }
  
  return data;
}