/**
 * GET /api/news-monitoring/mentions
 * Obtiene las menciones encontradas para el usuario
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSiteById } from '@/lib/news-monitoring/sites-config';

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

    // Parsear query params
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');
    const sentiment = searchParams.get('sentiment');
    const isRead = searchParams.get('isRead');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Construir query
    let query = supabase
      .from('news_mentions')
      .select(`
        id,
        monitored_site_id,
        article_url,
        article_title,
        article_author,
        mention_context,
        sentiment,
        sentiment_score,
        matched_terms,
        published_date,
        discovered_at,
        is_read,
        is_starred
      `)
      .eq('user_id', user.id);

    // Aplicar filtros
    if (siteId) {
      query = query.eq('monitored_site_id', siteId);
    }

    if (sentiment && ['positive', 'negative', 'neutral'].includes(sentiment)) {
      query = query.eq('sentiment', sentiment);
    }

    if (isRead !== null) {
      query = query.eq('is_read', isRead === 'true');
    }

    // Ordenar y paginar
    query = query
      .order('discovered_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: mentions, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Database error: ${fetchError.message}`);
    }

    // Obtener información de sitios monitoreados
    const { data: monitoredSites } = await supabase
      .from('monitored_news_sites')
      .select('id, site_id')
      .eq('user_id', user.id);

    const siteMap = new Map(monitoredSites?.map(s => [s.id, s.site_id]) || []);

    // Enriquecer menciones con información del sitio
    const enrichedMentions = (mentions || []).map(mention => {
      const siteConfigId = siteMap.get(mention.monitored_site_id);
      const siteConfig = siteConfigId ? getSiteById(siteConfigId) : null;

      return {
        ...mention,
        site: {
          id: mention.monitored_site_id,
          name: siteConfig?.name || 'Unknown',
          url: siteConfig?.url || '',
          logoUrl: siteConfig?.logoUrl,
          category: siteConfig?.category,
        },
      };
    });

    // Obtener estadísticas
    const { data: stats } = await supabase
      .from('news_mentions')
      .select('sentiment, is_read')
      .eq('user_id', user.id);

    const statistics = {
      total: stats?.length || 0,
      unread: stats?.filter(s => !s.is_read).length || 0,
      positive: stats?.filter(s => s.sentiment === 'positive').length || 0,
      negative: stats?.filter(s => s.sentiment === 'negative').length || 0,
      neutral: stats?.filter(s => s.sentiment === 'neutral').length || 0,
    };

    return NextResponse.json(
      {
        success: true,
        data: {
          mentions: enrichedMentions,
          pagination: {
            limit,
            offset,
            count: enrichedMentions.length,
            hasMore: enrichedMentions.length === limit,
          },
          statistics,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('[NEWS-MONITORING] Error fetching mentions:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_MENTIONS_ERROR',
          message: 'Error al obtener menciones',
          details: error.message,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/news-monitoring/mentions
 * Actualiza el estado de una mención (marcar como leída, estrellada, etc.)
 */
export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const { mentionId, isRead, isStarred } = body;

    if (!mentionId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'mentionId es requerido',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Actualizar mención
    const updateData: any = {};
    if (typeof isRead === 'boolean') updateData.is_read = isRead;
    if (typeof isStarred === 'boolean') updateData.is_starred = isStarred;

    const { data, error: updateError } = await supabase
      .from('news_mentions')
      .update(updateData)
      .eq('id', mentionId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Update error: ${updateError.message}`);
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          mention: data,
        },
        message: 'Mención actualizada exitosamente',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('[NEWS-MONITORING] Error updating mention:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UPDATE_MENTION_ERROR',
          message: 'Error al actualizar mención',
          details: error.message,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
