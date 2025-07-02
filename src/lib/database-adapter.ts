// Adaptador de base de datos que detecta el entorno
// Usa SQLite para desarrollo local y PostgreSQL para producción

const isProduction = process.env.NODE_ENV === 'production';
const hasPostgresUrl = process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres');

// Si estamos en desarrollo o no hay URL de PostgreSQL, usar SQLite
const usePostgres = isProduction && hasPostgresUrl;

console.log('🔍 DATABASE ADAPTER:', {
  isProduction,
  hasPostgresUrl,
  usePostgres,
  databaseUrl: process.env.DATABASE_URL ? 'Configurada' : 'No configurada'
});

// Exportar el servicio correcto según el entorno
export const { userService, socialMediaService, statsService, systemSettingsService } = usePostgres
  ? require('./database')
  : require('./database-sqlite');

export default usePostgres ? require('./database').default : require('./database-sqlite').default;