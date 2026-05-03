// src/app/api/mentions/recent/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/auth-helper';

// Interfaz para los parámetros de query
interface QueryParams {
  limit: number;
  hours: number;
  platform?: string;
}

// Interfaz para la estructura de Mention compatible con el frontend
interface Mention {
  id: string;
  author: string;
  platform: string;
  content: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  timestamp: Date;
  engagement: {
    likes: number;
    comments: number;
    retweets?: number;
    shares?: number;
  };
  location: string;
  verified: boolean;
}

// Función para extraer el sentiment desde metadata
function extractSentiment(metadata: any): 'positive' | 'negative' | 'neutral' {
  if (!metadata) return 'neutral';

  const sentiment = metadata.sentiment || metadata.sentimentScore;

  if (!sentiment) return 'neutral';

  // Si es string, retornar directamente
  if (typeof sentiment === 'string') {
    const normalized = sentiment.toLowerCase();
    if (normalized === 'positive' || normalized === 'negative' || normalized === 'neutral') {
      return normalized as 'positive' | 'negative' | 'neutral';
    }
  }

  // Si es número (score), convertir a categoría
  if (typeof sentiment === 'number') {
    if (sentiment > 0.3) return 'positive';
    if (sentiment < -0.3) return 'negative';
    return 'neutral';
  }

  return 'neutral';
}

// Función para mapear datos de Supabase a formato Mention
function mapSupabaseMention(dbMention: any): Mention {
  const metadata = dbMention.metadata || {};

  return {
    id: dbMention.id,
    author: dbMention.author_name || dbMention.author_username || 'Usuario Desconocido',
    platform: dbMention.platform,
    content: dbMention.content || '',
    sentiment: extractSentiment(metadata),
    timestamp: new Date(dbMention.published_at || dbMention.scraped_at),
    engagement: {
      likes: dbMention.likes || 0,
      comments: dbMention.comments || 0,
      retweets: dbMention.platform.toLowerCase() === 'x' || dbMention.platform.toLowerCase() === 'twitter'
        ? dbMention.shares || 0
        : undefined,
      shares: dbMention.shares || 0,
    },
    location: metadata.location || 'Desconocido',
    verified: metadata.verified || false,
  };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    const userId = auth.userId;
    console.log('✅ API MENTIONS: Usuario autenticado:', userId);

    // 3. EXTRAER PARÁMETROS DE QUERY
    const searchParams = request.nextUrl.searchParams;
    const queryParams: QueryParams = {
      limit: Math.min(parseInt(searchParams.get('limit') || '10'), 50), // Max 50
      hours: parseInt(searchParams.get('hours') || '24'),
      platform: searchParams.get('platform') || undefined,
    };

    console.log('🔍 API MENTIONS: Parámetros de búsqueda:', queryParams);

    // 4. CALCULAR RANGO DE TIEMPO
    const now = new Date();
    const timeAgo = new Date(now.getTime() - queryParams.hours * 60 * 60 * 1000);
    const timeAgoISO = timeAgo.toISOString();

    // 5. CONSTRUIR QUERY DE SUPABASE
    let query = supabase
      .from('mentions')
      .select('*')
      .eq('user_id', userId)
      .gte('published_at', timeAgoISO)
      .order('published_at', { ascending: false })
      .limit(queryParams.limit);

    // Filtrar por plataforma si se especifica
    if (queryParams.platform) {
      query = query.eq('platform', queryParams.platform);
    }

    // 6. EJECUTAR QUERY
    const { data: mentions, error } = await query;

    if (error) {
      console.error('❌ API MENTIONS: Error consultando Supabase:', error);
      return NextResponse.json(
        { success: false, message: 'Error obteniendo menciones de la base de datos.' },
        { status: 500 }
      );
    }

    // 7. MAPEAR DATOS AL FORMATO ESPERADO
    const mappedMentions: Mention[] = (mentions || []).map(mapSupabaseMention);

    console.log(`✅ API MENTIONS: ${mappedMentions.length} menciones obtenidas exitosamente`);

    // 8. RETORNAR RESPUESTA
    return NextResponse.json({
      success: true,
      data: {
        mentions: mappedMentions,
        total: mappedMentions.length,
        timeRange: `${queryParams.hours} horas`,
        lastUpdated: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('💥 API MENTIONS ERROR:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor.' },
      { status: 500 }
    );
  }
}
