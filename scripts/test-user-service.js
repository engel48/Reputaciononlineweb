#!/usr/bin/env node
const { Pool } = require('pg');

// Configuración de la base de datos PostgreSQL desde .env.local
const DATABASE_URL = 'postgres://postgres:admin123@postgresql-database-rkgwkkss048ck00skskc08gs:5432/postgres';

console.log('🔍 TESTING userService.findAll() Query');
console.log('=' .repeat(50));

async function testUserServiceQuery() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: false
  });

  try {
    const client = await pool.connect();
    console.log('✅ Conexión exitosa a PostgreSQL');
    
    // Esta es la query exacta que usa userService.findAll()
    console.log('\n🔍 Ejecutando query: SELECT * FROM users ORDER BY "createdAt" DESC');
    
    try {
      const result = await client.query('SELECT * FROM users ORDER BY "createdAt" DESC');
      console.log(`✅ Query exitosa - ${result.rows.length} usuarios encontrados`);
      
      if (result.rows.length > 0) {
        console.log('\n📄 Primeros 3 usuarios (con password filtrada):');
        result.rows.slice(0, 3).forEach((user, index) => {
          // Simular el filtrado que hace userService
          const { password, ...userWithoutPassword } = user;
          console.log(`${index + 1}. Usuario:`, {
            id: userWithoutPassword.id,
            email: userWithoutPassword.email,
            name: userWithoutPassword.name,
            plan: userWithoutPassword.plan,
            credits: userWithoutPassword.credits,
            createdAt: userWithoutPassword.createdAt
          });
        });
        
        // Verificar si hay algún campo que pueda estar causando problemas
        console.log('\n🔍 Verificando campos del primer usuario:');
        const firstUser = result.rows[0];
        Object.keys(firstUser).forEach(key => {
          const value = firstUser[key];
          const type = typeof value;
          const isNull = value === null;
          console.log(`   ${key}: ${isNull ? 'NULL' : type} ${isNull ? '' : `(${String(value).length > 50 ? String(value).substring(0, 50) + '...' : value})`}`);
        });
      }
      
    } catch (queryError) {
      console.error('❌ Error en query:', queryError.message);
      
      // Intentar variaciones de la query
      console.log('\n🔄 Probando variaciones de la query...');
      
      // Sin comillas en createdAt
      try {
        console.log('   Probando: SELECT * FROM users ORDER BY createdAt DESC');
        const result2 = await client.query('SELECT * FROM users ORDER BY createdAt DESC');
        console.log(`   ✅ Funciona sin comillas - ${result2.rows.length} usuarios`);
      } catch (e) {
        console.log(`   ❌ Falla sin comillas: ${e.message}`);
      }
      
      // Sin ORDER BY
      try {
        console.log('   Probando: SELECT * FROM users LIMIT 5');
        const result3 = await client.query('SELECT * FROM users LIMIT 5');
        console.log(`   ✅ Funciona sin ORDER BY - ${result3.rows.length} usuarios`);
      } catch (e) {
        console.log(`   ❌ Falla sin ORDER BY: ${e.message}`);
      }
      
      // SELECT específico
      try {
        console.log('   Probando: SELECT id, email, name FROM users LIMIT 3');
        const result4 = await client.query('SELECT id, email, name FROM users LIMIT 3');
        console.log(`   ✅ Funciona SELECT específico - ${result4.rows.length} usuarios`);
        result4.rows.forEach((user, index) => {
          console.log(`      ${index + 1}. ${user.name} (${user.email})`);
        });
      } catch (e) {
        console.log(`   ❌ Falla SELECT específico: ${e.message}`);
      }
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
  } finally {
    await pool.end();
  }
}

// Ejecutar test
testUserServiceQuery()
  .then(() => {
    console.log('\n🏁 Test completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });