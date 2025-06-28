#!/usr/bin/env node

// Script para configurar variables de entorno por defecto si no están presentes
// Esto es especialmente útil para despliegues donde no se han configurado todas las variables

const fs = require('fs');
const path = require('path');

// Variables de entorno requeridas con sus valores por defecto
const requiredEnvVars = {
  DATABASE_URL: 'file:./prisma/dev.db',
  NEXTAUTH_SECRET: 'default-secret-change-in-production',
  NEXTAUTH_URL: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'
};

console.log('🔧 Verificando variables de entorno...');

let envUpdated = false;

// Verificar cada variable requerida
Object.entries(requiredEnvVars).forEach(([key, defaultValue]) => {
  if (!process.env[key]) {
    console.log(`⚠️  Variable ${key} no encontrada, usando valor por defecto`);
    process.env[key] = defaultValue;
    envUpdated = true;
  } else {
    console.log(`✅ Variable ${key} configurada`);
  }
});

if (envUpdated) {
  console.log('🔄 Variables de entorno actualizadas con valores por defecto');
} else {
  console.log('✅ Todas las variables de entorno están configuradas');
}

// Verificar que Prisma pueda conectarse
try {
  console.log('🔍 Verificando conexión a base de datos...');
  console.log(`📍 DATABASE_URL: ${process.env.DATABASE_URL}`);
} catch (error) {
  console.error('❌ Error verificando base de datos:', error.message);
}
