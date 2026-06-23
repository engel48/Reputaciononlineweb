import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Obtener el user ID del token JWT
function getUserIdFromRequest(request: NextRequest): string | null {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || (() => { throw new Error('FATAL: JWT_SECRET no está configurado en el entorno') })()) as any;
    return decoded.userId || decoded.id;
  } catch {
    return null;
  }
}

// GET - Obtener palabras clave del usuario
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('keywords, name')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error obteniendo keywords:', error);
      return NextResponse.json({ success: false, error: 'Error al obtener palabras clave' }, { status: 500 });
    }

    // Si no hay keywords, devolver el nombre del usuario como keyword por defecto
    const keywords = user?.keywords || [];
    const userName = user?.name || '';

    return NextResponse.json({
      success: true,
      data: {
        keywords,
        userName,
        defaultKeyword: userName // El nombre del usuario es la keyword por defecto
      }
    });

  } catch (error: any) {
    console.error('Error en GET /api/user/keywords:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST - Agregar una palabra clave
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const { keyword } = await request.json();

    if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Palabra clave inválida' }, { status: 400 });
    }

    const cleanKeyword = keyword.trim().toLowerCase();

    // Obtener keywords actuales
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('keywords')
      .eq('id', userId)
      .single();

    if (fetchError) {
      return NextResponse.json({ success: false, error: 'Error al obtener usuario' }, { status: 500 });
    }

    const currentKeywords = user?.keywords || [];

    // Verificar si ya existe
    if (currentKeywords.includes(cleanKeyword)) {
      return NextResponse.json({ success: false, error: 'La palabra clave ya existe' }, { status: 400 });
    }

    // Límite de keywords según plan (por ahora 10 máximo)
    if (currentKeywords.length >= 10) {
      return NextResponse.json({
        success: false,
        error: 'Límite de palabras clave alcanzado (máximo 10)'
      }, { status: 400 });
    }

    // Agregar nueva keyword
    const newKeywords = [...currentKeywords, cleanKeyword];

    const { error: updateError } = await supabase
      .from('users')
      .update({ keywords: newKeywords, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (updateError) {
      console.error('Error actualizando keywords:', updateError);
      return NextResponse.json({ success: false, error: 'Error al guardar palabra clave' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: { keywords: newKeywords },
      message: 'Palabra clave agregada correctamente'
    });

  } catch (error: any) {
    console.error('Error en POST /api/user/keywords:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE - Eliminar una palabra clave
export async function DELETE(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const { keyword } = await request.json();

    if (!keyword || typeof keyword !== 'string') {
      return NextResponse.json({ success: false, error: 'Palabra clave inválida' }, { status: 400 });
    }

    const cleanKeyword = keyword.trim().toLowerCase();

    // Obtener keywords actuales
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('keywords')
      .eq('id', userId)
      .single();

    if (fetchError) {
      return NextResponse.json({ success: false, error: 'Error al obtener usuario' }, { status: 500 });
    }

    const currentKeywords = user?.keywords || [];

    // Filtrar la keyword a eliminar
    const newKeywords = currentKeywords.filter((kw: string) => kw !== cleanKeyword);

    const { error: updateError } = await supabase
      .from('users')
      .update({ keywords: newKeywords, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (updateError) {
      console.error('Error eliminando keyword:', updateError);
      return NextResponse.json({ success: false, error: 'Error al eliminar palabra clave' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: { keywords: newKeywords },
      message: 'Palabra clave eliminada correctamente'
    });

  } catch (error: any) {
    console.error('Error en DELETE /api/user/keywords:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT - Reemplazar todas las palabras clave
export async function PUT(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const { keywords } = await request.json();

    if (!Array.isArray(keywords)) {
      return NextResponse.json({ success: false, error: 'Formato inválido' }, { status: 400 });
    }

    // Limpiar y validar keywords
    const cleanKeywords = keywords
      .filter((kw: any) => typeof kw === 'string' && kw.trim().length > 0)
      .map((kw: string) => kw.trim().toLowerCase())
      .slice(0, 10); // Máximo 10

    // Eliminar duplicados
    const uniqueKeywords = [...new Set(cleanKeywords)];

    const { error: updateError } = await supabase
      .from('users')
      .update({ keywords: uniqueKeywords, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (updateError) {
      console.error('Error actualizando keywords:', updateError);
      return NextResponse.json({ success: false, error: 'Error al guardar palabras clave' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: { keywords: uniqueKeywords },
      message: 'Palabras clave actualizadas correctamente'
    });

  } catch (error: any) {
    console.error('Error en PUT /api/user/keywords:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
