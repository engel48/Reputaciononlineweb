/**
 * Script de prueba completa del sistema de scraping
 * Ejecuta el scraping y guarda las menciones en la base de datos
 *
 * Ejecutar: node scripts/test-full-scraper.js
 */

const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Cargar .env.local manualmente
function loadEnvFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    content.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
      }
    });
  } catch (e) {
    // Ignorar si el archivo no existe
  }
}

loadEnvFile(path.join(__dirname, '..', '.env.local'));
loadEnvFile(path.join(__dirname, '..', '.env'));

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('ERROR: Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Sitios de prueba con RSS URLs correctos
const TEST_SITES = [
  {
    id: 'el-tiempo',
    name: 'El Tiempo',
    rssUrl: 'https://www.eltiempo.com/rss/colombia.xml',
  },
  {
    id: 'portafolio',
    name: 'Portafolio',
    rssUrl: 'https://www.portafolio.co/rss/economia.xml',
  },
];

// Función para hacer fetch con timeout
function fetchWithTimeout(url, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : require('http');

    const req = protocol.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ReputacionOnline/1.0)',
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });

    req.on('error', reject);
    req.setTimeout(timeout, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

// Función para hacer requests a Supabase
async function supabaseRequest(endpoint, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, supabaseUrl);

    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: data ? JSON.parse(data) : null });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

// Función para limpiar HTML
function cleanHtml(html) {
  return html
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

// Función para extraer items de RSS
function extractRSSItems(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];

    const titleMatch = itemXml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const linkMatch = itemXml.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
    const descMatch = itemXml.match(/<description[^>]*>([\s\S]*?)<\/description>/i);
    const pubDateMatch = itemXml.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i);

    if (titleMatch && linkMatch) {
      const title = cleanHtml(titleMatch[1]);
      const link = linkMatch[1].trim();

      items.push({
        title,
        link,
        description: descMatch ? cleanHtml(descMatch[1]).substring(0, 500) : '',
        pubDate: pubDateMatch ? pubDateMatch[1].trim() : null,
        hash: crypto.createHash('sha256').update(`${link}|${title}`).digest('hex'),
      });
    }
  }

  return items;
}

// Análisis de sentimiento simple
function analyzeSentiment(text) {
  const lowerText = text.toLowerCase();

  const positiveWords = ['éxito', 'logro', 'avance', 'mejora', 'crecimiento', 'positivo', 'bueno', 'excelente', 'beneficio'];
  const negativeWords = ['crisis', 'problema', 'caída', 'pérdida', 'negativo', 'malo', 'fracaso', 'escándalo', 'corrupción', 'denuncia'];

  let positiveCount = 0;
  let negativeCount = 0;

  positiveWords.forEach(word => {
    if (lowerText.includes(word)) positiveCount++;
  });

  negativeWords.forEach(word => {
    if (lowerText.includes(word)) negativeCount++;
  });

  if (positiveCount > negativeCount) {
    return { type: 'positive', score: 0.6 + (positiveCount * 0.1) };
  } else if (negativeCount > positiveCount) {
    return { type: 'negative', score: -(0.6 + (negativeCount * 0.1)) };
  }
  return { type: 'neutral', score: 0 };
}

// Función principal
async function testFullScraper() {
  console.log('========================================');
  console.log('PRUEBA COMPLETA DE SCRAPING');
  console.log('========================================\n');

  // Obtener sitios monitoreados de la base de datos
  console.log('1. Obteniendo sitios monitoreados de Supabase...');

  const sitesResult = await supabaseRequest('/rest/v1/monitored_news_sites?is_active=eq.true&select=*');

  if (sitesResult.status !== 200 || !sitesResult.data?.length) {
    console.log('   No hay sitios monitoreados activos');
    console.log('   Usando sitios de prueba por defecto...\n');
  } else {
    console.log(`   Encontrados ${sitesResult.data.length} sitios monitoreados\n`);
  }

  const monitoredSites = sitesResult.data || [];
  let totalMentionsSaved = 0;

  for (const site of TEST_SITES) {
    console.log(`\n--- Procesando: ${site.name} ---`);
    console.log(`URL: ${site.rssUrl}`);

    try {
      const startTime = Date.now();
      const response = await fetchWithTimeout(site.rssUrl);
      const duration = Date.now() - startTime;

      if (response.status !== 200) {
        console.log(`ERROR: HTTP ${response.status}`);
        continue;
      }

      const items = extractRSSItems(response.data);
      console.log(`Estado: OK (${duration}ms)`);
      console.log(`Artículos encontrados: ${items.length}`);

      // Buscar el monitored_site correspondiente
      const monitoredSite = monitoredSites.find(ms => ms.site_id === site.id);

      if (!monitoredSite) {
        console.log(`AVISO: No hay sitio monitoreado para ${site.id} en la base de datos`);
        continue;
      }

      console.log(`Monitored Site ID: ${monitoredSite.id}`);
      console.log(`User ID: ${monitoredSite.user_id}`);

      // Preparar menciones para insertar
      const mentionsToInsert = items.slice(0, 10).map(item => {
        const sentiment = analyzeSentiment(item.title + ' ' + item.description);

        return {
          user_id: monitoredSite.user_id,
          monitored_site_id: monitoredSite.id,
          article_url: item.link,
          article_title: item.title,
          article_author: null,
          mention_context: item.description.substring(0, 300),
          full_content: item.description,
          sentiment: sentiment.type,
          sentiment_score: sentiment.score,
          matched_terms: ['[noticia general]'],
          published_date: item.pubDate ? new Date(item.pubDate).toISOString() : null,
          article_hash: item.hash,
        };
      });

      console.log(`Insertando ${mentionsToInsert.length} menciones...`);

      // Insertar menciones una por una para manejar duplicados
      let insertedCount = 0;
      for (const mention of mentionsToInsert) {
        const insertResult = await supabaseRequest('/rest/v1/news_mentions', 'POST', mention);

        if (insertResult.status === 201) {
          insertedCount++;
        } else if (insertResult.status === 409 || (insertResult.data?.message && insertResult.data.message.includes('duplicate'))) {
          // Duplicado, ignorar
        } else {
          console.log(`   Error insertando: ${JSON.stringify(insertResult.data)}`);
        }
      }

      console.log(`Menciones insertadas: ${insertedCount} (${mentionsToInsert.length - insertedCount} duplicados)`);
      totalMentionsSaved += insertedCount;

      // Actualizar last_checked_at
      const updateResult = await supabaseRequest(
        `/rest/v1/monitored_news_sites?id=eq.${monitoredSite.id}`,
        'PATCH',
        { last_checked_at: new Date().toISOString() }
      );

      if (updateResult.status === 200 || updateResult.status === 204) {
        console.log('last_checked_at actualizado');
      }

    } catch (error) {
      console.log(`ERROR: ${error.message}`);
    }
  }

  // Verificar menciones en la base de datos
  console.log('\n========================================');
  console.log('VERIFICACIÓN FINAL');
  console.log('========================================\n');

  const mentionsResult = await supabaseRequest('/rest/v1/news_mentions?select=count&limit=1');
  console.log(`Total menciones guardadas en esta ejecución: ${totalMentionsSaved}`);

  const allMentionsResult = await supabaseRequest('/rest/v1/news_mentions?select=id,article_title,sentiment,created_at&order=created_at.desc&limit=5');

  if (allMentionsResult.data?.length > 0) {
    console.log('\nÚltimas 5 menciones en la base de datos:');
    allMentionsResult.data.forEach((m, i) => {
      console.log(`  ${i + 1}. [${m.sentiment}] ${m.article_title?.substring(0, 60)}...`);
    });
  }

  console.log('\n========================================');
  console.log('PRUEBA COMPLETADA');
  console.log('========================================');
}

// Ejecutar prueba
testFullScraper().catch(console.error);
