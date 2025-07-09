#!/usr/bin/env node

// setup-production.js - Setup completo automático para producción
// Configura la base de datos completa con usuarios y datos de ejemplo

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

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
  internal: 'postgres://postgres:admin123@rkgwkkss048ck00skskc08gs:5432/postgres',
  external: 'postgres://postgres:admin123@localhost:5435/postgres',
  name: 'postgresql-database-rkgwkkss048ck00skskc08gs',
  username: 'postgres',
  password: 'admin123'
};

console.log('🚀 SETUP-PRODUCTION: Iniciando setup automático completo...');

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
  console.log('🔍 SETUP-PRODUCTION: Entorno detectado:', env.platform);
  
  // Configurar DATABASE_URL según el entorno
  if (!process.env.DATABASE_URL) {
    if (env.isCoolify || env.isProduction) {
      process.env.DATABASE_URL = DATABASE_CONFIG.internal;
      console.log('🐘 SETUP-PRODUCTION: DATABASE_URL configurada para Coolify (interno)');
    } else {
      process.env.DATABASE_URL = DATABASE_CONFIG.external;
      console.log('🐘 SETUP-PRODUCTION: DATABASE_URL configurada para desarrollo (externo)');
    }
  }
  
  // Configurar otras variables críticas
  process.env.NEXTAUTH_SECRET = 'reputacion-online-super-secret-key-2025';
  process.env.JWT_SECRET = 'reputacion-online-secret-key-2025';
  process.env.NODE_ENV = 'production';
  
  console.log('✅ SETUP-PRODUCTION: Variables de entorno configuradas');
}

// Función para generar IDs únicos
function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Crear conexión a PostgreSQL
async function createDatabaseConnection() {
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
    
    console.log('🔗 SETUP-PRODUCTION: Conectando a PostgreSQL...');
    await pool.query('SELECT NOW()');
    console.log('✅ SETUP-PRODUCTION: Conexión a PostgreSQL exitosa');
    
    return pool;
  } catch (error) {
    console.error('❌ SETUP-PRODUCTION: Error conectando a PostgreSQL:', error.message);
    throw error;
  }
}

// Crear todas las tablas necesarias
async function createTables(pool) {
  try {
    console.log('📊 SETUP-PRODUCTION: Creando tablas...');
    
    // Tabla de usuarios
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT,
        company TEXT,
        phone TEXT,
        bio TEXT,
        "avatarUrl" TEXT,
        role TEXT DEFAULT 'user',
        plan TEXT DEFAULT 'free',
        credits INTEGER DEFAULT 0,
        "profileType" TEXT,
        category TEXT,
        "brandName" TEXT,
        "otherCategory" TEXT,
        "partidoPolitico" TEXT,
        "cargoActual" TEXT,
        "propuestasPrincipales" TEXT,
        settings TEXT,
        "onboardingCompleted" BOOLEAN DEFAULT false,
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "lastLogin" TIMESTAMP,
        "nextBillingDate" TIMESTAMP
      )
    `);
    
    // Tabla de redes sociales
    await pool.query(`
      CREATE TABLE IF NOT EXISTS social_media (
        id TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        platform TEXT NOT NULL,
        username TEXT,
        "profileUrl" TEXT,
        followers INTEGER DEFAULT 0,
        following INTEGER DEFAULT 0,
        posts INTEGER DEFAULT 0,
        engagement REAL DEFAULT 0,
        connected BOOLEAN DEFAULT false,
        "lastSync" TIMESTAMP,
        "accessToken" TEXT,
        "refreshToken" TEXT,
        "tokenExpiry" TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE("userId", platform)
      )
    `);
    
    // Tabla de estadísticas de usuario
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_stats (
        id TEXT PRIMARY KEY,
        "userId" TEXT UNIQUE NOT NULL,
        "totalMentions" INTEGER DEFAULT 0,
        "positiveMentions" INTEGER DEFAULT 0,
        "negativeMentions" INTEGER DEFAULT 0,
        "neutralMentions" INTEGER DEFAULT 0,
        "sentimentScore" REAL DEFAULT 0,
        "reachEstimate" INTEGER DEFAULT 0,
        "engagementRate" REAL DEFAULT 0,
        "influenceScore" REAL DEFAULT 0,
        "trendingScore" REAL DEFAULT 0,
        "monthlyGrowth" REAL DEFAULT 0,
        "lastCalculated" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // Tabla de notificaciones
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL,
        "isRead" BOOLEAN DEFAULT false,
        priority TEXT DEFAULT 'normal',
        metadata TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // Tabla de configuraciones del sistema
    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id TEXT PRIMARY KEY,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        description TEXT,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedBy" TEXT
      )
    `);
    
    console.log('✅ SETUP-PRODUCTION: Tablas creadas exitosamente');
  } catch (error) {
    console.error('❌ SETUP-PRODUCTION: Error creando tablas:', error.message);
    throw error;
  }
}

// Crear usuarios automáticamente
async function createUsers(pool) {
  try {
    console.log('👤 SETUP-PRODUCTION: Creando usuarios...');
    
    const users = [
      {
        id: generateId(),
        email: 'admin@reputaciononline.com',
        password: 'admin123',
        name: 'Administrador',
        company: 'Reputación Online',
        role: 'admin',
        plan: 'enterprise',
        credits: 999999,
        onboardingCompleted: true
      },
      {
        id: generateId(),
        email: 'developer@reputaciononline.com',
        password: 'dev123',
        name: 'Desarrollador',
        company: 'Reputación Online',
        role: 'developer',
        plan: 'pro',
        credits: 50000,
        onboardingCompleted: true
      },
      {
        id: generateId(),
        email: 'client@example.com',
        password: 'client123',
        name: 'Cliente Ejemplo',
        company: 'Empresa Demo',
        role: 'user',
        plan: 'basic',
        credits: 1000,
        profileType: 'business',
        onboardingCompleted: false
      }
    ];
    
    for (const user of users) {
      // Verificar si el usuario ya existe
      const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [user.email]);
      
      if (existingUser.rows.length === 0) {
        const hashedPassword = await bcrypt.hash(user.password, 12);
        
        await pool.query(`
          INSERT INTO users (
            id, email, password, name, company, role, plan, credits, 
            "profileType", "onboardingCompleted", "createdAt", "updatedAt"
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [
          user.id, user.email, hashedPassword, user.name, user.company,
          user.role, user.plan, user.credits, user.profileType || 'personal',
          user.onboardingCompleted
        ]);
        
        console.log(`✅ SETUP-PRODUCTION: Usuario creado: ${user.email}`);
      } else {
        console.log(`ℹ️ SETUP-PRODUCTION: Usuario ya existe: ${user.email}`);
      }
    }
    
    console.log('✅ SETUP-PRODUCTION: Usuarios creados exitosamente');
  } catch (error) {
    console.error('❌ SETUP-PRODUCTION: Error creando usuarios:', error.message);
    throw error;
  }
}

// Crear datos de ejemplo
async function createSampleData(pool) {
  try {
    console.log('📊 SETUP-PRODUCTION: Creando datos de ejemplo...');
    
    // Obtener usuarios para crear datos de ejemplo
    const users = await pool.query('SELECT id, email FROM users LIMIT 3');
    
    for (const user of users.rows) {
      // Crear estadísticas de ejemplo
      const statsExists = await pool.query('SELECT id FROM user_stats WHERE "userId" = $1', [user.id]);
      
      if (statsExists.rows.length === 0) {
        await pool.query(`
          INSERT INTO user_stats (
            id, "userId", "totalMentions", "positiveMentions", 
            "negativeMentions", "neutralMentions", "sentimentScore",
            "reachEstimate", "engagementRate", "influenceScore"
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          generateId(), user.id, 1250, 850, 200, 200, 0.75,
          50000, 0.08, 0.65
        ]);
        
        console.log(`✅ SETUP-PRODUCTION: Estadísticas creadas para: ${user.email}`);
      }
      
      // Crear redes sociales de ejemplo
      const platforms = ['facebook', 'x', 'instagram', 'linkedin'];
      
      for (const platform of platforms) {
        const socialExists = await pool.query(
          'SELECT id FROM social_media WHERE "userId" = $1 AND platform = $2',
          [user.id, platform]
        );
        
        if (socialExists.rows.length === 0) {
          await pool.query(`
            INSERT INTO social_media (
              id, "userId", platform, username, followers, 
              following, posts, engagement, connected
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          `, [
            generateId(), user.id, platform, `@${user.email.split('@')[0]}`,
            Math.floor(Math.random() * 10000) + 1000,
            Math.floor(Math.random() * 1000) + 100,
            Math.floor(Math.random() * 500) + 50,
            Math.random() * 0.1 + 0.02,
            Math.random() > 0.5
          ]);
        }
      }
    }
    
    console.log('✅ SETUP-PRODUCTION: Datos de ejemplo creados exitosamente');
  } catch (error) {
    console.error('❌ SETUP-PRODUCTION: Error creando datos de ejemplo:', error.message);
    throw error;
  }
}

// Función principal de setup
async function setupProduction() {
  let pool;
  
  try {
    console.log('🚀 SETUP-PRODUCTION: Iniciando setup completo...');
    
    // 1. Configurar variables de entorno
    configureEnvironmentVariables();
    
    // 2. Crear conexión a base de datos
    pool = await createDatabaseConnection();
    
    // 3. Crear tablas
    await createTables(pool);
    
    // 4. Crear usuarios
    await createUsers(pool);
    
    // 5. Crear datos de ejemplo
    await createSampleData(pool);
    
    console.log('✅ SETUP-PRODUCTION: Setup completo exitoso');
    console.log('📋 SETUP-PRODUCTION: Usuarios creados:');
    console.log('   - admin@reputaciononline.com (password: admin123)');
    console.log('   - developer@reputaciononline.com (password: dev123)');
    console.log('   - client@example.com (password: client123)');
    console.log('🎯 SETUP-PRODUCTION: La aplicación está lista para usar');
    
    return true;
  } catch (error) {
    console.error('❌ SETUP-PRODUCTION: Error en setup:', error.message);
    return false;
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// Ejecutar setup si se llama directamente
if (require.main === module) {
  setupProduction().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { setupProduction };