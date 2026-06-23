#!/usr/bin/env node

// Script de inicio mejorado con configuración automática
// Detecta el entorno y configura variables automáticamente

console.log('🚀 Iniciando aplicación Reputación Online...');

// Función para extraer credenciales de DATABASE_URL
function extractCredentialsFromEnv() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return null;
  
  const match = databaseUrl.match(/postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!match) return null;
  
  const [, username, password, host, port, database] = match;
  
  return {
    internal: databaseUrl,
    external: `postgres://${username}:${password}@localhost:5435/${database}`,
    name: database,
    username,
    password
  };
}

// Configuración de PostgreSQL para Coolify (con fallback automático)
const DATABASE_CONFIG = extractCredentialsFromEnv() || {
  internal: 'postgres://postgres:ghxdiIxvNX8kjwafpuvS03B6e7M0ECSoZdEqPtLJsEW3WxBxn1f6USpp4vb42HIc@aswcsw80wsoskcskkscwscoo:5432/postgres',
  external: 'postgres://thor3:thor44@31.97.138.249:5437/postgres',
  name: 'thor',
  username: 'postgres',
  password: 'ghxdiIxvNX8kjwafpuvS03B6e7M0ECSoZdEqPtLJsEW3WxBxn1f6USpp4vb42HIc'
};

// Detectar entorno automáticamente
function detectEnvironment() {
  const nodeEnv = process.env.NODE_ENV;
  const coolifyFqdn = process.env.COOLIFY_FQDN;
  const vercelUrl = process.env.VERCEL_URL;
  const railwayUrl = process.env.RAILWAY_STATIC_URL;
  const isDockerContainer = process.env.IS_DOCKER || process.cwd() === '/app';
  
  return {
    isDevelopment: nodeEnv !== 'production',
    isProduction: nodeEnv === 'production',
    isCoolify: !!(coolifyFqdn || process.env.COOLIFY_URL),
    isVercel: !!vercelUrl,
    isRailway: !!railwayUrl,
    isLocal: !coolifyFqdn && !vercelUrl && !railwayUrl && !isDockerContainer,
    platform: coolifyFqdn ? 'coolify' : 
              vercelUrl ? 'vercel' : 
              railwayUrl ? 'railway' : 
              isDockerContainer ? 'docker' : 'local'
  };
}

// Verificar si se debe forzar SQLite - ABSOLUTO, SIN IMPORTAR EL ENTORNO
const forceSQLite = process.env.FORCE_SQLITE === 'true';

if (forceSQLite) {
  console.log('🔄 FORCE_SQLITE detectado - USANDO SQLite local');
  console.log('💡 Ignorando TODA la configuración de PostgreSQL y entorno');
  console.log('🗄️ Base de datos: SQLite local únicamente');
  
  // Limpiar completamente cualquier configuración de PostgreSQL
  delete process.env.DATABASE_URL;
  delete process.env.POSTGRES_URL;
  delete process.env.POSTGRESQL_URL;
  
} else {
  // Solo si NO se fuerza SQLite, entonces configurar PostgreSQL
  const env = detectEnvironment();
  console.log('🔍 Entorno detectado:', env.platform);
  
  // FORZAR uso de credenciales correctas en Coolify
  if (env.isCoolify || env.isProduction) {
    console.log('🔧 COOLIFY DETECTADO: Sobrescribiendo DATABASE_URL con credenciales correctas');
    process.env.DATABASE_URL = DATABASE_CONFIG.internal;
    console.log('✅ DATABASE_URL configurada correctamente para Coolify');
  } else if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = DATABASE_CONFIG.external;
    console.log('🔧 DATABASE_URL configurada para desarrollo (externo)');
  }
}

if (process.env.DATABASE_URL) {
  console.log('🔍 DATABASE_URL final:', process.env.DATABASE_URL.replace(/:([^@]+)@/, ':***@'));
} else {
  console.log('🔍 DATABASE_URL final: NO DEFINIDA (usando SQLite)');
}

// Seguridad: JWT_SECRET / NEXTAUTH_SECRET deben venir del entorno. NO usar valores por
// defecto hardcodeados (permitirían forjar tokens). Si faltan, abortar el arranque.
if (!process.env.JWT_SECRET) {
  console.error('❌ FATAL: JWT_SECRET no está configurada. Definí JWT_SECRET en el entorno (Coolify) antes de arrancar.');
  process.exit(1);
}
if (!process.env.NEXTAUTH_SECRET) {
  console.error('❌ FATAL: NEXTAUTH_SECRET no está configurada. Definí NEXTAUTH_SECRET en el entorno.');
  process.exit(1);
}

// Configurar NEXTAUTH_URL automáticamente
if (!process.env.NEXTAUTH_URL) {
  // URLs posibles para detección automática
  const possibleUrls = [
    process.env.APP_URL,
    process.env.PUBLIC_URL,
    process.env.COOLIFY_URL,
    process.env.COOLIFY_FQDN ? `https://${process.env.COOLIFY_FQDN}` : undefined,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    process.env.RAILWAY_STATIC_URL ? `https://${process.env.RAILWAY_STATIC_URL}` : undefined,
    'http://localhost:3000'
  ].filter(Boolean);
  
  const selectedUrl = possibleUrls[0];
  process.env.NEXTAUTH_URL = selectedUrl;
  console.log(`🔧 NEXTAUTH_URL configurada automáticamente: ${selectedUrl}`);
}

// Diagnóstico de la configuración
console.log('\n🔍 DIAGNÓSTICO COMPLETO DE CONFIGURACIÓN:');
console.log('=' .repeat(60));
console.log('DATABASE_URL actual:', process.env.DATABASE_URL ? 
  process.env.DATABASE_URL.replace(/:([^@]+)@/, ':***@') : 
  'NO DEFINIDA');

if (process.env.DATABASE_URL) {
  // Extraer componentes de la URL para análisis detallado
  const urlMatch = process.env.DATABASE_URL.match(/postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (urlMatch) {
    const [, user, password, host, port, database] = urlMatch;
    console.log('📋 Componentes de DATABASE_URL:');
    console.log('   Usuario:', user);
    console.log('   Contraseña: [OCULTA - longitud:', password.length, 'caracteres]');
    console.log('   Host:', host);
    console.log('   Puerto:', port);
    console.log('   Base de datos:', database);
    console.log('   Primeros 4 caracteres de contraseña:', password.substring(0, 4) + '***');
  }
}

console.log('NODE_ENV:', process.env.NODE_ENV || 'No definido');
console.log('POSTGRES_URL:', process.env.POSTGRES_URL ? 'DEFINIDA' : 'No definida');
console.log('Variables de entorno que contienen "postgres":', Object.keys(process.env).filter(k => k.toLowerCase().includes('postgres')));
console.log('Variables de entorno que contienen "database":', Object.keys(process.env).filter(k => k.toLowerCase().includes('database')));
console.log('=' .repeat(60));

// Diagnóstico de configuración de email (Resend)
console.log('\n📧 DIAGNÓSTICO DE EMAIL (Resend):');
const resendKey = process.env.RESEND_API_KEY;
const resendFrom = process.env.RESEND_FROM_EMAIL;
if (resendKey) {
  console.log(`  RESEND_API_KEY: CONFIGURADA (${resendKey.substring(0, 10)}...)`);
} else {
  console.log('  ⚠️ RESEND_API_KEY: NO CONFIGURADA - Los emails NO se enviaran');
  console.log('  💡 Agregar RESEND_API_KEY en las variables de entorno de Coolify');
}
console.log(`  RESEND_FROM_EMAIL: ${resendFrom || 'NO DEFINIDA (usara default: noreply@reputaciononline.com.co)'}`);

// Detectar si se está usando Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const isUsingSupabase = supabaseUrl && supabaseKey && supabaseUrl.includes('supabase.co');

if (forceSQLite) {
  console.log('🗄️ FORCE_SQLITE activado - saltando inicialización de PostgreSQL');
  console.log('🎯 Iniciando Next.js directamente con SQLite...');
  startNextJs();
} else if (isUsingSupabase) {
  console.log('🟢 Supabase detectado - saltando inicialización de PostgreSQL');
  console.log('✅ Las tablas ya existen en Supabase, iniciando Next.js...');
  startNextJs();
} else {
  console.log('🐘 Inicializando base de datos PostgreSQL...');
  initializeDatabase();
}

async function initializeDatabase() {
  try {
    // Usar script de inicialización de PostgreSQL
    const { initializeDatabase: initDB } = require('./scripts/init-database-postgres.js');
    const success = await initDB();
    if (success) {
      console.log('🎯 Base de datos PostgreSQL lista, iniciando Next.js...');
      startNextJs();
    } else {
      console.error('❌ Error inicializando base de datos PostgreSQL, iniciando Next.js de todas formas...');
      startNextJs();
    }
  } catch (error) {
    console.error('❌ Error importando database PostgreSQL:', error);
    console.log('🎯 Iniciando Next.js sin inicialización de base de datos...');
    startNextJs();
  }
}

function startNextJs() {
  console.log('🎯 Iniciando Next.js...');
  
  // Para Next.js con output: standalone, usar server.js directamente
  const { spawn } = require('child_process');
  const serverPath = '.next/standalone/server.js';
  
  // Verificar si existe el archivo server.js (build standalone)
  const fs = require('fs');
  let nextProcess;
  
  if (fs.existsSync(serverPath)) {
    console.log('📦 Usando modo standalone de Next.js');
    nextProcess = spawn('node', [serverPath], {
      stdio: 'inherit',
      env: {
        ...process.env,
        HOSTNAME: '0.0.0.0',
        PORT: process.env.PORT || '3000'
      }
    });
  } else {
    console.log('🔧 Usando modo de desarrollo de Next.js');
    nextProcess = spawn('npx', ['next', 'start'], {
      stdio: 'inherit',
      env: {
        ...process.env,
        HOSTNAME: '0.0.0.0',
        PORT: process.env.PORT || '3000'
      }
    });
  }
  
  nextProcess.on('close', (code) => {
    console.log(`Next.js terminó con código: ${code}`);
    process.exit(code);
  });
  
  // Manejar señales para shutdown graceful
  process.on('SIGTERM', () => {
    console.log('🛑 Recibida señal SIGTERM, cerrando aplicación...');
    nextProcess.kill('SIGTERM');
  });
  
  process.on('SIGINT', () => {
    console.log('🛑 Recibida señal SIGINT, cerrando aplicación...');
    nextProcess.kill('SIGINT');
  });
}
