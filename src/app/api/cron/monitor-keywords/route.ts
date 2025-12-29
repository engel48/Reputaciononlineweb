/**
 * Cron Job para monitoreo automatico de keywords
 * Este endpoint debe ser llamado cada hora por un servicio externo (Vercel Cron, Railway, etc.)
 *
 * GET /api/cron/monitor-keywords
 *
 * Para configurar en Vercel, agregar a vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/monitor-keywords",
 *     "schedule": "0 * * * *"
 *   }]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Verificar si es una llamada autorizada (opcional - para seguridad)
const CRON_SECRET = process.env.CRON_SECRET || '';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verificar autorizacion (opcional)
    const authHeader = request.headers.get('authorization');
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      console.log('⚠️ Cron: Autorizacion fallida o no configurada');
      // Continuar de todos modos si no hay CRON_SECRET configurado
    }

    console.log('🕐 Iniciando monitoreo automatico de keywords...');

    // 1. Obtener todas las keywords activas que necesitan actualizacion
    const now = new Date();
    const { data: keywords, error: kwError } = await supabase
      .from('monitored_keywords')
      .select('id, keyword, user_id, check_frequency_minutes, last_checked_at')
      .eq('is_active', true);

    if (kwError) throw kwError;

    if (!keywords || keywords.length === 0) {
      console.log('📭 No hay keywords activas para monitorear');
      return NextResponse.json({
        success: true,
        message: 'No hay keywords activas',
        processed: 0,
      });
    }

    // Filtrar keywords que necesitan actualizacion
    const keywordsToUpdate = keywords.filter(kw => {
      if (!kw.last_checked_at) return true; // Nunca se ha chequeado

      const lastCheck = new Date(kw.last_checked_at);
      const minutesSinceLastCheck = (now.getTime() - lastCheck.getTime()) / (1000 * 60);

      return minutesSinceLastCheck >= (kw.check_frequency_minutes || 60);
    });

    console.log(`📋 ${keywordsToUpdate.length} keywords necesitan actualizacion de ${keywords.length} totales`);

    // Calcular fecha limite (1 mes atras)
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const results = [];
    let totalNewMentions = 0;

    for (const kw of keywordsToUpdate) {
      console.log(`  🔍 Procesando: "${kw.keyword}"...`);

      try {
        // Buscar noticias que coincidan con la keyword
        const { data: newsMatches, error: newsError } = await supabase
          .from('scraped_news')
          .select('*')
          .or(`title.ilike.%${kw.keyword}%,content.ilike.%${kw.keyword}%`)
          .gte('published_at', oneMonthAgo.toISOString())
          .order('published_at', { ascending: false })
          .limit(100);

        if (newsError) {
          console.error(`  ❌ Error buscando noticias para "${kw.keyword}":`, newsError);
          continue;
        }

        let savedCount = 0;

        // Guardar menciones nuevas
        for (const news of newsMatches || []) {
          const { error: insertError } = await supabase
            .from('keyword_mentions')
            .insert({
              keyword_id: kw.id,
              news_id: news.id,
              article_title: news.title,
              article_url: news.article_url,
              article_content: news.content?.substring(0, 500),
              source: news.source,
              published_at: news.published_at,
              sentiment: news.sentiment || 'neutral',
              sentiment_score: news.sentiment_score || 0,
            })
            .single();

          if (!insertError) {
            savedCount++;
          }
          // Ignorar duplicados silenciosamente
        }

        // Actualizar contador de menciones y last_checked
        const { count: totalMentions } = await supabase
          .from('keyword_mentions')
          .select('*', { count: 'exact', head: true })
          .eq('keyword_id', kw.id);

        await supabase
          .from('monitored_keywords')
          .update({
            last_checked_at: new Date().toISOString(),
            total_mentions: totalMentions || 0,
            updated_at: new Date().toISOString(),
          })
          .eq('id', kw.id);

        totalNewMentions += savedCount;

        results.push({
          keyword: kw.keyword,
          user_id: kw.user_id,
          found: newsMatches?.length || 0,
          saved: savedCount,
          total: totalMentions || 0,
        });

        console.log(`  ✅ "${kw.keyword}": ${newsMatches?.length || 0} encontradas, ${savedCount} nuevas`);

      } catch (error: any) {
        console.error(`  ❌ Error procesando "${kw.keyword}":`, error.message);
      }
    }

    const duration = Date.now() - startTime;

    console.log(`\n📊 Monitoreo completado en ${duration}ms`);
    console.log(`   Keywords procesadas: ${keywordsToUpdate.length}`);
    console.log(`   Nuevas menciones: ${totalNewMentions}`);

    return NextResponse.json({
      success: true,
      message: `Monitoreo completado: ${totalNewMentions} nuevas menciones`,
      stats: {
        keywordsTotal: keywords.length,
        keywordsProcessed: keywordsToUpdate.length,
        newMentions: totalNewMentions,
        duration: `${duration}ms`,
      },
      results,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('❌ Error en cron de monitoreo:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      duration: `${Date.now() - startTime}ms`,
    }, { status: 500 });
  }
}
