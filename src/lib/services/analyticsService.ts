// Servicio para proporcionar datos simulados de analytics

/**
 * Genera un retraso simulado
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Genera un rango de fechas según el período
 */
const generateTimeRange = (count: number, period: string) => {
  const result = [];
  
  switch (period) {
    case 'week':
      return ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    case 'month':
      for (let i = 0; i < count; i++) {
        result.push(`${String(i + 1).padStart(2, '0')}`);
      }
      return result;
    case 'quarter':
      return ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'].slice(0, count);
    default:
      return Array(count).fill(0).map((_, i) => `Día ${i + 1}`);
  }
};

/**
 * Genera valores métricos aleatorios
 */
const generateMetricValues = (count: number, min: number, max: number, volatility: number) => {
  const result = [];
  let current = min + Math.random() * (max - min) * 0.5;
  
  for (let i = 0; i < count; i++) {
    current += (Math.random() - 0.5) * volatility * (max - min);
    current = Math.max(min, Math.min(max, current));
    result.push(Math.round(current));
  }
  
  return result;
};

/**
 * Genera datos simulados de métricas de reputación
 */
export const getReputationMetrics = async (userId?: string) => {
  try {
    // Simulamos una llamada a API
    await delay(600);
    
    return {
      overallScore: 87,
      mentionsCount: 2487,
      reachScore: 65342,
      engagementRate: 4.3,
      trends: {
        overallScoreTrend: { value: 2.5, isPositive: true },
        mentionsCountTrend: { value: 12, isPositive: true },
        reachScoreTrend: { value: 5.7, isPositive: true },
        engagementRateTrend: { value: 0.8, isPositive: false }
      }
    };
  } catch (error) {
    console.error('Error obteniendo métricas de reputación:', error);
    // Datos de fallback en caso de error
    return {
      overallScore: 80,
      mentionsCount: 2000,
      reachScore: 60000,
      engagementRate: 4.0,
      trends: {
        overallScoreTrend: { value: 2.0, isPositive: true },
        mentionsCountTrend: { value: 10, isPositive: true },
        reachScoreTrend: { value: 5.0, isPositive: true },
        engagementRateTrend: { value: 0.5, isPositive: true }
      }
    };
  }
};

/**
 * Genera datos simulados para gráficos de evolución temporal
 */
export const getTimelineData = async (period: 'week' | 'month' | 'quarter' = 'month') => {
  try {
    // Simulamos una llamada a API
    await delay(600);
    
    // Cantidad de puntos según período
    const pointCount = {
      week: 7,
      month: 30,
      quarter: 12
    }[period] || 7;
    
    // Generar datos simulados
    const timeRange = generateTimeRange(pointCount, period);
    
    return {
      reputationScore: {
        labels: timeRange,
        values: generateMetricValues(pointCount, 50, 90, 0.2),
        previousPeriodValues: generateMetricValues(pointCount, 45, 80, 0.2)
      },
      mentions: {
        labels: timeRange,
        values: generateMetricValues(pointCount, 5, 20, 0.6),
        previousPeriodValues: generateMetricValues(pointCount, 3, 15, 0.6)
      },
      engagement: {
        labels: timeRange,
        values: generateMetricValues(pointCount, 20, 120, 0.4),
        previousPeriodValues: generateMetricValues(pointCount, 15, 100, 0.4)
      }
    };
  } catch (error) {
    console.error('Error obteniendo datos de timeline:', error);
    // Datos de fallback en caso de error
    const labels = ['Día 1', 'Día 2', 'Día 3', 'Día 4', 'Día 5', 'Día 6', 'Día 7'];
    return {
      reputationScore: {
        labels,
        values: [65, 68, 72, 75, 78, 82, 85],
        previousPeriodValues: [60, 62, 65, 68, 70, 75, 78]
      },
      mentions: {
        labels,
        values: [8, 10, 15, 12, 18, 16, 20],
        previousPeriodValues: [5, 8, 12, 10, 15, 13, 17]
      },
      engagement: {
        labels,
        values: [40, 45, 60, 55, 70, 65, 80],
        previousPeriodValues: [35, 40, 50, 48, 60, 55, 70]
      }
    };
  }
};

/**
 * Genera datos simulados para análisis de sentimiento
 */
export const getSentimentData = async () => {
  try {
    // Simulamos una llamada a API
    await delay(700);
    
    return {
      current: {
        positive: 1523,
        neutral: 795,
        negative: 169,
        total: 2487
      },
      historical: {
        labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
        positive: [58, 60, 62, 65, 68, 71],
        neutral: [32, 30, 28, 25, 22, 20],
        negative: [10, 10, 10, 10, 10, 9]
      },
      topics: [
        { topic: 'Atención al cliente', sentiment: 92, volume: 582 },
        { topic: 'Calidad de servicio', sentiment: 88, volume: 423 },
        { topic: 'Sostenibilidad', sentiment: 95, volume: 347 },
        { topic: 'Precios', sentiment: 65, volume: 683 },
        { topic: 'Innovación', sentiment: 87, volume: 452 }
      ]
    };
  } catch (error) {
    console.error('Error obteniendo datos de sentimiento:', error);
    // Datos de fallback en caso de error
    return {
      current: {
        positive: 1200,
        neutral: 600,
        negative: 100,
        total: 1900
      },
      historical: {
        labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
        positive: [50, 55, 60, 65, 70, 75],
        neutral: [30, 28, 25, 22, 20, 18],
        negative: [10, 10, 10, 10, 10, 9]
      },
      topics: [
        { topic: 'Atención al cliente', sentiment: 90, volume: 400 },
        { topic: 'Calidad de servicio', sentiment: 85, volume: 350 },
        { topic: 'Sostenibilidad', sentiment: 92, volume: 300 },
        { topic: 'Precios', sentiment: 60, volume: 500 },
        { topic: 'Innovación', sentiment: 85, volume: 400 }
      ]
    };
  }
};

/**
 * Genera datos simulados para las menciones más recientes
 */
export const getLatestMentions = async (limit: number = 5) => {
  try {
    // Simulamos una llamada a API
    await delay(600);
    
    const mentions = [
      {
        id: 'm1',
        platform: 'x',
        author: 'Carlos Méndez',
        authorHandle: '@carlosmendez',
        profileImage: 'https://randomuser.me/api/portraits/men/32.jpg',
        content: 'Excelente servicio y atención personalizada. Totalmente recomendable para gestionar la reputación online de cualquier empresa.',
        sentiment: 'positive',
        date: '2025-06-04T10:24:00',
        engagement: 38,
        url: 'https://x.com'
      },
      {
        id: 'm2',
        platform: 'facebook',
        author: 'Ana García',
        authorHandle: 'Ana García',
        profileImage: 'https://randomuser.me/api/portraits/women/44.jpg',
        content: 'Buena plataforma pero los precios son algo elevados comparados con otras opciones del mercado.',
        sentiment: 'neutral',
        date: '2025-06-04T08:15:00',
        engagement: 12,
        url: 'https://facebook.com'
      },
      {
        id: 'm3',
        platform: 'linkedin',
        author: 'Roberto Fernández',
        authorHandle: 'Roberto Fernández',
        profileImage: 'https://randomuser.me/api/portraits/men/54.jpg',
        content: 'Su enfoque en sostenibilidad y responsabilidad social es admirable. Un ejemplo a seguir en el sector.',
        sentiment: 'positive',
        date: '2025-06-03T22:41:00',
        engagement: 87,
        url: 'https://linkedin.com'
      },
      {
        id: 'm4',
        platform: 'instagram',
        author: 'Laura Martín',
        authorHandle: '@lauramartin',
        profileImage: 'https://randomuser.me/api/portraits/women/29.jpg',
        content: 'Increíble la innovación constante y cómo integran nuevas tecnologías. #Recomendado',
        sentiment: 'positive',
        date: '2025-06-03T17:09:00',
        engagement: 45,
        url: 'https://instagram.com'
      },
      {
        id: 'm5',
        platform: 'review',
        author: 'Miguel Torres',
        authorHandle: 'Miguel T.',
        profileImage: 'https://randomuser.me/api/portraits/men/78.jpg',
        content: 'Decepcionado con la atención al cliente. Llevo 3 días esperando respuesta a mi consulta técnica.',
        sentiment: 'negative',
        date: '2025-06-03T14:32:00',
        engagement: 8,
        url: 'https://reviews.com'
      },
      {
        id: 'm6',
        platform: 'x',
        author: 'Patricia López',
        authorHandle: '@patricial',
        profileImage: 'https://randomuser.me/api/portraits/women/62.jpg',
        content: 'Fantástica experiencia de usuario y resultados inmediatos. Vale cada céntimo invertido.',
        sentiment: 'positive',
        date: '2025-06-03T11:45:00',
        engagement: 27,
        url: 'https://x.com'
      },
      {
        id: 'm7',
        platform: 'facebook',
        author: 'David Ruiz',
        authorHandle: 'David Ruiz',
        profileImage: 'https://randomuser.me/api/portraits/men/23.jpg',
        content: 'Esperaba más funcionalidades por el precio que tiene. Hay alternativas más completas.',
        sentiment: 'negative',
        date: '2025-06-02T19:21:00',
        engagement: 15,
        url: 'https://facebook.com'
      }
    ];
    
    // Devolvemos solo la cantidad solicitada
    return mentions.slice(0, limit);
  } catch (error) {
    console.error('Error obteniendo menciones recientes:', error);
    // Datos de fallback en caso de error
    return [
      {
        id: 'fallback1',
        platform: 'x',
        author: 'Usuario Ejemplo',
        authorHandle: '@usuario',
        profileImage: 'https://randomuser.me/api/portraits/men/1.jpg',
        content: 'Este es un contenido de ejemplo para mostrar cuando hay un error cargando las menciones reales.',
        sentiment: 'positive',
        date: new Date().toISOString(),
        engagement: 10,
        url: 'https://x.com'
      },
      {
        id: 'fallback2',
        platform: 'facebook',
        author: 'Usuario Secundario',
        authorHandle: 'Usuario Secundario',
        profileImage: 'https://randomuser.me/api/portraits/women/1.jpg',
        content: 'Otra mención de ejemplo para asegurar que siempre se muestran datos en la interfaz.',
        sentiment: 'neutral',
        date: new Date().toISOString(),
        engagement: 5,
        url: 'https://facebook.com'
      }
    ].slice(0, limit);
  }
};
