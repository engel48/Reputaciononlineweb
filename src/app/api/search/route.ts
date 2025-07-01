import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai-service';
import { searchPersonalitiesOnline, searchAndAnalyzePersonality } from '@/lib/realScraping';
import { performRealAnalysis } from '@/lib/realNewsAPI';

// Base de datos expandida de personalidades latinoamericanas
const personalitiesDB = [
  // Políticos Colombia
  { id: 'p1', name: 'Gustavo Petro', type: 'político', country: 'Colombia', category: 'Presidente', followers: 5200000, platforms: ['X', 'Facebook', 'Instagram'] },
  { id: 'p2', name: 'Iván Duque', type: 'político', country: 'Colombia', category: 'Ex-Presidente', followers: 3800000, platforms: ['X', 'Facebook'] },
  { id: 'p3', name: 'Claudia López', type: 'político', country: 'Colombia', category: 'Alcaldesa Bogotá', followers: 2100000, platforms: ['X', 'Instagram'] },
  { id: 'p6', name: 'Francia Márquez', type: 'político', country: 'Colombia', category: 'Vicepresidenta', followers: 1800000, platforms: ['X', 'Instagram', 'Facebook'] },
  { id: 'p7', name: 'Federico Gutiérrez', type: 'político', country: 'Colombia', category: 'Alcalde Medellín', followers: 950000, platforms: ['X', 'Facebook'] },
  { id: 'p8', name: 'Sergio Fajardo', type: 'político', country: 'Colombia', category: 'Ex-candidato presidencial', followers: 1200000, platforms: ['X', 'Instagram'] },
  { id: 'p9', name: 'Enrique Peñalosa', type: 'político', country: 'Colombia', category: 'Ex-alcalde Bogotá', followers: 850000, platforms: ['X', 'Facebook'] },
  
  // Influencers Colombia
  { id: 'i1', name: 'Luisa Fernanda W', type: 'influencer', country: 'Colombia', category: 'Lifestyle', followers: 18500000, platforms: ['Instagram', 'YouTube', 'TikTok'] },
  { id: 'i2', name: 'La Liendra', type: 'influencer', country: 'Colombia', category: 'Entretenimiento', followers: 7200000, platforms: ['Instagram', 'TikTok'] },
  { id: 'i3', name: 'Ami Rodriguez', type: 'influencer', country: 'Colombia', category: 'Fitness', followers: 4800000, platforms: ['Instagram', 'YouTube'] },
  { id: 'i6', name: 'Dani Duke', type: 'influencer', country: 'Colombia', category: 'Lifestyle', followers: 6200000, platforms: ['Instagram', 'TikTok'] },
  { id: 'i7', name: 'Pautips', type: 'influencer', country: 'Colombia', category: 'Belleza', followers: 8500000, platforms: ['YouTube', 'Instagram'] },
  { id: 'i8', name: 'Juanpis González', type: 'influencer', country: 'Colombia', category: 'Comedia', followers: 3200000, platforms: ['Instagram', 'YouTube'] },
  { id: 'i9', name: 'Yeferson Cossio', type: 'influencer', country: 'Colombia', category: 'Entretenimiento', followers: 9800000, platforms: ['Instagram', 'TikTok'] },
  { id: 'i10', name: 'Manuela Gómez', type: 'influencer', country: 'Colombia', category: 'Entretenimiento', followers: 4100000, platforms: ['Instagram', 'TikTok'] },
  { id: 'i11', name: 'Epa Colombia', type: 'influencer', country: 'Colombia', category: 'Empresaria/Entretenimiento', followers: 6800000, platforms: ['Instagram', 'TikTok'] },
  
  // Artistas/Cantantes Colombia
  { id: 'a1', name: 'Shakira', type: 'artista', country: 'Colombia', category: 'Cantante', followers: 85000000, platforms: ['Instagram', 'X', 'Facebook'] },
  { id: 'a2', name: 'Maluma', type: 'artista', country: 'Colombia', category: 'Cantante', followers: 65000000, platforms: ['Instagram', 'X', 'TikTok'] },
  { id: 'a3', name: 'J Balvin', type: 'artista', country: 'Colombia', category: 'Cantante', followers: 58000000, platforms: ['Instagram', 'X', 'TikTok'] },
  { id: 'a4', name: 'Karol G', type: 'artista', country: 'Colombia', category: 'Cantante', followers: 72000000, platforms: ['Instagram', 'X', 'TikTok'] },
  { id: 'a5', name: 'Carlos Vives', type: 'artista', country: 'Colombia', category: 'Cantante', followers: 12000000, platforms: ['Instagram', 'Facebook', 'X'] },
  { id: 'a6', name: 'Feid', type: 'artista', country: 'Colombia', category: 'Cantante', followers: 15000000, platforms: ['Instagram', 'X', 'TikTok'] },
  { id: 'a7', name: 'Manuel Turizo', type: 'artista', country: 'Colombia', category: 'Cantante', followers: 18000000, platforms: ['Instagram', 'TikTok'] },
  
  // Deportistas Colombia
  { id: 'd1', name: 'James Rodríguez', type: 'deportista', country: 'Colombia', category: 'Futbolista', followers: 45000000, platforms: ['Instagram', 'X', 'TikTok'] },
  { id: 'd2', name: 'Falcao', type: 'deportista', country: 'Colombia', category: 'Futbolista', followers: 28000000, platforms: ['Instagram', 'X', 'Facebook'] },
  { id: 'd3', name: 'Mariana Pajón', type: 'deportista', country: 'Colombia', category: 'Ciclista BMX', followers: 2800000, platforms: ['Instagram', 'X'] },
  { id: 'd4', name: 'Nairo Quintana', type: 'deportista', country: 'Colombia', category: 'Ciclista', followers: 3200000, platforms: ['Instagram', 'X'] },
  { id: 'd5', name: 'Egan Bernal', type: 'deportista', country: 'Colombia', category: 'Ciclista', followers: 4100000, platforms: ['Instagram', 'X'] },
  
  // Empresas Colombia
  { id: 'e1', name: 'Bancolombia', type: 'empresa', country: 'Colombia', category: 'Banca', followers: 1200000, platforms: ['X', 'Facebook', 'LinkedIn'] },
  { id: 'e2', name: 'Avianca', type: 'empresa', country: 'Colombia', category: 'Aerolínea', followers: 2800000, platforms: ['X', 'Facebook', 'Instagram'] },
  { id: 'e3', name: 'Grupo Éxito', type: 'empresa', country: 'Colombia', category: 'Retail', followers: 980000, platforms: ['Facebook', 'Instagram', 'X'] },
  { id: 'e4', name: 'Ecopetrol', type: 'empresa', country: 'Colombia', category: 'Petrolera', followers: 850000, platforms: ['X', 'LinkedIn', 'Facebook'] },
  { id: 'e5', name: 'Rappi', type: 'empresa', country: 'Colombia', category: 'Tecnología/Delivery', followers: 3200000, platforms: ['Instagram', 'X', 'TikTok'] },
  { id: 'e6', name: 'Falabella', type: 'empresa', country: 'Colombia', category: 'Retail', followers: 1500000, platforms: ['Instagram', 'Facebook', 'X'] },
  { id: 'e7', name: 'Claro Colombia', type: 'empresa', country: 'Colombia', category: 'Telecomunicaciones', followers: 2100000, platforms: ['Facebook', 'Instagram', 'X'] },
  { id: 'e8', name: 'Movistar Colombia', type: 'empresa', country: 'Colombia', category: 'Telecomunicaciones', followers: 1800000, platforms: ['X', 'Facebook', 'Instagram'] },
  { id: 'e9', name: 'EPM', type: 'empresa', country: 'Colombia', category: 'Servicios Públicos', followers: 650000, platforms: ['X', 'Facebook', 'LinkedIn'] },
  { id: 'e10', name: 'Banco de Bogotá', type: 'empresa', country: 'Colombia', category: 'Banca', followers: 850000, platforms: ['X', 'Facebook', 'LinkedIn'] },
  { id: 'e11', name: 'Corona', type: 'empresa', country: 'Colombia', category: 'Construcción', followers: 450000, platforms: ['Instagram', 'Facebook', 'X'] },
  { id: 'e12', name: 'Alpina', type: 'empresa', country: 'Colombia', category: 'Alimentos', followers: 1200000, platforms: ['Instagram', 'Facebook', 'TikTok'] },
  { id: 'e13', name: 'Postobón', type: 'empresa', country: 'Colombia', category: 'Bebidas', followers: 890000, platforms: ['Instagram', 'Facebook', 'X'] },
  { id: 'e14', name: 'Grupo Nutresa', type: 'empresa', country: 'Colombia', category: 'Alimentos', followers: 720000, platforms: ['LinkedIn', 'Instagram', 'Facebook'] },
  { id: 'e15', name: 'Cemex Colombia', type: 'empresa', country: 'Colombia', category: 'Construcción', followers: 320000, platforms: ['LinkedIn', 'X', 'Facebook'] },
  { id: 'e16', name: 'Davivienda', type: 'empresa', country: 'Colombia', category: 'Banca', followers: 980000, platforms: ['X', 'Facebook', 'LinkedIn'] },
  { id: 'e17', name: 'Colpatria', type: 'empresa', country: 'Colombia', category: 'Banca', followers: 520000, platforms: ['Facebook', 'X', 'LinkedIn'] },
  { id: 'e18', name: 'Sodimac', type: 'empresa', country: 'Colombia', category: 'Retail/Construcción', followers: 680000, platforms: ['Instagram', 'Facebook', 'X'] },
  { id: 'e19', name: 'Mercado Libre Colombia', type: 'empresa', country: 'Colombia', category: 'E-commerce', followers: 2800000, platforms: ['Instagram', 'X', 'TikTok'] },
  { id: 'e20', name: 'Uber Colombia', type: 'empresa', country: 'Colombia', category: 'Tecnología/Transporte', followers: 1900000, platforms: ['X', 'Instagram', 'Facebook'] },
  
  // Empresas Internacionales en Latinoamérica
  { id: 'e21', name: 'Coca-Cola', type: 'empresa', country: 'Internacional', category: 'Bebidas', followers: 15000000, platforms: ['Instagram', 'Facebook', 'X', 'TikTok'] },
  { id: 'e22', name: 'McDonald\'s', type: 'empresa', country: 'Internacional', category: 'Restaurantes', followers: 12000000, platforms: ['Instagram', 'Facebook', 'TikTok'] },
  { id: 'e23', name: 'Netflix', type: 'empresa', country: 'Internacional', category: 'Entretenimiento', followers: 25000000, platforms: ['X', 'Instagram', 'TikTok'] },
  { id: 'e24', name: 'Amazon', type: 'empresa', country: 'Internacional', category: 'E-commerce', followers: 30000000, platforms: ['X', 'Instagram', 'LinkedIn'] },
  { id: 'e25', name: 'Google', type: 'empresa', country: 'Internacional', category: 'Tecnología', followers: 40000000, platforms: ['X', 'Instagram', 'LinkedIn', 'YouTube'] },
  
  // México
  { id: 'p4', name: 'AMLO', type: 'político', country: 'México', category: 'Presidente', followers: 8500000, platforms: ['X', 'Facebook'] },
  { id: 'p10', name: 'Claudia Sheinbaum', type: 'político', country: 'México', category: 'Presidenta electa', followers: 2100000, platforms: ['X', 'Facebook'] },
  { id: 'i4', name: 'Luisito Comunica', type: 'influencer', country: 'México', category: 'Travel/Entertainment', followers: 25000000, platforms: ['YouTube', 'Instagram', 'TikTok'] },
  { id: 'i12', name: 'Yuya', type: 'influencer', country: 'México', category: 'Belleza', followers: 24000000, platforms: ['YouTube', 'Instagram'] },
  { id: 'i13', name: 'Kimberly Loaiza', type: 'influencer', country: 'México', category: 'Entretenimiento', followers: 32000000, platforms: ['TikTok', 'Instagram', 'YouTube'] },
  { id: 'a8', name: 'Bad Bunny', type: 'artista', country: 'Puerto Rico', category: 'Cantante', followers: 95000000, platforms: ['Instagram', 'X', 'TikTok'] },
  
  // Argentina
  { id: 'p11', name: 'Javier Milei', type: 'político', country: 'Argentina', category: 'Presidente', followers: 3800000, platforms: ['X', 'Instagram'] },
  { id: 'p12', name: 'Cristina Kirchner', type: 'político', country: 'Argentina', category: 'Ex-presidenta', followers: 4200000, platforms: ['X', 'Instagram'] },
  { id: 'd6', name: 'Lionel Messi', type: 'deportista', country: 'Argentina', category: 'Futbolista', followers: 180000000, platforms: ['Instagram', 'X', 'Facebook'] },
  { id: 'i14', name: 'ElRubius', type: 'influencer', country: 'Argentina', category: 'Gaming/Entretenimiento', followers: 40000000, platforms: ['YouTube', 'Instagram', 'TikTok'] },
  
  // Brasil
  { id: 'p5', name: 'Jair Bolsonaro', type: 'político', country: 'Brasil', category: 'Ex-Presidente', followers: 6200000, platforms: ['X', 'Instagram'] },
  { id: 'p13', name: 'Lula da Silva', type: 'político', country: 'Brasil', category: 'Presidente', followers: 5800000, platforms: ['X', 'Instagram', 'Facebook'] },
  { id: 'i5', name: 'Whindersson Nunes', type: 'influencer', country: 'Brasil', category: 'Comedy', followers: 58000000, platforms: ['Instagram', 'YouTube'] },
  { id: 'i15', name: 'Felipe Neto', type: 'influencer', country: 'Brasil', category: 'Entretenimiento', followers: 45000000, platforms: ['YouTube', 'Instagram', 'X'] },
  { id: 'd7', name: 'Neymar', type: 'deportista', country: 'Brasil', category: 'Futbolista', followers: 195000000, platforms: ['Instagram', 'X', 'TikTok'] },
  { id: 'a9', name: 'Anitta', type: 'artista', country: 'Brasil', category: 'Cantante', followers: 68000000, platforms: ['Instagram', 'X', 'TikTok'] },
  
  // Chile
  { id: 'p14', name: 'Gabriel Boric', type: 'político', country: 'Chile', category: 'Presidente', followers: 2800000, platforms: ['X', 'Instagram'] },
  { id: 'i16', name: 'German Garmendia', type: 'influencer', country: 'Chile', category: 'Gaming/Comedy', followers: 42000000, platforms: ['YouTube', 'Instagram'] },
  { id: 'd8', name: 'Alexis Sánchez', type: 'deportista', country: 'Chile', category: 'Futbolista', followers: 12000000, platforms: ['Instagram', 'X'] },
  
  // Perú
  { id: 'p15', name: 'Dina Boluarte', type: 'político', country: 'Perú', category: 'Presidenta', followers: 950000, platforms: ['X', 'Facebook'] },
  { id: 'i17', name: 'Nicolás Arrieta', type: 'influencer', country: 'Perú', category: 'Entretenimiento', followers: 8500000, platforms: ['TikTok', 'Instagram'] },
  
  // Ecuador
  { id: 'p16', name: 'Daniel Noboa', type: 'político', country: 'Ecuador', category: 'Presidente', followers: 1200000, platforms: ['X', 'Instagram'] },
  
  // Venezuela
  { id: 'p17', name: 'Nicolás Maduro', type: 'político', country: 'Venezuela', category: 'Presidente', followers: 4500000, platforms: ['X', 'Instagram', 'TikTok'] },
  { id: 'i18', name: 'Lele Pons', type: 'influencer', country: 'Venezuela', category: 'Entretenimiento', followers: 55000000, platforms: ['Instagram', 'TikTok', 'YouTube'] },
];

function generateSentimentAnalysis(personality: any) {
  // Simulación de análisis de sentimientos más realista
  const basePositive = Math.random() * 40 + 30; // 30-70%
  const baseNegative = Math.random() * 30 + 10; // 10-40%
  const neutral = 100 - basePositive - baseNegative;

  const platforms = personality.platforms.map((platform: string) => ({
    platform,
    mentions: Math.floor(Math.random() * 1000) + 100,
    sentiment: {
      positive: Math.floor(basePositive + (Math.random() * 20 - 10)),
      negative: Math.floor(baseNegative + (Math.random() * 15 - 7)),
      neutral: Math.floor(neutral + (Math.random() * 10 - 5))
    },
    engagement: Math.floor(Math.random() * 8) + 2, // 2-10%
    trending_topics: generateTrendingTopics(personality.type, personality.name)
  }));

  return {
    overall_sentiment: {
      positive: Math.floor(basePositive),
      negative: Math.floor(baseNegative),
      neutral: Math.floor(neutral)
    },
    total_mentions: platforms.reduce((sum: number, p: any) => sum + p.mentions, 0),
    platforms,
    reputation_score: Math.floor((basePositive - baseNegative + 50) * 2), // 0-100
    trend: Math.random() > 0.5 ? 'up' : 'down',
    last_updated: new Date().toISOString(),
    key_insights: generateKeyInsights(personality),
    recent_mentions: generateRecentMentions(personality)
  };
}

function generateTrendingTopics(type: string, name: string) {
  const topics = {
    político: ['políticas públicas', 'elecciones', 'gobierno', 'reformas', 'economía'],
    influencer: ['contenido viral', 'colaboraciones', 'lifestyle', 'tendencias', 'marca personal'],
    empresa: ['servicio al cliente', 'productos', 'innovación', 'responsabilidad social', 'mercado']
  };
  
  return topics[type as keyof typeof topics]?.slice(0, 3) || ['general', 'noticias', 'actualidad'];
}

function generateKeyInsights(personality: any) {
  const insights = [
    `Mayor actividad en ${personality.platforms[0]} con alto engagement`,
    `Sentimiento mayormente positivo en discusiones sobre ${personality.category.toLowerCase()}`,
    `Incremento del 15% en menciones esta semana`,
    `Alta interacción con audiencia joven (18-35 años)`
  ];
  return insights.slice(0, 2);
}

function generateRecentMentions(personality: any) {
  const sampleMentions = [
    { author: 'Usuario123', content: `Gran trabajo de ${personality.name} en su último proyecto`, sentiment: 'positive', platform: personality.platforms[0] },
    { author: 'AnalystPro', content: `Interesante perspectiva de ${personality.name} sobre el tema`, sentiment: 'neutral', platform: personality.platforms[1] || personality.platforms[0] },
    { author: 'CriticaReal', content: `No estoy de acuerdo con la posición de ${personality.name}`, sentiment: 'negative', platform: personality.platforms[0] }
  ];
  return sampleMentions.slice(0, 3).map(m => ({
    ...m,
    timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString() // Últimas 24h
  }));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type');
    const country = searchParams.get('country') || 'Colombia';

    if (!query) {
      return NextResponse.json({
        success: false,
        error: 'Parámetro de búsqueda requerido'
      }, { status: 400 });
    }

    console.log(`🔍 Búsqueda real para: ${query}`);

    // 1. Primero buscar en base de datos local (búsqueda mejorada)
    let localResults = personalitiesDB.filter(person => {
      const searchTerm = query.toLowerCase().trim();
      const personName = person.name.toLowerCase();
      const personCategory = person.category.toLowerCase();
      
      // Búsqueda más flexible
      const matchesName = personName.includes(searchTerm) || 
                         searchTerm.split(' ').some(term => personName.includes(term)) ||
                         personCategory.includes(searchTerm);
      const matchesType = !type || person.type === type;
      const matchesCountry = !country || person.country === country;
      
      return matchesName && matchesType && matchesCountry;
    });
    
    // Ordenar por relevancia (coincidencia exacta primero)
    localResults = localResults.sort((a, b) => {
      const aExact = a.name.toLowerCase() === query.toLowerCase();
      const bExact = b.name.toLowerCase() === query.toLowerCase();
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return b.followers - a.followers; // Por número de seguidores
    });

    // 2. Buscar en internet usando IA
    let onlineResults: any[] = [];
    try {
      onlineResults = await searchPersonalitiesOnline(query);
      console.log(`🌐 Encontradas ${onlineResults.length} personalidades online`);
    } catch (error) {
      console.error('Error en búsqueda online:', error);
    }

    // 3. Combinar resultados
    const allResults = [
      ...localResults.map(r => ({ ...r, found_online: false })),
      ...onlineResults
    ];

    if (allResults.length === 0) {
      // Sugerencias con IA si no hay resultados
      try {
        const suggestionsPrompt = `No se encontró "${query}". Sugiere 3 personalidades similares de Latinoamérica con nombres exactos y una breve descripción de por qué son relevantes.`;
        const suggestions = await aiService.chat([
          {
            role: 'system',
            content: 'Eres Sofia, un experto en personalidades latinoamericanas. Sugiere personalidades reales similares cuando no encuentres resultados exactos. Responde en español con sugerencias útiles y precisas.'
          },
          {
            role: 'user',
            content: suggestionsPrompt
          }
        ], { max_tokens: 200, temperature: 0.3 });
        
        return NextResponse.json({
          success: true,
          results: [],
          suggestions: suggestions,
          message: `No se encontraron resultados para "${query}". Aquí tienes algunas sugerencias:`
        });
      } catch (aiError) {
        console.error('Error en IA de sugerencias:', aiError);
      }
    }

    return NextResponse.json({
      success: true,
      results: allResults.slice(0, 10),
      total: allResults.length,
      searched_online: true
    });

  } catch (error) {
    console.error('Error en búsqueda:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { personalityName, personalityId } = await request.json();

    if (!personalityName && !personalityId) {
      return NextResponse.json({
        success: false,
        error: 'Nombre o ID de personalidad requerido'
      }, { status: 400 });
    }

    let personalityNameToAnalyze = personalityName;

    // Si es un ID, buscar el nombre
    if (personalityId && !personalityName) {
      const personality = personalitiesDB.find(p => p.id === personalityId);
      if (personality) {
        personalityNameToAnalyze = personality.name;
      } else {
        return NextResponse.json({
          success: false,
          error: 'Personalidad no encontrada'
        }, { status: 404 });
      }
    }

    console.log(`🔍 Iniciando análisis REAL COMPLETO para: ${personalityNameToAnalyze}`);

    // Realizar análisis con noticias reales y datos en tiempo real
    try {
      const realAnalysis = await performRealAnalysis(personalityNameToAnalyze);
      
      console.log(`✅ Análisis REAL completado: ${realAnalysis.totalMentions} menciones reales encontradas`);

      return NextResponse.json({
        success: true,
        personality: {
          name: personalityNameToAnalyze,
          type: 'real_news_analysis',
          country: 'Latinoamérica'
        },
        analysis: {
          name: realAnalysis.personalityName,
          total_mentions: realAnalysis.totalMentions,
          overall_sentiment: realAnalysis.sentiment,
          reputation_score: realAnalysis.reputationScore,
          trend: realAnalysis.trend,
          key_insights: realAnalysis.keyInsights,
          news_analysis: realAnalysis.realNews,
          social_analysis: realAnalysis.socialMentions,
          sources: [
            {
              source: 'Noticias Reales',
              mentions: realAnalysis.realNews.length,
              sentiment: {
                positive: Math.round(realAnalysis.realNews.filter(n => n.sentiment === 'positive').length / Math.max(1, realAnalysis.realNews.length) * 100),
                negative: Math.round(realAnalysis.realNews.filter(n => n.sentiment === 'negative').length / Math.max(1, realAnalysis.realNews.length) * 100),
                neutral: Math.round(realAnalysis.realNews.filter(n => n.sentiment === 'neutral').length / Math.max(1, realAnalysis.realNews.length) * 100)
              },
              recent_mentions: realAnalysis.realNews.slice(0, 3)
            },
            {
              source: 'Redes Sociales',
              mentions: realAnalysis.socialMentions.length,
              sentiment: {
                positive: Math.round(realAnalysis.socialMentions.filter(s => s.sentiment === 'positive').length / Math.max(1, realAnalysis.socialMentions.length) * 100),
                negative: Math.round(realAnalysis.socialMentions.filter(s => s.sentiment === 'negative').length / Math.max(1, realAnalysis.socialMentions.length) * 100),
                neutral: Math.round(realAnalysis.socialMentions.filter(s => s.sentiment === 'neutral').length / Math.max(1, realAnalysis.socialMentions.length) * 100)
              },
              recent_mentions: realAnalysis.socialMentions.slice(0, 3)
            }
          ]
        },
        real_data: true,
        real_news: true,
        generated_at: new Date().toISOString(),
        sources_scraped: ['Google News', 'X/Twitter', 'Facebook', 'Instagram', 'Medios Digitales'],
        last_updated: realAnalysis.lastUpdated
      });

    } catch (scrapingError) {
      console.error('Error en scraping real:', scrapingError);
      
      // Fallback a análisis simulado con IA
      const personality = personalitiesDB.find(p => 
        p.name.toLowerCase().includes(personalityNameToAnalyze.toLowerCase())
      );
      
      if (personality) {
        const analysis: any = generateSentimentAnalysis(personality);
        
        try {
          const aiContent = await aiService.chat([
            {
              role: 'system',
              content: 'Eres Sofia, un analista experto en reputación digital de Latinoamérica. Proporciona insights detallados en español sobre personalidades públicas.'
            },
            {
              role: 'user',
              content: `Analiza la reputación de ${personalityNameToAnalyze}. Proporciona insights sobre su presencia digital, tendencias de sentimiento y recomendaciones estratégicas.`
            }
          ], { max_tokens: 500, temperature: 0.7 });
          
          if (aiContent) {
            analysis.ai_insights = { insights: [aiContent] };
          }
        } catch (aiError) {
          console.error('Error en análisis IA:', aiError);
        }

        return NextResponse.json({
          success: true,
          personality,
          analysis,
          real_data: false,
          fallback: true,
          generated_at: new Date().toISOString()
        });
      }
      
      throw scrapingError;
    }

  } catch (error: any) {
    console.error('Error en análisis:', error);
    return NextResponse.json({
      success: false,
      error: 'Error en el análisis de reputación',
      details: error?.message || 'Error desconocido'
    }, { status: 500 });
  }
}