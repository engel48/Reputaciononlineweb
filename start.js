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
  internal: 'postgres://postgres:admin123@rkgwkkss048ck00skskc08gs:5432/postgres',
  external: 'postgres://postgres:admin123@localhost:5435/postgres',
  name: 'postgresql-database-rkgwkkss048ck00skskc08gs',
  username: 'postgres',
  password: 'admin123'
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

// Configurar variables de entorno automáticamente
const env = detectEnvironment();
console.log('🔍 Entorno detectado:', env.platform);

// Configurar DATABASE_URL según el entorno
if (!process.env.DATABASE_URL) {
  if (env.isCoolify || env.isProduction) {
    process.env.DATABASE_URL = DATABASE_CONFIG.internal;
    console.log('🔧 DATABASE_URL configurada para Coolify (interno)');
  } else {
    process.env.DATABASE_URL = DATABASE_CONFIG.external;
    console.log('🔧 DATABASE_URL configurada para desarrollo (externo)');
  }
} else {
  console.log('🔍 DATABASE_URL ya configurada:', process.env.DATABASE_URL.replace(/:([^@]+)@/, ':***@'));
}

// Configurar NEXTAUTH_SECRET
if (!process.env.NEXTAUTH_SECRET) {
  process.env.NEXTAUTH_SECRET = 'reputacion-online-super-secret-key-2025';
  console.log('🔧 NEXTAUTH_SECRET configurada automáticamente');
}

// Configurar JWT_SECRET
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'reputacion-online-secret-key-2025';
  console.log('🔧 JWT_SECRET configurada automáticamente');
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

console.log('🐘 Inicializando base de datos PostgreSQL...');
initializeDatabase();

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
