#!/usr/bin/env node

// Script de inicialización de PostgreSQL para producción
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Configuración de conexión
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:admin123@rkgwkkss048ck00skskc08gs:5432/postgres';

console.log('🐘 Conectando a PostgreSQL...');
console.log('🔍 INIT-DATABASE-POSTGRES: Configuración de conexión:');
console.log(`   DATABASE_URL: ${connectionString.replace(/:([^@]+)@/, ':***@')}`);

// Extraer y mostrar componentes
const urlMatch = connectionString.match(/postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
if (urlMatch) {
  const [, user, password, host, port, database] = urlMatch;
  console.log('📋 INIT-DATABASE-POSTGRES: Componentes extraídos:');
  console.log(`   Usuario: ${user}`);
  console.log(`   Contraseña: ${password.length} caracteres, inicia con: ${password.substring(0, 4)}***`);
  console.log(`   Host: ${host}`);
  console.log(`   Puerto: ${port}`);
  console.log(`   Base de datos: ${database}`);
} else {
  console.log('❌ INIT-DATABASE-POSTGRES: No se pudo parsear la URL de conexión');
}

// Crear configuración del pool
let poolConfig;

// Si tenemos una URL, intentar parsearla para configuración de objeto
if (connectionString && connectionString.startsWith('postgres://')) {
  const urlMatch = connectionString.match(/postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (urlMatch) {
    const [, user, password, host, port, database] = urlMatch;
    console.log('🔧 INIT-DATABASE-POSTGRES: Usando configuración de objeto parseada');
    console.log('📋 INIT-DATABASE-POSTGRES: Configuración detallada:');
    console.log(`   Host: ${host}`);
    console.log(`   Puerto: ${port}`);
    console.log(`   Usuario: ${user}`);
    console.log(`   Contraseña parseada: "${password}"`);
    console.log(`   Base de datos: ${database}`);
    
    // Verificar si la contraseña tiene caracteres extraños
    if (password.startsWith('//')) {
      console.log('⚠️  ADVERTENCIA: La contraseña empieza con //');
      console.log('   Intentando corregir eliminando prefijo...');
      const cleanPassword = password.replace(/^\/\//, '');
      console.log(`   Contraseña limpia: "${cleanPassword}" (${cleanPassword.length} chars)`);
      
      poolConfig = {
        host,
        port: parseInt(port),
        user,
        password: cleanPassword, // Usar contraseña limpia
        database,
        ssl: false,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      };
    } else {
      poolConfig = {
        host,
        port: parseInt(port),
        user,
        password,
        database,
        ssl: false,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      };
    }
  } else {
    console.log('⚠️ INIT-DATABASE-POSTGRES: No se pudo parsear URL, usando connectionString');
    poolConfig = {
      connectionString,
      ssl: false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    };
  }
} else {
  console.log('❌ INIT-DATABASE-POSTGRES: No hay connectionString válida');
  throw new Error('No se encontró configuración de base de datos válida');
}

const pool = new Pool(poolConfig);

// Función para generar IDs
const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Crear todas las tablas
async function createTables() {
  console.log('📊 Creando tablas PostgreSQL...');
  
  try {
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
        "additionalSources" TEXT,
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

    // Tabla de alertas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS alerts (
        id TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        name TEXT NOT NULL,
        keywords TEXT NOT NULL,
        platforms TEXT NOT NULL,
        sentiment TEXT,
        "isActive" BOOLEAN DEFAULT true,
        frequency TEXT DEFAULT 'realtime',
        "lastTriggered" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Tabla de reportes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        "dateRange" TEXT NOT NULL,
        data TEXT NOT NULL,
        status TEXT DEFAULT 'generated',
        "fileUrl" TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Tabla de actividad
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activities (
        id TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        action TEXT NOT NULL,
        description TEXT NOT NULL,
        metadata TEXT,
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Tabla de fuentes de medios
    await pool.query(`
      CREATE TABLE IF NOT EXISTS media_sources (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        url TEXT UNIQUE NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        "logoUrl" TEXT,
        "isActive" BOOLEAN DEFAULT true,
        "isDefault" BOOLEAN DEFAULT false,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de fuentes seleccionadas por usuario
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_media_sources (
        id TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "mediaSourceId" TEXT NOT NULL,
        "isSelected" BOOLEAN DEFAULT false,
        "addedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY ("mediaSourceId") REFERENCES media_sources(id) ON DELETE CASCADE,
        UNIQUE("userId", "mediaSourceId")
      )
    `);

    // Tabla de plataformas sociales
    await pool.query(`
      CREATE TABLE IF NOT EXISTS social_platforms (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        platform TEXT UNIQUE NOT NULL,
        "isActive" BOOLEAN DEFAULT true,
        "oauthConfig" TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Tablas PostgreSQL creadas exitosamente');
  } catch (error) {
    console.error('❌ Error creando tablas:', error.message);
    console.error('📋 Detalles del error:');
    console.error('   Código:', error.code);
    console.error('   Severidad:', error.severity);
    
    if (error.code === '28P01') {
      console.error('\n🔍 ANÁLISIS DEL ERROR DE AUTENTICACIÓN:');
      console.error('   → Error 28P01 = Autenticación fallida');
      console.error('   → La contraseña para el usuario "postgres" es incorrecta');
      console.error('   → Verificar la contraseña en la configuración de Coolify');
      
      // Mostrar la configuración actual
      if (connectionString) {
        const passwordMatch = connectionString.match(/:([^@]+)@/);
        if (passwordMatch) {
          const password = passwordMatch[1];
          console.error('   → Contraseña actual: longitud', password.length, 'chars, inicia con:', password.substring(0, 4) + '***');
        }
      }
      
      console.error('\n💡 SOLUCIONES:');
      console.error('   1. Ejecutar: node scripts/extract-password.js');
      console.error('   2. Verificar variables de entorno en Coolify');
      console.error('   3. Comprobar contraseña real en configuración de PostgreSQL');
    }
    
    throw error;
  }
}

// Crear usuario admin
async function createAdminUser() {
  try {
    const adminCheck = await pool.query('SELECT * FROM users WHERE email = $1', ['admin@admin.com']);
    
    if (adminCheck.rows.length === 0) {
      console.log('👤 Creando usuario administrador...');
      const hashedPassword = await bcrypt.hash('admin', 12);
      const id = generateId();
      
      await pool.query(`
        INSERT INTO users (id, email, password, name, company, role, plan, credits, "onboardingCompleted", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [id, 'admin@admin.com', hashedPassword, 'Administrador', 'Sistema', 'admin', 'enterprise', 999999, true]);
      
      console.log('✅ Usuario administrador creado');
    } else {
      console.log('ℹ️  Usuario administrador ya existe');
    }
  } catch (error) {
    console.error('❌ Error creando usuario admin:', error);
  }
}

// Crear usuarios de prueba
async function createTestUsers() {
  try {
    const testUsers = [
      {
        email: 'elmer.zapata@example.com',
        password: 'password123',
        name: 'Elmer Zapata',
        company: 'Política Colombiana',
        phone: '+57 300 123 4567',
        bio: 'Líder político comprometido con el desarrollo social y económico del país.',
        role: 'user',
        plan: 'pro',
        credits: 2500,
        profileType: 'political',
        category: 'Sector político y gubernamental',
        onboardingCompleted: true
      },
      {
        email: 'lucia.morales@example.com',
        password: 'password123',
        name: 'Lucía Morales',
        company: 'StartUp Tech',
        phone: '+57 301 987 6543',
        bio: 'Emprendedora en el sector tecnológico, enfocada en innovación y desarrollo digital.',
        role: 'user',
        plan: 'basic',
        credits: 500,
        profileType: 'business',
        category: 'Marca / empresa',
        brandName: 'StartUp Tech Solutions',
        onboardingCompleted: false
      }
    ];

    for (const userData of testUsers) {
      const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [userData.email]);
      
      if (userCheck.rows.length === 0) {
        console.log(`👤 Creando usuario de prueba: ${userData.email}...`);
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        const id = generateId();
        
        await pool.query(`
          INSERT INTO users (
            id, email, password, name, company, phone, bio, role, plan, credits, 
            "profileType", category, "brandName", "onboardingCompleted", "createdAt", "updatedAt"
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [
          id, userData.email, hashedPassword, userData.name, userData.company,
          userData.phone, userData.bio, userData.role, userData.plan, userData.credits,
          userData.profileType, userData.category, userData.brandName || null,
          userData.onboardingCompleted
        ]);
      }
    }
    console.log('✅ Usuarios de prueba creados');
  } catch (error) {
    console.error('❌ Error creando usuarios de prueba:', error);
  }
}

// Poblar plataformas sociales
async function populateSocialPlatforms() {
  try {
    const platforms = [
      { name: 'Facebook', platform: 'facebook', isActive: true },
      { name: 'X', platform: 'x', isActive: true },
      { name: 'Instagram', platform: 'instagram', isActive: true },
      { name: 'Threads', platform: 'threads', isActive: true },
      { name: 'LinkedIn', platform: 'linkedin', isActive: true },
      { name: 'YouTube', platform: 'youtube', isActive: true },
      { name: 'TikTok', platform: 'tiktok', isActive: true }
    ];

    for (const platform of platforms) {
      const platformCheck = await pool.query('SELECT * FROM social_platforms WHERE platform = $1', [platform.platform]);
      
      if (platformCheck.rows.length === 0) {
        const id = generateId();
        await pool.query(`
          INSERT INTO social_platforms (id, name, platform, "isActive", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [id, platform.name, platform.platform, platform.isActive]);
      }
    }
    console.log('✅ Plataformas sociales pobladas');
  } catch (error) {
    console.error('❌ Error poblando plataformas sociales:', error);
  }
}

// Función principal de inicialización
async function initializeDatabase() {
  try {
    console.log('🚀 Iniciando inicialización de base de datos PostgreSQL...');
    
    // Crear tablas
    await createTables();
    
    // Crear usuarios
    await createAdminUser();
    await createTestUsers();
    
    // Poblar datos
    await populateSocialPlatforms();
    
    console.log('✅ Base de datos PostgreSQL inicializada correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error inicializando base de datos PostgreSQL:', error);
    return false;
  } finally {
    await pool.end();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  initializeDatabase().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { initializeDatabase };