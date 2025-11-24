/**
 * POST /api/news-monitoring/activate-site
 * Activa el monitoreo de un sitio de noticias para el usuario
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSiteById } from '@/lib/news-monitoring/sites-config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface ActivateSiteRequest {
  siteId: string;
  searchTerms: string[];
  checkFrequencyMinutes?: number;
}

export async function POST(request: NextRequest) {
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

    // Validar request body
    const body: ActivateSiteRequest = await request.json();

    if (!body.siteId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'siteId es requerido',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // searchTerms es opcional - si no se proporciona, se monitorea todo el sitio
    const searchTerms = body.searchTerms || [];

    // Validar que el sitio existe en el catálogo
    const siteConfig = getSiteById(body.siteId);
    if (!siteConfig) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SITE_NOT_FOUND',
            message: `Sitio no encontrado: ${body.siteId}`,
          },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    if (!siteConfig.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SITE_INACTIVE',
            message: `El sitio ${siteConfig.name} no está disponible actualmente`,
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Validar límite de términos de búsqueda (max 10)
    if (searchTerms.length > 10) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TOO_MANY_SEARCH_TERMS',
            message: 'Máximo 10 términos de búsqueda permitidos',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Sanitizar términos de búsqueda (si se proporcionan)
    // Si no hay términos, se monitoreará todo el contenido del sitio
    const sanitizedTerms = searchTerms
      .map(term => term.trim().toLowerCase())
      .filter(term => term.length > 0 && term.length <= 100);

    // Verificar límite de sitios monitoreados por usuario (max 10)
    const { data: existingSites, error: countError } = await supabase
      .from('monitored_news_sites')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (countError) {
      throw new Error(`Database error: ${countError.message}`);
    }

    if (existingSites && existingSites.length >= 10) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MAX_SITES_REACHED',
            message: 'Has alcanzado el límite de 10 sitios monitoreados',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Verificar si ya existe este sitio para el usuario
    const { data: existingSite } = await supabase
      .from('monitored_news_sites')
      .select('*')
      .eq('user_id', user.id)
      .eq('site_id', body.siteId)
      .single();

    let result;

    if (existingSite) {
      // Actualizar sitio existente
      const { data: updated, error: updateError } = await supabase
        .from('monitored_news_sites')
        .update({
          is_active: true,
          search_terms: sanitizedTerms,
          check_frequency_minutes: body.checkFrequencyMinutes || 30,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSite.id)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Update error: ${updateError.message}`);
      }

      result = updated;
    } else {
      // Crear nuevo sitio monitoreado
      const { data: created, error: createError } = await supabase
        .from('monitored_news_sites')
        .insert({
          user_id: user.id,
          site_id: body.siteId,
          is_active: true,
          search_terms: sanitizedTerms,
          check_frequency_minutes: body.checkFrequencyMinutes || 30,
        })
        .select()
        .single();

      if (createError) {
        throw new Error(`Create error: ${createError.message}`);
      }

      result = created;
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          monitoredSite: {
            id: result.id,
            siteId: result.site_id,
            siteName: siteConfig.name,
            siteUrl: siteConfig.url,
            isActive: result.is_active,
            searchTerms: result.search_terms,
            checkFrequencyMinutes: result.check_frequency_minutes,
            createdAt: result.created_at,
          },
        },
        message: `Monitoreo activado para ${siteConfig.name}`,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('[NEWS-MONITORING] Error activating site:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'ACTIVATE_SITE_ERROR',
          message: 'Error al activar monitoreo del sitio',
          details: error.message,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
