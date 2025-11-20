import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai-service';
import { searchPersonalitiesOnline, searchAndAnalyzePersonality } from '@/lib/realScraping';
import { performRealAnalysis } from '@/lib/realNewsAPI';
import { performWebSearch, identifyPersonalities } from '@/lib/realWebSearch';
import { createClient } from '@supabase/supabase-js';

// ❌ BASE DE DATOS HARDCODEADA ELIMINADA - Solo búsqueda REAL

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

    console.log(`🔍 Búsqueda REAL para: "${query}" (tipo: ${type || 'todos'})`);

    // BÚSQUEDA REAL usando las herramientas de scraping
    try {
      // Intentar búsqueda real con scraping y análisis
      const realResults = await searchAndAnalyzePersonality(query);

      if (realResults && realResults.name) {
        console.log(`✅ Encontrado resultado real para: ${realResults.name}`);
        return NextResponse.json({
          results: [realResults], // Envolver en array para compatibilidad
          source: 'real_scraping',
          query: query,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error en búsqueda real:', error);
    }

    // Si no hay resultados reales, intentar búsqueda web
    try {
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

    // Si tampoco hay resultados de búsqueda web, consultar base de datos de usuarios monitoreados
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

    // Sin resultados reales
    console.log('⚠️ No se encontraron resultados reales para la búsqueda');
    return NextResponse.json({
      results: [],
      message: 'No se encontraron resultados. Intenta con otro nombre o verifica la ortografía.',
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

    console.log(`🔍 Análisis profundo REAL para: "${query}"`);

    // Realizar análisis real completo
    const analysis = await searchAndAnalyzePersonality(query);

    if (!analysis || !analysis.name) {
      return NextResponse.json({
        message: 'No se encontraron resultados de análisis real',
        query: query,
        results: []
      });
    }

    return NextResponse.json({
      query: query,
      results: [analysis], // Envolver en array para compatibilidad
      source: 'real_analysis',
      timestamp: new Date().toISOString()
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
