/**
 * Endpoint para buscar noticias por palabra clave
 * Busca en la tabla scraped_news de Supabase
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchNews } from '@/lib/services/newsSearchService';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const keyword = searchParams.get('keyword') || searchParams.get('q');
    const sentiment = searchParams.get('sentiment') as 'positive' | 'negative' | 'neutral' | 'all' | undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const dateFrom = searchParams.get('dateFrom') || undefined;
    const dateTo = searchParams.get('dateTo') || undefined;

    if (!keyword || keyword.trim() === '') {
      return NextResponse.json({
        success: false,
        error: 'Se requiere una palabra clave para buscar',
        results: [],
        total: 0,
      }, { status: 400 });
    }

    console.log(`🔍 Buscando noticias con keyword: "${keyword}"`);

    const searchResponse = await searchNews(keyword, {
      limit,
      offset,
      sentiment: sentiment || 'all',
      dateFrom,
      dateTo,
      orderBy: 'date',
    });

    // Transformar resultados para el frontend
    const results = searchResponse.results.map(news => ({
      id: news.id,
      title: news.title,
      summary: news.summary || news.content?.substring(0, 200),
      content: news.content?.substring(0, 500),
      source: news.source,
      sourceUrl: news.sourceUrl,
      articleUrl: news.articleUrl,
      publishedAt: news.publishedAt,
      author: news.author,
      sentiment: news.sentiment,
      sentimentScore: news.sentimentScore,
      imageUrl: news.imageUrl,
      keywords: news.keywords,
    }));

    return NextResponse.json({
      success: true,
      keyword,
      results,
      total: searchResponse.total,
      sentimentSummary: searchResponse.sentimentSummary,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('❌ Error en búsqueda de noticias:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error al buscar noticias',
      results: [],
      total: 0,
    }, { status: 500 });
  }
}
