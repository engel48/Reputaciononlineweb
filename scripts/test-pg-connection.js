#!/usr/bin/env node

// Script para probar la conexión PostgreSQL directamente con la librería pg
console.log('🔍 TEST-PG-CONNECTION: Probando conexión directa con pg...');

const { Pool } = require('pg');

// Función para probar conexión con diferentes configuraciones
async function testConnection(config, name) {
  console.log(`\n🔍 Probando: ${name}`);
  console.log('=' .repeat(50));
  
  // Mostrar configuración
  if (typeof config === 'string') {
    console.log(`📋 Connection String: ${config.replace(/:([^@]+)@/, ':***@')}`);
    
    // Parsear manualmente la URL
    const match = config.match(/postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    if (match) {
      const [, user, password, host, port, database] = match;
      console.log('📋 Componentes parseados:');
      console.log(`   Usuario: ${user}`);
      console.log(`   Contraseña: "${password}"`);
      console.log(`   Longitud real: ${password.length} caracteres`);
      console.log(`   Primeros 8 chars: "${password.substring(0, 8)}"`);
      console.log(`   Contiene //: ${password.includes('//') ? 'SÍ' : 'NO'}`);
      console.log(`   Host: ${host}`);
      console.log(`   Puerto: ${port}`);
      console.log(`   Base de datos: ${database}`);
    }
  } else {
    console.log('📋 Configuración objeto:');
    console.log(`   Host: ${config.host}`);
    console.log(`   Puerto: ${config.port}`);
    console.log(`   Usuario: ${config.user}`);
    console.log(`   Contraseña: ${config.password?.length} caracteres`);
    console.log(`   Base de datos: ${config.database}`);
  }
  
  // Crear pool
  const pool = new Pool(config);
  
  // Interceptar eventos de error
  pool.on('error', (err) => {
    console.error('🔴 Pool error event:', err.message);
  });
  
  try {
    console.log('⏳ Intentando conectar...');
    
    // Intentar conectar con timeout
    const client = await pool.connect();
    
    console.log('✅ ¡CONEXIÓN EXITOSA!');
    
    // Probar query simple
    const result = await client.query('SELECT current_user, current_database()');
    console.log('📋 Query ejecutada:');
    console.log(`   Usuario actual: ${result.rows[0].current_user}`);
    console.log(`   Base de datos: ${result.rows[0].current_database}`);
    
    client.release();
    
  } catch (error) {
    console.error('❌ ERROR DE CONEXIÓN:');
    console.error(`   Mensaje: ${error.message}`);
    console.error(`   Código: ${error.code}`);
    console.error(`   Severidad: ${error.severity || 'N/A'}`);
    console.error(`   Detalles: ${error.detail || 'N/A'}`);
    
    // Mostrar información adicional sobre el error
    if (error.message && error.message.includes('password')) {
      console.error('\n🔍 ANÁLISIS DEL ERROR DE CONTRASEÑA:');
      
      // Intentar extraer la contraseña que pg está usando
      if (error.message.includes('for user')) {
        console.error('   El error indica problema de autenticación');
        console.error('   PostgreSQL rechazó las credenciales proporcionadas');
      }
    }
  } finally {
    await pool.end();
  }
}

// Función principal
async function main() {
  console.log('🚀 TEST-PG-CONNECTION: Iniciando pruebas de conexión...');
  
  // Mostrar DATABASE_URL actual
  const databaseUrl = process.env.DATABASE_URL;
  console.log('\n📋 VARIABLE DATABASE_URL:');
  console.log(`   Definida: ${databaseUrl ? 'SÍ' : 'NO'}`);
  if (databaseUrl) {
    console.log(`   Valor: ${databaseUrl.replace(/:([^@]+)@/, ':***@')}`);
    console.log(`   Longitud total: ${databaseUrl.length} caracteres`);
  }
  
  // Configuraciones a probar
  const configs = [];
  
  // 1. Connection string directa (hardcoded)
  configs.push({
    config: 'postgres://postgres:admin123@rkgwkkss048ck00skskc08gs:5432/postgres',
    name: 'CONNECTION STRING HARDCODED'
  });
  
  // 2. Connection string desde DATABASE_URL
  if (databaseUrl) {
    configs.push({
      config: databaseUrl,
      name: 'CONNECTION STRING DESDE DATABASE_URL'
    });
  }
  
  // 3. Configuración como objeto (hardcoded)
  configs.push({
    config: {
      host: 'rkgwkkss048ck00skskc08gs',
      port: 5432,
      user: 'postgres',
      password: 'admin123',
      database: 'postgres',
      ssl: false
    },
    name: 'OBJETO CONFIG HARDCODED'
  });
  
  // 4. Configuración como objeto desde DATABASE_URL
  if (databaseUrl) {
    const match = databaseUrl.match(/postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    if (match) {
      const [, user, password, host, port, database] = match;
      configs.push({
        config: {
          host,
          port: parseInt(port),
          user,
          password,
          database,
          ssl: false
        },
        name: 'OBJETO CONFIG DESDE DATABASE_URL'
      });
    }
  }
  
  // Probar todas las configuraciones
  for (const { config, name } of configs) {
    await testConnection(config, name);
    console.log('\n' + '='.repeat(80) + '\n');
  }
  
  // Mostrar resumen
  console.log('🏁 TEST-PG-CONNECTION: Pruebas completadas');
  console.log('\n💡 NOTA: Si todas las conexiones fallan con la misma contraseña de 19 caracteres');
  console.log('   que empieza con //po***, entonces el problema está en la librería pg');
  console.log('   o en cómo se está parseando la URL de conexión.');
}

// Ejecutar
main().catch(console.error);