import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai-service';
import { searchPersonalitiesOnline, searchAndAnalyzePersonality } from '@/lib/realScraping';
import { performRealAnalysis } from '@/lib/realNewsAPI';
import { performWebSearch, identifyPersonalities } from '@/lib/realWebSearch';
import { searchPersonOrCompany, searchNews } from '@/lib/services/newsSearchService';
import { createClient } from '@supabase/supabase-js';

// Búsqueda REAL en base de datos + scraping

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const type = searchParams.get('type');

    if (!query) {
      return NextResponse.json({ error: 'Parámetro de búsqueda requerido' }, { status: 400 });
    }

    console.log(`🔍 Búsqueda para: "${query}" (tipo: ${type || 'todos'})`);

    // 1. PRIMERO: Buscar en scraped_news (noticias reales scrapeadas)
    try {
      console.log('📰 Buscando en noticias scrapeadas...');
      const newsResults = await searchPersonOrCompany(query, { limit: 20 });

      if (newsResults && newsResults.news.length > 0) {
        console.log(`✅ Encontradas ${newsResults.news.length} noticias reales para: "${query}"`);

        return NextResponse.json({
          results: newsResults.news.map(n => ({
            id: n.id,
            title: n.title,
            description: n.summary,
            url: n.articleUrl,
            source: n.source,
            sourceUrl: n.sourceUrl,
            publishedAt: n.publishedAt,
            author: n.author,
            sentiment: n.sentiment,
            sentimentScore: n.sentimentScore,
            imageUrl: n.imageUrl,
            type: 'news'
          })),
          analysis: newsResults.analysis,
          source: 'scraped_news',
          query: query,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error buscando en noticias scrapeadas:', error);
    }

    // 2. SEGUNDO: Intentar búsqueda real con scraping en tiempo real
    try {
      console.log('🔄 Intentando scraping en tiempo real...');
      const realResults = await searchAndAnalyzePersonality(query);

      if (realResults && realResults.name) {
        console.log(`✅ Encontrado resultado real para: ${realResults.name}`);
        return NextResponse.json({
          results: [realResults],
          source: 'real_scraping',
          query: query,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error en scraping en tiempo real:', error);
    }

    // 3. TERCERO: Intentar búsqueda web externa
    try {
      console.log('🌐 Intentando búsqueda web...');
      const webResults = await performWebSearch(query);

      if (webResults && webResults.totalResults > 0) {
        console.log(`✅ Encontrados ${webResults.totalResults} resultados de búsqueda web`);
        return NextResponse.json({
          results: [...webResults.webResults, ...webResults.newsResults],
          source: 'web_search',
          query: query,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error en búsqueda web:', error);
    }

    // 4. CUARTO: Consultar base de datos de usuarios monitoreados
    try {
      const { data: monitoredPersons, error } = await supabase
        .from('users')
        .select('id, name, email, profileType, category')
        .ilike('name', `%${query}%`)
        .limit(10);

      if (!error && monitoredPersons && monitoredPersons.length > 0) {
        console.log(`✅ Encontrados ${monitoredPersons.length} usuarios monitoreados`);
        return NextResponse.json({
          results: monitoredPersons.map(person => ({
            id: person.id,
            name: person.name,
            type: person.profileType || 'user',
            category: person.category,
            source: 'database',
            monitored: true
          })),
          source: 'database',
          query: query,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error consultando base de datos:', error);
    }

    // Sin resultados - sugerir ejecutar scraping
    console.log('⚠️ No se encontraron resultados para la búsqueda');
    return NextResponse.json({
      results: [],
      message: 'No se encontraron noticias. Prueba ejecutar el scraping primero con POST /api/scraping/run',
      suggestion: 'scraped_news está vacía. Ejecuta el scraping para poblar la base de datos.',
      source: 'none',
      query: query,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error en búsqueda:', error);
    return NextResponse.json(
      {
        error: 'Error procesando búsqueda',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, options } = body;

    if (!query) {
      return NextResponse.json({ error: 'Query requerido' }, { status: 400 });
    }

    console.log(`🔍 Análisis profundo para: "${query}"`);

    // 1. PRIMERO: Buscar en noticias scrapeadas con análisis completo
    try {
      const newsResults = await searchPersonOrCompany(query, { limit: 50 });

      if (newsResults && newsResults.news.length > 0) {
        console.log(`✅ Análisis basado en ${newsResults.news.length} noticias reales`);

        return NextResponse.json({
          query: query,
          results: newsResults.news.map(n => ({
            id: n.id,
            title: n.title,
            description: n.summary,
            url: n.articleUrl,
            source: n.source,
            publishedAt: n.publishedAt,
            sentiment: n.sentiment,
            sentimentScore: n.sentimentScore,
            type: 'news'
          })),
          analysis: newsResults.analysis,
          source: 'scraped_news',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error buscando en noticias scrapeadas:', error);
    }

    // 2. Fallback: análisis con scraping en tiempo real
    try {
      const analysis = await searchAndAnalyzePersonality(query);

      if (analysis && analysis.name) {
        return NextResponse.json({
          query: query,
          results: [analysis],
          source: 'real_analysis',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error en análisis en tiempo real:', error);
    }

    return NextResponse.json({
      message: 'No se encontraron resultados. Ejecuta el scraping primero.',
      query: query,
      results: [],
      suggestion: 'POST /api/scraping/run para poblar la base de datos'
    });

  } catch (error) {
    console.error('Error en análisis POST:', error);
    return NextResponse.json(
      {
        error: 'Error en análisis',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
