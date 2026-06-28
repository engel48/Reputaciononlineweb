import { NextRequest, NextResponse } from 'next/server';
import { performWebSearch, scrapeWebPage } from '@/lib/realWebSearch';
import { aiService } from '@/lib/ai-service';
import { searchPersonOrCompany } from '@/lib/services/newsSearchService';
import { checkBalance, deductCreditsForAction, extractUserIdFromToken } from '@/lib/credit-guard';
import { CREDIT_COSTS } from '@/lib/credit-costs';

export async function POST(request: NextRequest) {
  try {
    const { name, type } = await request.json();

    if (!name) {
      return NextResponse.json({
        success: false,
        error: 'Nombre requerido para análisis'
      }, { status: 400 });
    }

    console.log(`📊 Iniciando análisis profundo para: ${name}`);

    // Cobro del análisis profundo (operación pesada: scraping + IA). Verifica
    // saldo antes; deduce al obtener resultado (charge()). Si no hay sesión, no cobra.
    const authToken = request.cookies.get('auth-token')?.value;
    const userId = authToken ? extractUserIdFromToken(authToken) : null;
    if (userId) {
      const cost = CREDIT_COSTS.julia_person_search;
      const balance = await checkBalance(userId, cost);
      if (!balance.hasEnough && !balance.unlimited) {
        return NextResponse.json(
          {
            success: false,
            error: `No te alcanzan los créditos. Este análisis cuesta ${cost}.`,
            credits: { cost, currentBalance: balance.currentBalance },
          },
          { status: 402 }
        );
      }
    }
    const charge = async () => {
      if (!userId) return;
      try {
        await deductCreditsForAction(userId, 'julia_person_search', 1, `Análisis de ${name}`);
      } catch {
        /* no romper la respuesta por un fallo de deducción */
      }
    };

    // 1. PRIMERO: Buscar en noticias scrapeadas (datos REALES)
    let dbAnalysis = null;
    let dbNews: any[] = [];

    try {
      console.log('📰 Buscando en base de datos de noticias...');
      const newsResults = await searchPersonOrCompany(name, { limit: 50 });

      if (newsResults && newsResults.news.length > 0) {
        console.log(`✅ Encontradas ${newsResults.news.length} noticias reales`);
        dbNews = newsResults.news;
        dbAnalysis = newsResults.analysis;
      }
    } catch (error) {
      console.error('Error buscando en DB:', error);
    }

    // Si tenemos datos de la BD, usarlos como fuente principal
    if (dbAnalysis && dbNews.length > 0) {
      const { sentimentBreakdown, reputationScore, topSources, recentTrend } = dbAnalysis;

      // Calcular porcentajes reales
      const total = dbNews.length;
      const sentimentAnalysis = {
        positive: Math.round(sentimentBreakdown.percentages.positive),
        negative: Math.round(sentimentBreakdown.percentages.negative),
        neutral: Math.round(sentimentBreakdown.percentages.neutral),
        insights: [
          `${total} menciones encontradas en medios colombianos`,
          `Tendencia reciente: ${recentTrend === 'improving' ? 'mejorando' : recentTrend === 'declining' ? 'en declive' : 'estable'}`,
          `Principales fuentes: ${topSources.slice(0, 3).join(', ')}`,
          `Score promedio de sentimiento: ${dbAnalysis.averageSentimentScore.toFixed(2)}`
        ]
      };

      const analysis = {
        name,
        type,
        sources_analyzed: dbNews.length,
        web_mentions: 0,
        news_mentions: dbNews.length,
        sentiment: sentimentAnalysis,
        recent_news: dbNews.slice(0, 10).map(n => ({
          title: n.title,
          url: n.articleUrl,
          source: n.source,
          date: n.publishedAt,
          sentiment: n.sentiment,
          sentimentScore: n.sentimentScore
        })),
        web_sources: [],
        scraped_content: dbNews.slice(0, 3).map(n => ({
          url: n.articleUrl,
          title: n.title,
          content: n.summary || n.content?.substring(0, 500)
        })),
        reputation_score: reputationScore,
        trend: recentTrend,
        data_source: 'scraped_news_database',
        analysis_date: new Date().toISOString()
      };

      await charge();
      return NextResponse.json({
        success: true,
        analysis
      });
    }

    // 2. FALLBACK: Si no hay datos en BD, intentar web search
    console.log('⚠️ No hay noticias en BD, intentando búsqueda web...');

    const { webResults, newsResults } = await performWebSearch(name);

    // 3. Analizar las primeras 5 páginas encontradas
    const scrapedContent = [];
    for (const result of webResults.slice(0, 5)) {
      const pageContent = await scrapeWebPage(result.url);
      if (pageContent) {
        scrapedContent.push({
          url: result.url,
          title: pageContent.title,
          content: pageContent.content.substring(0, 1000)
        });
      }
    }

    // 4. Analizar sentimiento con IA si hay contenido
    let sentimentAnalysis = {
      positive: 0,
      negative: 0,
      neutral: 0,
      insights: [] as string[]
    };

    if (scrapedContent.length > 0) {
      try {
        const contentForAnalysis = scrapedContent.map(s => s.content).join('\n\n');
        const aiAnalysis = await aiService.chat([
          {
            role: 'system',
            content: 'Eres un experto en análisis de sentimientos y reputación online. Analiza el contenido y proporciona un análisis detallado. IMPORTANTE: Responde ÚNICAMENTE con un objeto JSON válido, sin bloques de código ni texto adicional.'
          },
          {
            role: 'user',
            content: `Analiza el sentimiento y la reputación de "${name}" basándote en este contenido real de internet:\n\n${contentForAnalysis.substring(0, 3000)}\n\nResponde ÚNICAMENTE con este formato JSON exacto (sin bloques de código markdown):\n{\n  "sentiment": {\n    "positive": 40,\n    "negative": 25,\n    "neutral": 35\n  },\n  "key_insights": [\n    "insight 1",\n    "insight 2",\n    "insight 3"\n  ],\n  "reputation_score": 75\n}`
          }
        ], { temperature: 0.3 });

        try {
          let cleanResponse = aiAnalysis.trim();
          if (cleanResponse.startsWith('```json')) {
            cleanResponse = cleanResponse.replace(/```json\s*/, '').replace(/```\s*$/, '');
          } else if (cleanResponse.startsWith('```')) {
            cleanResponse = cleanResponse.replace(/```\s*/, '').replace(/```\s*$/, '');
          }

          const parsed = JSON.parse(cleanResponse);
          if (parsed.sentiment) {
            sentimentAnalysis.positive = parsed.sentiment.positive || 0;
            sentimentAnalysis.negative = parsed.sentiment.negative || 0;
            sentimentAnalysis.neutral = parsed.sentiment.neutral || 0;
          }
          if (parsed.key_insights) {
            sentimentAnalysis.insights = parsed.key_insights;
          }
        } catch (e) {
          console.log('Error parseando análisis de IA, usando análisis por keywords');
          // NO usar valores hardcodeados - dejar en 0 si no hay datos
          sentimentAnalysis.insights = [
            'No se pudo analizar el sentimiento automáticamente',
            'Ejecuta el scraping primero: POST /api/scraping/run',
            'La base de datos scraped_news está vacía'
          ];
        }
      } catch (error) {
        console.error('Error en análisis de sentimiento con IA:', error);
      }
    } else {
      // Sin contenido para analizar
      sentimentAnalysis.insights = [
        'No se encontró contenido para analizar',
        'Ejecuta primero: POST /api/scraping/run para poblar la base de datos',
        'Luego vuelve a intentar el análisis'
      ];
    }

    // 5. Compilar resultados
    const analysis = {
      name,
      type,
      sources_analyzed: scrapedContent.length + newsResults.length,
      web_mentions: webResults.length,
      news_mentions: newsResults.length,
      sentiment: sentimentAnalysis,
      recent_news: newsResults.slice(0, 5),
      web_sources: webResults.slice(0, 5),
      scraped_content: scrapedContent.slice(0, 3),
      reputation_score: sentimentAnalysis.positive > 0 || sentimentAnalysis.negative > 0
        ? Math.max(0, Math.min(100, Math.round((sentimentAnalysis.positive - sentimentAnalysis.negative + 50))))
        : null, // null si no hay datos reales
      data_source: scrapedContent.length > 0 ? 'web_scraping' : 'no_data',
      suggestion: scrapedContent.length === 0 ? 'Ejecuta POST /api/scraping/run para obtener datos reales' : null,
      analysis_date: new Date().toISOString()
    };

    await charge();
    return NextResponse.json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error('Error en análisis:', error);
    return NextResponse.json({
      success: false,
      error: 'Error realizando análisis'
    }, { status: 500 });
  }
}