#!/usr/bin/env node

// start-production.js - Script de inicio automático para producción
// Configura variables antes de iniciar Next.js con detección inteligente

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

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

// Configuración de base de datos PostgreSQL para Coolify (con fallback automático)
const DATABASE_CONFIG = extractCredentialsFromEnv() || {
  internal: 'postgres://postgres:ghxdiIxvNX8kjwafpuvS03B6e7M0ECSoZdEqPtLJsEW3WxBxn1f6USpp4vb42HIc@aswcsw80wsoskcskkscwscoo:5432/postgres',
  external: 'postgres://thor3:thor44@31.97.138.249:5437/postgres',
  name: 'thor',
  username: 'postgres',
  password: 'ghxdiIxvNX8kjwafpuvS03B6e7M0ECSoZdEqPtLJsEW3WxBxn1f6USpp4vb42HIc'
};

console.log('🚀 START-PRODUCTION: Iniciando aplicación Reputación Online...');

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
function configureEnvironmentVariables() {
  const env = detectEnvironment();
  console.log('🔍 START-PRODUCTION: Entorno detectado:', env.platform);
  
  // Forzar NODE_ENV a production
  process.env.NODE_ENV = 'production';
  console.log('🔧 START-PRODUCTION: NODE_ENV forzado a production');
  
  // Configurar DATABASE_URL según el entorno
  if (!process.env.DATABASE_URL) {
    if (env.isCoolify || env.isProduction) {
      process.env.DATABASE_URL = DATABASE_CONFIG.internal;
      console.log('🐘 START-PRODUCTION: DATABASE_URL configurada para Coolify (interno)');
    } else {
      process.env.DATABASE_URL = DATABASE_CONFIG.external;
      console.log('🐘 START-PRODUCTION: DATABASE_URL configurada para desarrollo (externo)');
    }
  }
  
  // Configurar NEXTAUTH_SECRET
  if (!process.env.NEXTAUTH_SECRET) {
    process.env.NEXTAUTH_SECRET = 'reputacion-online-super-secret-key-2025';
    console.log('🔧 START-PRODUCTION: NEXTAUTH_SECRET configurada');
  }
  
  // Detectar y configurar NEXTAUTH_URL automáticamente
  if (!process.env.NEXTAUTH_URL) {
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
    console.log('🔗 START-PRODUCTION: NEXTAUTH_URL configurada:', selectedUrl);
  }
  
  // Seguridad: JWT_SECRET debe venir del entorno. No usar default hardcodeado.
  if (!process.env.JWT_SECRET) {
    console.error('❌ START-PRODUCTION: JWT_SECRET no está configurada en el entorno. Abortando.');
    process.exit(1);
  }
  
  // Configurar variables de contenedor
  if (!process.env.PORT) {
    process.env.PORT = '3000';
    console.log('🔧 START-PRODUCTION: PORT configurado: 3000');
  }
  
  if (!process.env.HOSTNAME) {
    process.env.HOSTNAME = '0.0.0.0';
    console.log('🔧 START-PRODUCTION: HOSTNAME configurado: 0.0.0.0');
  }
  
  console.log('✅ START-PRODUCTION: Variables de entorno configuradas automáticamente');
}

// Inicializar base de datos PostgreSQL
async function initializeDatabase() {
  try {
    console.log('🐘 START-PRODUCTION: Inicializando base de datos PostgreSQL...');
    
    // Verificar si el script de inicialización existe
    const postgresScript = path.join(__dirname, 'init-database-postgres.js');
    if (fs.existsSync(postgresScript)) {
      const { initializeDatabase: initDB } = require('./init-database-postgres.js');
      const success = await initDB();
      if (success) {
        console.log('✅ START-PRODUCTION: Base de datos PostgreSQL inicializada exitosamente');
        return true;
      } else {
        console.log('⚠️ START-PRODUCTION: Base de datos PostgreSQL tuvo problemas, continuando...');
        return false;
      }
    } else {
      console.log('⚠️ START-PRODUCTION: Script de inicialización PostgreSQL no encontrado');
      return false;
    }
  } catch (error) {
    console.error('❌ START-PRODUCTION: Error inicializando base de datos:', error.message);
    return false;
  }
}

// Iniciar Next.js con configuración optimizada
function startNextJs() {
  console.log('🎯 START-PRODUCTION: Iniciando Next.js en modo producción...');
  
  const serverPath = '.next/standalone/server.js';
  let nextProcess;
  
  // Verificar si existe el build standalone
  if (fs.existsSync(serverPath)) {
    console.log('📦 START-PRODUCTION: Usando modo standalone de Next.js');
    nextProcess = spawn('node', [serverPath], {
      stdio: 'inherit',
      env: {
        ...process.env,
        HOSTNAME: '0.0.0.0',
        PORT: process.env.PORT || '3000'
      }
    });
  } else {
    console.log('🔧 START-PRODUCTION: Usando comando next start');
    nextProcess = spawn('npx', ['next', 'start'], {
      stdio: 'inherit',
      env: {
        ...process.env,
        HOSTNAME: '0.0.0.0',
        PORT: process.env.PORT || '3000'
      }
    });
  }
  
  // Manejo de eventos del proceso
  nextProcess.on('close', (code) => {
    console.log(`🔚 START-PRODUCTION: Next.js terminó con código: ${code}`);
    process.exit(code);
  });
  
  nextProcess.on('error', (error) => {
    console.error('💥 START-PRODUCTION: Error iniciando Next.js:', error);
    process.exit(1);
  });
  
  // Manejo de señales para shutdown graceful
  process.on('SIGTERM', () => {
    console.log('🛑 START-PRODUCTION: Recibida señal SIGTERM, cerrando aplicación...');
    nextProcess.kill('SIGTERM');
  });
  
  process.on('SIGINT', () => {
    console.log('🛑 START-PRODUCTION: Recibida señal SIGINT, cerrando aplicación...');
    nextProcess.kill('SIGINT');
  });
  
  console.log('✅ START-PRODUCTION: Next.js iniciado correctamente');
}

// Función principal
async function main() {
  try {
    console.log('🚀 START-PRODUCTION: Iniciando secuencia de arranque...');
    
    // 1. Configurar variables de entorno
    configureEnvironmentVariables();
    
    // 2. Inicializar base de datos
    await initializeDatabase();
    
    // 3. Iniciar Next.js
    startNextJs();
    
  } catch (error) {
    console.error('💥 START-PRODUCTION: Error fatal:', error);
    process.exit(1);
  }
}

// Ejecutar función principal
main();