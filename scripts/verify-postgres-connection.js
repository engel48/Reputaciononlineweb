#!/usr/bin/env node
const { Pool } = require('pg');

// Configuración de la base de datos PostgreSQL - CREDENCIALES CORRECTAS
const DATABASE_URL = 'postgres://postgres:ghxdiIxvNX8kjwafpuvS03B6e7M0ECSoZdEqPtLJsEW3WxBxn1f6USpp4vb42HIc@aswcsw80wsoskcskkscwscoo:5432/postgres';

console.log('🔍 VERIFICACIÓN PostgreSQL - Coolify VPS');
console.log('=' .repeat(60));

async function verifyPostgresConnection() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: false
  });

  try {
    console.log('🔗 Intentando conectar a PostgreSQL...');
    const client = await pool.connect();
    console.log('✅ Conexión exitosa a PostgreSQL');
    
    // Verificar la versión de PostgreSQL
    console.log('\n📊 Información del servidor:');
    const versionResult = await client.query('SELECT version()');
    console.log('   Versión:', versionResult.rows[0].version);
    
    // Verificar la base de datos actual
    const dbResult = await client.query('SELECT current_database()');
    console.log('   Base de datos:', dbResult.rows[0].current_database);
    
    // Listar todas las tablas
    console.log('\n📋 Tablas existentes:');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length === 0) {
      console.log('   ⚠️  No se encontraron tablas en el esquema public');
    } else {
      tablesResult.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    }
    
    // Verificar tabla users específicamente
    console.log('\n👥 Verificación tabla USERS:');
    try {
      const usersCountResult = await client.query('SELECT COUNT(*) as count FROM users');
      const usersCount = parseInt(usersCountResult.rows[0].count);
      console.log(`   Total usuarios: ${usersCount}`);
      
      if (usersCount > 0) {
        // Mostrar algunos usuarios de ejemplo
        const sampleUsersResult = await client.query(`
          SELECT id, email, name, plan, credits, "createdAt" 
          FROM users 
          ORDER BY "createdAt" DESC 
          LIMIT 5
        `);
        
        console.log('\n   Usuarios de ejemplo:');
        sampleUsersResult.rows.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.name} (${user.email}) - Plan: ${user.plan} - Créditos: ${user.credits}`);
        });
      } else {
        console.log('   ⚠️  La tabla users está vacía');
        
        // Verificar estructura de la tabla
        const structureResult = await client.query(`
          SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_name = 'users' 
          ORDER BY ordinal_position
        `);
        
        console.log('\n   Estructura de la tabla users:');
        structureResult.rows.forEach(col => {
          console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
        });
      }
    } catch (usersError) {
      console.log(`   ❌ Error accediendo tabla users: ${usersError.message}`);
    }
    
    // Verificar tabla system_settings
    console.log('\n⚙️  Verificación tabla SYSTEM_SETTINGS:');
    try {
      const settingsCountResult = await client.query('SELECT COUNT(*) as count FROM system_settings');
      const settingsCount = parseInt(settingsCountResult.rows[0].count);
      console.log(`   Total configuraciones: ${settingsCount}`);
      
      if (settingsCount > 0) {
        const sampleSettingsResult = await client.query(`
          SELECT key, value, description 
          FROM system_settings 
          ORDER BY key 
          LIMIT 5
        `);
        
        console.log('\n   Configuraciones de ejemplo:');
        sampleSettingsResult.rows.forEach((setting, index) => {
          console.log(`   ${index + 1}. ${setting.key}: ${setting.value}`);
        });
      }
    } catch (settingsError) {
      console.log(`   ❌ Error accediendo tabla system_settings: ${settingsError.message}`);
    }
    
    // Verificar tabla social_media
    console.log('\n📱 Verificación tabla SOCIAL_MEDIA:');
    try {
      const socialCountResult = await client.query('SELECT COUNT(*) as count FROM social_media');
      const socialCount = parseInt(socialCountResult.rows[0].count);
      console.log(`   Total registros redes sociales: ${socialCount}`);
    } catch (socialError) {
      console.log(`   ❌ Error accediendo tabla social_media: ${socialError.message}`);
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.error('   Código de error:', error.code);
    console.error('   Detalles:', error.detail || 'No disponible');
    
    if (error.code === 'ENOTFOUND') {
      console.log('\n💡 Posibles soluciones:');
      console.log('   - Verificar que la IP del servidor sea correcta');
      console.log('   - Verificar que el puerto 5435 esté abierto');
      console.log('   - Verificar que PostgreSQL esté ejecutándose');
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Posibles soluciones:');
      console.log('   - PostgreSQL no está ejecutándose en el puerto 5435');
      console.log('   - Firewall bloqueando la conexión');
      console.log('   - Puerto incorrecto');
    }
  } finally {
    await pool.end();
  }
}

// Ejecutar verificación
verifyPostgresConnection()
  .then(() => {
    console.log('\n🏁 Verificación completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });