#!/usr/bin/env node

// Script para probar diferentes variaciones de contraseñas
const { Pool } = require('pg');

console.log('🔐 PRUEBA DE CONTRASEÑAS POSTGRESQL');
console.log('=' .repeat(60));

// Lista de posibles contraseñas y variaciones
const passwords = [
  'admin123',
  'Admin123',
  'ADMIN123',
  'admin123 ', // con espacio al final
  ' admin123', // con espacio al inicio
  'admin@123',
  'admin_123',
  'admin-123',
  'postgres',
  'password',
  'ReputacionOnline2025',
  'brrfcUVjU4QjzJDzCNzFLcCNCp4pbIQBrhJlMCLMbL1cAPAwf1t66C0o2LdPmIwf'
];

// Posibles hosts
const hosts = [
  'rkgwkkss048ck00skskc08gs',
  'postgresql-database-rkgwkkss048ck00skskc08gs',
  'postgres',
  'postgresql',
  'db',
  'database',
  'localhost'
];

async function testPassword(host, password) {
  const connectionString = `postgres://postgres:${password}@${host}:5432/postgres`;
  
  const pool = new Pool({
    connectionString,
    ssl: false,
    max: 1,
    connectionTimeoutMillis: 3000,
  });

  try {
    const client = await pool.connect();
    console.log(`✅ ÉXITO: host="${host}", password="${password}"`);
    
    // Si funciona, obtener más información
    const result = await client.query('SELECT current_database(), current_user, version()');
    console.log('   Base de datos:', result.rows[0].current_database);
    console.log('   Usuario:', result.rows[0].current_user);
    
    client.release();
    return true;
  } catch (error) {
    if (error.code === '28P01') {
      // Solo mostrar errores de autenticación si es verbose
      return false;
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      // Host no accesible, no seguir probando contraseñas para este host
      return 'skip_host';
    } else {
      console.log(`❓ Error inesperado con ${host}:`, error.code, error.message);
      return false;
    }
  } finally {
    await pool.end();
  }
}

async function runPasswordTests() {
  console.log('\n🚀 Probando combinaciones de host y contraseña...\n');
  
  let successCount = 0;
  
  for (const host of hosts) {
    console.log(`\n🔍 Probando host: ${host}`);
    let hostAccessible = true;
    
    for (const password of passwords) {
      if (!hostAccessible) break;
      
      const result = await testPassword(host, password);
      
      if (result === true) {
        successCount++;
        console.log(`\n🎯 CONTRASEÑA CORRECTA ENCONTRADA!`);
        console.log(`   Host: ${host}`);
        console.log(`   Password: ${password}`);
        console.log(`   URL completa: postgres://postgres:${password}@${host}:5432/postgres\n`);
        return; // Terminar al encontrar la correcta
      } else if (result === 'skip_host') {
        console.log(`   ❌ Host no accesible, saltando...`);
        hostAccessible = false;
      }
    }
    
    if (hostAccessible) {
      console.log(`   ❌ Ninguna contraseña funcionó para ${host}`);
    }
  }
  
  if (successCount === 0) {
    console.log('\n❌ No se encontró ninguna combinación válida');
    console.log('\n💡 POSIBLES CAUSAS:');
    console.log('1. La contraseña real no está en la lista de pruebas');
    console.log('2. El host correcto no está en la lista');
    console.log('3. PostgreSQL está en un puerto diferente a 5432');
    console.log('4. Hay restricciones de firewall o red');
  }
}

runPasswordTests()
  .then(() => {
    console.log('\n✅ Prueba completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error:', error);
    process.exit(1);
  });