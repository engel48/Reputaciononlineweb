/**
 * Script de prueba para el sistema de scraping de noticias colombianas
 * Run: node scripts/test-scraping.js
 */

const API_BASE = 'http://localhost:3000/api/noticias-colombia';

async function testSitiosEndpoint() {
  console.log('\n===== TEST 1: Listar Sitios Disponibles =====\n');

  try {
    const response = await fetch(`${API_BASE}/sitios?activos=true&stats=true&limit=5`);
    const data = await response.json();

    if (data.success) {
      console.log(`✅ Encontrados ${data.data.summary.totalSitios} sitios totales`);
      console.log(`✅ Sitios activos: ${data.data.summary.sitiosActivos}`);
      console.log('\nPrimeros 5 sitios:');
      data.data.sitios.forEach((sitio, i) => {
        console.log(`  ${i + 1}. ${sitio.nombre} (${sitio.categoria})`);
        if (sitio.stats) {
          console.log(`     - Scrapes exitosos: ${sitio.stats.scrapesExitosos}/${sitio.stats.totalScrapes}`);
          console.log(`     - Tasa éxito: ${sitio.stats.tasaExito}%`);
        }
      });
    } else {
      console.error('❌ Error:', data.error);
    }
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
  }
}

async function testScrapingEndpoint() {
  console.log('\n===== TEST 2: Scrapear Sitio Individual =====\n');

  const sitioId = 'eltiempo'; // Cambiar según necesidad

  try {
    console.log(`🔍 Scrapeando ${sitioId}...`);
    const startTime = Date.now();

    const response = await fetch(`${API_BASE}/scrape?sitio=${sitioId}&limit=5`);
    const data = await response.json();

    const duration = Date.now() - startTime;

    if (data.success) {
      console.log(`✅ Scraping exitoso en ${duration}ms`);
      console.log(`✅ Sitio: ${data.data.sitio.nombre}`);
      console.log(`✅ Cached: ${data.data.scraping.cached ? 'Sí' : 'No'}`);
      console.log(`✅ Artículos encontrados: ${data.data.pagination.total}`);
      console.log('\nPrimeras 5 noticias:');
      data.data.articles.forEach((article, i) => {
        console.log(`\n  ${i + 1}. ${article.titulo}`);
        console.log(`     URL: ${article.url}`);
        console.log(`     Autor: ${article.autor || 'N/A'}`);
        console.log(`     Fecha: ${article.fechaPublicacion}`);
      });
    } else {
      console.error('❌ Error:', data.error);
      if (data.data && data.data.scraping && data.data.scraping.error) {
        console.error('   Detalles:', data.data.scraping.error);
      }
    }
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
  }
}

async function testScrapeAllEndpoint() {
  console.log('\n===== TEST 3: Scraping Masivo =====\n');

  const requestBody = {
    sitios: ['eltiempo', 'elespectador', 'semana'],
    concurrency: 2
  };

  try {
    console.log(`🔍 Scrapeando ${requestBody.sitios.length} sitios...`);
    const startTime = Date.now();

    const response = await fetch(`${API_BASE}/scrape-all`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    const duration = Date.now() - startTime;

    if (data.success) {
      console.log(`✅ Scraping masivo completado en ${duration}ms`);
      console.log(`✅ Total sitios: ${data.data.stats.total}`);
      console.log(`✅ Exitosos: ${data.data.stats.successful}`);
      console.log(`✅ Fallidos: ${data.data.stats.failed}`);
      console.log(`✅ Total artículos: ${data.data.stats.totalArticles}`);
      console.log(`✅ Duración promedio: ${data.data.stats.averageDuration}ms`);

      console.log('\nResultados por sitio:');
      data.data.results.forEach((result, i) => {
        const status = result.success ? '✅' : '❌';
        console.log(`  ${status} ${result.sitioNombre}: ${result.articlesCount} artículos (${result.durationMs}ms)`);
        if (result.error) {
          console.log(`     Error: ${result.error}`);
        }
      });
    } else {
      console.error('❌ Error:', data.error);
    }
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
  }
}

async function testCachePerformance() {
  console.log('\n===== TEST 4: Performance del Cache =====\n');

  const sitioId = 'eltiempo';

  try {
    // Primera llamada (sin cache)
    console.log('🔍 Primera llamada (sin cache)...');
    const start1 = Date.now();
    const response1 = await fetch(`${API_BASE}/scrape?sitio=${sitioId}&limit=5`);
    const data1 = await response1.json();
    const duration1 = Date.now() - start1;

    console.log(`  Duración: ${duration1}ms`);
    console.log(`  Cached: ${data1.data.scraping.cached}`);

    // Segunda llamada (con cache)
    console.log('\n🔍 Segunda llamada (con cache)...');
    const start2 = Date.now();
    const response2 = await fetch(`${API_BASE}/scrape?sitio=${sitioId}&limit=5`);
    const data2 = await response2.json();
    const duration2 = Date.now() - start2;

    console.log(`  Duración: ${duration2}ms`);
    console.log(`  Cached: ${data2.data.scraping.cached}`);

    const improvement = ((duration1 - duration2) / duration1 * 100).toFixed(2);
    console.log(`\n✅ Mejora de performance con cache: ${improvement}%`);
    console.log(`✅ Ahorro de tiempo: ${duration1 - duration2}ms`);

  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
  }
}

async function testRateLimit() {
  console.log('\n===== TEST 5: Rate Limiting =====\n');

  const sitioId = 'eltiempo';

  try {
    console.log('🔍 Enviando 35 requests rápidos (límite: 30/min)...\n');

    const promises = [];
    for (let i = 0; i < 35; i++) {
      promises.push(
        fetch(`${API_BASE}/scrape?sitio=${sitioId}&limit=1`)
          .then(r => r.json())
          .then(data => ({ index: i + 1, success: data.success, error: data.error }))
      );
    }

    const results = await Promise.all(promises);

    const successful = results.filter(r => r.success).length;
    const rateLimited = results.filter(r => !r.success && r.error?.includes('Rate limit')).length;

    console.log(`✅ Requests exitosos: ${successful}`);
    console.log(`⚠️  Requests bloqueados por rate limit: ${rateLimited}`);

    if (rateLimited > 0) {
      console.log('\n✅ Rate limiting funcionando correctamente');
    } else {
      console.log('\n⚠️  Rate limiting no se activó (puede que el límite sea mayor)');
    }

  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
  }
}

async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  SISTEMA DE SCRAPING DE NOTICIAS COLOMBIANAS - TEST SUITE ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  await testSitiosEndpoint();
  await new Promise(resolve => setTimeout(resolve, 1000));

  await testScrapingEndpoint();
  await new Promise(resolve => setTimeout(resolve, 1000));

  await testScrapeAllEndpoint();
  await new Promise(resolve => setTimeout(resolve, 1000));

  await testCachePerformance();
  await new Promise(resolve => setTimeout(resolve, 1000));

  await testRateLimit();

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                   TESTS COMPLETADOS                        ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
}

// Run tests
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testSitiosEndpoint,
  testScrapingEndpoint,
  testScrapeAllEndpoint,
  testCachePerformance,
  testRateLimit
};
