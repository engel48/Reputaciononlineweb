// Adaptador de base de datos con detección automática y configuración inteligente
// Prioriza PostgreSQL pero permite fallback a SQLite en desarrollo local

// Importar configuración automática
import './env-loader';

interface DatabaseConfig {
  internal: string;
  external: string;
  username: string;
  password: string;
}

// Configuración de PostgreSQL para Coolify
const postgresConfig: DatabaseConfig = {
  internal: 'postgres://postgres:admin123@rkgwkkss048ck00skskc08gs:5432/postgres',
  external: 'postgres://postgres:admin123@localhost:5435/postgres',
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

// Configurar DATABASE_URL automáticamente si no existe
function ensureDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    const env = detectEnvironment();
    
    if (env.isCoolify || env.isProduction) {
      console.log('🔍 DATABASE ADAPTER: Configurando PostgreSQL interno para Coolify');
      process.env.DATABASE_URL = postgresConfig.internal;
    } else if (env.isLocal) {
      console.log('🔍 DATABASE ADAPTER: Configurando PostgreSQL externo para desarrollo local');
      process.env.DATABASE_URL = postgresConfig.external;
    } else {
      console.log('🔍 DATABASE ADAPTER: Usando PostgreSQL interno como fallback');
      process.env.DATABASE_URL = postgresConfig.internal;
    }
  }
}

// Verificar y configurar DATABASE_URL
ensureDatabaseUrl();

const env = detectEnvironment();
console.log('🔍 DATABASE ADAPTER: Entorno detectado:', env.platform);
console.log('🔍 DATABASE_URL:', process.env.DATABASE_URL ? 'Configurada' : 'NO CONFIGURADA');

// Intentar conectar a PostgreSQL primero
let usePostgres = true;
let dbAdapter;

try {
  if (process.env.DATABASE_URL?.startsWith('postgres')) {
    console.log('🐘 DATABASE ADAPTER: Intentando conectar a PostgreSQL...');
    dbAdapter = require('./database');
    console.log('✅ DATABASE ADAPTER: PostgreSQL conectado exitosamente');
  } else {
    throw new Error('DATABASE_URL no es PostgreSQL');
  }
} catch (error) {
  console.error('❌ DATABASE ADAPTER: Error conectando a PostgreSQL:', error.message);
  
  // Solo usar SQLite como fallback en desarrollo local
  if (env.isLocal && !env.isProduction) {
    console.log('🔄 DATABASE ADAPTER: Usando SQLite como fallback para desarrollo local');
    usePostgres = false;
    dbAdapter = require('./database-sqlite');
  } else {
    console.error('❌ DATABASE ADAPTER: PostgreSQL es requerido en producción');
    throw new Error('PostgreSQL es requerido - no se permite SQLite en producción');
  }
}

// Exportar servicios según el adaptador seleccionado
export const { userService, socialMediaService, statsService, systemSettingsService } = dbAdapter;

// Exportar información del adaptador usado
export const databaseInfo = {
  type: usePostgres ? 'postgresql' : 'sqlite',
  environment: env.platform,
  url: process.env.DATABASE_URL?.replace(/:([^@]+)@/, ':***@') || 'No configurada'
};

console.log('📊 DATABASE ADAPTER: Usando', databaseInfo.type, 'en', databaseInfo.environment);

export default dbAdapter.default;