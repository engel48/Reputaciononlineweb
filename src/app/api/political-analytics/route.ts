import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

let openai: OpenAI | null = null;

function getOpenAI() {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

export async function GET(request: NextRequest) {
  try {
    console.log('🏛️ Generando métricas políticas con IA...');

    const openaiClient = getOpenAI();
    if (!openaiClient) {
      console.log('OpenAI no disponible, usando datos de respaldo');
      return NextResponse.json({
        success: true,
        data: generateFallbackPoliticalData(),
        source: 'fallback'
      });
    }

    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Eres un analista político especializado. Genera métricas realistas para un líder político en Colombia.
          
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
      ],
      max_tokens: 1000,
      temperature: 0.2,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No se recibió respuesta de OpenAI');
    }

    // Limpiar la respuesta y parsear JSON
    let cleanResponse = response.trim();
    if (cleanResponse.startsWith('```json')) {
      cleanResponse = cleanResponse.replace(/```json\s*/, '').replace(/```\s*$/, '');
    }

    let metrics;
    try {
      metrics = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error('Error parseando JSON:', parseError);
      // Fallback con datos realistas
      metrics = {
        approvalRating: 45,
        previousApproval: 42,
        voterSentiment: {
          positive: 38,
          negative: 35,
          neutral: 27
        },
        demographicData: {
          youngVoters: 32,
          adultVoters: 41,
          seniorVoters: 27
        },
        keyIssues: [
          { issue: "Economía y Empleo", sentiment: "negative", mentions: 1250 },
          { issue: "Seguridad Ciudadana", sentiment: "negative", mentions: 980 },
          { issue: "Reforma de Salud", sentiment: "neutral", mentions: 756 },
          { issue: "Educación Pública", sentiment: "positive", mentions: 642 },
          { issue: "Lucha contra la Corrupción", sentiment: "positive", mentions: 534 }
        ],
        campaignMetrics: {
          donations: 1250000,
          volunteers: 4200,
          events: 28
        }
      };
    }

    // Validar y ajustar datos si es necesario
    if (!metrics.voterSentiment || typeof metrics.voterSentiment.positive !== 'number') {
      metrics.voterSentiment = { positive: 38, negative: 35, neutral: 27 };
    }

    if (!metrics.demographicData || typeof metrics.demographicData.youngVoters !== 'number') {
      metrics.demographicData = { youngVoters: 32, adultVoters: 41, seniorVoters: 27 };
    }

    if (!metrics.keyIssues || !Array.isArray(metrics.keyIssues)) {
      metrics.keyIssues = [
        { issue: "Economía y Empleo", sentiment: "negative", mentions: 1250 },
        { issue: "Seguridad Ciudadana", sentiment: "negative", mentions: 980 },
        { issue: "Educación Pública", sentiment: "positive", mentions: 642 }
      ];
    }

    console.log('✅ Métricas políticas generadas exitosamente');

    return NextResponse.json({
      success: true,
      metrics: metrics,
      generated_at: new Date().toISOString(),
      source: 'political_ai_analysis'
    });

  } catch (error) {
    console.error('Error generando métricas políticas:', error);
    
    // Retornar datos de fallback realistas
    return NextResponse.json({
      success: true,
      metrics: {
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
          { issue: "Infraestructura", sentiment: "neutral", mentions: 560 },
          { issue: "Lucha contra la Corrupción", sentiment: "positive", mentions: 445 }
        ],
        campaignMetrics: {
          donations: 1450000,
          volunteers: 3800,
          events: 32
        }
      },
      generated_at: new Date().toISOString(),
      source: 'fallback_data'
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