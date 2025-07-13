import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai-service';

export async function GET(request: NextRequest) {
  try {
    console.log('🏛️ Julia: Generando métricas políticas con IA...');

    // Preparar datos dummy para el análisis político
    const dummyPoliticalData = {
      approvalRating: 47,
      previousApproval: 44,
      voterSentiment: {
        positive: 40,
        negative: 33,
        neutral: 27
      },
      demographicData: {
        youngVoters: 35,
        adultVoters: 42,
        seniorVoters: 23
      },
      keyIssues: [
        { issue: "Economía y Empleo", sentiment: "negative", mentions: 1350 },
        { issue: "Seguridad Ciudadana", sentiment: "negative", mentions: 1120 },
        { issue: "Reforma de Salud", sentiment: "neutral", mentions: 890 },
        { issue: "Educación Pública", sentiment: "positive", mentions: 720 },
        { issue: "Infraestructura", sentiment: "neutral", mentions: 560 }
      ],
      campaignMetrics: {
        donations: 1450000,
        volunteers: 3800,
        events: 32
      }
    };

    try {
      // Usar el servicio de análisis político con Julia
      const enhancedMetrics = await aiService.analyzePoliticalMetrics(dummyPoliticalData);
      
      console.log('✅ Julia: Métricas políticas generadas exitosamente');
      
      return NextResponse.json({
        success: true,
        metrics: enhancedMetrics,
        generated_at: new Date().toISOString(),
        source: 'julia_political_analysis'
      });
      
    } catch (aiError) {
      console.error('🚨 Julia: Error en análisis político:', aiError);
      
      // Fallback a datos base si el AI falla
      const response = await aiService.chat([
        {
          role: "system",
          content: `Eres Julia, un analista político especializado en Colombia. Genera métricas realistas para un líder político.
          
          IMPORTANTE: Responde ÚNICAMENTE con un JSON válido, sin texto adicional ni formato markdown.
          
          El JSON debe tener esta estructura exacta:
          {
            "approvalRating": número entre 30-70,
            "previousApproval": número ligeramente diferente,
            "voterSentiment": {
              "positive": número entre 25-55,
              "negative": número entre 20-45,
              "neutral": número calculado para que sume 100
            },
            "demographicData": {
              "youngVoters": número entre 20-45,
              "adultVoters": número entre 35-50,
              "seniorVoters": número calculado para que sume 100
            },
            "keyIssues": [
              {"issue": "nombre del tema", "sentiment": "positive|negative|neutral", "mentions": número},
              {"issue": "otro tema", "sentiment": "positive|negative|neutral", "mentions": número},
              {"issue": "tercer tema", "sentiment": "positive|negative|neutral", "mentions": número}
            ],
            "campaignMetrics": {
              "donations": número entre 500000-2000000,
              "volunteers": número entre 1000-8000,
              "events": número entre 15-50
            }
          }`
        },
        {
          role: "user",
          content: "Genera métricas políticas realistas para un político colombiano actual. Incluye temas como economía, seguridad, educación, salud, corrupción."
        }
      ], { max_tokens: 1000, temperature: 0.2 });

      let metrics;
      try {
        let cleanResponse = response.trim();
        if (cleanResponse.startsWith('```json')) {
          cleanResponse = cleanResponse.replace(/```json\s*/, '').replace(/```\s*$/, '');
        }
        metrics = JSON.parse(cleanResponse);
      } catch (parseError) {
        console.error('🚨 Julia: Error parseando JSON:', parseError);
        metrics = dummyPoliticalData; // usar datos dummy como fallback
      }

      // Validar y ajustar datos si es necesario
      if (!metrics.voterSentiment || typeof metrics.voterSentiment.positive !== 'number') {
        metrics.voterSentiment = dummyPoliticalData.voterSentiment;
      }

      if (!metrics.demographicData || typeof metrics.demographicData.youngVoters !== 'number') {
        metrics.demographicData = dummyPoliticalData.demographicData;
      }

      if (!metrics.keyIssues || !Array.isArray(metrics.keyIssues)) {
        metrics.keyIssues = dummyPoliticalData.keyIssues;
      }

      console.log('✅ Julia: Métricas políticas generadas exitosamente');

      return NextResponse.json({
        success: true,
        metrics: metrics,
        generated_at: new Date().toISOString(),
        source: 'julia_political_analysis_fallback'
      });
    }

  } catch (error) {
    console.error('🚨 Julia: Error generando métricas políticas:', error);
    
    // Retornar datos de fallback realistas
    return NextResponse.json({
      success: true,
      metrics: generateFallbackPoliticalData(),
      generated_at: new Date().toISOString(),
      source: 'julia_fallback_data'
    });
  }
}

function generateFallbackPoliticalData() {
  return {
    approvalRating: 47,
    previousApproval: 44,
    voterSentiment: {
      positive: 40,
      negative: 33,
      neutral: 27
    },
    demographicData: {
      youngVoters: 35,
      adultVoters: 42,
      seniorVoters: 23
    },
    keyIssues: [
      { issue: "Economía y Empleo", sentiment: "negative", mentions: 1350 },
      { issue: "Seguridad Ciudadana", sentiment: "negative", mentions: 1120 },
      { issue: "Reforma de Salud", sentiment: "neutral", mentions: 890 },
      { issue: "Educación Pública", sentiment: "positive", mentions: 720 },
      { issue: "Infraestructura", sentiment: "neutral", mentions: 560 }
    ],
    campaignMetrics: {
      donations: 1450000,
      volunteers: 3800,
      events: 32
    }
  };
}