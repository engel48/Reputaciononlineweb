/**
 * GET /api/news-monitoring/user-sites
 * Obtiene los sitios que el usuario tiene configurados para monitorear
 */

import { NextRequest, NextResponse } from 'next/server';
import * as jwt from 'jsonwebtoken';
import { supabase } from '@/lib/supabase-server';
import { getSiteById } from '@/lib/news-monitoring/sites-config';

import { getJwtSecret } from '@/lib/jwt-secret';

export async function GET(request: NextRequest) {
  try {
    // Obtener token de autenticación desde cookie
    const authToken = request.cookies.get('auth-token')?.value;

    if (!authToken) {
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

    // Verificar token JWT
    let userId: string;
    try {
      const decoded = jwt.verify(authToken, getJwtSecret()) as { userId: string; email: string };
      userId = decoded.userId;
    } catch (error) {
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
      .eq('user_id', userId)
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
