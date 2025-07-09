#!/usr/bin/env node

// Script de diagnóstico completo para PostgreSQL
const { Pool } = require('pg');

console.log('🔍 DIAGNÓSTICO COMPLETO DE POSTGRESQL');
console.log('=' .repeat(60));

// Mostrar todas las variables de entorno relacionadas
console.log('\n📋 Variables de entorno:');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Configurada' : '❌ NO configurada');
console.log('POSTGRES_URL:', process.env.POSTGRES_URL ? '✅ Configurada' : '❌ NO configurada');
console.log('NODE_ENV:', process.env.NODE_ENV || 'No definido');

// Buscar todas las variables que contengan postgres o database
const allEnvVars = Object.keys(process.env).filter(key => 
  key.toLowerCase().includes('postgres') || 
  key.toLowerCase().includes('database') ||
  key.toLowerCase().includes('db_')
);

if (allEnvVars.length > 0) {
  console.log('\n🔍 Todas las variables relacionadas con DB:');
  allEnvVars.forEach(key => {
    const value = process.env[key];
    if (value && value.includes('postgres://')) {
      const maskedValue = value.replace(/:([^@]+)@/, ':***@');
      console.log(`   ${key}: ${maskedValue}`);
    } else {
      console.log(`   ${key}: ${value ? (value.length > 50 ? value.substring(0, 50) + '...' : value) : 'undefined'}`);
    }
  });
}

// Mostrar la URL completa (ocultando parte de la contraseña)
if (process.env.DATABASE_URL) {
  const url = process.env.DATABASE_URL;
  const passwordMatch = url.match(/:([^@]+)@/);
  if (passwordMatch) {
    const password = passwordMatch[1];
    const maskedUrl = url.replace(password, password.substring(0, 4) + '***');
    console.log('\n🔐 DATABASE_URL análisis detallado:');
    console.log('   URL completa:', maskedUrl);
    console.log('   Longitud de contraseña:', password.length, 'caracteres');
    console.log('   Primeros 6 chars de contraseña:', password.substring(0, 6) + '***');
    console.log('   ¿Contiene números?', /\d/.test(password));
    console.log('   ¿Contiene letras?', /[a-zA-Z]/.test(password));
    console.log('   ¿Contiene símbolos?', /[^a-zA-Z0-9]/.test(password));
  }
}

// Intentar múltiples configuraciones - CREDENCIALES ACTUALIZADAS
const configurations = [
  {
    name: 'Config 1: Variable de entorno DATABASE_URL',
    connectionString: process.env.DATABASE_URL
  },
  {
    name: 'Config 2: URL correcta Coolify',
    connectionString: 'postgres://postgres:ghxdiIxvNX8kjwafpuvS03B6e7M0ECSoZdEqPtLJsEW3WxBxn1f6USpp4vb42HIc@aswcsw80wsoskcskkscwscoo:5432/postgres'
  },
  {
    name: 'Config 3: URL externa correcta',
    connectionString: 'postgres://thor3:thor44@31.97.138.249:5437/postgres'
  },
  {
    name: 'Config 4: URL antigua (para comparar)',
    connectionString: 'postgres://postgres:admin123@rkgwkkss048ck00skskc08gs:5432/postgres'
  },
  {
    name: 'Config 5: URL con host localhost',
    connectionString: 'postgres://postgres:admin123@localhost:5432/postgres'
  }
];

async function testConnection(config) {
  console.log(`\n🔧 Probando: ${config.name}`);
  
  if (!config.connectionString) {
    console.log('❌ No hay connectionString para esta configuración');
    return;
  }

  const pool = new Pool({
    connectionString: config.connectionString,
    ssl: false,
    max: 1,
    connectionTimeoutMillis: 5000,
  });

  try {
    const client = await pool.connect();
    console.log('✅ CONEXIÓN EXITOSA!');
    
    const result = await client.query('SELECT NOW()');
    console.log('   Hora del servidor:', result.rows[0].now);
    
    const dbResult = await client.query('SELECT current_database()');
    console.log('   Base de datos:', dbResult.rows[0].current_database);
    
    client.release();
  } catch (error) {
    console.log('❌ Error de conexión:', error.message);
    if (error.code === '28P01') {
      console.log('   → La contraseña es incorrecta');
    } else if (error.code === 'ENOTFOUND') {
      console.log('   → El host no se puede resolver');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('   → Conexión rechazada (puerto cerrado o servicio no disponible)');
    }
  } finally {
    await pool.end();
  }
}

async function runDiagnostics() {
  console.log('\n🚀 Iniciando diagnóstico...\n');
  
  // Probar todas las configuraciones
  for (const config of configurations) {
    await testConnection(config);
  }
  
  console.log('\n📊 RESUMEN:');
  console.log('Si ninguna conexión funcionó, posibles causas:');
  console.log('1. La contraseña "admin123" no es correcta');
  console.log('2. El host "rkgwkkss048ck00skskc08gs" no es accesible desde el contenedor de la app');
  console.log('3. PostgreSQL no está escuchando en el puerto 5432');
  console.log('4. Hay un firewall o configuración de red bloqueando la conexión');
  
  console.log('\n💡 SOLUCIONES SUGERIDAS:');
  console.log('1. Verificar la contraseña real en Coolify (pestaña de la base de datos)');
  console.log('2. Verificar que ambos contenedores estén en la misma red de Docker');
  console.log('3. Intentar con el nombre del servicio PostgreSQL en lugar del hash');
  console.log('4. Verificar los logs de PostgreSQL para ver intentos de conexión');
}

runDiagnostics()
  .then(() => {
    console.log('\n✅ Diagnóstico completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });