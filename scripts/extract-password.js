#!/usr/bin/env node

// Script para extraer la contraseña exacta de PostgreSQL
console.log('🔐 EXTRACTOR DE CONTRASEÑA POSTGRESQL');
console.log('=' .repeat(60));

// CUIDADO: Este script muestra la contraseña real - solo para diagnóstico
console.log('⚠️  ADVERTENCIA: Este script mostrará la contraseña real');
console.log('⚠️  Solo ejecutar en entorno seguro para diagnóstico\n');

if (process.env.DATABASE_URL) {
  const url = process.env.DATABASE_URL;
  console.log('DATABASE_URL encontrada:', url.replace(/:([^@]+)@/, ':***@'));
  
  const urlMatch = url.match(/postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  
  if (urlMatch) {
    const [, user, password, host, port, database] = urlMatch;
    
    console.log('\n📋 COMPONENTES EXTRAÍDOS:');
    console.log('Usuario:', user);
    console.log('Host:', host);
    console.log('Puerto:', port);
    console.log('Base de datos:', database);
    console.log('Longitud de contraseña:', password.length, 'caracteres');
    
    console.log('\n🔑 CONTRASEÑA REAL (para diagnóstico):');
    console.log('└─ "' + password + '"');
    
    console.log('\n📝 URL COMPLETA PARA COPIAR:');
    console.log('└─ ' + url);
    
    console.log('\n🔧 COMPARACIÓN CON CONTRASEÑAS CONOCIDAS:');
    const knownPasswords = [
      'admin123',
      'Admin123', 
      'ADMIN123',
      'postgres',
      'password',
      'ReputacionOnline2025'
    ];
    
    knownPasswords.forEach(known => {
      if (password === known) {
        console.log(`✅ COINCIDE con "${known}"`);
      } else {
        console.log(`❌ NO coincide con "${known}"`);
      }
    });
    
    console.log('\n💡 ANÁLISIS DE LA CONTRASEÑA:');
    console.log('- Contiene números:', /\d/.test(password) ? 'Sí' : 'No');
    console.log('- Contiene letras minúsculas:', /[a-z]/.test(password) ? 'Sí' : 'No');
    console.log('- Contiene letras mayúsculas:', /[A-Z]/.test(password) ? 'Sí' : 'No');
    console.log('- Contiene símbolos especiales:', /[^a-zA-Z0-9]/.test(password) ? 'Sí' : 'No');
    console.log('- Primeros 8 caracteres:', password.substring(0, 8));
    console.log('- Últimos 4 caracteres:', password.substring(password.length - 4));
    
  } else {
    console.log('❌ No se pudo parsear la URL de DATABASE_URL');
  }
} else {
  console.log('❌ DATABASE_URL no está definida');
}

// Mostrar todas las variables de entorno relacionadas
console.log('\n🔍 TODAS LAS VARIABLES DE DB:');
Object.keys(process.env).forEach(key => {
  if (key.toLowerCase().includes('postgres') || 
      key.toLowerCase().includes('database') ||
      key.toLowerCase().includes('db_') ||
      key.toLowerCase().includes('password')) {
    const value = process.env[key];
    console.log(`${key}:`, value || 'undefined');
  }
});

console.log('\n✅ Extracción completada');
console.log('⚠️  Recuerda: NO compartir esta salida en lugares públicos');