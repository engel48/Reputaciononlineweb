// Script para probar la conexión a Supabase y verificar las tablas
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Leer .env.local manualmente
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
}

async function testSupabaseConnection() {
  console.log('🔍 TEST SUPABASE: Iniciando prueba de conexión...\n');

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ ERROR: DATABASE_URL no está configurada en .env.local');
    process.exit(1);
  }

  console.log('📋 DATABASE_URL configurada:', databaseUrl.substring(0, 50) + '...');

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
    max: 1,
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log('\n🔌 Intentando conectar a Supabase...');
    const client = await pool.connect();
    console.log('✅ Conexión exitosa a Supabase\n');

    // Verificar versión de PostgreSQL
    console.log('📊 Información de la base de datos:');
    const versionResult = await client.query('SELECT version()');
    console.log('   Versión:', versionResult.rows[0].version.split(',')[0]);

    // Listar todas las tablas en schema public
    console.log('\n📋 Listando tablas en schema public:');
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    if (tablesResult.rows.length === 0) {
      console.log('   ⚠️  No se encontraron tablas en schema public');
      console.log('   💡 Necesitas crear las tablas en Supabase');
    } else {
      console.log('   Tablas encontradas:', tablesResult.rows.length);
      tablesResult.rows.forEach(row => {
        console.log('   - ' + row.table_name);
      });
    }

    // Verificar si existe la tabla users
    console.log('\n🔍 Verificando tabla users:');
    const usersCheckResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'users'
      )
    `);

    if (usersCheckResult.rows[0].exists) {
      console.log('   ✅ Tabla users existe');

      // Verificar columnas de la tabla users
      const columnsResult = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'users'
        ORDER BY ordinal_position
      `);

      console.log('   📋 Columnas de la tabla users:');
      columnsResult.rows.forEach(col => {
        console.log(`      - ${col.column_name} (${col.data_type})${col.is_nullable === 'YES' ? ' NULL' : ' NOT NULL'}`);
      });

      // Contar usuarios
      const countResult = await client.query('SELECT COUNT(*) as total FROM users');
      console.log('   👥 Usuarios registrados:', countResult.rows[0].total);
    } else {
      console.log('   ❌ Tabla users NO existe');
      console.log('   💡 Necesitas ejecutar la migración de Supabase para crear las tablas');
    }

    client.release();
    await pool.end();

    console.log('\n✅ Prueba completada exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR durante la prueba:');
    console.error('   Mensaje:', error.message);
    console.error('   Código:', error.code);
    console.error('   Stack:', error.stack);

    await pool.end();
    process.exit(1);
  }
}

testSupabaseConnection();
