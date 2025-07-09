#!/usr/bin/env node

// Script para depurar todas las variables de entorno relacionadas con PostgreSQL
console.log('🔍 DEBUG-ENV-VARS: Analizando TODAS las variables de entorno...');
console.log('=' .repeat(80));

// Función para extraer credenciales de una URL
function extractCredentials(url) {
  if (!url) return null;
  
  const match = url.match(/postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!match) return null;
  
  const [, username, password, host, port, database] = match;
  return { username, password, host, port, database };
}

// Mostrar información básica del entorno
console.log('📋 INFORMACIÓN BÁSICA DEL ENTORNO:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'No definido'}`);
console.log(`   PWD: ${process.cwd()}`);
console.log(`   HOSTNAME: ${process.env.HOSTNAME || 'No definido'}`);
console.log(`   PORT: ${process.env.PORT || 'No definido'}`);
console.log(`   USER: ${process.env.USER || 'No definido'}`);

// Buscar TODAS las variables que contengan palabras clave relacionadas con PostgreSQL
const keywords = ['postgres', 'database', 'db', 'sql', 'pg', 'connection', 'dsn', 'uri', 'url'];
const relatedVars = {};

Object.keys(process.env).forEach(key => {
  const keyLower = key.toLowerCase();
  const value = process.env[key];
  
  // Buscar por palabras clave
  const hasKeyword = keywords.some(keyword => keyLower.includes(keyword));
  
  // Buscar por patrones de URL de PostgreSQL
  const looksLikePostgresUrl = value && value.includes('postgres://');
  
  if (hasKeyword || looksLikePostgresUrl) {
    relatedVars[key] = value;
  }
});

console.log('\n📋 VARIABLES RELACIONADAS CON POSTGRESQL:');
console.log('=' .repeat(50));

if (Object.keys(relatedVars).length === 0) {
  console.log('❌ No se encontraron variables relacionadas con PostgreSQL');
} else {
  Object.entries(relatedVars).forEach(([key, value]) => {
    console.log(`\n🔑 ${key}:`);
    console.log(`   Valor: ${value || 'Vacío'}`);
    
    if (value && value.includes('postgres://')) {
      console.log(`   Es URL de PostgreSQL: Sí`);
      const credentials = extractCredentials(value);
      if (credentials) {
        console.log(`   Usuario: ${credentials.username}`);
        console.log(`   Contraseña: ${credentials.password.length} caracteres, inicia con: ${credentials.password.substring(0, 4)}***`);
        console.log(`   Host: ${credentials.host}`);
        console.log(`   Puerto: ${credentials.port}`);
        console.log(`   Base de datos: ${credentials.database}`);
      }
    } else {
      console.log(`   Es URL de PostgreSQL: No`);
    }
  });
}

// Mostrar variables que podrían estar interfiriendo
console.log('\n📋 VARIABLES ESPECIALES DE COOLIFY:');
console.log('=' .repeat(50));

const coolifyVars = [
  'COOLIFY_FQDN',
  'COOLIFY_URL', 
  'COOLIFY_DATABASE_URL',
  'INTERNAL_DATABASE_URL',
  'EXTERNAL_DATABASE_URL',
  'DB_HOST',
  'DB_PORT',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'POSTGRES_HOST',
  'POSTGRES_PORT',
  'POSTGRES_USER',
  'POSTGRES_PASSWORD',
  'POSTGRES_DB',
  'POSTGRES_DATABASE',
  'POSTGRESQL_URL',
  'POSTGRESQL_HOST',
  'POSTGRESQL_PORT',
  'POSTGRESQL_USER',
  'POSTGRESQL_PASSWORD',
  'POSTGRESQL_DATABASE'
];

coolifyVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.includes('postgres://') ? value.replace(/:([^@]+)@/, ':***@') : value}`);
  } else {
    console.log(`❌ ${varName}: No definido`);
  }
});

// Buscar variables que contengan la contraseña problemática
console.log('\n📋 BUSCANDO CONTRASEÑA PROBLEMÁTICA (19 caracteres, //po***)...');
console.log('=' .repeat(50));

let foundProblematicPassword = false;

Object.entries(process.env).forEach(([key, value]) => {
  if (value && value.includes('postgres://')) {
    const credentials = extractCredentials(value);
    if (credentials && credentials.password.length === 19 && credentials.password.startsWith('//po')) {
      console.log(`🎯 ENCONTRADA EN ${key}:`);
      console.log(`   Valor completo: ${value}`);
      console.log(`   Contraseña problemática: ${credentials.password}`);
      foundProblematicPassword = true;
    }
  }
});

if (!foundProblematicPassword) {
  console.log('❌ No se encontró la contraseña problemática en las variables de entorno');
  console.log('💡 Podría estar siendo generada dinámicamente o estar oculta');
}

// Mostrar todas las variables (útil para debugging)
console.log('\n📋 TODAS LAS VARIABLES DE ENTORNO (primeras 100):');
console.log('=' .repeat(50));

const allVars = Object.keys(process.env).sort();
allVars.slice(0, 100).forEach(key => {
  const value = process.env[key];
  const displayValue = value && value.length > 50 ? value.substring(0, 50) + '...' : value;
  console.log(`${key}: ${displayValue || 'undefined'}`);
});

if (allVars.length > 100) {
  console.log(`... y ${allVars.length - 100} variables más`);
}

console.log('\n🏁 DEBUG-ENV-VARS: Análisis completado');