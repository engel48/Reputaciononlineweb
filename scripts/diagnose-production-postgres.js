#!/usr/bin/env node

// Script de diagnóstico específico para PostgreSQL en producción
console.log('🔍 DIAGNÓSTICO POSTGRES PRODUCCIÓN: Iniciando...');

const { Pool } = require('pg');

// Configuraciones a probar - CREDENCIALES CORRECTAS
const POSTGRES_CONFIGS = [
  {
    name: 'COOLIFY_INTERNAL_CORRECT',
    url: 'postgres://postgres:ghxdiIxvNX8kjwafpuvS03B6e7M0ECSoZdEqPtLJsEW3WxBxn1f6USpp4vb42HIc@aswcsw80wsoskcskkscwscoo:5432/postgres',
    description: 'Configuración interna correcta de Coolify'
  },
  {
    name: 'COOLIFY_EXTERNAL_CORRECT',
    url: 'postgres://thor3:thor44@31.97.138.249:5437/postgres',
    description: 'Configuración externa correcta'
  },
  {
    name: 'COOLIFY_INTERNAL_OLD',
    url: 'postgres://postgres:admin123@rkgwkkss048ck00skskc08gs:5432/postgres',
    description: 'Configuración interna antigua (para comparar)'
  },
  {
    name: 'COOLIFY_INTERNAL_ALTERNATIVE',
    url: 'postgres://postgres:ghxdiIxvNX8kjwafpuvS03B6e7M0ECSoZdEqPtLJsEW3WxBxn1f6USpp4vb42HIc@postgresql-database-aswcsw80wsoskcskkscwscoo:5432/postgres',
    description: 'Configuración interna con nombre completo del servicio'
  }
];

// Función para probar una configuración específica
async function testPostgresConfig(config) {
  console.log(`\n🔍 PROBANDO: ${config.name}`);
  console.log(`📝 Descripción: ${config.description}`);
  console.log(`🔗 URL: ${config.url.replace(/:([^@]+)@/, ':***@')}`);
  
  const pool = new Pool({
    connectionString: config.url,
    ssl: false,
    connectionTimeoutMillis: 5000,
    max: 1
  });
  
  try {
    console.log('⏳ Conectando...');
    const client = await pool.connect();
    
    console.log('✅ CONEXIÓN EXITOSA');
    
    // Información básica
    const versionResult = await client.query('SELECT version(), current_user, current_database(), NOW()');
    const version = versionResult.rows[0];
    
    console.log('📋 Información de la base de datos:');
    console.log(`   PostgreSQL: ${version.version.split(' ')[0]}`);
    console.log(`   Usuario: ${version.current_user}`);
    console.log(`   Base de datos: ${version.current_database}`);
    console.log(`   Timestamp: ${version.now}`);
    
    // Verificar tablas existentes
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`📊 Tablas encontradas: ${tablesResult.rows.length}`);
    if (tablesResult.rows.length > 0) {
      tablesResult.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    }
    
    // Verificar tabla de usuarios si existe
    try {
      const usersResult = await client.query('SELECT COUNT(*) as count FROM users');
      console.log(`👤 Usuarios en la tabla: ${usersResult.rows[0].count}`);
    } catch (tableError) {
      console.log('👤 Tabla users: No existe');
    }
    
    client.release();
    
    return {
      success: true,
      config: config.name,
      url: config.url,
      tablesCount: tablesResult.rows.length,
      tables: tablesResult.rows.map(r => r.table_name)
    };
    
  } catch (error) {
    console.error('❌ ERROR DE CONEXIÓN:');
    console.error(`   Mensaje: ${error.message}`);
    console.error(`   Código: ${error.code}`);
    console.error(`   Severidad: ${error.severity || 'N/A'}`);
    
    if (error.code === 'ENOTFOUND') {
      console.log('💡 El hostname no es accesible desde este entorno');
    } else if (error.code === '28P01') {
      console.log('💡 Error de autenticación - credenciales incorrectas');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('💡 Conexión rechazada - servicio no disponible');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('💡 Timeout de conexión - servicio no responde');
    }
    
    return {
      success: false,
      config: config.name,
      url: config.url,
      error: error.message,
      code: error.code
    };
  } finally {
    await pool.end();
  }
}

// Función principal
async function main() {
  console.log('🔍 DIAGNÓSTICO POSTGRES PRODUCCIÓN: Analizando entorno...');
  
  // Información del entorno
  console.log('\n📋 INFORMACIÓN DEL ENTORNO:');
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'No definido'}`);
  console.log(`   PWD: ${process.cwd()}`);
  console.log(`   HOSTNAME: ${process.env.HOSTNAME || 'No definido'}`);
  console.log(`   PORT: ${process.env.PORT || 'No definido'}`);
  console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? 'Definida' : 'No definida'}`);
  
  // Variables de entorno relacionadas con Coolify
  console.log('\n📋 VARIABLES DE COOLIFY:');
  console.log(`   COOLIFY_FQDN: ${process.env.COOLIFY_FQDN || 'No definido'}`);
  console.log(`   COOLIFY_URL: ${process.env.COOLIFY_URL || 'No definido'}`);
  console.log(`   IS_DOCKER: ${process.env.IS_DOCKER || 'No definido'}`);
  
  // Buscar variables que contengan "postgres"
  console.log('\n📋 VARIABLES RELACIONADAS CON POSTGRES:');
  const postgresVars = Object.keys(process.env).filter(key => 
    key.toLowerCase().includes('postgres') || 
    key.toLowerCase().includes('database')
  );
  
  if (postgresVars.length > 0) {
    postgresVars.forEach(key => {
      const value = process.env[key];
      const displayValue = value && value.includes('postgres://') ? 
        value.replace(/:([^@]+)@/, ':***@') : value;
      console.log(`   ${key}: ${displayValue || 'Vacío'}`);
    });
  } else {
    console.log('   No se encontraron variables relacionadas con PostgreSQL');
  }
  
  // Probar todas las configuraciones
  console.log('\n🔍 DIAGNÓSTICO POSTGRES PRODUCCIÓN: Probando configuraciones...');
  const results = [];
  
  for (const config of POSTGRES_CONFIGS) {
    const result = await testPostgresConfig(config);
    results.push(result);
    
    // Pausa entre pruebas
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Resumen final
  console.log('\n📋 DIAGNÓSTICO POSTGRES PRODUCCIÓN: Resumen de resultados:');
  console.log('=' .repeat(60));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Configuraciones exitosas: ${successful.length}/${results.length}`);
  console.log(`❌ Configuraciones fallidas: ${failed.length}/${results.length}`);
  
  if (successful.length > 0) {
    console.log('\n✅ CONFIGURACIONES EXITOSAS:');
    successful.forEach(result => {
      console.log(`   ${result.config}: ${result.tablesCount} tablas encontradas`);
    });
    
    console.log('\n🎯 RECOMENDACIÓN: Usar la primera configuración exitosa:');
    const recommended = successful[0];
    console.log(`   Configuración: ${recommended.config}`);
    console.log(`   URL: ${recommended.url.replace(/:([^@]+)@/, ':***@')}`);
    console.log(`   Tablas: ${recommended.tables.join(', ')}`);
  }
  
  if (failed.length > 0) {
    console.log('\n❌ CONFIGURACIONES FALLIDAS:');
    failed.forEach(result => {
      console.log(`   ${result.config}: ${result.error} (${result.code})`);
    });
  }
  
  // Devolver estado de éxito
  return successful.length > 0;
}

// Ejecutar diagnóstico
main().then(success => {
  console.log('\n🏁 DIAGNÓSTICO POSTGRES PRODUCCIÓN: Completado');
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 DIAGNÓSTICO POSTGRES PRODUCCIÓN: Error fatal:', error);
  process.exit(1);
});