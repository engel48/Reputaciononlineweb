// Adaptador de base de datos - SIEMPRE usar PostgreSQL
// El sistema debe usar PostgreSQL en todos los entornos

// FORZAR PostgreSQL siempre - no más SQLite fallback
const usePostgres = true;

console.log('🔍 DATABASE ADAPTER: FORZANDO PostgreSQL siempre');
console.log('🔍 DATABASE_URL:', process.env.DATABASE_URL ? 'Configurada' : 'NO CONFIGURADA - ERROR!');

if (!process.env.DATABASE_URL) {
  console.error('❌ CRITICAL ERROR: DATABASE_URL no está configurada!');
  console.error('❌ Debes configurar DATABASE_URL en las variables de entorno');
  throw new Error('DATABASE_URL es requerida - no se permite fallback a SQLite');
}

if (!process.env.DATABASE_URL.startsWith('postgres')) {
  console.error('❌ CRITICAL ERROR: DATABASE_URL debe ser PostgreSQL!');
  throw new Error('Solo se permite PostgreSQL - no SQLite');
}

// SIEMPRE exportar PostgreSQL - nunca SQLite
export const { userService, socialMediaService, statsService, systemSettingsService } = require('./database');

export default require('./database').default;