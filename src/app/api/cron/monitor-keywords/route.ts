/**
 * Cron Job para monitoreo automatico de keywords
 * Este endpoint debe ser llamado cada hora por un servicio externo (Vercel Cron, Railway, etc.)
 *
 * GET /api/cron/monitor-keywords
 *
 * Funcionalidades:
 * - Busca en scraped_news y news_mentions (multi-media)
 * - Deduce creditos por ciclo de monitoreo (3 cred/hora, 1 cred/dia)
 * - Detecta crisis automaticamente al 50% aumento de menciones
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { CREDIT_COSTS } from '@/lib/credit-costs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const CRON_SECRET = process.env.CRON_SECRET || '';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const authHeader = request.headers.get('authorization');
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      console.log('Cron: Autorizacion fallida o no configurada');
    }

    console.log('Iniciando monitoreo automatico de keywords...');

    // 1. Obtener keywords activas que necesitan actualizacion
    const now = new Date();
    const { data: keywords, error: kwError } = await supabase
      .from('monitored_keywords')
      .select('id, keyword, user_id, check_frequency_minutes, last_checked_at, total_mentions')
      .eq('is_active', true);

    if (kwError) throw kwError;

    if (!keywords || keywords.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay keywords activas',
        processed: 0,
      });
    }

    // Filtrar keywords que necesitan actualizacion
    const keywordsToUpdate = keywords.filter(kw => {
      if (!kw.last_checked_at) return true;
      const lastCheck = new Date(kw.last_checked_at);
      const minutesSinceLastCheck = (now.getTime() - lastCheck.getTime()) / (1000 * 60);
      return minutesSinceLastCheck >= (kw.check_frequency_minutes || 60);
    });

    console.log(`${keywordsToUpdate.length} keywords necesitan actualizacion de ${keywords.length} totales`);

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const results = [];
    let totalNewMentions = 0;
    const crisisAlerts: any[] = [];

    for (const kw of keywordsToUpdate) {
      try {
        // Deducir creditos por ciclo de monitoreo
        const isHourly = (kw.check_frequency_minutes || 60) <= 60;
        const creditCost = isHourly ? CREDIT_COSTS.monitoring_hourly : CREDIT_COSTS.monitoring_daily;

        const { data: creditResult, error: creditError } = await supabase.rpc('deduct_user_credits', {
          p_user_id: kw.user_id,
          p_amount: creditCost,
          p_description: `Monitoreo ${isHourly ? 'horario' : 'diario'}: "${kw.keyword}"`,
          p_related_entity: isHourly ? 'monitoring_hourly' : 'monitoring_daily',
        });

        if (creditError) {
          console.log(`  Creditos insuficientes para "${kw.keyword}" (usuario ${kw.user_id}), saltando`);
          continue;
        }

        const words = kw.keyword.trim().toLowerCase().split(/\s+/).filter((w: string) => w.length >= 2);

        // === BUSQUEDA MULTI-MEDIA ===

        // 1. Buscar en scraped_news
        let newsMatches: any[] = [];
        if (words.length === 1) {
          const result = await supabase
            .from('scraped_news')
            .select('*')
            .or(`title.ilike.%${words[0]}%,content.ilike.%${words[0]}%`)
            .gte('published_at', oneMonthAgo.toISOString())
            .order('published_at', { ascending: false })
            .limit(100);
          newsMatches = result.data || [];
        } else {
          const result = await supabase
            .from('scraped_news')
            .select('*')
            .or(`title.ilike.%${words[0]}%,content.ilike.%${words[0]}%`)
            .gte('published_at', oneMonthAgo.toISOString())
            .order('published_at', { ascending: false })
            .limit(200);

          if (!result.error) {
            newsMatches = (result.data || []).filter((news: any) => {
              const fullText = `${(news.title || '').toLowerCase()} ${(news.content || '').toLowerCase()}`;
              return words.every((word: string) => fullText.includes(word));
            }).slice(0, 100);
          }
        }

        // 2. Buscar en news_mentions (menciones de noticias de usuarios)
        let newsMentionMatches: any[] = [];
        try {
          const nmResult = await supabase
            .from('news_mentions')
            .select('*')
            .eq('user_id', kw.user_id)
            .or(`article_title.ilike.%${words[0]}%,article_content.ilike.%${words[0]}%`)
            .gte('created_at', oneMonthAgo.toISOString())
            .limit(50);
          newsMentionMatches = nmResult.data || [];
        } catch {
          // Tabla puede no existir o tener estructura diferente
        }

        // Guardar menciones nuevas de scraped_news
        let savedCount = 0;
        for (const news of newsMatches) {
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
              source_type: 'news',
            })
            .single();

          if (!insertError) savedCount++;
        }

        // Guardar menciones de news_mentions
        for (const nm of newsMentionMatches) {
          const { error: insertError } = await supabase
            .from('keyword_mentions')
            .insert({
              keyword_id: kw.id,
              article_title: nm.article_title || nm.title,
              article_url: nm.article_url || nm.url,
              article_content: (nm.article_content || nm.content || '').substring(0, 500),
              source: nm.source || 'news_mention',
              published_at: nm.published_at || nm.created_at,
              sentiment: nm.sentiment || 'neutral',
              sentiment_score: nm.sentiment_score || 0,
              source_type: 'social',
            })
            .single();

          if (!insertError) savedCount++;
        }

        // Actualizar contador de menciones
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

        // === DETECCION DE CRISIS AL 50% ===
        const previousTotal = kw.total_mentions || 0;
        const currentTotal = totalMentions || 0;

        if (previousTotal > 0 && savedCount > 0) {
          // Comparar menciones nuevas vs el promedio esperado
          const expectedNewPerCycle = previousTotal / Math.max(1, 30); // promedio diario historico
          const increaseRatio = savedCount / Math.max(1, expectedNewPerCycle);

          if (increaseRatio >= 1.5) { // 50% o mas aumento
            const increasePercent = Math.round((increaseRatio - 1) * 100);
            const severity = increasePercent >= 200 ? 'critical'
              : increasePercent >= 100 ? 'high'
              : 'medium';

            const alertData = {
              user_id: kw.user_id,
              type: 'negative_spike',
              severity,
              description: `Menciones de "${kw.keyword}" aumentaron ${increasePercent}% (${savedCount} nuevas vs promedio esperado de ${Math.round(expectedNewPerCycle)})`,
              trigger_data: {
                keyword: kw.keyword,
                keyword_id: kw.id,
                new_mentions: savedCount,
                expected: Math.round(expectedNewPerCycle),
                increase_percent: increasePercent,
                period_minutes: kw.check_frequency_minutes,
              },
              status: 'active',
            };

            const { error: alertError } = await supabase
              .from('crisis_alerts')
              .insert(alertData);

            if (!alertError) {
              crisisAlerts.push(alertData);
              console.log(`  ALERTA DE CRISIS: "${kw.keyword}" +${increasePercent}% (${severity})`);
            }
          }
        }

        results.push({
          keyword: kw.keyword,
          user_id: kw.user_id,
          found: newsMatches.length + newsMentionMatches.length,
          saved: savedCount,
          total: totalMentions || 0,
          creditCost,
        });

        console.log(`  "${kw.keyword}": ${newsMatches.length + newsMentionMatches.length} encontradas, ${savedCount} nuevas, ${creditCost} cred`);

      } catch (error: any) {
        console.error(`  Error procesando "${kw.keyword}":`, error.message);
      }
    }

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: `Monitoreo completado: ${totalNewMentions} nuevas menciones`,
      stats: {
        keywordsTotal: keywords.length,
        keywordsProcessed: keywordsToUpdate.length,
        newMentions: totalNewMentions,
        crisisAlerts: crisisAlerts.length,
        duration: `${duration}ms`,
      },
      results,
      crisisAlerts,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Error en cron de monitoreo:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      duration: `${Date.now() - startTime}ms`,
    }, { status: 500 });
  }
}
