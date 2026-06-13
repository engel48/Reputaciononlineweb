/**
 * API Endpoint: Análisis de Sentimiento en Lote
 *
 * Analiza múltiples menciones en batch con rate limiting y manejo de errores
 * Actualiza todas las menciones en Supabase con sus análisis de sentimiento
 *
 * @route POST /api/mentions/analyze-batch
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { aiService } from '@/lib/ai-service';

// Supabase client (server-side con service_role para bypass RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Límites de procesamiento en batch
const MAX_BATCH_SIZE = 50; // Máximo 50 menciones por request
const RATE_LIMIT_DELAY = 1000; // 1 segundo entre requests a Groq (60/min)

// Función para esperar (rate limiting)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Analizar una mención individual con reintentos
async function analyzeMention(
  mentionId: string,
  content: string,
  retries = 2
): Promise<{
  mentionId: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  success: boolean;
  error?: string;
}> {
  try {
    // SOLO Groq (con reintentos). Si agota reintentos, queda PENDIENTE
    // (success:false → no se escribe en DB, se reanaliza luego). Sin keywords.
    const sentimentResult = await aiService.analyzeSentiment(content);

    // Normalizar score
    let normalizedScore = sentimentResult.score;
    if (normalizedScore > 1) normalizedScore = normalizedScore / 100;
    if (normalizedScore > 1) normalizedScore = 1;
    if (normalizedScore < -1) normalizedScore = -1;

    return {
      mentionId,
      sentiment: sentimentResult.sentiment,
      score: normalizedScore,
      success: true
    };

  } catch (error: any) {
    if (retries > 0) {
      console.warn(`⚠️ Reintentando análisis Groq para ${mentionId}... (${retries} restantes)`);
      await delay(2000);
      return analyzeMention(mentionId, content, retries - 1);
    }
    // Groq no disponible: queda pendiente (no se simula).
    return {
      mentionId,
      sentiment: 'neutral',
      score: 0,
      success: false,
      error: error?.message || 'Groq no disponible'
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mentionIds } = body;

    // Validación
    if (!mentionIds || !Array.isArray(mentionIds)) {
      return NextResponse.json(
        { success: false, error: 'El campo "mentionIds" debe ser un array' },
        { status: 400 }
      );
    }

    if (mentionIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'El array de mentionIds está vacío' },
        { status: 400 }
      );
    }

    if (mentionIds.length > MAX_BATCH_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `Máximo ${MAX_BATCH_SIZE} menciones por batch. Recibido: ${mentionIds.length}`
        },
        { status: 400 }
      );
    }

    console.log(`🤖 Iniciando análisis batch de ${mentionIds.length} menciones`);

    // Verificar Supabase configurado
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { success: false, error: 'Supabase no está configurado correctamente' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Obtener menciones de Supabase
    const { data: mentions, error: fetchError } = await supabase
      .from('mentions')
      .select('id, content, metadata, user_id')
      .in('id', mentionIds);

    if (fetchError) {
      console.error('❌ Error al obtener menciones:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Error al obtener menciones de la base de datos' },
        { status: 500 }
      );
    }

    if (!mentions || mentions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No se encontraron menciones con los IDs proporcionados' },
        { status: 404 }
      );
    }

    console.log(`✅ Encontradas ${mentions.length} menciones para analizar`);

    // Procesar cada mención con rate limiting
    const results = [];
    let analyzed = 0;
    let failed = 0;

    for (let i = 0; i < mentions.length; i++) {
      const mention = mentions[i];

      // Validar que tenga contenido
      if (!mention.content || mention.content.trim().length === 0) {
        failed++;
        results.push({
          mentionId: mention.id,
          sentiment: 'neutral',
          score: 0,
          error: 'Contenido vacío'
        });
        continue;
      }

      // Analizar sentimiento
      const analysisResult = await analyzeMention(mention.id, mention.content);

      if (analysisResult.success) {
        // Actualizar metadata en Supabase
        try {
          const updatedMetadata = {
            ...(mention.metadata || {}),
            sentiment: analysisResult.sentiment,
            sentiment_score: analysisResult.score,
            sentiment_analyzed_at: new Date().toISOString(),
            sentiment_method: 'batch_analysis'
          };

          const { error: updateError } = await supabase
            .from('mentions')
            .update({ metadata: updatedMetadata })
            .eq('id', mention.id);

          if (updateError) {
            console.error(`❌ Error actualizando ${mention.id}:`, updateError);
            failed++;
          } else {
            analyzed++;

            // Crear registro en sentiment_analysis
            try {
              await supabase.from('sentiment_analysis').insert({
                mention_id: mention.id,
                user_id: mention.user_id,
                sentiment_score: analysisResult.score * 100,
                confidence: 80,
                analyzed_at: new Date().toISOString(),
                analysis_metadata: {
                  method: 'batch_groq',
                  sentiment: analysisResult.sentiment,
                  batch_processing: true
                }
              });
            } catch (insertError) {
              console.warn('⚠️ No se pudo crear registro en sentiment_analysis:', insertError);
            }
          }
        } catch (supabaseError) {
          console.error(`❌ Error de Supabase para ${mention.id}:`, supabaseError);
          failed++;
        }
      } else {
        failed++;
      }

      results.push({
        mentionId: analysisResult.mentionId,
        sentiment: analysisResult.sentiment,
        score: analysisResult.score,
        ...(analysisResult.error && { error: analysisResult.error })
      });

      // Rate limiting: esperar antes del siguiente request (excepto en el último)
      if (i < mentions.length - 1) {
        await delay(RATE_LIMIT_DELAY);
      }

      // Log de progreso cada 10 menciones
      if ((i + 1) % 10 === 0) {
        console.log(`📊 Progreso: ${i + 1}/${mentions.length} menciones procesadas`);
      }
    }

    console.log(`✅ Análisis batch completado: ${analyzed} exitosos, ${failed} fallidos`);

    // Respuesta exitosa
    return NextResponse.json({
      success: true,
      data: {
        analyzed,
        failed,
        total: mentions.length,
        results
      }
    });

  } catch (error: any) {
    console.error('❌ Error en análisis batch:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor en análisis batch',
        details: error?.message || 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
