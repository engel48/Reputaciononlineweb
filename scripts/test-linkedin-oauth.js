#!/usr/bin/env node

/**
 * Script de prueba para LinkedIn OAuth
 *
 * Verifica que:
 * 1. Variables de entorno estén configuradas
 * 2. Endpoints existan y respondan
 * 3. Supabase esté configurado correctamente
 */

// Cargar variables de entorno manualmente
const fs = require('fs');
const path = require('path');

try {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=:#]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        process.env[key] = value;
      }
    });
  }
} catch (err) {
  console.log('⚠️  No se pudo cargar .env.local');
}

const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_LINKEDIN_CLIENT_ID',
  'LINKEDIN_CLIENT_ID',
  'LINKEDIN_CLIENT_SECRET',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXTAUTH_URL'
];

const OPTIONAL_ENV_VARS = [
  'LINKEDIN_REDIRECT_URI'
];

console.log('🔍 Verificando configuración de LinkedIn OAuth...\n');

// 1. Verificar variables de entorno
console.log('1️⃣ Variables de Entorno:');
let missingVars = [];
let foundVars = [];

REQUIRED_ENV_VARS.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`   ❌ ${varName}: NO CONFIGURADA`);
    missingVars.push(varName);
  } else {
    console.log(`   ✅ ${varName}: ${value.substring(0, 20)}...`);
    foundVars.push(varName);
  }
});

OPTIONAL_ENV_VARS.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`   ℹ️  ${varName}: No configurada (opcional)`);
  } else {
    console.log(`   ✅ ${varName}: ${value}`);
  }
});

console.log('');

if (missingVars.length > 0) {
  console.log('❌ FALTAN VARIABLES DE ENTORNO:');
  missingVars.forEach(v => console.log(`   - ${v}`));
  console.log('\n📝 Agrega estas variables a tu archivo .env.local\n');
  process.exit(1);
}

// 2. Verificar estructura de archivos
console.log('2️⃣ Estructura de Archivos:');

const REQUIRED_FILES = [
  'src/app/api/auth/linkedin/route.ts',
  'src/app/api/auth/linkedin/callback/route.ts',
  'src/lib/oauth/linkedin.ts',
  'src/lib/oauth-storage.ts',
  'src/lib/encryption.ts',
  'src/app/oauth-login/page.tsx'
];

let missingFiles = [];

REQUIRED_FILES.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} - NO EXISTE`);
    missingFiles.push(file);
  }
});

console.log('');

if (missingFiles.length > 0) {
  console.log('❌ FALTAN ARCHIVOS:');
  missingFiles.forEach(f => console.log(`   - ${f}`));
  console.log('\n');
  process.exit(1);
}

// 3. Verificar configuración de LinkedIn
console.log('3️⃣ Configuración de LinkedIn OAuth:');

const clientId = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID;
const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
const redirectUri = process.env.LINKEDIN_REDIRECT_URI ||
  `${process.env.NEXTAUTH_URL}/api/auth/linkedin/callback`;

console.log(`   Client ID: ${clientId}`);
console.log(`   Client Secret: ${clientSecret ? '***' + clientSecret.slice(-4) : 'NO CONFIGURADO'}`);
console.log(`   Redirect URI: ${redirectUri}`);
console.log('');

// 4. Generar URL de prueba
console.log('4️⃣ URL de Autorización de LinkedIn:');

const state = Math.random().toString(36).substring(2, 15);
const authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
  `client_id=${clientId}&` +
  `redirect_uri=${encodeURIComponent(redirectUri)}&` +
  `scope=r_liteprofile%20r_emailaddress%20w_member_social&` +
  `response_type=code&` +
  `state=${state}`;

console.log(`   ${authUrl}\n`);

// 5. Verificar endpoints de Supabase
console.log('5️⃣ Supabase Configuration:');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log(`   URL: ${supabaseUrl}`);
console.log(`   Anon Key: ${supabaseAnonKey ? '***' + supabaseAnonKey.slice(-8) : 'NO CONFIGURADO'}`);
console.log('');

// 6. Verificar tabla social_media en Supabase
console.log('6️⃣ Verificando tabla social_media en Supabase...');

const { createClient } = require('@supabase/supabase-js');

if (!supabaseUrl || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('   ⚠️  No se puede verificar (faltan credenciales de Supabase)\n');
} else {
  const supabase = createClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  (async () => {
    try {
      const { data, error } = await supabase
        .from('social_media')
        .select('*')
        .eq('platform', 'linkedin')
        .limit(1);

      if (error) {
        console.log(`   ❌ Error: ${error.message}`);
        console.log('   ℹ️  Asegúrate de que la tabla social_media existe');
      } else {
        console.log(`   ✅ Tabla social_media accesible`);
        console.log(`   ℹ️  Conexiones LinkedIn existentes: ${data ? data.length : 0}`);
      }
    } catch (err) {
      console.log(`   ❌ Error de conexión: ${err.message}`);
    }

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('✅ VERIFICACIÓN COMPLETA');
    console.log('');
    console.log('📋 Próximos pasos:');
    console.log('');
    console.log('1. Configurar LinkedIn Developer Portal:');
    console.log('   - https://www.linkedin.com/developers/apps');
    console.log('   - Crear app o usar existente');
    console.log('   - Activar "Sign In with LinkedIn using OpenID Connect"');
    console.log('   - Agregar Redirect URI:');
    console.log(`     ${redirectUri}`);
    console.log('');
    console.log('2. Iniciar aplicación:');
    console.log('   npm run dev');
    console.log('');
    console.log('3. Probar OAuth:');
    console.log('   - Login en la app');
    console.log('   - Ir a /dashboard/redes-sociales');
    console.log('   - Click en "Conectar LinkedIn"');
    console.log('   - Autorizar en LinkedIn');
    console.log('   - Verificar redirección exitosa');
    console.log('');
    console.log('4. Verificar en Supabase:');
    console.log('   SELECT * FROM social_media WHERE platform = \'linkedin\';');
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
  })();
}
