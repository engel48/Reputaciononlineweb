#!/usr/bin/env node

// Script de inicio para configurar variables de entorno en runtime
// Este script se ejecuta cada vez que el contenedor inicia en producción

console.log('🚀 Iniciando aplicación Reputación Online...');

// Configurar variables de entorno requeridas si no están presentes
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:/app/prisma/dev.db';
  console.log('🔧 DATABASE_URL configurada: file:/app/prisma/dev.db');
}

if (!process.env.NEXTAUTH_SECRET) {
  process.env.NEXTAUTH_SECRET = 'reputacion-online-secret-' + Date.now();
  console.log('🔧 NEXTAUTH_SECRET configurada con valor generado');
}

if (!process.env.NEXTAUTH_URL) {
  // Detectar URL automáticamente basado en el entorno
  const url = process.env.COOLIFY_FQDN 
    ? `https://${process.env.COOLIFY_FQDN}`
    : process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}`
    : process.env.RAILWAY_STATIC_URL
    ? `https://${process.env.RAILWAY_STATIC_URL}`
    : 'http://localhost:3000';
  
  process.env.NEXTAUTH_URL = url;
  console.log(`🔧 NEXTAUTH_URL configurada: ${url}`);
}

console.log('✅ Variables de entorno configuradas para runtime');

// Verificar que la base de datos existe o crearla
const fs = require('fs');
const path = require('path');

const dbPath = '/app/prisma/dev.db';
const dbDir = path.dirname(dbPath);

// Crear directorio prisma si no existe
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log('📁 Directorio prisma creado');
}

// Si la base de datos no existe, intentar crearla
if (!fs.existsSync(dbPath)) {
  console.log('🔍 Base de datos no encontrada, intentando crear...');
  
  // Ejecutar migraciones de Prisma para crear la base de datos
  const { spawn } = require('child_process');
  
  const migrate = spawn('npx', ['prisma', 'migrate', 'deploy'], {
    stdio: 'inherit',
    env: process.env
  });
  
  migrate.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Migraciones aplicadas exitosamente');
      
      // Ejecutar seed si existe
      const seed = spawn('npm', ['run', 'db:seed'], {
        stdio: 'inherit',
        env: process.env
      });
      
      seed.on('close', (seedCode) => {
        if (seedCode === 0) {
          console.log('✅ Datos de prueba cargados');
        }
        startNextJs();
      });
    } else {
      console.log('⚠️  Error en migraciones, continuando sin base de datos...');
      startNextJs();
    }
  });
} else {
  console.log('✅ Base de datos encontrada');
  startNextJs();
}

function startNextJs() {
  console.log('🎯 Iniciando Next.js...');
  
  // Iniciar Next.js
  const { spawn } = require('child_process');
  const nextProcess = spawn('npx', ['next', 'start'], {
    stdio: 'inherit',
    env: process.env
  });
  
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
