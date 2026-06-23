/**
 * Cron de reproceso de sentimiento PENDIENTE con Groq real.
 *
 * Política "solo Groq, pendiente si falla": las menciones cuyo análisis Groq falló quedan
 * con sentiment=null. Este endpoint las reanaliza desde el servidor (donde Groq es
 * alcanzable) y se auto-cura: drena el backlog y mantiene futuras pendientes al día.
 *
 *  - news_mentions WHERE sentiment IS NULL           → sentiment + sentiment_score (-1..1)
 *  - mentions      WHERE metadata->>'sentiment' NULL → metadata.{sentiment,sentiment_score(-100..100),sentiment_explanation}
 *
 * GET /api/cron/reprocess-sentiment?limit=50
 * Auth: header `Authorization: Bearer <CRON_SECRET>`.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { aiService } from '@/lib/ai-service';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const CRON_SECRET = process.env.CRON_SECRET || '';

export async function GET(request: NextRequest) {
  const start = Date.now();
  try {
    const authHeader = request.headers.get('authorization');
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    let newsOk = 0, newsPend = 0, menOk = 0, menPend = 0;

    // 1) news_mentions pendientes
    const { data: news } = await supabase
      .from('news_mentions')
      .select('id, article_title, mention_context, full_content')
      .is('sentiment', null)
      .limit(limit);

    for (const m of news || []) {
      const text = m.mention_context || m.full_content || m.article_title || '';
      try {
        const ai = await aiService.analyzeSentiment(text);
        await supabase
          .from('news_mentions')
          .update({ sentiment: ai.sentiment, sentiment_score: Number(ai.score.toFixed(2)) })
          .eq('id', m.id);
        newsOk++;
      } catch {
        newsPend++; // sigue pendiente (no se fabrica valor)
      }
    }

    // 2) mentions pendientes (metadata.sentiment null)
    const { data: mentions } = await supabase
      .from('mentions')
      .select('id, content, metadata')
      .limit(300);
    const pendingMentions = (mentions || [])
      .filter((m: any) => !m.metadata || m.metadata.sentiment == null)
      .slice(0, limit);

    for (const m of pendingMentions) {
      const text = (m as any).content || (m as any).metadata?.video_title || '';
      try {
        const ai = await aiService.analyzeSentiment(text);
        const metadata = {
          ...((m as any).metadata || {}),
          sentiment: ai.sentiment,
          sentiment_score: Math.round(ai.score * 100),
          sentiment_explanation: ai.explanation,
        };
        await supabase.from('mentions').update({ metadata }).eq('id', (m as any).id);
        menOk++;
      } catch {
        menPend++;
      }
    }

    return NextResponse.json({
      success: true,
      news: { reprocessed: newsOk, pending: newsPend },
      mentions: { reprocessed: menOk, pending: menPend },
      duration: `${Date.now() - start}ms`,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('❌ Error en cron reprocess-sentiment:', error);
    return NextResponse.json(
      { success: false, error: error.message, duration: `${Date.now() - start}ms` },
      { status: 500 }
    );
  }
}
