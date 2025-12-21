/**
 * GET /api/mentions/map
 * Obtiene menciones con datos de ubicacion para el mapa
 */

import { NextRequest, NextResponse } from 'next/server';
import * as jwt from 'jsonwebtoken';
import { supabase } from '@/lib/supabase-server';

const JWT_SECRET = process.env.JWT_SECRET || 'reputacion-online-secret-key-2025';

// Ciudades de Latinoamerica con coordenadas
const LATIN_AMERICA_CITIES = [
  { name: 'Bogota, Colombia', lat: 4.6097, lng: -74.0817 },
  { name: 'Medellin, Colombia', lat: 6.2476, lng: -75.5658 },
  { name: 'Cali, Colombia', lat: 3.4516, lng: -76.5320 },
  { name: 'Barranquilla, Colombia', lat: 10.9639, lng: -74.7964 },
  { name: 'Cartagena, Colombia', lat: 10.3910, lng: -75.4794 },
  { name: 'Ciudad de Mexico, Mexico', lat: 19.4326, lng: -99.1332 },
  { name: 'Guadalajara, Mexico', lat: 20.6597, lng: -103.3496 },
  { name: 'Buenos Aires, Argentina', lat: -34.6118, lng: -58.3960 },
  { name: 'Sao Paulo, Brasil', lat: -23.5558, lng: -46.6396 },
  { name: 'Lima, Peru', lat: -12.0464, lng: -77.0428 },
  { name: 'Santiago, Chile', lat: -33.4489, lng: -70.6693 },
  { name: 'Caracas, Venezuela', lat: 10.4806, lng: -66.9036 },
  { name: 'Quito, Ecuador', lat: -0.1807, lng: -78.4678 },
  { name: 'Panama City, Panama', lat: 8.9824, lng: -79.5199 },
  { name: 'San Jose, Costa Rica', lat: 9.9281, lng: -84.0907 },
];

function getRandomCity() {
  return LATIN_AMERICA_CITIES[Math.floor(Math.random() * LATIN_AMERICA_CITIES.length)];
}

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
      const decoded = jwt.verify(authToken, JWT_SECRET) as { userId: string; email: string };
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
      mapMentions = mentions.map((m: any) => {
        const metadata = m.metadata || {};
        const locationData = metadata.location;

        // Si tiene ubicacion en metadata, usarla; si no, asignar ciudad aleatoria
        let location;
        if (locationData && locationData.lat && locationData.lng) {
          location = {
            lat: locationData.lat,
            lng: locationData.lng,
            name: locationData.name || 'Ubicacion desconocida'
          };
        } else {
          const city = getRandomCity();
          location = { lat: city.lat, lng: city.lng, name: city.name };
        }

        // Extraer sentiment
        let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
        if (metadata.sentiment) {
          const s = metadata.sentiment.toLowerCase();
          if (s === 'positive' || s === 'negative' || s === 'neutral') {
            sentiment = s;
          }
        } else if (typeof metadata.sentimentScore === 'number') {
          sentiment = metadata.sentimentScore > 0.3 ? 'positive' :
                     metadata.sentimentScore < -0.3 ? 'negative' : 'neutral';
        }

        return {
          id: m.id,
          author: m.author_name || m.author_username || 'Usuario',
          content: m.content || '',
          sentiment,
          platform: m.platform || 'web',
          location,
          timestamp: m.published_at || m.scraped_at
        };
      });
    }

    // 6. SI NO HAY MENCIONES, BUSCAR EN news_mentions
    if (mapMentions.length === 0) {
      const { data: newsMentions, error: newsError } = await supabase
        .from('news_mentions')
        .select('*')
        .eq('user_id', userId)
        .order('discovered_at', { ascending: false })
        .limit(limit);

      if (!newsError && newsMentions && newsMentions.length > 0) {
        mapMentions = newsMentions.map((m: any) => {
          const city = getRandomCity();

          let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
          if (m.sentiment) {
            const s = m.sentiment.toLowerCase();
            if (s === 'positive' || s === 'negative' || s === 'neutral') {
              sentiment = s;
            }
          }

          return {
            id: m.id,
            author: m.article_author || 'Medio de noticias',
            content: m.mention_context || m.article_title || '',
            sentiment,
            platform: 'news',
            location: { lat: city.lat, lng: city.lng, name: city.name },
            timestamp: m.published_date || m.discovered_at
          };
        });
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
