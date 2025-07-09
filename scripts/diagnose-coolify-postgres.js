#!/usr/bin/env node

// Script específico para diagnosticar PostgreSQL en Coolify
console.log('🔍 DIAGNOSE-COOLIFY-POSTGRES: Iniciando diagnóstico completo...');
console.log('=' .repeat(80));

const { Pool } = require('pg');
const { execSync } = require('child_process');

// Función para ejecutar comandos de sistema
function runCommand(command, description) {
  try {
    console.log(`\n📋 ${description}:`);
    const output = execSync(command, { encoding: 'utf8' });
    console.log(output.trim());
    return output;
  } catch (error) {
    console.log(`❌ Error ejecutando comando: ${error.message}`);
    return null;
  }
}

// Función para verificar conexión directa con psql
async function testPsqlConnection() {
  console.log('\n🔍 PROBANDO CONEXIÓN CON PSQL:');
  console.log('=' .repeat(50));
  
  // Extraer componentes de DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log('❌ DATABASE_URL no definida');
    return;
  }
  
  const match = databaseUrl.match(/postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!match) {
    console.log('❌ No se pudo parsear DATABASE_URL');
    return;
  }
  
  const [, user, password, host, port, database] = match;
  
  // Intentar conexión con psql
  const psqlCommand = `PGPASSWORD="${password}" psql -h ${host} -p ${port} -U ${user} -d ${database} -c "SELECT version();" 2>&1`;
  
  console.log('📋 Comando psql (sin contraseña visible):');
  console.log(`   PGPASSWORD="***" psql -h ${host} -p ${port} -U ${user} -d ${database} -c "SELECT version();"`);
  
  try {
    const output = execSync(psqlCommand, { encoding: 'utf8' });
    console.log('✅ CONEXIÓN EXITOSA CON PSQL:');
    console.log(output);
  } catch (error) {
    console.log('❌ ERROR CON PSQL:');
    console.log(error.message);
  }
}

// Función para probar diferentes contraseñas
async function testPasswords() {
  console.log('\n🔍 PROBANDO DIFERENTES CONTRASEÑAS:');
  console.log('=' .repeat(50));
  
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log('❌ DATABASE_URL no definida');
    return;
  }
  
  const match = databaseUrl.match(/postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!match) {
    console.log('❌ No se pudo parsear DATABASE_URL');
    return;
  }
  
  const [, user, envPassword, host, port, database] = match;
  
  // Contraseñas a probar
  const passwords = [
    { pass: envPassword, desc: 'Contraseña de DATABASE_URL' },
    { pass: 'admin123', desc: 'admin123 (hardcoded)' },
    { pass: '//postgres:admin123', desc: '//postgres:admin123 (con prefijo)' },
    { pass: 'postgres', desc: 'postgres (default)' },
    { pass: 'password', desc: 'password (common)' },
    { pass: 'coolify', desc: 'coolify' },
    { pass: process.env.POSTGRES_PASSWORD, desc: 'POSTGRES_PASSWORD env var' },
    { pass: process.env.DB_PASSWORD, desc: 'DB_PASSWORD env var' },
  ].filter(p => p.pass); // Solo probar contraseñas que existan
  
  for (const { pass, desc } of passwords) {
    console.log(`\n🔑 Probando: ${desc}`);
    console.log(`   Longitud: ${pass.length} caracteres`);
    console.log(`   Primeros 4: ${pass.substring(0, 4)}***`);
    
    const pool = new Pool({
      host,
      port: parseInt(port),
      user,
      password: pass,
      database,
      ssl: false,
      connectionTimeoutMillis: 3000,
      max: 1
    });
    
    try {
      const client = await pool.connect();
      console.log('   ✅ ¡CONEXIÓN EXITOSA!');
      console.log('   🎯 CONTRASEÑA CORRECTA ENCONTRADA:', desc);
      
      // Guardar la contraseña correcta
      console.log('\n🔧 CONFIGURACIÓN CORRECTA:');
      console.log(`const DATABASE_CONFIG = {`);
      console.log(`  internal: 'postgres://${user}:${pass}@${host}:${port}/${database}',`);
      console.log(`  external: 'postgres://${user}:${pass}@localhost:5435/${database}',`);
      console.log(`  username: '${user}',`);
      console.log(`  password: '${pass}'`);
      console.log(`};`);
      
      client.release();
      await pool.end();
      return true;
    } catch (error) {
      console.log(`   ❌ Falló: ${error.code}`);
    } finally {
      await pool.end();
    }
  }
  
  return false;
}

// Función para verificar configuración de red
async function checkNetworkConfig() {
  console.log('\n🔍 VERIFICANDO CONFIGURACIÓN DE RED:');
  console.log('=' .repeat(50));
  
  // Verificar resolución DNS
  runCommand('nslookup rkgwkkss048ck00skskc08gs 2>&1 || echo "nslookup no disponible"', 'Resolución DNS');
  
  // Verificar conectividad
  runCommand('ping -c 1 rkgwkkss048ck00skskc08gs 2>&1 || echo "ping no disponible"', 'Ping al host');
  
  // Verificar puertos abiertos
  runCommand('nc -zv rkgwkkss048ck00skskc08gs 5432 2>&1 || echo "nc no disponible"', 'Puerto 5432');
  
  // Verificar rutas
  runCommand('ip route 2>&1 || route -n 2>&1 || echo "comandos de ruta no disponibles"', 'Tabla de rutas');
}

// Función para mostrar todas las variables
async function showAllEnvVars() {
  console.log('\n🔍 TODAS LAS VARIABLES DE ENTORNO:');
  console.log('=' .repeat(50));
  
  const postgresRelated = {};
  const coolifyRelated = {};
  const dbRelated = {};
  
  Object.entries(process.env).forEach(([key, value]) => {
    const keyLower = key.toLowerCase();
    
    if (keyLower.includes('postgres')) {
      postgresRelated[key] = value;
    } else if (keyLower.includes('coolify')) {
      coolifyRelated[key] = value;
    } else if (keyLower.includes('db') || keyLower.includes('database')) {
      dbRelated[key] = value;
    }
  });
  
  console.log('\n📋 Variables POSTGRES:');
  Object.entries(postgresRelated).forEach(([k, v]) => {
    console.log(`   ${k}: ${v?.includes?.('postgres://') ? v.replace(/:([^@]+)@/, ':***@') : v}`);
  });
  
  console.log('\n📋 Variables COOLIFY:');
  Object.entries(coolifyRelated).forEach(([k, v]) => {
    console.log(`   ${k}: ${v}`);
  });
  
  console.log('\n📋 Variables DB/DATABASE:');
  Object.entries(dbRelated).forEach(([k, v]) => {
    console.log(`   ${k}: ${v?.includes?.('postgres://') ? v.replace(/:([^@]+)@/, ':***@') : v}`);
  });
}

// Función principal
async function main() {
  console.log('🚀 DIAGNOSE-COOLIFY-POSTGRES: Ejecutando diagnóstico completo...');
  
  // Información básica
  console.log('\n📋 INFORMACIÓN BÁSICA:');
  console.log(`   Hostname: ${process.env.HOSTNAME || 'No definido'}`);
  console.log(`   Container ID: ${process.env.CONTAINER_ID || 'No definido'}`);
  console.log(`   PWD: ${process.cwd()}`);
  console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
  
  // Mostrar todas las variables
  await showAllEnvVars();
  
  // Verificar configuración de red
  await checkNetworkConfig();
  
  // Probar conexión con psql
  await testPsqlConnection();
  
  // Probar diferentes contraseñas
  const found = await testPasswords();
  
  if (!found) {
    console.log('\n❌ NO SE ENCONTRÓ LA CONTRASEÑA CORRECTA');
    console.log('💡 La contraseña real podría estar:');
    console.log('   1. En una variable de entorno no detectada');
    console.log('   2. Configurada directamente en PostgreSQL');
    console.log('   3. Usando un formato especial de Coolify');
  }
  
  console.log('\n🏁 DIAGNOSE-COOLIFY-POSTGRES: Diagnóstico completado');
}

// Ejecutar
main().catch(console.error);