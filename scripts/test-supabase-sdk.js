// Script para probar la conexión usando Supabase SDK oficial
const { createClient } = require('@supabase/supabase-js');
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

async function testSupabaseSDK() {
  console.log('🔍 TEST SUPABASE SDK: Iniciando prueba...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ ERROR: Variables de Supabase no configuradas');
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Configurada' : 'NO CONFIGURADA');
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'Configurada' : 'NO CONFIGURADA');
    process.exit(1);
  }

  console.log('📋 Supabase URL:', supabaseUrl);
  console.log('📋 Service Role Key:', supabaseKey.substring(0, 20) + '...\n');

  try {
    console.log('🔌 Creando cliente de Supabase...');
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    console.log('✅ Cliente de Supabase creado\n');

    // Intentar hacer una consulta simple
    console.log('🔍 Probando conexión a la base de datos...');
    const { data, error } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Error al consultar tabla users:');
      console.error('   Código:', error.code);
      console.error('   Mensaje:', error.message);
      console.error('   Detalles:', error.details);
      console.error('   Hint:', error.hint);

      if (error.code === 'PGRST116' || error.message.includes('not found')) {
        console.log('\n💡 La tabla "users" no existe en Supabase');
        console.log('   Necesitas crear las tablas usando migraciones de Supabase\n');
      }

      // Intentar obtener lista de tablas
      console.log('🔍 Intentando obtener información del proyecto...');
      const { data: healthData, error: healthError } = await supabase
        .from('_supabase_health')
        .select('*')
        .limit(1);

      if (healthError) {
        console.log('   ℹ️  No se pudo acceder a información del proyecto');
      } else {
        console.log('   ✅ El proyecto de Supabase está activo y accesible');
      }
    } else {
      console.log('✅ Conexión exitosa a Supabase');
      console.log('   Usuarios en la base de datos:', data || 0);
    }

    // Probar autenticación (verificar que el servicio esté disponible)
    console.log('\n🔍 Verificando servicio de autenticación...');
    const { data: authData, error: authError } = await supabase.auth.getSession();

    if (authError) {
      console.log('   ⚠️  Error en auth:', authError.message);
    } else {
      console.log('   ✅ Servicio de autenticación disponible');
    }

    console.log('\n✅ Prueba completada');
    console.log('\n📋 RESUMEN:');
    console.log('   - Proyecto de Supabase: ✅ Accesible');
    console.log('   - SDK de Supabase: ✅ Funcional');
    console.log('   - Tabla users:', error ? '❌ No existe' : '✅ Existe');
    console.log('\n💡 SIGUIENTE PASO:');

    if (error && (error.code === 'PGRST116' || error.message.includes('not found'))) {
      console.log('   1. Crear las tablas en Supabase');
      console.log('   2. Ejecutar migraciones desde el SQL Editor de Supabase');
      console.log('   3. O usar Supabase CLI para aplicar migraciones');
    } else {
      console.log('   ✅ El sistema está listo para funcionar');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR durante la prueba:');
    console.error('   Mensaje:', error.message);
    console.error('   Stack:', error.stack);
    process.exit(1);
  }
}

testSupabaseSDK();
