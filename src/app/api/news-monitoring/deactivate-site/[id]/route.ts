/**
 * DELETE /api/news-monitoring/deactivate-site/[id]
 * Desactiva el monitoreo de un sitio de noticias
 */

import { NextRequest, NextResponse } from 'next/server';
import * as jwt from 'jsonwebtoken';
import { supabase } from '@/lib/supabase-server';

const JWT_SECRET = process.env.JWT_SECRET || (() => { throw new Error('FATAL: JWT_SECRET no está configurado en el entorno') })();

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

    // Primero eliminar las menciones asociadas a este sitio
    const { error: deleteMentionsError } = await supabase
      .from('news_mentions')
      .delete()
      .eq('monitored_site_id', id)
      .eq('user_id', userId);

    if (deleteMentionsError) {
      console.error('[NEWS-MONITORING] Error deleting mentions:', deleteMentionsError);
      // Continuar aunque falle - las menciones huérfanas no son críticas
    }

    // Eliminar el sitio de la base de datos (DELETE real, no soft delete)
    const { error: deleteError } = await supabase
      .from('monitored_news_sites')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (deleteError) {
      throw new Error(`Delete error: ${deleteError.message}`);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Sitio eliminado exitosamente',
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
