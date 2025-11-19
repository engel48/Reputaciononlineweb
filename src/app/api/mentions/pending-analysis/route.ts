/**
 * API Endpoint: Obtener Menciones Pendientes de Análisis
 *
 * Retorna menciones que no tienen análisis de sentimiento para procesamiento en batch
 * Útil para el dashboard para mostrar cuántas menciones están pendientes
 *
 * @route GET /api/mentions/pending-analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase client (server-side con service_role para bypass RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(req: NextRequest) {
  try {
    // Verificar Supabase configurado
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { success: false, error: 'Supabase no está configurado correctamente' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Obtener parámetros de query
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Construir query
    let query = supabase
      .from('mentions')
      .select('id, platform, content, author_name, published_at, metadata')
      .is('metadata->>sentiment', null) // Menciones sin análisis de sentimiento
      .not('content', 'is', null) // Que tengan contenido
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filtrar por usuario si se proporciona
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: mentions, error: fetchError, count } = await query;

    if (fetchError) {
      console.error('❌ Error al obtener menciones pendientes:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Error al obtener menciones de la base de datos' },
        { status: 500 }
      );
    }

    // También obtener el conteo total
    let countQuery = supabase
      .from('mentions')
      .select('id', { count: 'exact', head: true })
      .is('metadata->>sentiment', null)
      .not('content', 'is', null);

    if (userId) {
      countQuery = countQuery.eq('user_id', userId);
    }

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
