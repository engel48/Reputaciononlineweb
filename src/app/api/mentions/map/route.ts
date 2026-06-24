/**
 * GET /api/mentions/map
 * Obtiene menciones con datos de ubicacion para el mapa
 */

import { NextRequest, NextResponse } from 'next/server';
import * as jwt from 'jsonwebtoken';
import { supabase } from '@/lib/supabase-server';

import { getJwtSecret } from '@/lib/jwt-secret';

interface MapMention {
  id: string;
  author: string;
  content: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  platform: string;
  location: {
    lat: number;
    lng: number;
    name: string;
  };
  timestamp: string;
}

export async function GET(request: NextRequest) {
  try {
    // 1. AUTENTICACION: Obtener token desde cookie
    const authToken = request.cookies.get('auth-token')?.value;

    if (!authToken) {
      return NextResponse.json(
        { success: false, message: 'No autenticado. Token no encontrado.' },
        { status: 401 }
      );
    }

    // 2. VERIFICAR TOKEN JWT
    let userId: string;
    try {
      const decoded = jwt.verify(authToken, getJwtSecret()) as { userId: string; email: string };
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Token invalido o expirado.' },
        { status: 401 }
      );
    }

    // 3. PARAMETROS
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const hours = parseInt(searchParams.get('hours') || '168'); // 7 dias por defecto

    // 4. CALCULAR RANGO DE TIEMPO
    const timeAgo = new Date(Date.now() - hours * 60 * 60 * 1000);

    // 5. BUSCAR EN TABLA mentions
    let mapMentions: MapMention[] = [];

    const { data: mentions, error: mentionsError } = await supabase
      .from('mentions')
      .select('*')
      .eq('user_id', userId)
      .gte('published_at', timeAgo.toISOString())
      .order('published_at', { ascending: false })
      .limit(limit);

    if (!mentionsError && mentions && mentions.length > 0) {
      for (const m of mentions) {
        const metadata = m.metadata || {};
        const locationData = metadata.location;

        // Solo incluir menciones con ubicación real en metadata.
        // NO asignamos ciudades aleatorias — si no hay coords, se omite.
        if (!locationData?.lat || !locationData?.lng) continue;

        const location = {
          lat: locationData.lat,
          lng: locationData.lng,
          name: locationData.name || 'Ubicación desconocida',
        };

        let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
        if (metadata.sentiment) {
          const s = String(metadata.sentiment).toLowerCase();
          if (s === 'positive' || s === 'negative' || s === 'neutral') {
            sentiment = s;
          }
        } else if (typeof metadata.sentimentScore === 'number') {
          sentiment =
            metadata.sentimentScore > 0.3
              ? 'positive'
              : metadata.sentimentScore < -0.3
              ? 'negative'
              : 'neutral';
        }

        mapMentions.push({
          id: m.id,
          author: m.author_name || m.author_username || 'Usuario',
          content: m.content || '',
          sentiment,
          platform: m.platform || 'web',
          location,
          timestamp: m.published_at || m.scraped_at,
        });
      }
    }

    // 6. Si no hay menciones sociales con ubicación, intentar news_mentions.
    //    También requerimos coords reales en metadata/location.
    if (mapMentions.length === 0) {
      const { data: newsMentions, error: newsError } = await supabase
        .from('news_mentions')
        .select('*')
        .eq('user_id', userId)
        .order('discovered_at', { ascending: false })
        .limit(limit);

      if (!newsError && newsMentions && newsMentions.length > 0) {
        for (const m of newsMentions as any[]) {
          const loc = m.metadata?.location;
          if (!loc?.lat || !loc?.lng) continue;

          let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
          if (m.sentiment) {
            const s = String(m.sentiment).toLowerCase();
            if (s === 'positive' || s === 'negative' || s === 'neutral') {
              sentiment = s;
            }
          }

          mapMentions.push({
            id: m.id,
            author: m.article_author || 'Medio de noticias',
            content: m.mention_context || m.article_title || '',
            sentiment,
            platform: 'news',
            location: {
              lat: loc.lat,
              lng: loc.lng,
              name: loc.name || 'Ubicación desconocida',
            },
            timestamp: m.published_date || m.discovered_at,
          });
        }
      }
    }

    // 7. RESPUESTA
    return NextResponse.json({
      success: true,
      data: {
        mentions: mapMentions,
        total: mapMentions.length,
        stats: {
          positive: mapMentions.filter(m => m.sentiment === 'positive').length,
          negative: mapMentions.filter(m => m.sentiment === 'negative').length,
          neutral: mapMentions.filter(m => m.sentiment === 'neutral').length,
        },
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error en /api/mentions/map:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor.' },
      { status: 500 }
    );
  }
}
