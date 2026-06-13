/**
 * Script de testing para el sistema de monitoreo de noticias
 * Ejecutar con: npx tsx scripts/test-news-monitoring.ts
 */

import { scrapeSite } from '../src/lib/news-monitoring/scraper';
import { analyzeSentiment } from '../src/lib/news-monitoring/sentiment';
import { NEWS_SITES_CONFIG, getSitesStats } from '../src/lib/news-monitoring/sites-config';

async function testSitesConfig() {
  console.log('\n=== TEST: Sites Configuration ===\n');

  const stats = getSitesStats();
  console.log('Total sites configured:', stats.total);
  console.log('Active sites:', stats.active);
  console.log('\nBy category:', stats.byCategory);
  console.log('\nBy method:', stats.byMethod);

  console.log('\n✓ Sites configuration test passed\n');
}

async function testSentimentAnalysis() {
  console.log('\n=== TEST: Sentiment Analysis ===\n');

  const testCases = [
    {
      text: 'El presidente Gustavo Petro logró un importante acuerdo de paz que beneficiará a millones de colombianos.',
      term: 'Gustavo Petro',
      expectedSentiment: 'positive',
    },
    {
      text: 'Escándalo de corrupción involucra al alcalde en caso de sobornos y malversación de fondos públicos.',
      term: 'alcalde',
      expectedSentiment: 'negative',
    },
    {
      text: 'El candidato anunció su propuesta de reforma tributaria en rueda de prensa.',
      term: 'candidato',
      expectedSentiment: 'neutral',
    },
    {
      text: 'No hay evidencia de corrupción en el gobierno actual, según la investigación.',
      term: 'gobierno',
      expectedSentiment: 'positive', // Negación invierte sentimiento
    },
  ];

  for (const testCase of testCases) {
    const result = await analyzeSentiment(testCase.text, testCase.term);

    console.log(`Text: "${testCase.text.substring(0, 80)}..."`);
    console.log(`Term: "${testCase.term}"`);
    console.log(`Sentiment: ${result.sentiment} (score: ${result.score})`);
    console.log(`Expected: ${testCase.expectedSentiment}`);
    console.log(`Explanation: ${result.explanation ?? '(pendiente)'}`);

    if (result.sentiment === testCase.expectedSentiment) {
      console.log('✓ PASS\n');
    } else {
      console.log('✗ FAIL\n');
    }
  }

  console.log('✓ Sentiment analysis test completed\n');
}

async function testScraping() {
  console.log('\n=== TEST: Scraping (El Tiempo RSS) ===\n');

  const searchTerms = ['Colombia', 'presidente', 'gobierno'];

  console.log('Testing scraping with terms:', searchTerms);
  console.log('This will make a real HTTP request to El Tiempo RSS feed...\n');

  const result = await scrapeSite('el-tiempo', searchTerms);

  console.log('Scraping result:');
  console.log('  Success:', result.success);
  console.log('  Articles scraped:', result.articlesScraped);
  console.log('  Mentions found:', result.mentionsFound);

  if (result.error) {
    console.log('  Error:', result.error);
  }

  if (result.mentions.length > 0) {
    console.log('\nFirst mention found:');
    const firstMention = result.mentions[0];
    console.log('  Title:', firstMention.article.title);
    console.log('  URL:', firstMention.article.url);
    console.log('  Sentiment:', firstMention.sentiment.type);
    console.log('  Score:', firstMention.sentiment.score);
    console.log('  Matched terms:', firstMention.matchedTerms);
    console.log('  Context:', firstMention.context.substring(0, 150) + '...');
  }

  if (result.success) {
    console.log('\n✓ Scraping test passed\n');
  } else {
    console.log('\n✗ Scraping test failed\n');
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   NEWS MONITORING SYSTEM - TEST SUITE                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  try {
    await testSitesConfig();
    await testSentimentAnalysis();

    // Comentar esta línea si no quieres hacer requests reales
    // await testScraping();

    console.log('\n✓ All tests completed!\n');
  } catch (error) {
    console.error('\n✗ Test suite failed:', error);
    process.exit(1);
  }
}

main();
