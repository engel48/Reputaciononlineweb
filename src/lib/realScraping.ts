// Importamos el servicio de IA centralizado en lugar de OpenAI directamente
// El servicio maneja automáticamente el fallback a DeepSeek cuando OpenAI no está disponible

interface ScrapingResult {
  source: string;
  title: string;
  content: string;
  url: string;
  date?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

interface PersonalityAnalysis {
  name: string;
  overall_sentiment: {
    positive: number;
    negative: number;
    neutral: number;
  };
  total_mentions: number;
  sources: Array<{
    source: string;
    mentions: number;
    sentiment: {
      positive: number;
      negative: number;
      neutral: number;
    };
    recent_mentions: ScrapingResult[];
  }>;
  reputation_score: number;
  trend: 'up' | 'down';
  key_insights: string[];
  news_analysis: ScrapingResult[];
  social_analysis: ScrapingResult[];
}

// Función para buscar noticias reales usando IA con información actualizada
async function searchNewsWithAI(query: string): Promise<ScrapingResult[]> {
  try {
    const aiService = await import('./ai-service');
    
    const response = await aiService.aiService.chat([
        {
          role: "system",
          content: `Eres un analista de noticias especializado en Latinoamérica con acceso a información actualizada. Tu tarea es generar un reporte basado en NOTICIAS REALES Y TENDENCIAS ACTUALES.

          IMPORTANTE: 
          - Usa información real y actual sobre la persona/empresa consultada
          - Incluye contexto real de Latinoamérica (política, economía, cultura)
          - Las noticias deben reflejar eventos y tendencias reales
          - Usa fechas recientes y contenido verosímil
          
          Responde en JSON exacto con noticias realistas:`
        },
        {
          role: "user",
          content: `Busca y genera 6-8 noticias REALES y actuales sobre "${query}" en Latinoamérica. 
          
          Considera:
          - Eventos recientes relacionados con esta persona/empresa
          - Contexto actual de su país/industria
          - Tendencias mediáticas latinoamericanas
          - Fuentes de noticias reales (periódicos, medios digitales)
          
          Incluye variedad en el sentimiento (positivo, negativo, neutral) basado en la realidad.`
        }
      ],
      {
        max_tokens: 1200,
        temperature: 0.2, // Más determinístico para "noticias reales"
      }
    );

    if (response) {
      try {
        // Limpiar la respuesta de posibles bloques de código
        let cleanResponse = response.trim();
        if (cleanResponse.startsWith('```json')) {
          cleanResponse = cleanResponse.replace(/```json\s*/, '').replace(/```\s*$/, '');
        } else if (cleanResponse.startsWith('```')) {
          cleanResponse = cleanResponse.replace(/```\s*/, '').replace(/```\s*$/, '');
        }
        
        const news = JSON.parse(cleanResponse);
        return news.map((item: any, index: number) => ({
          source: 'Google News',
          title: item.title,
          content: item.content,
          url: `https://news.google.com/article/${Date.now() + index}`,
          date: item.date || new Date().toISOString(), // ✅ Fecha actual real
          sentiment: item.sentiment
        }));
      } catch (e) {
        console.error('Error parsing AI news:', e);
      }
    }
    
    return [];
  } catch (error) {
    console.error('Error generating news with AI:', error);
    return [];
  }
}

// ❌ FUNCIÓN ELIMINADA - GENERABA DATOS FALSOS
// Esta función simulaba menciones de redes sociales que no existen
// Las APIs reales de redes sociales requieren OAuth y tokens de acceso válidos
async function simulateSocialMediaScraping(query: string): Promise<ScrapingResult[]> {
  // ✅ Retornar array vacío - NO generar datos falsos
  // Si no hay conexión OAuth real a las redes sociales, no mostrar datos
  console.warn('simulateSocialMediaScraping: No se generan datos simulados. Conecte APIs reales.');
  return [];
}

// ❌ FUNCIÓN ELIMINADA - Ya no se usa porque simulateSocialMediaScraping retorna vacío
// function generateRealisticSocialContent() ya no es necesaria

// Función para analizar sentimientos con Julia IA
// ⚠️ SOLO se usa si hay contenido REAL para analizar
async function analyzeSentimentWithGPT(contents: string[], personalityName: string): Promise<{
  overall_sentiment: { positive: number; negative: number; neutral: number };
  insights: string[];
} | null> {
  // Si no hay contenido, retornar null (NO hardcodear valores)
  if (!contents || contents.length === 0) {
    console.warn('analyzeSentimentWithGPT: No hay contenido para analizar');
    return null;
  }

  try {
    const combinedContent = contents.slice(0, 20).join('\n\n');

    // Usar el servicio de IA centralizado
    const aiService = await import('./ai-service');
    const aiAnalysis = await aiService.aiService.chat([
      {
        role: 'system',
        content: 'Eres Julia, un experto en análisis de sentimientos. Responde ÚNICAMENTE con un objeto JSON válido.'
      },
      {
        role: 'user',
        content: `Analiza el sentimiento sobre "${personalityName}" en este contenido:\n\n${combinedContent.substring(0, 2000)}\n\nResponde con este formato JSON exacto:\n{"sentiment": {"positive": 40, "negative": 25, "neutral": 35}, "insights": ["insight 1", "insight 2"]}`
      }
    ], { temperature: 0.3 });

    try {
      // Limpiar respuesta de markdown
      let cleanResponse = aiAnalysis.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/```json\s*/, '').replace(/```\s*$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/```\s*/, '').replace(/```\s*$/, '');
      }

      const parsed = JSON.parse(cleanResponse);
      if (parsed.sentiment && typeof parsed.sentiment.positive === 'number') {
        return {
          overall_sentiment: parsed.sentiment,
          insights: parsed.insights || [`Análisis completado para ${personalityName}`]
        };
      }
      // Si el parse no tiene la estructura correcta, retornar null
      console.warn('analyzeSentimentWithGPT: Respuesta de IA no tiene estructura válida');
      return null;
    } catch (parseError) {
      console.error('Error parseando análisis de IA:', parseError);
      return null; // NO hardcodear valores
    }
  } catch (error) {
    console.error('Error with GPT sentiment analysis:', error);
    return null; // NO hardcodear valores
  }
}

// Función principal para búsqueda y análisis real
// ⚠️ IMPORTANTE: Esta función ya NO genera datos inventados
// Si no hay datos reales, retorna null para que el sistema use scraped_news
export async function searchAndAnalyzePersonality(name: string): Promise<PersonalityAnalysis | null> {
  try {
    console.log(`Iniciando búsqueda para: ${name}`);

    // ❌ NO usar searchNewsWithAI - genera noticias INVENTADAS por IA
    // ❌ NO usar simulateSocialMediaScraping - retorna vacío
    // ✅ Los datos reales vienen de scraped_news (RSS scraping)

    // Esta función ahora solo intenta analizar si hay contenido real
    // El contenido real debe venir del servicio newsSearchService

    console.warn('searchAndAnalyzePersonality: Use /api/search que busca en scraped_news primero');

    // Retornar null para indicar que no hay datos
    // El endpoint /api/search usará el newsSearchService como fuente principal
    return null;

  } catch (error) {
    console.error('Error in searchAndAnalyzePersonality:', error);
    return null;
  }
}

// Función para buscar personalidades en internet
export async function searchPersonalitiesOnline(query: string): Promise<Array<{
  id: string;
  name: string;
  type: string;
  country: string;
  category: string;
  description: string;
  found_online: boolean;
}>> {
  try {
    // Usar el servicio de IA centralizado (que maneja el fallback a DeepSeek)
    const aiService = await import('./ai-service');
    
    const response = await aiService.aiService.chat([
        {
          role: "system",
          content: `Eres un experto en personalidades de Latinoamérica. Cuando busquen una persona, identifica personalidades reales similares o exactas. Responde en JSON con este formato:
          [
            {
              "name": "Nombre completo",
              "type": "político|influencer|empresa|deportista|artista",
              "country": "País",
              "category": "Descripción breve",
              "description": "Descripción de 1-2 líneas"
            }
          ]`
        },
        {
          role: "user",
          content: `Busca personalidades relacionadas con: "${query}". Incluye políticos, influencers, empresas, deportistas o artistas de Latinoamérica, especialmente Colombia.`
        }
      ],
      {
        max_tokens: 600,
        temperature: 0.3,
      }
    );

    if (response) {
      try {
        // Limpiar la respuesta de posibles bloques de código
        let cleanResponse = response.trim();
        if (cleanResponse.startsWith('```json')) {
          cleanResponse = cleanResponse.replace(/```json\s*/, '').replace(/```\s*$/, '');
        } else if (cleanResponse.startsWith('```')) {
          cleanResponse = cleanResponse.replace(/```\s*/, '').replace(/```\s*$/, '');
        }
        
        const personalities = JSON.parse(cleanResponse);
        return personalities.map((p: any, index: number) => ({
          id: `real-${Date.now()}-${index}`,
          name: p.name,
          type: p.type,
          country: p.country,
          category: p.category,
          description: p.description,
          found_online: true
        }));
      } catch (e) {
        console.error('Error parsing GPT response:', e);
      }
    }
    
    return [];
  } catch (error) {
    console.error('Error searching personalities online:', error);
    return [];
  }
}

// ❌ FUNCIÓN ELIMINADA - GENERABA DATOS FALSOS
// Esta función generaba noticias falsas cuando la IA no estaba disponible
function generateFallbackScrapingResults(query: string): ScrapingResult[] {
  // ✅ Retornar array vacío - NO generar datos falsos
  console.warn('generateFallbackScrapingResults: No hay datos reales disponibles. Retornando vacío.');
  return [];
}