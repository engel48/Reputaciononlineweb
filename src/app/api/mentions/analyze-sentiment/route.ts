/**
 * API Endpoint: Análisis de Sentimiento en Tiempo Real
 *
 * Analiza el sentimiento de menciones SOLO con Groq (IA real). Si Groq no está
 * disponible, NO se simula con keywords: se responde 503 y la mención queda
 * pendiente para reanalizar (vía /api/mentions/analyze-batch).
 *
 * @route POST /api/mentions/analyze-sentiment
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { aiService } from '@/lib/ai-service';

// Supabase client (server-side con service_role para bypass RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Rate limiting simple en memoria (60 requests/min para Groq)
const rateLimiter = new Map<string, { count: number; resetAt: number }>();

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

    console.log('🤖 Iniciando análisis de sentimiento (Groq) para:', content.substring(0, 100) + '...');

    // SOLO Groq. Si falla, NO se simula: queda pendiente (503).
    let sentimentResult;
    try {
      sentimentResult = await aiService.analyzeSentiment(content);
    } catch (error: any) {
      console.warn('⚠️ Groq no disponible; la mención queda pendiente:', error?.message);
      return NextResponse.json(
        {
          success: false,
          pending: true,
          error: 'Groq no disponible en este momento. La mención quedará pendiente y se reanalizará.',
        },
        { status: 503 }
      );
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
            sentiment_method: 'groq'
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
                confidence: 85,
                analyzed_at: new Date().toISOString(),
                analysis_metadata: {
                  method: 'groq',
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
        method: 'groq'
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
