#!/usr/bin/env node

// Script para intentar corregir el problema de autenticación de PostgreSQL
console.log('🔧 FIX-POSTGRES-AUTH: Intentando solucionar autenticación...');

const { Pool } = require('pg');

// Función para decodificar posibles encodings
function tryDecode(str) {
  const attempts = [
    { method: 'Original', value: str },
    { method: 'URL decode', value: decodeURIComponent(str) },
    { method: 'Base64 decode', value: tryBase64Decode(str) },
    { method: 'Sin prefijo //', value: str.replace(/^\/\//, '') },
    { method: 'Sin postgres:', value: str.replace(/^postgres:/, '') },
    { method: 'Sin //postgres:', value: str.replace(/^\/\/postgres:/, '') },
  ];
  
  return attempts;
}

function tryBase64Decode(str) {
  try {
    return Buffer.from(str, 'base64').toString('utf8');
  } catch {
    return null;
  }
}

// Función principal
async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL no está definida');
    process.exit(1);
  }
  
  console.log('📋 DATABASE_URL detectada:', databaseUrl.replace(/:([^@]+)@/, ':***@'));
  
  // Parsear URL
  const match = databaseUrl.match(/postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!match) {
    console.error('❌ No se pudo parsear DATABASE_URL');
    process.exit(1);
  }
  
  const [, user, password, host, port, database] = match;
  
  console.log('\n📋 Componentes extraídos:');
  console.log(`   Usuario: ${user}`);
  console.log(`   Contraseña original: ${password.length} caracteres`);
  console.log(`   Host: ${host}`);
  console.log(`   Puerto: ${port}`);
  console.log(`   Base de datos: ${database}`);
  
  // Si la contraseña empieza con //, es probable que sea un error de parsing
  if (password.startsWith('//')) {
    console.log('\n⚠️  DETECTADO: La contraseña empieza con //');
    console.log('   Esto sugiere un error de parsing en la URL');
  }
  
  // Intentar diferentes decodificaciones de la contraseña
  console.log('\n🔍 Probando diferentes interpretaciones de la contraseña:');
  
  const passwordAttempts = tryDecode(password);
  
  for (const { method, value } of passwordAttempts) {
    if (!value) continue;
    
    console.log(`\n🔑 Probando ${method}: "${value}" (${value.length} chars)`);
    
    const config = {
      host,
      port: parseInt(port),
      user,
      password: value,
      database,
      ssl: false,
      connectionTimeoutMillis: 3000,
      max: 1
    };
    
    const pool = new Pool(config);
    
    try {
      const client = await pool.connect();
      console.log('   ✅ ¡CONEXIÓN EXITOSA!');
      
      // Verificar versión
      const result = await client.query('SELECT version()');
      console.log('   PostgreSQL:', result.rows[0].version.split(' ')[0]);
      
      client.release();
      
      // Generar configuración corregida
      console.log('\n🎯 SOLUCIÓN ENCONTRADA:');
      console.log('=' .repeat(60));
      console.log('Actualiza tu DATABASE_URL a:');
      console.log(`postgres://${user}:${value}@${host}:${port}/${database}`);
      
      console.log('\nO usa esta configuración en tus archivos:');
      console.log('```javascript');
      console.log('const DATABASE_CONFIG = {');
      console.log(`  internal: 'postgres://${user}:${value}@${host}:${port}/${database}',`);
      console.log(`  external: 'postgres://${user}:${value}@localhost:5435/${database}',`);
      console.log(`  username: '${user}',`);
      console.log(`  password: '${value}'`);
      console.log('};');
      console.log('```');
      
      await pool.end();
      return;
      
    } catch (error) {
      console.log(`   ❌ Falló: ${error.code || error.message}`);
    } finally {
      await pool.end();
    }
  }
  
  // Si llegamos aquí, ninguna contraseña funcionó
  console.log('\n❌ No se pudo encontrar la contraseña correcta');
  console.log('\n💡 POSIBLES SOLUCIONES:');
  console.log('1. Verifica la contraseña real en el panel de Coolify');
  console.log('2. Intenta recrear la base de datos con una contraseña conocida');
  console.log('3. Revisa si hay variables de entorno adicionales que contengan la contraseña');
  console.log('4. Contacta soporte de Coolify si el problema persiste');
  
  // Mostrar información adicional para debugging
  console.log('\n📋 INFORMACIÓN ADICIONAL PARA SOPORTE:');
  console.log(`   Contraseña detectada: ${password}`);
  console.log(`   Longitud: ${password.length} caracteres`);
  console.log(`   Caracteres ASCII:`, Array.from(password).map(c => c.charCodeAt(0)));
  console.log(`   Hex:`, Buffer.from(password).toString('hex'));
}

main().catch(console.error);