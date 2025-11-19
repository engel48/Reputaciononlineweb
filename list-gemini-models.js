#!/usr/bin/env node
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Cargar API Key desde variable de entorno
// Para ejecutar: GEMINI_API_KEY=tu-api-key node list-gemini-models.js
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

console.log('🔍 Listando modelos disponibles de Gemini...\n');

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function listModels() {
  try {
    // Intentar con diferentes versiones de API
    const versions = ['v1', 'v1beta'];

    for (const version of versions) {
      console.log(`\n📋 Probando API version: ${version}`);
      console.log('-'.repeat(60));

      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/${version}/models?key=${GEMINI_API_KEY}`);
        const data = await response.json();

        if (data.models) {
          console.log(`✅ Modelos disponibles en ${version}:`);
          data.models.forEach(model => {
            console.log(`   - ${model.name}`);
            console.log(`     Métodos: ${model.supportedGenerationMethods?.join(', ')}`);
          });
        } else if (data.error) {
          console.log(`❌ Error en ${version}:`, data.error.message);
        }
      } catch (error) {
        console.log(`❌ Error con ${version}:`, error.message);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

listModels();
