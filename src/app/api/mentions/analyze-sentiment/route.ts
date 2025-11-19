/**
 * API Endpoint: Análisis de Sentimiento en Tiempo Real
 *
 * Analiza el sentimiento de menciones usando Gemini AI con fallback a keywords
 * Actualiza la tabla mentions en Supabase si se proporciona mentionId
 *
 * @route POST /api/mentions/analyze-sentiment
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { aiService } from '@/lib/ai-service';

// Supabase client (server-side con service_role para bypass RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Rate limiting simple en memoria (60 requests/min para Gemini)
const rateLimiter = new Map<string, { count: number; resetAt: number }>();

// Fallback: Análisis de sentimiento basado en keywords
function keywordBasedSentiment(text: string): {
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  explanation: string;
} {
  const positiveKeywords = [
    'excelente', 'bueno', 'genial', 'increíble', 'fantástico', 'maravilloso',
    'éxito', 'logro', 'feliz', 'alegre', 'positivo', 'amor', 'felicidades',
    'gracias', 'apoyo', 'admiro', 'respeto', 'calidad', 'mejor', 'orgullo'
  ];

  const negativeKeywords = [
    'malo', 'pésimo', 'terrible', 'horrible', 'desastre', 'fracaso',
    'triste', 'enojo', 'odio', 'corrupto', 'ladrón', 'mentiroso',
    'problema', 'crisis', 'escándalo', 'crítica', 'denuncia', 'peor',
    'incompetente', 'vergüenza', 'decepción', 'indignante'
  ];

  const lowerText = text.toLowerCase();

  let positiveCount = 0;
  let negativeCount = 0;

  positiveKeywords.forEach(keyword => {
    const matches = lowerText.split(keyword).length - 1;
    positiveCount += matches;
  });

  negativeKeywords.forEach(keyword => {
    const matches = lowerText.split(keyword).length - 1;
    negativeCount += matches;
  });

  const totalMatches = positiveCount + negativeCount;

  if (totalMatches === 0) {
    return {
      sentiment: 'neutral',
      score: 0,
      explanation: 'No se detectaron palabras clave de sentimiento'
    };
  }

  const score = (positiveCount - negativeCount) / totalMatches;

  let sentiment: 'positive' | 'negative' | 'neutral';
  if (score > 0.2) {
    sentiment = 'positive';
  } else if (score < -0.2) {
    sentiment = 'negative';
  } else {
    sentiment = 'neutral';
  }

  return {
    sentiment,
    score: Math.max(-1, Math.min(1, score)), // Normalizar a -1 a +1
    explanation: `Análisis basado en keywords: ${positiveCount} positivas, ${negativeCount} negativas`
  };
}

// Verificar rate limit
function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const limit = rateLimiter.get(identifier);

  if (!limit || now > limit.resetAt) {
    rateLimiter.set(identifier, { count: 1, resetAt: now + 60000 }); // 1 minuto
    return true;
  }

  if (limit.count >= 60) {
    return false; // Excedió el límite
  }

  limit.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content, mentionId } = body;

    // Validación
    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { success: false, error: 'El campo "content" es requerido y debe ser texto' },
        { status: 400 }
      );
    }

    if (content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'El contenido no puede estar vacío' },
        { status: 400 }
      );
    }

    // Rate limiting (por IP o identificador)
    const identifier = req.headers.get('x-forwarded-for') || 'default';
    if (!checkRateLimit(identifier)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Límite de solicitudes excedido. Intenta en 1 minuto.'
        },
        { status: 429 }
      );
    }

    console.log('🤖 Iniciando análisis de sentimiento para:', content.substring(0, 100) + '...');

    let sentimentResult;
    let usedFallback = false;

    // Intentar con Gemini AI primero
    try {
      sentimentResult = await aiService.analyzeSentiment(content);
      console.log('✅ Análisis completado con Gemini AI:', sentimentResult);
    } catch (error) {
      console.warn('⚠️ Gemini AI falló, usando análisis de keywords como fallback:', error);
      sentimentResult = keywordBasedSentiment(content);
      usedFallback = true;
    }

    // Normalizar score a -1 a +1 para consistencia
    let normalizedScore = sentimentResult.score;
    if (normalizedScore > 1) normalizedScore = normalizedScore / 100; // Si viene como 0-100
    if (normalizedScore > 1) normalizedScore = 1;
    if (normalizedScore < -1) normalizedScore = -1;

    // Si se proporcionó mentionId, actualizar en Supabase
    let updated = false;
    if (mentionId && supabaseUrl && supabaseServiceKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Verificar que la mención existe
        const { data: mention, error: fetchError } = await supabase
          .from('mentions')
          .select('id, metadata')
          .eq('id', mentionId)
          .single();

        if (fetchError) {
          console.error('❌ Error al buscar mención:', fetchError);
        } else if (mention) {
          // Actualizar metadata con análisis de sentimiento
          const updatedMetadata = {
            ...(mention.metadata || {}),
            sentiment: sentimentResult.sentiment,
            sentiment_score: normalizedScore,
            sentiment_explanation: sentimentResult.explanation,
            sentiment_analyzed_at: new Date().toISOString(),
            sentiment_method: usedFallback ? 'keywords' : 'gemini_ai'
          };

          const { error: updateError } = await supabase
            .from('mentions')
            .update({ metadata: updatedMetadata })
            .eq('id', mentionId);

          if (updateError) {
            console.error('❌ Error al actualizar mención:', updateError);
          } else {
            updated = true;
            console.log('✅ Mención actualizada en Supabase:', mentionId);

            // Opcionalmente, crear registro en sentiment_analysis
            try {
              await supabase.from('sentiment_analysis').insert({
                mention_id: mentionId,
                user_id: mention.metadata?.user_id || null,
                sentiment_score: normalizedScore * 100, // -100 a +100 para esta tabla
                confidence: usedFallback ? 60 : 85,
                analyzed_at: new Date().toISOString(),
                analysis_metadata: {
                  method: usedFallback ? 'keywords' : 'gemini_ai',
                  sentiment: sentimentResult.sentiment,
                  explanation: sentimentResult.explanation
                }
              });
              console.log('✅ Registro creado en sentiment_analysis');
            } catch (insertError) {
              console.warn('⚠️ No se pudo crear registro en sentiment_analysis:', insertError);
            }
          }
        }
      } catch (supabaseError) {
        console.error('❌ Error de Supabase:', supabaseError);
      }
    }

    // Respuesta exitosa
    return NextResponse.json({
      success: true,
      data: {
        sentiment: sentimentResult.sentiment,
        score: normalizedScore,
        explanation: sentimentResult.explanation,
        updated,
        method: usedFallback ? 'keywords' : 'gemini_ai'
      }
    });

  } catch (error: any) {
    console.error('❌ Error en análisis de sentimiento:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor al analizar sentimiento',
        details: error?.message || 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
