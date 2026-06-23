/**
 * POST /api/news-monitoring/activate-site
 * Activa el monitoreo de un sitio de noticias para el usuario
 * AUTOMÁTICAMENTE usa el nombre del usuario como término de búsqueda
 */

import { NextRequest, NextResponse } from 'next/server';
import * as jwt from 'jsonwebtoken';
import { supabase } from '@/lib/supabase-server';
import { getSiteById } from '@/lib/news-monitoring/sites-config';

const JWT_SECRET = process.env.JWT_SECRET || (() => { throw new Error('FATAL: JWT_SECRET no está configurado en el entorno') })();

interface ActivateSiteRequest {
  siteId: string;
  checkFrequencyMinutes?: number;
}

export async function POST(request: NextRequest) {
  try {
    // Obtener token de autenticación desde cookie (JWT Local)
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

    // Verificar token JWT Local
    let userId: string;
    try {
      const decoded = jwt.verify(authToken, JWT_SECRET) as { userId: string; email: string };
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

    // Obtener el nombre del usuario de la base de datos
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'No se pudo obtener la información del usuario',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    // Generar términos de búsqueda automáticamente desde el nombre del usuario
    const userName = userData.name || '';
    const autoSearchTerms: string[] = [];

    if (userName) {
      // Agregar nombre completo
      autoSearchTerms.push(userName.toLowerCase());

      // Si tiene nombre y apellido, agregar variaciones
      const nameParts = userName.trim().split(/\s+/);
      if (nameParts.length >= 2) {
        // Agregar solo el primer nombre
        autoSearchTerms.push(nameParts[0].toLowerCase());
        // Agregar solo el apellido
        autoSearchTerms.push(nameParts[nameParts.length - 1].toLowerCase());
      }
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

    // Usar los términos automáticos del nombre del usuario
    const searchTerms = autoSearchTerms;

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

    // Los términos ya están sanitizados (generados automáticamente del nombre)
    const sanitizedTerms = searchTerms.filter(term => term.length > 0 && term.length <= 100);

    console.log(`[NEWS-MONITORING] Términos de búsqueda automáticos para ${userData.name}:`, sanitizedTerms);

    // Verificar límite de sitios monitoreados por usuario (max 10)
    const { data: existingSites, error: countError } = await supabase
      .from('monitored_news_sites')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
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
      .eq('user_id', userId)
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
          user_id: userId,
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
        message: `Monitoreo activado para ${siteConfig.name}. Buscando menciones de "${userData.name}"`,
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
