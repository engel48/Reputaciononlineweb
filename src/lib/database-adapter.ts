// Adaptador de base de datos con detección automática y configuración inteligente
// Prioriza PostgreSQL pero permite fallback a SQLite en desarrollo local

interface DatabaseConfig {
  internal: string;
  external: string;
  username: string;
  password: string;
}

// Función para extraer credenciales de DATABASE_URL
function extractCredentialsFromEnv(): DatabaseConfig | null {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return null;
  
  const match = databaseUrl.match(/postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!match) return null;
  
  const [, username, password, host, port, database] = match;
  
  return {
    internal: databaseUrl,
    external: `postgres://${username}:${password}@localhost:5435/${database}`,
    username,
    password
  };
}

// Configuración de PostgreSQL para Coolify (con fallback automático)
const extractedConfig = extractCredentialsFromEnv();

// Usar configuración extraída de DATABASE_URL (sin credenciales hardcodeadas)
const postgresConfig: DatabaseConfig | null = extractedConfig;

// Función para verificar si una URL es accesible
async function isUrlAccessible(url: string): Promise<boolean> {
  try {
    const { Pool } = require('pg');
    const testPool = new Pool({
      connectionString: url,
      ssl: false,
      connectionTimeoutMillis: 3000,
      max: 1
    });
    
    await testPool.query('SELECT 1');
    await testPool.end();
    return true;
  } catch (error) {
    return false;
  }
}

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

// Verificar que DATABASE_URL está configurada
async function ensureDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE ADAPTER: DATABASE_URL no está configurada.');
    console.error('💡 Configura DATABASE_URL en .env.local o en las variables de entorno del servidor.');
    throw new Error('DATABASE_URL es requerida. Configúrala en las variables de entorno.');
  } else {
    console.log('✅ DATABASE ADAPTER: DATABASE_URL configurada');
  }
}

// Inicialización asíncrona del adaptador de base de datos
async function initializeAdapter() {
  const env = detectEnvironment();
  console.log('🔍 DATABASE ADAPTER: Entorno detectado:', env.platform);
  
  // Configuración inteligente de base de datos
  const forceSQLiteEnv = process.env.FORCE_SQLITE;
  const isLocalDevelopment = env.isLocal || env.isDevelopment || env.platform === 'local';

  // Determinar qué base de datos usar
  let useSQLite = false;

  if (forceSQLiteEnv !== undefined) {
    // Si FORCE_SQLITE está definida explícitamente, respetarla
    useSQLite = forceSQLiteEnv === 'true';
    const dbType = useSQLite ? 'SQLite' : 'PostgreSQL/Supabase';
    console.log(`✅ DATABASE ADAPTER: FORCE_SQLITE=${forceSQLiteEnv} → Usando ${dbType}`);
  } else {
    // Auto-detectar: SQLite en local, PostgreSQL en producción
    useSQLite = isLocalDevelopment;
    const reason = isLocalDevelopment ? 'entorno local (auto-detectado)' : 'entorno de producción (auto-detectado)';
    console.log(`🔍 DATABASE ADAPTER: ${reason} → Usando ${useSQLite ? 'SQLite' : 'PostgreSQL/Supabase'}`);
  }

  if (useSQLite) {
    console.log('💡 DATABASE ADAPTER: SQLite será usado para este entorno');
    console.log('📋 DATABASE ADAPTER: Saltando configuración de PostgreSQL/Supabase');

    // Limpiar DATABASE_URL para evitar confusiones
    if (process.env.DATABASE_URL) {
      console.log('🧹 DATABASE ADAPTER: Limpiando DATABASE_URL para usar SQLite');
      delete process.env.DATABASE_URL;
    }

    return {
      usePostgres: false,
      dbAdapter: require('./database-sqlite'),
      env
    };
  }

  // Verificar si usar Supabase o PostgreSQL directo
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  let usePostgres = true;
  let dbAdapter;

  try {
    // Priorizar Supabase si está configurado
    if (supabaseUrl && supabaseKey && supabaseUrl.includes('supabase.co')) {
      console.log('🟢 DATABASE ADAPTER: Usando Supabase SDK (configuración detectada)');
      dbAdapter = require('./supabase-server');
      console.log('✅ DATABASE ADAPTER: Supabase SDK inicializado exitosamente');
    } else if (process.env.DATABASE_URL?.startsWith('postgres')) {
      // Fallback a PostgreSQL directo si no hay Supabase
      console.log('🐘 DATABASE ADAPTER: Usando PostgreSQL directo (DATABASE_URL)');
      await ensureDatabaseUrl();
      dbAdapter = require('./database');
      console.log('✅ DATABASE ADAPTER: PostgreSQL conectado exitosamente');
    } else {
      throw new Error('No hay configuración de base de datos disponible');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ DATABASE ADAPTER: Error conectando a base de datos:', errorMessage);

    // Solo usar SQLite como fallback en desarrollo local
    if (env.isLocal && !env.isProduction) {
      console.log('🔄 DATABASE ADAPTER: Usando SQLite como fallback para desarrollo local');
      usePostgres = false;
      dbAdapter = require('./database-sqlite');
    } else {
      console.error('❌ DATABASE ADAPTER: Base de datos PostgreSQL/Supabase es requerida en producción');
      throw new Error('Base de datos es requerida - no se permite SQLite en producción');
    }
  }

  return {
    usePostgres,
    dbAdapter,
    env
  };
}

// Adaptador inicializado lazily
let adapterPromise: Promise<any> | null = null;
let adapterResult: any = null;

// Función para obtener el adaptador inicializado (lazy initialization)
async function getAdapter() {
  if (!adapterResult) {
    if (!adapterPromise) {
      // Solo inicializar cuando realmente se necesite (no durante build)
      adapterPromise = initializeAdapter();
    }
    adapterResult = await adapterPromise;
  }
  return adapterResult;
}

// Exportar servicios dinámicamente usando proxy
export const userService = new Proxy({} as any, {
  get: (target, prop) => {
    return async (...args: any[]) => {
      const adapter = await getAdapter();
      return adapter.dbAdapter.userService[prop](...args);
    };
  }
});

export const socialMediaService = new Proxy({} as any, {
  get: (target, prop) => {
    return async (...args: any[]) => {
      const adapter = await getAdapter();
      return adapter.dbAdapter.socialMediaService[prop](...args);
    };
  }
});

export const statsService = new Proxy({} as any, {
  get: (target, prop) => {
    return async (...args: any[]) => {
      const adapter = await getAdapter();
      return adapter.dbAdapter.statsService[prop](...args);
    };
  }
});

export const systemSettingsService = new Proxy({} as any, {
  get: (target, prop) => {
    return async (...args: any[]) => {
      const adapter = await getAdapter();
      return adapter.dbAdapter.systemSettingsService[prop](...args);
    };
  }
});

// Exportar información del adaptador usado
export const getDatabaseInfo = async () => {
  const adapter = await getAdapter();
  return {
    type: adapter.usePostgres ? 'postgresql' : 'sqlite',
    environment: adapter.env.platform,
    url: process.env.DATABASE_URL?.replace(/:([^@]+)@/, ':***@') || 'No configurada'
  };
};

// Exportar función para obtener el adaptador
export const getDatabase = async () => {
  const adapter = await getAdapter();
  return adapter.dbAdapter.default;
};