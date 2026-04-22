/**
 * Google News RSS Search — búsqueda de noticias en TIEMPO REAL.
 *
 * Sin API key, sin caché. Cada llamada consulta Google News en vivo
 * y retorna las noticias recientes que mencionan el término buscado.
 *
 * Ventajas:
 *  - En tiempo real (no datos previamente scrapeados)
 *  - Funciona para CUALQUIER persona/marca
 *  - Incluye medios colombianos + internacionales
 *  - Retorna fuente original (título + link del medio real)
 *  - Español colombiano por defecto (hl=es-419&gl=CO)
 *
 * Uso:
 *   const news = await searchGoogleNewsLive('Gustavo Petro', { limit: 20 });
 */

export interface LiveNewsItem {
  title: string;
  link: string;
  pubDate: string | null;
  source: string;
  snippet: string;
}

interface SearchOptions {
  limit?: number;
  /** Código de idioma-región Google. Default: es-419 (español LATAM) */
  hl?: string;
  /** Código de país. Default: CO (Colombia) */
  gl?: string;
  /** Timeout de la request en ms. Default: 12000 */
  timeoutMs?: number;
}

/**
 * Extrae el primer match de un regex o retorna null.
 */
function extract(pattern: RegExp, text: string): string | null {
  const m = text.match(pattern);
  return m ? m[1] : null;
}

/**
 * Decodifica entidades HTML comunes (&amp;, &quot;, &#39;, etc.)
 */
function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]+>/g, '') // quitar tags HTML restantes
    .trim();
}

/**
 * Parsea el XML de Google News RSS sin dependencias externas.
 * Formato de <item>:
 *   <title>...</title>
 *   <link>...</link>
 *   <pubDate>...</pubDate>
 *   <source url="...">Nombre del medio</source>
 *   <description>... HTML ...</description>
 */
function parseRss(xml: string, limit: number): LiveNewsItem[] {
  const items: LiveNewsItem[] = [];
  const itemBlocks = xml.split(/<item\b/i).slice(1);

  for (const rawBlock of itemBlocks) {
    const closeIdx = rawBlock.indexOf('</item>');
    const block = closeIdx >= 0 ? rawBlock.slice(0, closeIdx) : rawBlock;

    // title y link pueden estar en CDATA o texto plano
    const titleRaw =
      extract(/<title>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/title>/i, block) ||
      extract(/<title>([\s\S]*?)<\/title>/i, block) ||
      '';
    const linkRaw = extract(/<link>([\s\S]*?)<\/link>/i, block) || '';
    const pubDate = extract(/<pubDate>([\s\S]*?)<\/pubDate>/i, block);
    const sourceRaw =
      extract(/<source[^>]*>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/source>/i, block) ||
      extract(/<source[^>]*>([\s\S]*?)<\/source>/i, block) ||
      '';
    const descRaw =
      extract(/<description>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/description>/i, block) ||
      extract(/<description>([\s\S]*?)<\/description>/i, block) ||
      '';

    const title = decodeHtmlEntities(titleRaw);
    const link = decodeHtmlEntities(linkRaw);
    const source = decodeHtmlEntities(sourceRaw);
    const snippet = decodeHtmlEntities(descRaw).slice(0, 500);

    if (!title || !link) continue;

    items.push({
      title,
      link,
      pubDate,
      source,
      snippet,
    });

    if (items.length >= limit) break;
  }

  return items;
}

/**
 * Busca noticias en vivo en Google News.
 * Retorna hasta `limit` noticias recientes que mencionan `query`.
 */
export async function searchGoogleNewsLive(
  query: string,
  options: SearchOptions = {}
): Promise<LiveNewsItem[]> {
  const { limit = 20, hl = 'es-419', gl = 'CO', timeoutMs = 12000 } = options;
  if (!query || query.trim().length === 0) return [];

  const encoded = encodeURIComponent(query.trim());
  const url = `https://news.google.com/rss/search?q=${encoded}&hl=${hl}&gl=${gl}&ceid=${gl}:${hl}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        // User-Agent para evitar bloqueos
        'User-Agent':
          'Mozilla/5.0 (compatible; ReputacionOnlineBot/1.0; +https://reputaciononline.com.co)',
        Accept: 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      console.warn(`[google-news-rss] HTTP ${res.status} buscando "${query}"`);
      return [];
    }

    const xml = await res.text();
    return parseRss(xml, limit);
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      console.warn(`[google-news-rss] timeout buscando "${query}"`);
    } else {
      console.warn(`[google-news-rss] error:`, err?.message || err);
    }
    return [];
  } finally {
    clearTimeout(timer);
  }
}
