/**
 * Cron Job - Resumen semanal de reputacion
 * Envia email C1 (sendWeeklyDigestEmail) a todos los usuarios activos
 *
 * GET /api/cron/weekly-digest
 * Se recomienda ejecutar cada viernes a las 9am COT
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendWeeklyDigestEmail } from '@/lib/email-service';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const CRON_SECRET = process.env.CRON_SECRET || '';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Auth check
    const authHeader = request.headers.get('authorization');
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    console.log('CRON WEEKLY-DIGEST: Iniciando envio de resumenes semanales...');

    // Get all active users with email
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name, plan')
      .not('email', 'is', null)
      .neq('plan', 'free');

    if (usersError || !users) {
      console.error('CRON WEEKLY-DIGEST: Error obteniendo usuarios:', usersError);
      return NextResponse.json({ error: 'Error obteniendo usuarios' }, { status: 500 });
    }

    console.log(`CRON WEEKLY-DIGEST: ${users.length} usuarios a procesar`);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const results: Array<{ email: string; sent: boolean; error?: string }> = [];

    for (const user of users) {
      try {
        // Get mentions from last 7 days
        const { data: mentions } = await supabase
          .from('mentions')
          .select('content, platform, metadata, published_at')
          .eq('user_id', user.id)
          .gte('published_at', sevenDaysAgo)
          .order('published_at', { ascending: false })
          .limit(50);

        // Get news mentions from last 7 days
        const { data: newsMentions } = await supabase
          .from('news_mentions')
          .select('article_title, sentiment')
          .eq('user_id', user.id)
          .gte('discovered_at', sevenDaysAgo);

        // Get user stats
        const { data: stats } = await supabase
          .from('user_stats')
          .select('sentiment_score')
          .eq('user_id', user.id)
          .single();

        // Get social media platforms
        const { data: platforms } = await supabase
          .from('social_media')
          .select('platform, followers')
          .eq('user_id', user.id)
          .eq('connected', true);

        // El sentimiento de las menciones sociales vive en metadata.sentiment.
        const sentOf = (m: any): string => {
          const s = m?.metadata?.sentiment;
          return s === 'positive' || s === 'negative' || s === 'neutral' ? s : 'neutral';
        };
        const allMentions = mentions || [];
        const positive = allMentions.filter(m => sentOf(m) === 'positive').length;
        const negative = allMentions.filter(m => sentOf(m) === 'negative').length;

        // Build period string
        const endDate = new Date();
        const startDate = new Date(sevenDaysAgo);
        const period = `${startDate.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })} - ${endDate.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}`;

        const sent = await sendWeeklyDigestEmail(user.email, user.name || 'Usuario', {
          period,
          sentimentScore: stats?.sentiment_score || 0,
          totalMentions: allMentions.length,
          positiveMentions: positive,
          negativeMentions: negative,
          topMentions: allMentions.slice(0, 5).map(m => ({
            content: m.content || '',
            source: m.platform || 'desconocido',
            sentiment: sentOf(m),
          })),
          platforms: (platforms || []).map(p => ({
            name: p.platform,
            followers: p.followers || 0,
            change: 0,
          })),
          newsCount: (newsMentions || []).length,
        });

        results.push({ email: user.email, sent });

        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 1000));
      } catch (userError: any) {
        results.push({ email: user.email, sent: false, error: userError.message });
      }
    }

    const sent = results.filter(r => r.sent).length;
    const failed = results.filter(r => !r.sent).length;
    const duration = Date.now() - startTime;

    console.log(`CRON WEEKLY-DIGEST: Completado - ${sent} enviados, ${failed} fallidos en ${duration}ms`);

    return NextResponse.json({
      success: true,
      message: `Weekly digest enviado a ${sent}/${users.length} usuarios`,
      stats: { sent, failed, duration },
    });
  } catch (error: any) {
    console.error('CRON WEEKLY-DIGEST: Error general:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
