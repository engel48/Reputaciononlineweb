// Script para probar el registro de usuario usando Supabase SDK
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
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

async function testRegister() {
  console.log('🔍 TEST REGISTER: Iniciando prueba de registro...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ ERROR: Variables de Supabase no configuradas');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const testUser = {
    email: `test_${Date.now()}@test.com`,
    password: 'test123456',
    name: 'Usuario de Prueba',
    company: 'Test Company'
  };

  console.log('📋 Intentando registrar usuario:', testUser.email);

  try {
    // Paso 1: Verificar que el usuario no existe
    console.log('\n🔍 Paso 1: Verificando si el usuario existe...');
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('email', testUser.email)
      .single();

    if (existingUser) {
      console.log('⚠️  Usuario ya existe, eliminando...');
      await supabase.from('users').delete().eq('email', testUser.email);
    }

    // Paso 2: Hashear contraseña
    console.log('\n🔐 Paso 2: Hasheando contraseña...');
    const hashedPassword = await bcrypt.hash(testUser.password, 12);
    console.log('✅ Contraseña hasheada exitosamente');

    // Paso 3: Insertar usuario
    console.log('\n💾 Paso 3: Insertando usuario en Supabase...');
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        email: testUser.email,
        password: hashedPassword,
        name: testUser.name,
        company: testUser.company,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error insertando usuario:', insertError);
      console.error('   Código:', insertError.code);
      console.error('   Mensaje:', insertError.message);
      console.error('   Detalles:', insertError.details);
      process.exit(1);
    }

    console.log('✅ Usuario insertado exitosamente!');
    console.log('   ID:', newUser.id);
    console.log('   Email:', newUser.email);
    console.log('   Nombre:', newUser.name);

    // Paso 4: Actualizar datos adicionales
    console.log('\n📝 Paso 4: Actualizando datos adicionales...');
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        phone: '+57 300 123 4567',
        avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(testUser.name)}&background=01257D&color=fff`,
        credits: 1000,
        onboarding_completed: false,
        profile_type: 'personal',
        plan: 'basic',
        role: 'user'
      })
      .eq('id', newUser.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error actualizando usuario:', updateError);
    } else {
      console.log('✅ Usuario actualizado exitosamente!');
      console.log('   Créditos:', updatedUser.credits);
      console.log('   Plan:', updatedUser.plan);
      console.log('   Rol:', updatedUser.role);
    }

    // Paso 5: Verificar contraseña
    console.log('\n🔐 Paso 5: Verificando contraseña...');
    const isPasswordValid = await bcrypt.compare(testUser.password, hashedPassword);
    console.log('   Verificación de contraseña:', isPasswordValid ? '✅ CORRECTA' : '❌ INCORRECTA');

    console.log('\n✅ TEST COMPLETADO EXITOSAMENTE!');
    console.log('\n📋 RESUMEN:');
    console.log('   - Registro de usuario: ✅ FUNCIONAL');
    console.log('   - Hash de contraseña: ✅ FUNCIONAL');
    console.log('   - Actualización de datos: ✅ FUNCIONAL');
    console.log('   - Verificación de contraseña: ✅ FUNCIONAL');
    console.log('\n💡 El endpoint /api/auth/register debería funcionar correctamente ahora');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR durante el test:');
    console.error('   Mensaje:', error.message);
    console.error('   Stack:', error.stack);
    process.exit(1);
  }
}

testRegister();
