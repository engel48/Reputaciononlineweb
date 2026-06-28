/**
 * API Endpoint: Obtener Menciones Pendientes de Análisis
 *
 * Retorna menciones que no tienen análisis de sentimiento para procesamiento en batch
 * Útil para el dashboard para mostrar cuántas menciones están pendientes
 *
 * @route GET /api/mentions/pending-analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/auth-helper';

export async function GET(req: NextRequest) {
  try {
    // Aislamiento multiusuario: exigir sesión y filtrar SIEMPRE por el userId
    // del token verificado. Nunca confiar en un userId que venga por query.
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;
    const userId = auth.userId;

    // Obtener parámetros de query
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Construir query (solo menciones del usuario autenticado)
    let query = supabase
      .from('mentions')
      .select('id, platform, content, author_name, published_at, metadata')
      .eq('user_id', userId)
      .is('metadata->>sentiment', null) // Menciones sin análisis de sentimiento
      .not('content', 'is', null) // Que tengan contenido
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: mentions, error: fetchError, count } = await query;

    if (fetchError) {
      console.error('❌ Error al obtener menciones pendientes:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Error al obtener menciones de la base de datos' },
        { status: 500 }
      );
    }

    // También obtener el conteo total (solo del usuario autenticado)
    const countQuery = supabase
      .from('mentions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('metadata->>sentiment', null)
      .not('content', 'is', null);

    const { count: totalCount } = await countQuery;

    console.log(`✅ Encontradas ${mentions?.length || 0} menciones pendientes de análisis`);

    return NextResponse.json({
      success: true,
      data: {
        mentions: mentions || [],
        count: mentions?.length || 0,
        total: totalCount || 0,
        hasMore: (offset + limit) < (totalCount || 0)
      }
    });

  } catch (error: any) {
    console.error('❌ Error al obtener menciones pendientes:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        details: error?.message || 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
