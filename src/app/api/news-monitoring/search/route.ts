/**
 * Endpoint para buscar noticias por palabra clave
 * GET - Busca en la tabla scraped_news de Supabase
 * POST - Busca en Google News y guarda los resultados
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchNews } from '@/lib/services/newsSearchService';
import { analyzeSentiment as analyzeSentimentAI } from '@/lib/news-monitoring/sentiment';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

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

// Sentimiento con Groq REAL (vía aiService). Si Groq falla, type/score quedan
// null (pendiente) — nunca matching de palabras.
async function analyzeSentiment(
  text: string
): Promise<{ type: 'positive' | 'negative' | 'neutral' | null; score: number | null }> {
  const ai = await analyzeSentimentAI(text);
  return { type: ai.sentiment, score: ai.score };
}

// Limpia HTML
function cleanHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/\s+/g, ' ').trim();
}

// Busca en Google News RSS
async function searchGoogleNews(keyword: string): Promise<any[]> {
  const articles: any[] = [];
  try {
    const searchQuery = encodeURIComponent(`${keyword} Colombia`);
    const url = `https://news.google.com/rss/search?q=${searchQuery}&hl=es-419&gl=CO&ceid=CO:es-419`;

    console.log(`🔍 Buscando en Google News: "${keyword}"`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    clearTimeout(timeoutId);

    if (!response.ok) return [];

    const xml = await response.text();
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
      const item = match[1];
      const title = item.match(/<title>([^<]+)<\/title>/)?.[1];
      const link = item.match(/<link>([^<]+)<\/link>/)?.[1];
      const pubDate = item.match(/<pubDate>([^<]+)<\/pubDate>/)?.[1];
      const desc = item.match(/<description>([\s\S]*?)<\/description>/)?.[1];
      const source = item.match(/<source[^>]*>([^<]+)<\/source>/)?.[1];

      if (title && link) {
        articles.push({
          title: cleanHtml(title),
          url: link.trim(),
          content: desc ? cleanHtml(desc) : '',
          source: source ? cleanHtml(source) : 'Google News',
          publishedAt: pubDate ? new Date(pubDate) : new Date(),
        });
      }
    }
    console.log(`✅ Google News: ${articles.length} noticias encontradas`);
  } catch (error: any) {
    console.error(`❌ Error Google News:`, error.message);
  }
  return articles;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const keyword = searchParams.get('keyword') || searchParams.get('q');
    const sentiment = searchParams.get('sentiment') as 'positive' | 'negative' | 'neutral' | 'all' | undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const dateFrom = searchParams.get('dateFrom') || undefined;
    const dateTo = searchParams.get('dateTo') || undefined;

    if (!keyword || keyword.trim() === '') {
      return NextResponse.json({
        success: false,
        error: 'Se requiere una palabra clave para buscar',
        results: [],
        total: 0,
      }, { status: 400 });
    }

    console.log(`🔍 Buscando noticias con keyword: "${keyword}"`);

    const searchResponse = await searchNews(keyword, {
      limit,
      offset,
      sentiment: sentiment || 'all',
      dateFrom,
      dateTo,
      orderBy: 'date',
    });

    // Transformar resultados para el frontend
    const results = searchResponse.results.map(news => ({
      id: news.id,
      title: news.title,
      summary: news.summary || news.content?.substring(0, 200),
      content: news.content?.substring(0, 500),
      source: news.source,
      sourceUrl: news.sourceUrl,
      articleUrl: news.articleUrl,
      publishedAt: news.publishedAt,
      author: news.author,
      sentiment: news.sentiment,
      sentimentScore: news.sentimentScore,
      imageUrl: news.imageUrl,
      keywords: news.keywords,
    }));

    return NextResponse.json({
      success: true,
      keyword,
      results,
      total: searchResponse.total,
      sentimentSummary: searchResponse.sentimentSummary,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('❌ Error en búsqueda de noticias:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error al buscar noticias',
      results: [],
      total: 0,
    }, { status: 500 });
  }
}

/**
 * POST /api/news-monitoring/search
 * Busca noticias en INTERNET (Google News) y las guarda
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromCookie();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { keyword, keywordId } = body;

    if (!keyword || keyword.trim().length < 2) {
      return NextResponse.json({ success: false, error: 'Keyword requerida' }, { status: 400 });
    }

    console.log(`🚀 Buscando en internet: "${keyword}"`);

    // Buscar en Google News
    const articles = await searchGoogleNews(keyword.trim());

    if (articles.length === 0) {
      return NextResponse.json({
        success: true,
        message: `No se encontraron noticias para "${keyword}"`,
        stats: { found: 0, saved: 0, mentions: 0 },
      });
    }

    let savedCount = 0;
    let mentionsCount = 0;

    for (const article of articles) {
      const contentHash = crypto.createHash('sha256')
        .update(`${article.url}|${article.title}`).digest('hex');

      // Verificar si existe
      const { data: existing } = await supabase
        .from('scraped_news')
        .select('id')
        .eq('content_hash', contentHash)
        .single();

      let newsId = existing?.id;

      if (!existing) {
        const sentiment = await analyzeSentiment(`${article.title} ${article.content}`);

        const { data: newNews, error } = await supabase
          .from('scraped_news')
          .insert({
            title: article.title,
            content: article.content,
            summary: article.content?.substring(0, 300) || '',
            source: article.source,
            source_url: article.url,
            article_url: article.url,
            published_at: article.publishedAt.toISOString(),
            scraped_at: new Date().toISOString(),
            sentiment: sentiment.type,
            sentiment_score: sentiment.score,
            relevance_score: 0.8,
            verified: false,
            language: 'es',
            category: 'general',
            keywords: [keyword.toLowerCase()],
            content_hash: contentHash,
          })
          .select('id')
          .single();

        if (!error && newNews) {
          newsId = newNews.id;
          savedCount++;
        }
      }

      // Crear mencion si tenemos keywordId
      if (keywordId && newsId) {
        const sentiment = await analyzeSentiment(`${article.title} ${article.content}`);

        const { error } = await supabase
          .from('keyword_mentions')
          .insert({
            keyword_id: keywordId,
            news_id: newsId,
            article_title: article.title,
            article_url: article.url,
            article_content: article.content?.substring(0, 500) || '',
            source: article.source,
            published_at: article.publishedAt.toISOString(),
            sentiment: sentiment.type,
            sentiment_score: sentiment.score,
          });

        if (!error) mentionsCount++;
      }
    }

    // Actualizar contador
    if (keywordId) {
      const { count } = await supabase
        .from('keyword_mentions')
        .select('*', { count: 'exact', head: true })
        .eq('keyword_id', keywordId);

      await supabase
        .from('monitored_keywords')
        .update({
          total_mentions: count || 0,
          last_checked_at: new Date().toISOString(),
        })
        .eq('id', keywordId);
    }

    console.log(`📊 Resultados: ${articles.length} encontradas, ${savedCount} nuevas, ${mentionsCount} menciones`);

    return NextResponse.json({
      success: true,
      message: `${mentionsCount} noticias de internet encontradas`,
      stats: { found: articles.length, saved: savedCount, mentions: mentionsCount },
    });

  } catch (error: any) {
    console.error('❌ Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
