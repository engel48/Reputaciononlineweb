/**
 * Script de prueba para verificar el scraper de noticias
 * Ejecutar: node scripts/test-scraper.js
 */

const https = require('https');
const http = require('http');

// Configuracion de sitios de prueba
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

// Funcion para hacer fetch con timeout
function fetchWithTimeout(url, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

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

// Funcion para extraer items de RSS
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
      items.push({
        title: cleanHtml(titleMatch[1]),
        link: linkMatch[1].trim(),
        description: descMatch ? cleanHtml(descMatch[1]).substring(0, 200) : '',
        pubDate: pubDateMatch ? pubDateMatch[1].trim() : '',
      });
    }
  }

  return items;
}

// Funcion para limpiar HTML
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

// Funcion principal de prueba
async function testScraper() {
  console.log('========================================');
  console.log('PRUEBA DE SCRAPER DE NOTICIAS');
  console.log('========================================\n');

  for (const site of TEST_SITES) {
    console.log(`\n--- Probando: ${site.name} ---`);
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
      console.log(`Articulos encontrados: ${items.length}`);

      if (items.length > 0) {
        console.log('\nUltimos 3 articulos:');
        items.slice(0, 3).forEach((item, i) => {
          console.log(`  ${i + 1}. ${item.title.substring(0, 80)}...`);
          console.log(`     Fecha: ${item.pubDate}`);
        });
      }

    } catch (error) {
      console.log(`ERROR: ${error.message}`);
    }
  }

  console.log('\n========================================');
  console.log('PRUEBA COMPLETADA');
  console.log('========================================');
}

// Ejecutar prueba
testScraper().catch(console.error);
