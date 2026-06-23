/**
 * PUT /api/news-monitoring/update-site/[id]
 * Actualiza la configuración de un sitio monitoreado (términos de búsqueda, frecuencia)
 */

import { NextRequest, NextResponse } from 'next/server';
import * as jwt from 'jsonwebtoken';
import { supabase } from '@/lib/supabase-server';

const JWT_SECRET = process.env.JWT_SECRET || (() => { throw new Error('FATAL: JWT_SECRET no está configurado en el entorno') })();

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'ID de sitio monitoreado requerido',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

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

    // Parsear body
    const body = await request.json();
    const { searchTerms, checkFrequencyMinutes } = body;

    // Verificar que el sitio monitoreado existe y pertenece al usuario
    const { data: monitoredSite, error: fetchError } = await supabase
      .from('monitored_news_sites')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !monitoredSite) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SITE_NOT_FOUND',
            message: 'Sitio monitoreado no encontrado o no tienes permiso para modificarlo',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    // Preparar datos de actualización
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (searchTerms !== undefined) {
      updateData.search_terms = searchTerms;
    }

    if (checkFrequencyMinutes !== undefined) {
      updateData.check_frequency_minutes = checkFrequencyMinutes;
    }

    // Actualizar el sitio
    const { data: updatedSite, error: updateError } = await supabase
      .from('monitored_news_sites')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Update error: ${updateError.message}`);
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          site: updatedSite,
        },
        message: 'Configuración actualizada exitosamente',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('[NEWS-MONITORING] Error updating site:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UPDATE_SITE_ERROR',
          message: 'Error al actualizar configuración del sitio',
          details: error.message,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
