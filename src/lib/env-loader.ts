// env-loader.ts - Sistema de configuración automática de variables de entorno
// Detecta automáticamente el entorno y configura las variables apropiadas

interface DatabaseConfig {
  internal: string;
  external: string;
  name: string;
  username: string;
  password: string;
  port: {
    internal: number;
    external: number;
  };
}

interface EnvironmentConfig {
  isDevelopment: boolean;
  isProduction: boolean;
  isCoolify: boolean;
  isVercel: boolean;
  isRailway: boolean;
  isLocal: boolean;
  platform: string;
}

// Configuración de base de datos PostgreSQL para Coolify - CREDENCIALES CORRECTAS
const databaseConfig: DatabaseConfig = {
  internal: 'postgres://postgres:ghxdiIxvNX8kjwafpuvS03B6e7M0ECSoZdEqPtLJsEW3WxBxn1f6USpp4vb42HIc@aswcsw80wsoskcskkscwscoo:5432/postgres',
  external: 'postgres://thor3:thor44@31.97.138.249:5437/postgres',
  name: 'thor',
  username: 'postgres',
  password: 'ghxdiIxvNX8kjwafpuvS03B6e7M0ECSoZdEqPtLJsEW3WxBxn1f6USpp4vb42HIc',
  port: {
    internal: 5432,
    external: 5437
  }
};

// Detectar entorno automáticamente
function detectEnvironment(): EnvironmentConfig {
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

// URLs posibles para detección automática
function getPossibleUrls(): string[] {
  return [
    process.env.APP_URL,                    // Coolify app URL
    process.env.PUBLIC_URL,                 // Deploy variable
    process.env.COOLIFY_URL,               // Platform variable
    process.env.COOLIFY_FQDN ? `https://${process.env.COOLIFY_FQDN}` : undefined,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    process.env.RAILWAY_STATIC_URL ? `https://${process.env.RAILWAY_STATIC_URL}` : undefined,
    'http://localhost:3000'                // Fallback local
  ].filter(Boolean) as string[];
}

// Configurar DATABASE_URL automáticamente
function configureDatabaseUrl(env: EnvironmentConfig): string {
  console.log('🔍 ENV-LOADER: Configurando DATABASE_URL para entorno:', env.platform);
  
  // Si ya existe DATABASE_URL y funciona, mantenerla
  if (process.env.DATABASE_URL) {
    console.log('🔍 ENV-LOADER: DATABASE_URL ya existe:', process.env.DATABASE_URL.replace(/:([^@]+)@/, ':***@'));
    return process.env.DATABASE_URL;
  }
  
  // Configurar según el entorno
  if (env.isCoolify || env.isProduction) {
    console.log('🐘 ENV-LOADER: Usando PostgreSQL interno para Coolify/Producción');
    return databaseConfig.internal;
  } else if (env.isLocal) {
    console.log('🐘 ENV-LOADER: Usando PostgreSQL externo para desarrollo local');
    // En desarrollo local, intentar conectar al puerto externo
    return databaseConfig.external;
  } else {
    console.log('🐘 ENV-LOADER: Usando PostgreSQL interno como fallback');
    return databaseConfig.internal;
  }
}

// Configurar NEXTAUTH_URL automáticamente
function configureNextAuthUrl(env: EnvironmentConfig): string {
  const possibleUrls = getPossibleUrls();
  
  console.log('🔍 ENV-LOADER: URLs posibles detectadas:', possibleUrls);
  
  // Usar la primera URL válida encontrada
  const selectedUrl = possibleUrls[0] || 'http://localhost:3000';
  console.log('🔗 ENV-LOADER: NEXTAUTH_URL seleccionada:', selectedUrl);
  
  return selectedUrl;
}

// Función principal de configuración automática
export function autoConfigureEnvironment(): boolean {
  try {
    console.log('🚀 ENV-LOADER: Iniciando configuración automática de variables...');
    
    const env = detectEnvironment();
    console.log('🔍 ENV-LOADER: Entorno detectado:', env);
    
    // Configurar DATABASE_URL si no existe
    // FORZAR DATABASE_URL correcta en Coolify
    if (env.isCoolify || env.isProduction) {
      console.log('🔧 ENV-LOADER: Coolify/Producción detectado - FORZANDO credenciales correctas');
      process.env.DATABASE_URL = 'postgres://postgres:ghxdiIxvNX8kjwafpuvS03B6e7M0ECSoZdEqPtLJsEW3WxBxn1f6USpp4vb42HIc@aswcsw80wsoskcskkscwscoo:5432/postgres';
      console.log('✅ ENV-LOADER: DATABASE_URL sobrescrita con credenciales correctas');
    } else if (!process.env.DATABASE_URL) {
      const databaseUrl = configureDatabaseUrl(env);
      process.env.DATABASE_URL = databaseUrl;
      console.log('🔧 ENV-LOADER: DATABASE_URL configurada automáticamente');
    }
    
    // Configurar NEXTAUTH_SECRET si no existe
    if (!process.env.NEXTAUTH_SECRET) {
      process.env.NEXTAUTH_SECRET = 'reputacion-online-super-secret-key-2025';
      console.log('🔧 ENV-LOADER: NEXTAUTH_SECRET configurada automáticamente');
    }
    
    // Configurar NEXTAUTH_URL si no existe
    if (!process.env.NEXTAUTH_URL) {
      const nextAuthUrl = configureNextAuthUrl(env);
      process.env.NEXTAUTH_URL = nextAuthUrl;
      console.log('🔧 ENV-LOADER: NEXTAUTH_URL configurada automáticamente');
    }
    
    // Configurar JWT_SECRET si no existe
    if (!process.env.JWT_SECRET) {
      process.env.JWT_SECRET = 'reputacion-online-secret-key-2025';
      console.log('🔧 ENV-LOADER: JWT_SECRET configurada automáticamente');
    }
    
    // Configurar PORT y HOSTNAME para contenedores
    if (!process.env.PORT) {
      process.env.PORT = '3000';
      console.log('🔧 ENV-LOADER: PORT configurado: 3000');
    }
    
    if (!process.env.HOSTNAME && env.isProduction) {
      process.env.HOSTNAME = '0.0.0.0';
      console.log('🔧 ENV-LOADER: HOSTNAME configurado: 0.0.0.0');
    }
    
    // Configurar NODE_ENV si no existe (solo para referencia, no modificar en producción)
    if (!process.env.NODE_ENV) {
      try {
        (process.env as any).NODE_ENV = env.isLocal ? 'development' : 'production';
        console.log('🔧 ENV-LOADER: NODE_ENV configurado:', process.env.NODE_ENV);
      } catch (error) {
        console.log('⚠️ ENV-LOADER: No se pudo configurar NODE_ENV (solo lectura)');
      }
    }
    
    console.log('✅ ENV-LOADER: Configuración automática completada exitosamente');
    console.log('📋 ENV-LOADER: Resumen de configuración:');
    console.log('   - Plataforma:', env.platform);
    console.log('   - NODE_ENV:', process.env.NODE_ENV);
    console.log('   - DATABASE_URL:', process.env.DATABASE_URL?.replace(/:([^@]+)@/, ':***@'));
    console.log('   - NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
    console.log('   - PORT:', process.env.PORT);
    
    return true;
  } catch (error) {
    console.error('❌ ENV-LOADER: Error en configuración automática:', error);
    return false;
  }
}

// Exportar configuraciones para uso en otros módulos
export { databaseConfig, detectEnvironment, getPossibleUrls };

// Auto-ejecutar configuración al importar el módulo
autoConfigureEnvironment();