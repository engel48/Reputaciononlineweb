#!/usr/bin/env node

// Script para probar conexión en producción
console.log('🚀 PRODUCTION-TEST: Iniciando pruebas de conexión...');

const { Pool } = require('pg');

// Configuración de PostgreSQL para Coolify
const DATABASE_CONFIG = {
  internal: 'postgres://postgres:admin123@rkgwkkss048ck00skskc08gs:5432/postgres',
  external: 'postgres://postgres:admin123@localhost:5435/postgres'
};

// Detectar entorno
function detectEnvironment() {
  const nodeEnv = process.env.NODE_ENV;
  const coolifyFqdn = process.env.COOLIFY_FQDN;
  const vercelUrl = process.env.VERCEL_URL;
  const railwayUrl = process.env.RAILWAY_STATIC_URL;
  const isDockerContainer = process.env.IS_DOCKER || process.cwd() === '/app';
  
  return {
    isDevelopment: nodeEnv !== 'production',
    isProduction: nodeEnv === 'production',
    isCoolify: !!(coolifyFqdn || process.env.COOLIFY_URL),
    isVercel: !!vercelUrl,
    isRailway: !!railwayUrl,
    isLocal: !coolifyFqdn && !vercelUrl && !railwayUrl && !isDockerContainer,
    platform: coolifyFqdn ? 'coolify' : 
              vercelUrl ? 'vercel' : 
              railwayUrl ? 'railway' : 
              isDockerContainer ? 'docker' : 'local'
  };
}

// Función para probar conexión
async function testConnection(connectionString, name) {
  console.log(`🔍 PRODUCTION-TEST: Probando conexión ${name}...`);
  
  const pool = new Pool({
    connectionString,
    ssl: false,
    connectionTimeoutMillis: 5000,
    max: 1
  });
  
  try {
    const client = await pool.connect();
    console.log(`✅ PRODUCTION-TEST: Conexión ${name} exitosa`);
    
    // Probar una query simple
    const result = await client.query('SELECT version(), current_user, current_database(), NOW()');
    console.log(`📋 PRODUCTION-TEST: Información de ${name}:`);
    console.log('   PostgreSQL:', result.rows[0].version.split(' ')[0]);
    console.log('   Usuario:', result.rows[0].current_user);
    console.log('   Base de datos:', result.rows[0].current_database);
    console.log('   Timestamp:', result.rows[0].now);
    
    // Probar tabla usuarios
    try {
      const usersResult = await client.query('SELECT COUNT(*) FROM users');
      console.log('   Usuarios en BD:', usersResult.rows[0].count);
    } catch (tableError) {
      console.log('   Tabla usuarios: No existe (primera vez)');
    }
    
    client.release();
    return true;
    
  } catch (error) {
    console.error(`❌ PRODUCTION-TEST: Error en conexión ${name}:`);
    console.error('   Mensaje:', error.message);
    console.error('   Código:', error.code);
    
    if (error.code === 'ENOTFOUND') {
      console.log('   💡 Sugerencia: Hostname no accesible desde este entorno');
    } else if (error.code === '28P01') {
      console.log('   💡 Sugerencia: Error de autenticación');
    }
    
    return false;
  } finally {
    await pool.end();
  }
}

async function main() {
  const env = detectEnvironment();
  console.log('🔍 PRODUCTION-TEST: Entorno detectado:', env.platform);
  console.log('🔍 PRODUCTION-TEST: Variables de entorno relevantes:');
  console.log('   NODE_ENV:', process.env.NODE_ENV || 'No definido');
  console.log('   COOLIFY_FQDN:', process.env.COOLIFY_FQDN || 'No definido');
  console.log('   COOLIFY_URL:', process.env.COOLIFY_URL || 'No definido');
  console.log('   IS_DOCKER:', process.env.IS_DOCKER || 'No definido');
  console.log('   PWD:', process.cwd());
  
  let testResults = [];
  
  // Probar conexión interna
  const internalResult = await testConnection(DATABASE_CONFIG.internal, 'INTERNA');
  testResults.push({ name: 'INTERNA', success: internalResult });
  
  // Probar conexión externa
  const externalResult = await testConnection(DATABASE_CONFIG.external, 'EXTERNA');
  testResults.push({ name: 'EXTERNA', success: externalResult });
  
  // Resumen
  console.log('\n📋 PRODUCTION-TEST: Resumen de conexiones:');
  console.log('=' .repeat(50));
  testResults.forEach(result => {
    console.log(`   ${result.name}: ${result.success ? '✅ EXITOSA' : '❌ FALLIDA'}`);
  });
  
  const anySuccess = testResults.some(r => r.success);
  console.log('\n🎯 PRODUCTION-TEST: Resultado general:', anySuccess ? '✅ AL MENOS UNA CONEXIÓN EXITOSA' : '❌ TODAS LAS CONEXIONES FALLARON');
  
  return anySuccess;
}

// Ejecutar pruebas
main().then(success => {
  console.log('🏁 PRODUCTION-TEST: Pruebas completadas');
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 PRODUCTION-TEST: Error fatal:', error);
  process.exit(1);
});