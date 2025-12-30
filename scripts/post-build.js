#!/usr/bin/env node

// Script post-build para copiar archivos estáticos requeridos para standalone
const fs = require('fs');
const path = require('path');

console.log('📦 Copiando archivos estáticos para standalone...');

const sourceStatic = path.join('.next', 'static');
const targetStatic = path.join('.next', 'standalone', '.next', 'static');

const sourcePublic = 'public';
const targetPublic = path.join('.next', 'standalone', 'public');

const sourceScripts = 'scripts';
const targetScripts = path.join('.next', 'standalone', 'scripts');

// Función para copiar directorios recursivamente
function copyRecursiveSync(src, dest) {
  if (!fs.existsSync(src)) {
    console.log(`⚠️  Directorio fuente no existe: ${src}`);
    return;
  }

  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();

  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

try {
  // Copiar archivos estáticos de Next.js (.next/static)
  if (fs.existsSync(sourceStatic)) {
    copyRecursiveSync(sourceStatic, targetStatic);
    console.log('✅ Archivos estáticos de Next.js copiados');
  } else {
    console.log('⚠️  No se encontraron archivos estáticos de Next.js');
  }

  // Copiar archivos públicos (public)
  if (fs.existsSync(sourcePublic)) {
    copyRecursiveSync(sourcePublic, targetPublic);
    console.log('✅ Archivos públicos copiados');
  } else {
    console.log('⚠️  No se encontraron archivos públicos');
  }

  // Copiar scripts necesarios para producción
  if (fs.existsSync(sourceScripts)) {
    // Solo copiar scripts específicos necesarios en producción
    if (!fs.existsSync(targetScripts)) {
      fs.mkdirSync(targetScripts, { recursive: true });
    }
    
    // Copiar scripts de inicialización de base de datos
    const initDbScript = path.join(sourceScripts, 'init-database-postgres.js');
    if (fs.existsSync(initDbScript)) {
      fs.copyFileSync(initDbScript, path.join(targetScripts, 'init-database-postgres.js'));
      console.log('✅ Script de inicialización PostgreSQL copiado');
    }
    
    // También copiar el script SQLite por compatibilidad
    const initDbSqliteScript = path.join(sourceScripts, 'init-database.js');
    if (fs.existsSync(initDbSqliteScript)) {
      fs.copyFileSync(initDbSqliteScript, path.join(targetScripts, 'init-database.js'));
      console.log('✅ Script de inicialización SQLite copiado (fallback)');
    }
  }

  // Copiar start.js al root del standalone
  const sourceStart = 'start.js';
  const targetStart = path.join('.next', 'standalone', 'start.js');
  if (fs.existsSync(sourceStart)) {
    fs.copyFileSync(sourceStart, targetStart);
    console.log('✅ Script de inicio copiado');
  }

  console.log('🎉 Post-build completado exitosamente');
} catch (error) {
  console.error('❌ Error en post-build:', error);
  process.exit(1);
}