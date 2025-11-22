/**
 * GET /api/news-monitoring/stats
 * Obtiene estadísticas del sistema de monitoreo para el usuario
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  try {
    // Obtener token de autenticación
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'No autorizado. Token de autenticación requerido.',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // Verificar usuario autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Token inválido o expirado',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    // Usar la función de PostgreSQL para obtener estadísticas
    const { data: stats, error: statsError } = await supabase
      .rpc('get_user_monitoring_stats', { p_user_id: user.id });

    if (statsError) {
      throw new Error(`Stats error: ${statsError.message}`);
    }

    // Obtener menciones recientes (últimas 24 horas)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { data: recentMentions } = await supabase
      .from('news_mentions')
      .select('id, sentiment, discovered_at')
      .eq('user_id', user.id)
      .gte('discovered_at', yesterday.toISOString());

    // Obtener jobs recientes
    const { data: recentJobs } = await supabase
      .from('scraping_jobs')
      .select('id, status, created_at, completed_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Calcular métricas adicionales
    const last24hMentions = recentMentions || [];
    const mentionsByHour = Array(24).fill(0);

    last24hMentions.forEach(mention => {
      const hourAgo = Math.floor(
        (Date.now() - new Date(mention.discovered_at).getTime()) / (1000 * 60 * 60)
      );
      if (hourAgo >= 0 && hourAgo < 24) {
        mentionsByHour[23 - hourAgo]++;
      }
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          overview: stats || {
            active_sites: 0,
            total_mentions: 0,
            unread_mentions: 0,
            negative_mentions: 0,
            positive_mentions: 0,
            last_mention_date: null,
          },
          last24Hours: {
            total: last24hMentions.length,
            positive: last24hMentions.filter(m => m.sentiment === 'positive').length,
            negative: last24hMentions.filter(m => m.sentiment === 'negative').length,
            neutral: last24hMentions.filter(m => m.sentiment === 'neutral').length,
            byHour: mentionsByHour,
          },
          recentJobs: (recentJobs || []).map(job => ({
            id: job.id,
            status: job.status,
            createdAt: job.created_at,
            completedAt: job.completed_at,
            duration: job.completed_at
              ? new Date(job.completed_at).getTime() - new Date(job.created_at).getTime()
              : null,
          })),
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('[NEWS-MONITORING] Error fetching stats:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'STATS_ERROR',
          message: 'Error al obtener estadísticas',
          details: error.message,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
