/**
 * API para ejecutar monitoreo de keywords
 * Busca noticias para cada keyword y guarda las menciones
 *
 * POST - Ejecutar monitoreo para una keyword especifica o todas
 * GET - Obtener menciones de una keyword
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

    const secret = process.env.JWT_SECRET || 'reputacion-online-secret-key-2025';
    const decoded = jwt.verify(token, secret) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

/**
 * GET /api/news-monitoring/keywords/monitor?keywordId=xxx
 * Obtiene las menciones de una keyword especifica
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

    const { searchParams } = new URL(request.url);
    const keywordId = searchParams.get('keywordId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!keywordId) {
      return NextResponse.json({
        success: false,
        error: 'keywordId requerido',
      }, { status: 400 });
    }

    // Verificar que la keyword pertenece al usuario
    const { data: keyword } = await supabase
      .from('monitored_keywords')
      .select('id, keyword')
      .eq('id', keywordId)
      .eq('user_id', userId)
      .single();

    if (!keyword) {
      return NextResponse.json({
        success: false,
        error: 'Keyword no encontrada',
      }, { status: 404 });
    }

    // Obtener menciones
    const { data: mentions, error } = await supabase
      .from('keyword_mentions')
      .select('*')
      .eq('keyword_id', keywordId)
      .order('discovered_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Calcular stats de sentimiento
    const stats = {
      total: mentions?.length || 0,
      positive: mentions?.filter(m => m.sentiment === 'positive').length || 0,
      negative: mentions?.filter(m => m.sentiment === 'negative').length || 0,
      neutral: mentions?.filter(m => m.sentiment === 'neutral').length || 0,
      unread: mentions?.filter(m => !m.is_read).length || 0,
    };

    return NextResponse.json({
      success: true,
      keyword: keyword.keyword,
      mentions: mentions || [],
      stats,
    });

  } catch (error: any) {
    console.error('Error obteniendo menciones:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

/**
 * POST /api/news-monitoring/keywords/monitor
 * Ejecuta monitoreo para una o todas las keywords del usuario
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

    const body = await request.json().catch(() => ({}));
    const { keywordId } = body;

    // Obtener keywords a monitorear
    let keywordsQuery = supabase
      .from('monitored_keywords')
      .select('id, keyword')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (keywordId) {
      keywordsQuery = keywordsQuery.eq('id', keywordId);
    }

    const { data: keywords, error: kwError } = await keywordsQuery;

    if (kwError) throw kwError;

    if (!keywords || keywords.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No hay keywords activas para monitorear',
      }, { status: 400 });
    }

    console.log(`🔍 Monitoreando ${keywords.length} keywords para usuario ${userId}`);

    // Calcular fecha limite (1 mes atras)
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const results = [];

    for (const kw of keywords) {
      console.log(`  📰 Buscando noticias para: "${kw.keyword}"`);

      // Dividir keyword en palabras para busqueda mas flexible
      const words = kw.keyword.trim().toLowerCase().split(/\s+/).filter((w: string) => w.length >= 2);

      let newsMatches: any[] = [];
      let newsError: any = null;

      if (words.length === 1) {
        // Palabra simple: buscar directamente
        const result = await supabase
          .from('scraped_news')
          .select('*')
          .or(`title.ilike.%${words[0]}%,content.ilike.%${words[0]}%`)
          .gte('published_at', oneMonthAgo.toISOString())
          .order('published_at', { ascending: false })
          .limit(100);
        newsMatches = result.data || [];
        newsError = result.error;
      } else {
        // Multiples palabras: buscar articulos que contengan TODAS las palabras
        // Primero buscar con la primera palabra, luego filtrar
        const result = await supabase
          .from('scraped_news')
          .select('*')
          .or(`title.ilike.%${words[0]}%,content.ilike.%${words[0]}%`)
          .gte('published_at', oneMonthAgo.toISOString())
          .order('published_at', { ascending: false })
          .limit(200);

        if (result.error) {
          newsError = result.error;
        } else {
          // Filtrar los que contengan TODAS las palabras
          newsMatches = (result.data || []).filter(news => {
            const titleLower = (news.title || '').toLowerCase();
            const contentLower = (news.content || '').toLowerCase();
            const fullText = `${titleLower} ${contentLower}`;
            return words.every(word => fullText.includes(word));
          }).slice(0, 100);
        }

        console.log(`    🔎 Busqueda multi-palabra: ${words.join(' + ')} → ${newsMatches.length} resultados`);
      }

      if (newsError) {
        console.error(`  ❌ Error buscando noticias para "${kw.keyword}":`, newsError);
        continue;
      }

      let savedCount = 0;
      let duplicateCount = 0;

      // Guardar menciones nuevas
      for (const news of newsMatches || []) {
        const { error: insertError } = await supabase
          .from('keyword_mentions')
          .insert({
            keyword_id: kw.id,
            news_id: news.id,
            article_title: news.title,
            article_url: news.article_url,
            article_content: news.content?.substring(0, 500),
            source: news.source,
            published_at: news.published_at,
            sentiment: news.sentiment || 'neutral',
            sentiment_score: news.sentiment_score || 0,
          })
          .single();

        if (insertError) {
          if (insertError.code === '23505') {
            duplicateCount++;
          } else {
            console.error(`  ❌ Error guardando mencion:`, insertError.message);
          }
        } else {
          savedCount++;
        }
      }

      // Actualizar contador de menciones y last_checked
      const { count: totalMentions } = await supabase
        .from('keyword_mentions')
        .select('*', { count: 'exact', head: true })
        .eq('keyword_id', kw.id);

      await supabase
        .from('monitored_keywords')
        .update({
          last_checked_at: new Date().toISOString(),
          total_mentions: totalMentions || 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', kw.id);

      results.push({
        keyword: kw.keyword,
        found: newsMatches?.length || 0,
        saved: savedCount,
        duplicates: duplicateCount,
        total: totalMentions || 0,
      });

      console.log(`  ✅ "${kw.keyword}": ${newsMatches?.length || 0} encontradas, ${savedCount} nuevas`);
    }

    return NextResponse.json({
      success: true,
      message: `Monitoreo completado para ${keywords.length} keywords`,
      results,
    });

  } catch (error: any) {
    console.error('Error en monitoreo:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

/**
 * PATCH /api/news-monitoring/keywords/monitor
 * Marca menciones como leidas
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
    const { mentionId, mentionIds, markAllRead, keywordId } = body;

    if (markAllRead && keywordId) {
      // Marcar todas las menciones de una keyword como leidas
      const { error } = await supabase
        .from('keyword_mentions')
        .update({ is_read: true })
        .eq('keyword_id', keywordId);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: 'Todas las menciones marcadas como leidas',
      });
    }

    if (mentionId) {
      const { error } = await supabase
        .from('keyword_mentions')
        .update({ is_read: true })
        .eq('id', mentionId);

      if (error) throw error;
    }

    if (mentionIds && Array.isArray(mentionIds)) {
      const { error } = await supabase
        .from('keyword_mentions')
        .update({ is_read: true })
        .in('id', mentionIds);

      if (error) throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Menciones actualizadas',
    });

  } catch (error: any) {
    console.error('Error actualizando menciones:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
