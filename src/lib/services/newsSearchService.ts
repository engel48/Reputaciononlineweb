/**
 * Servicio de Búsqueda de Noticias en Base de Datos
 * Busca en la tabla scraped_news de Supabase
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Cliente Supabase con service role para lectura completa
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface NewsSearchResult {
  id: string;
  title: string;
  content: string;
  summary: string;
  source: string;
  sourceUrl: string;
  articleUrl: string;
  publishedAt: string;
  author: string | null;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number;
  relevanceScore: number;
  category: string;
  keywords: string[];
  imageUrl: string | null;
}

export interface SearchOptions {
  limit?: number;
  offset?: number;
  sentiment?: 'positive' | 'negative' | 'neutral' | 'all';
  source?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  orderBy?: 'relevance' | 'date' | 'sentiment';
}

export interface SearchResponse {
  results: NewsSearchResult[];
  total: number;
  query: string;
  sentimentSummary: {
    positive: number;
    negative: number;
    neutral: number;
    averageScore: number;
  };
}

/**
 * Busca noticias en la base de datos que coincidan con el término de búsqueda
 */
export async function searchNews(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResponse> {
  const {
    limit = 20,
    offset = 0,
    sentiment = 'all',
    source,
    category,
    dateFrom,
    dateTo,
    orderBy = 'date',
  } = options;

  try {
    console.log(`🔍 Buscando noticias para: "${query}"`);

    // Construir query base
    let dbQuery = supabase
      .from('scraped_news')
      .select('*', { count: 'exact' });

    // Búsqueda por texto en título y contenido
    if (query && query.trim()) {
      const searchTerms = query.toLowerCase().trim();
      dbQuery = dbQuery.or(`title.ilike.%${searchTerms}%,content.ilike.%${searchTerms}%`);
    }

    // Filtro por sentimiento
    if (sentiment && sentiment !== 'all') {
      dbQuery = dbQuery.eq('sentiment', sentiment);
    }

    // Filtro por fuente
    if (source) {
      dbQuery = dbQuery.ilike('source', `%${source}%`);
    }

    // Filtro por categoría
    if (category) {
      dbQuery = dbQuery.eq('category', category);
    }

    // Filtro por fecha
    if (dateFrom) {
      dbQuery = dbQuery.gte('published_at', dateFrom);
    }
    if (dateTo) {
      dbQuery = dbQuery.lte('published_at', dateTo);
    }

    // Ordenamiento
    switch (orderBy) {
      case 'relevance':
        dbQuery = dbQuery.order('relevance_score', { ascending: false });
        break;
      case 'sentiment':
        dbQuery = dbQuery.order('sentiment_score', { ascending: false });
        break;
      case 'date':
      default:
        dbQuery = dbQuery.order('published_at', { ascending: false });
    }

    // Paginación
    dbQuery = dbQuery.range(offset, offset + limit - 1);

    // Ejecutar query
    const { data, error, count } = await dbQuery;

    if (error) {
      console.error('❌ Error en búsqueda:', error);
      throw new Error(`Error en búsqueda: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.log(`📭 No se encontraron noticias para: "${query}"`);
      return {
        results: [],
        total: 0,
        query,
        sentimentSummary: {
          positive: 0,
          negative: 0,
          neutral: 0,
          averageScore: 0,
        },
      };
    }

    console.log(`✅ Encontradas ${data.length} noticias de ${count} totales`);

    // Transformar resultados
    const results: NewsSearchResult[] = data.map((row: any) => ({
      id: row.id,
      title: row.title,
      content: row.content || '',
      summary: row.summary || row.content?.substring(0, 200) || '',
      source: row.source,
      sourceUrl: row.source_url,
      articleUrl: row.article_url,
      publishedAt: row.published_at,
      author: row.author,
      sentiment: row.sentiment || 'neutral',
      sentimentScore: parseFloat(row.sentiment_score) || 0,
      relevanceScore: parseFloat(row.relevance_score) || 0.5,
      category: row.category || 'general',
      keywords: row.keywords || [],
      imageUrl: row.image_url,
    }));

    // Calcular resumen de sentimiento
    const sentimentCounts = { positive: 0, negative: 0, neutral: 0 };
    let totalScore = 0;

    results.forEach(r => {
      sentimentCounts[r.sentiment]++;
      totalScore += r.sentimentScore;
    });

    const sentimentSummary = {
      positive: sentimentCounts.positive,
      negative: sentimentCounts.negative,
      neutral: sentimentCounts.neutral,
      averageScore: results.length > 0 ? totalScore / results.length : 0,
    };

    return {
      results,
      total: count || results.length,
      query,
      sentimentSummary,
    };

  } catch (error: any) {
    console.error('❌ Error en newsSearchService:', error);
    throw error;
  }
}

/**
 * Obtiene estadísticas generales de las noticias
 */
export async function getNewsStats(): Promise<{
  total: number;
  bySource: Record<string, number>;
  bySentiment: Record<string, number>;
  lastUpdated: string | null;
}> {
  try {
    // Total de noticias
    const { count: total } = await supabase
      .from('scraped_news')
      .select('*', { count: 'exact', head: true });

    // Por fuente (top 10)
    const { data: sourceData } = await supabase
      .from('scraped_news')
      .select('source')
      .limit(1000);

    const bySource: Record<string, number> = {};
    sourceData?.forEach((row: any) => {
      bySource[row.source] = (bySource[row.source] || 0) + 1;
    });

    // Por sentimiento
    const { data: sentimentData } = await supabase
      .from('scraped_news')
      .select('sentiment')
      .limit(1000);

    const bySentiment: Record<string, number> = { positive: 0, negative: 0, neutral: 0 };
    sentimentData?.forEach((row: any) => {
      const s = row.sentiment || 'neutral';
      bySentiment[s] = (bySentiment[s] || 0) + 1;
    });

    // Última actualización
    const { data: lastNews } = await supabase
      .from('scraped_news')
      .select('scraped_at')
      .order('scraped_at', { ascending: false })
      .limit(1)
      .single();

    return {
      total: total || 0,
      bySource,
      bySentiment,
      lastUpdated: lastNews?.scraped_at || null,
    };
  } catch (error: any) {
    console.error('❌ Error obteniendo estadísticas:', error);
    return {
      total: 0,
      bySource: {},
      bySentiment: { positive: 0, negative: 0, neutral: 0 },
      lastUpdated: null,
    };
  }
}

/**
 * Busca noticias relacionadas con una persona o empresa específica
 * Retorna análisis de sentimiento consolidado
 */
export async function searchPersonOrCompany(
  name: string,
  options: SearchOptions = {}
): Promise<{
  news: NewsSearchResult[];
  analysis: {
    totalMentions: number;
    sentimentBreakdown: {
      positive: number;
      negative: number;
      neutral: number;
      percentages: {
        positive: number;
        negative: number;
        neutral: number;
      };
    };
    averageSentimentScore: number;
    reputationScore: number; // 0-100
    topSources: string[];
    recentTrend: 'improving' | 'declining' | 'stable';
  };
}> {
  const searchResponse = await searchNews(name, {
    ...options,
    limit: options.limit || 50,
    orderBy: 'date',
  });

  const { results, sentimentSummary } = searchResponse;
  const total = results.length;

  // Calcular porcentajes
  const percentages = {
    positive: total > 0 ? (sentimentSummary.positive / total) * 100 : 0,
    negative: total > 0 ? (sentimentSummary.negative / total) * 100 : 0,
    neutral: total > 0 ? (sentimentSummary.neutral / total) * 100 : 0,
  };

  // Calcular score de reputación (0-100)
  // Fórmula: (positivos * 100 + neutrales * 50) / total
  const reputationScore = total > 0
    ? Math.round(
        (sentimentSummary.positive * 100 + sentimentSummary.neutral * 50) / total
      )
    : 50;

  // Top fuentes
  const sourceCounts: Record<string, number> = {};
  results.forEach(r => {
    sourceCounts[r.source] = (sourceCounts[r.source] || 0) + 1;
  });
  const topSources = Object.entries(sourceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([source]) => source);

  // Tendencia reciente (comparar primera mitad vs segunda mitad)
  let recentTrend: 'improving' | 'declining' | 'stable' = 'stable';
  if (results.length >= 4) {
    const midPoint = Math.floor(results.length / 2);
    const recentNews = results.slice(0, midPoint);
    const olderNews = results.slice(midPoint);

    const recentAvg = recentNews.reduce((sum, r) => sum + r.sentimentScore, 0) / recentNews.length;
    const olderAvg = olderNews.reduce((sum, r) => sum + r.sentimentScore, 0) / olderNews.length;

    if (recentAvg > olderAvg + 0.1) {
      recentTrend = 'improving';
    } else if (recentAvg < olderAvg - 0.1) {
      recentTrend = 'declining';
    }
  }

  return {
    news: results,
    analysis: {
      totalMentions: total,
      sentimentBreakdown: {
        positive: sentimentSummary.positive,
        negative: sentimentSummary.negative,
        neutral: sentimentSummary.neutral,
        percentages,
      },
      averageSentimentScore: sentimentSummary.averageScore,
      reputationScore,
      topSources,
      recentTrend,
    },
  };
}

export default {
  searchNews,
  getNewsStats,
  searchPersonOrCompany,
};
