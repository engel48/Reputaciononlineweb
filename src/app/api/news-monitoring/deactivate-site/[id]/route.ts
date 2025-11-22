/**
 * DELETE /api/news-monitoring/deactivate-site/[id]
 * Desactiva el monitoreo de un sitio de noticias
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function DELETE(
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

    // Verificar que el sitio monitoreado existe y pertenece al usuario
    const { data: monitoredSite, error: fetchError } = await supabase
      .from('monitored_news_sites')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
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

    // Desactivar el sitio (soft delete)
    const { error: updateError } = await supabase
      .from('monitored_news_sites')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      throw new Error(`Update error: ${updateError.message}`);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Monitoreo desactivado exitosamente',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('[NEWS-MONITORING] Error deactivating site:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DEACTIVATE_SITE_ERROR',
          message: 'Error al desactivar monitoreo del sitio',
          details: error.message,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
