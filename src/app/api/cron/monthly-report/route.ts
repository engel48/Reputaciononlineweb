/**
 * Cron Job - Reporte mensual detallado
 * Envia email C2 (sendMonthlyReportEmail) a todos los usuarios activos
 *
 * GET /api/cron/monthly-report
 * Se recomienda ejecutar el 1ro de cada mes a las 9am COT
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendMonthlyReportEmail } from '@/lib/email-service';

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

    console.log('CRON MONTHLY-REPORT: Iniciando envio de reportes mensuales...');

    // Get all active users with email (non-free plans)
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name, plan, credits')
      .not('email', 'is', null)
      .neq('plan', 'free');

    if (usersError || !users) {
      console.error('CRON MONTHLY-REPORT: Error obteniendo usuarios:', usersError);
      return NextResponse.json({ error: 'Error obteniendo usuarios' }, { status: 500 });
    }

    console.log(`CRON MONTHLY-REPORT: ${users.length} usuarios a procesar`);

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

    const monthName = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      .toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });

    const results: Array<{ email: string; sent: boolean; error?: string }> = [];

    for (const user of users) {
      try {
        // Current month mentions
        const { data: currentMentions } = await supabase
          .from('mentions')
          .select('sentiment, reach, engagement')
          .eq('user_id', user.id)
          .gte('created_at', thisMonthStart);

        // Previous month mentions
        const { data: prevMentions } = await supabase
          .from('mentions')
          .select('sentiment, reach, engagement')
          .eq('user_id', user.id)
          .gte('created_at', lastMonthStart)
          .lte('created_at', lastMonthEnd);

        // News mentions count
        const { data: newsCount } = await supabase
          .from('news_mentions')
          .select('id')
          .eq('user_id', user.id)
          .gte('discovered_at', lastMonthStart)
          .lte('discovered_at', lastMonthEnd);

        // Get stats
        const { data: stats } = await supabase
          .from('user_stats')
          .select('sentiment_score, engagement_rate, reach_estimate')
          .eq('user_id', user.id)
          .single();

        // Get top platform
        const { data: platforms } = await supabase
          .from('social_media')
          .select('platform, followers')
          .eq('user_id', user.id)
          .eq('connected', true)
          .order('followers', { ascending: false })
          .limit(1);

        const curr = currentMentions || [];
        const prev = prevMentions || [];

        const calcSentiment = (mentions: any[]) => {
          const pos = mentions.filter(m => m.sentiment === 'positive').length;
          const total = mentions.length || 1;
          return Math.round((pos / total) * 100);
        };

        const calcReach = (mentions: any[]) => mentions.reduce((sum, m) => sum + (m.reach || 0), 0);
        const calcEngagement = (mentions: any[]) => {
          const total = mentions.reduce((sum, m) => sum + (m.engagement || 0), 0);
          return mentions.length > 0 ? Math.round((total / mentions.length) * 100) / 100 : 0;
        };

        const sent = await sendMonthlyReportEmail(user.email, user.name || 'Usuario', {
          month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
          currentMonth: {
            mentions: curr.length,
            sentiment: stats?.sentiment_score || calcSentiment(curr),
            reach: stats?.reach_estimate || calcReach(curr),
            engagement: stats?.engagement_rate || calcEngagement(curr),
          },
          previousMonth: {
            mentions: prev.length,
            sentiment: calcSentiment(prev),
            reach: calcReach(prev),
            engagement: calcEngagement(prev),
          },
          topPlatform: platforms?.[0]?.platform || 'N/A',
          topPlatformGrowth: 0,
          newsArticles: (newsCount || []).length,
          creditsUsed: 0,
          creditsRemaining: user.credits || 0,
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

    console.log(`CRON MONTHLY-REPORT: Completado - ${sent} enviados, ${failed} fallidos en ${duration}ms`);

    return NextResponse.json({
      success: true,
      message: `Monthly report enviado a ${sent}/${users.length} usuarios`,
      stats: { sent, failed, duration },
    });
  } catch (error: any) {
    console.error('CRON MONTHLY-REPORT: Error general:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
