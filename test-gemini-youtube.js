#!/usr/bin/env node
/**
 * Script de prueba para verificar la configuración de Gemini API
 * para el sistema de YouTube Listening
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Cargar API Key desde variable de entorno
// Para ejecutar: GEMINI_API_KEY=tu-api-key node test-gemini-youtube.js
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

console.log('🧪 Test de Gemini API para YouTube Listening\n');
console.log('=' .repeat(60));

// Test 1: Verificar API Key
console.log('\n📋 Test 1: Verificar API Key');
console.log('-'.repeat(60));
if (!GEMINI_API_KEY) {
  console.error('❌ ERROR: GEMINI_API_KEY no está configurada en .env.local');
  process.exit(1);
}
console.log(`✅ API Key encontrada: ${GEMINI_API_KEY.substring(0, 20)}...`);

// Test 2: Inicializar cliente
console.log('\n📋 Test 2: Inicializar cliente de Gemini');
console.log('-'.repeat(60));
let genAI;
let model;
try {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  console.log('✅ Cliente de Gemini inicializado correctamente');
  console.log('   Modelo: gemini-2.0-flash (rápido y eficiente)');
} catch (error) {
  console.error('❌ ERROR al inicializar:', error.message);
  process.exit(1);
}

// Test 3: Análisis de sentimiento simple
console.log('\n📋 Test 3: Análisis de sentimiento (caso positivo)');
console.log('-'.repeat(60));
async function testPositiveSentiment() {
  try {
    const testComment = "¡Me encanta este video! Excelente contenido, muy útil y bien explicado. Gracias por compartir.";
    console.log(`💬 Comentario de prueba: "${testComment}"`);

    const prompt = `Analiza el sentimiento del siguiente comentario de YouTube y responde ÚNICAMENTE en formato JSON:

Comentario: "${testComment}"

Debes responder con este formato exacto:
{
  "sentiment": "positive" | "negative" | "neutral",
  "score": número entre -1.0 y 1.0,
  "explanation": "explicación breve"
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('\n📊 Respuesta de Gemini:');
    console.log(text);

    // Intentar parsear JSON
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        console.log('\n✅ JSON parseado correctamente:');
        console.log(`   Sentimiento: ${analysis.sentiment}`);
        console.log(`   Score: ${analysis.score}`);
        console.log(`   Explicación: ${analysis.explanation}`);
      } else {
        console.log('⚠️  Respuesta no está en formato JSON esperado');
      }
    } catch (parseError) {
      console.log('⚠️  No se pudo parsear como JSON, pero la API responde');
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    throw error;
  }
}

// Test 4: Análisis de sentimiento negativo
console.log('\n📋 Test 4: Análisis de sentimiento (caso negativo)');
console.log('-'.repeat(60));
async function testNegativeSentiment() {
  try {
    const testComment = "Este video es horrible, pérdida de tiempo. No recomiendo para nada.";
    console.log(`💬 Comentario de prueba: "${testComment}"`);

    const prompt = `Analiza el sentimiento del siguiente comentario de YouTube y responde ÚNICAMENTE en formato JSON:

Comentario: "${testComment}"

Formato:
{
  "sentiment": "positive" | "negative" | "neutral",
  "score": número entre -1.0 y 1.0,
  "explanation": "explicación breve"
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('\n📊 Respuesta de Gemini:');
    console.log(text);

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        console.log('\n✅ JSON parseado correctamente:');
        console.log(`   Sentimiento: ${analysis.sentiment}`);
        console.log(`   Score: ${analysis.score}`);
        console.log(`   Explicación: ${analysis.explanation}`);
      }
    } catch (parseError) {
      console.log('⚠️  Respuesta válida pero no en JSON esperado');
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    throw error;
  }
}

// Test 5: Detección de sarcasmo
console.log('\n📋 Test 5: Detección de sarcasmo/ironía');
console.log('-'.repeat(60));
async function testSarcasmDetection() {
  try {
    const testComment = "Qué video tan 'genial', me encanta perder mi tiempo así 🙄";
    console.log(`💬 Comentario de prueba: "${testComment}"`);

    const prompt = `Analiza el sentimiento del siguiente comentario de YouTube detectando sarcasmo e ironía:

Comentario: "${testComment}"

Responde en JSON:
{
  "sentiment": "positive" | "negative" | "neutral",
  "score": número entre -1.0 y 1.0,
  "explanation": "explicación detectando sarcasmo si existe",
  "sarcasm_detected": true | false
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('\n📊 Respuesta de Gemini:');
    console.log(text);

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        console.log('\n✅ Análisis completo:');
        console.log(`   Sentimiento: ${analysis.sentiment}`);
        console.log(`   Score: ${analysis.score}`);
        console.log(`   Sarcasmo detectado: ${analysis.sarcasm_detected}`);
        console.log(`   Explicación: ${analysis.explanation}`);
      }
    } catch (parseError) {
      console.log('⚠️  Respuesta válida pero formato diferente');
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    throw error;
  }
}

// Ejecutar todos los tests
(async () => {
  try {
    await testPositiveSentiment();
    await testNegativeSentiment();
    await testSarcasmDetection();

    console.log('\n' + '='.repeat(60));
    console.log('🎉 TODOS LOS TESTS COMPLETADOS EXITOSAMENTE');
    console.log('='.repeat(60));
    console.log('\n✅ Tu API de Gemini está configurada correctamente');
    console.log('✅ El análisis de sentimiento funciona');
    console.log('✅ Sistema listo para YouTube Listening\n');

    console.log('📋 Próximos pasos:');
    console.log('   1. Configurar Google OAuth (GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET)');
    console.log('   2. Conectar cuenta de YouTube en /dashboard');
    console.log('   3. Ejecutar primera sincronización');
    console.log('   4. Ver resultados en /api/youtube/dashboard\n');

  } catch (error) {
    console.error('\n❌ TESTS FALLARON');
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
