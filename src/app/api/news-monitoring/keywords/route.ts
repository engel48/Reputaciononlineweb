/**
 * API para gestionar palabras clave monitoreadas
 * GET - Listar keywords del usuario
 * POST - Agregar nueva keyword
 * DELETE - Eliminar keyword
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Obtener usuario de la cookie JWT
async function getUserFromCookie(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) return null;

    const secret = process.env.JWT_SECRET || (() => { throw new Error('FATAL: JWT_SECRET no está configurado en el entorno') })();
    const decoded = jwt.verify(token, secret) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

/**
 * GET /api/news-monitoring/keywords
 * Lista todas las keywords monitoreadas del usuario
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromCookie();

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'No autorizado',
      }, { status: 401 });
    }

    // Obtener keywords con conteo de menciones
    const { data: keywords, error } = await supabase
      .from('monitored_keywords')
      .select(`
        id,
        keyword,
        is_active,
        check_frequency_minutes,
        last_checked_at,
        total_mentions,
        created_at
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error obteniendo keywords:', error);
      throw error;
    }

    // Para cada keyword, obtener menciones no leidas
    const keywordsWithStats = await Promise.all(
      (keywords || []).map(async (kw) => {
        const { count: unreadCount } = await supabase
          .from('keyword_mentions')
          .select('*', { count: 'exact', head: true })
          .eq('keyword_id', kw.id)
          .eq('is_read', false);

        return {
          ...kw,
          unread_mentions: unreadCount || 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      keywords: keywordsWithStats,
      total: keywordsWithStats.length,
    });

  } catch (error: any) {
    console.error('Error en GET keywords:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

/**
 * POST /api/news-monitoring/keywords
 * Agrega una nueva keyword para monitorear
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromCookie();

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'No autorizado',
      }, { status: 401 });
    }

    const body = await request.json();
    const { keyword, checkFrequencyMinutes = 60 } = body;

    if (!keyword || keyword.trim().length < 2) {
      return NextResponse.json({
        success: false,
        error: 'La palabra clave debe tener al menos 2 caracteres',
      }, { status: 400 });
    }

    // Verificar limite de keywords (max 20 por usuario)
    const { count: currentCount } = await supabase
      .from('monitored_keywords')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if ((currentCount || 0) >= 20) {
      return NextResponse.json({
        success: false,
        error: 'Has alcanzado el limite de 20 palabras clave',
      }, { status: 400 });
    }

    // Insertar nueva keyword
    const { data: newKeyword, error } = await supabase
      .from('monitored_keywords')
      .insert({
        user_id: userId,
        keyword: keyword.trim().toLowerCase(),
        check_frequency_minutes: checkFrequencyMinutes,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Duplicate key
        return NextResponse.json({
          success: false,
          error: 'Esta palabra clave ya esta siendo monitoreada',
        }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      keyword: newKeyword,
      message: `Palabra clave "${keyword}" agregada. Se buscaran noticias automaticamente.`,
    });

  } catch (error: any) {
    console.error('Error en POST keyword:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

/**
 * DELETE /api/news-monitoring/keywords
 * Elimina una keyword y sus menciones
 */
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserFromCookie();

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'No autorizado',
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const keywordId = searchParams.get('id');

    if (!keywordId) {
      return NextResponse.json({
        success: false,
        error: 'ID de keyword requerido',
      }, { status: 400 });
    }

    // Verificar que la keyword pertenece al usuario
    const { data: existing } = await supabase
      .from('monitored_keywords')
      .select('id')
      .eq('id', keywordId)
      .eq('user_id', userId)
      .single();

    if (!existing) {
      return NextResponse.json({
        success: false,
        error: 'Palabra clave no encontrada',
      }, { status: 404 });
    }

    // Eliminar keyword (las menciones se eliminan por CASCADE)
    const { error } = await supabase
      .from('monitored_keywords')
      .delete()
      .eq('id', keywordId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Palabra clave eliminada',
    });

  } catch (error: any) {
    console.error('Error en DELETE keyword:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

/**
 * PATCH /api/news-monitoring/keywords
 * Actualiza estado de una keyword (activar/desactivar)
 */
export async function PATCH(request: NextRequest) {
  try {
    const userId = await getUserFromCookie();

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'No autorizado',
      }, { status: 401 });
    }

    const body = await request.json();
    const { keywordId, isActive } = body;

    if (!keywordId) {
      return NextResponse.json({
        success: false,
        error: 'ID de keyword requerido',
      }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('monitored_keywords')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', keywordId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      keyword: data,
    });

  } catch (error: any) {
    console.error('Error en PATCH keyword:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
