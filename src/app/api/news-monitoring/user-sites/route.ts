/**
 * GET /api/news-monitoring/user-sites
 * Obtiene los sitios que el usuario tiene configurados para monitorear
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

    // Obtener sitios monitoreados del usuario
    const { data: monitoredSites, error: fetchError } = await supabase
      .from('monitored_news_sites')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      throw new Error(`Database error: ${fetchError.message}`);
    }

    // Enriquecer con información del catálogo
    const enrichedSites = (monitoredSites || []).map(site => {
      const siteConfig = getSiteById(site.site_id);
      return {
        id: site.id,
        siteId: site.site_id,
        siteName: siteConfig?.name || 'Unknown',
        siteUrl: siteConfig?.url || '',
        siteLogoUrl: siteConfig?.logoUrl,
        category: siteConfig?.category || 'unknown',
        isActive: site.is_active,
        searchTerms: site.search_terms,
        checkFrequencyMinutes: site.check_frequency_minutes,
        createdAt: site.created_at,
        lastCheckedAt: site.last_checked_at,
        scrapingMethod: siteConfig?.scrapingMethod,
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          sites: enrichedSites,
          count: enrichedSites.length,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('[NEWS-MONITORING] Error fetching user sites:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_USER_SITES_ERROR',
          message: 'Error al obtener sitios del usuario',
          details: error.message,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
