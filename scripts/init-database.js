#!/usr/bin/env node

// Script de inicialización de base de datos para producción
// Este archivo es JavaScript puro para evitar problemas con TypeScript en runtime

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// Usar la misma lógica de rutas que database.ts
// En producción standalone (Docker), usar ruta absoluta /app/data
const isDockerProduction = process.env.NODE_ENV === 'production' && process.cwd() === '/app';
const dbPath = isDockerProduction
  ? '/app/data/app.db' 
  : path.join(process.cwd(), 'data', 'app.db');

console.log('🗄️  Inicializando base de datos SQLite en:', dbPath);

// Crear directorio data si no existe
try {
  const dataDir = isDockerProduction
    ? '/app/data' 
    : path.join(process.cwd(), 'data');
  fs.mkdirSync(dataDir, { recursive: true });
} catch (error) {
  // El directorio ya existe
}

// Inicializar base de datos
const db = new Database(dbPath);

// Configuraciones de SQLite para manejar concurrencia
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = 1000000');
db.pragma('locking_mode = NORMAL');
db.pragma('temp_store = MEMORY');
db.pragma('busy_timeout = 30000');

// Función para generar IDs
const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Crear todas las tablas
function createTables() {
  console.log('📊 Creando tablas...');
  
  // Tabla de usuarios
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT,
      company TEXT,
      phone TEXT,
      bio TEXT,
      avatarUrl TEXT,
      role TEXT DEFAULT 'user',
      plan TEXT DEFAULT 'free',
      credits INTEGER DEFAULT 0,
      profileType TEXT,
      category TEXT,
      brandName TEXT,
      otherCategory TEXT,
      additionalSources TEXT,
      partidoPolitico TEXT,
      cargoActual TEXT,
      propuestasPrincipales TEXT,
      settings TEXT,
      onboardingCompleted BOOLEAN DEFAULT 0,
      isActive BOOLEAN DEFAULT 1,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      lastLogin DATETIME,
      nextBillingDate DATETIME
    )
  `);

  // Tabla de redes sociales
  db.exec(`
    CREATE TABLE IF NOT EXISTS social_media (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      platform TEXT NOT NULL,
      username TEXT,
      profileUrl TEXT,
      followers INTEGER DEFAULT 0,
      following INTEGER DEFAULT 0,
      posts INTEGER DEFAULT 0,
      engagement REAL DEFAULT 0,
      connected BOOLEAN DEFAULT 0,
      lastSync DATETIME,
      accessToken TEXT,
      refreshToken TEXT,
      tokenExpiry DATETIME,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(userId, platform)
    )
  `);

  // Tabla de estadísticas de usuario
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_stats (
      id TEXT PRIMARY KEY,
      userId TEXT UNIQUE NOT NULL,
      totalMentions INTEGER DEFAULT 0,
      positiveMentions INTEGER DEFAULT 0,
      negativeMentions INTEGER DEFAULT 0,
      neutralMentions INTEGER DEFAULT 0,
      sentimentScore REAL DEFAULT 0,
      reachEstimate INTEGER DEFAULT 0,
      engagementRate REAL DEFAULT 0,
      influenceScore REAL DEFAULT 0,
      trendingScore REAL DEFAULT 0,
      monthlyGrowth REAL DEFAULT 0,
      lastCalculated DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Tabla de notificaciones
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      isRead BOOLEAN DEFAULT 0,
      priority TEXT DEFAULT 'normal',
      metadata TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Tabla de alertas
  db.exec(`
    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      name TEXT NOT NULL,
      keywords TEXT NOT NULL,
      platforms TEXT NOT NULL,
      sentiment TEXT,
      isActive BOOLEAN DEFAULT 1,
      frequency TEXT DEFAULT 'realtime',
      lastTriggered DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Tabla de reportes
  db.exec(`
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      dateRange TEXT NOT NULL,
      data TEXT NOT NULL,
      status TEXT DEFAULT 'generated',
      fileUrl TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Tabla de actividad
  db.exec(`
    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      action TEXT NOT NULL,
      description TEXT NOT NULL,
      metadata TEXT,
      ipAddress TEXT,
      userAgent TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Tabla de fuentes de medios
  db.exec(`
    CREATE TABLE IF NOT EXISTS media_sources (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      url TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      logoUrl TEXT,
      isActive BOOLEAN DEFAULT 1,
      isDefault BOOLEAN DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabla de fuentes seleccionadas por usuario
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_media_sources (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      mediaSourceId TEXT NOT NULL,
      isSelected BOOLEAN DEFAULT 0,
      addedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (mediaSourceId) REFERENCES media_sources(id) ON DELETE CASCADE,
      UNIQUE(userId, mediaSourceId)
    )
  `);

  // Tabla de plataformas sociales
  db.exec(`
    CREATE TABLE IF NOT EXISTS social_platforms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      platform TEXT UNIQUE NOT NULL,
      isActive BOOLEAN DEFAULT 1,
      oauthConfig TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('✅ Tablas creadas exitosamente');
}

// Crear usuario admin
async function createAdminUser() {
  try {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    const adminExists = stmt.get('admin@admin.com');
    
    if (!adminExists) {
      console.log('👤 Creando usuario administrador...');
      const hashedPassword = await bcrypt.hash('admin', 12);
      const id = generateId();
      
      const insertStmt = db.prepare(`
        INSERT INTO users (id, email, password, name, company, role, plan, credits, onboardingCompleted, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `);
      
      insertStmt.run(id, 'admin@admin.com', hashedPassword, 'Administrador', 'Sistema', 'admin', 'enterprise', 999999, 1);
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
      const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
      const existingUser = stmt.get(userData.email);
      
      if (!existingUser) {
        console.log(`👤 Creando usuario de prueba: ${userData.email}...`);
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        const id = generateId();
        
        const insertStmt = db.prepare(`
          INSERT INTO users (
            id, email, password, name, company, phone, bio, role, plan, credits, 
            profileType, category, brandName, onboardingCompleted, createdAt, updatedAt
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `);
        
        insertStmt.run(
          id, userData.email, hashedPassword, userData.name, userData.company,
          userData.phone, userData.bio, userData.role, userData.plan, userData.credits,
          userData.profileType, userData.category, userData.brandName || null,
          userData.onboardingCompleted ? 1 : 0
        );
      }
    }
    console.log('✅ Usuarios de prueba creados');
  } catch (error) {
    console.error('❌ Error creando usuarios de prueba:', error);
  }
}

// Poblar plataformas sociales
function populateSocialPlatforms() {
  try {
    // Plataformas soportadas: Facebook, X, Instagram, YouTube
    const platforms = [
      { name: 'Facebook', platform: 'facebook', isActive: true },
      { name: 'X', platform: 'x', isActive: true },
      { name: 'Instagram', platform: 'instagram', isActive: true },
      { name: 'YouTube', platform: 'youtube', isActive: true }
    ];

    for (const platform of platforms) {
      const stmt = db.prepare('SELECT * FROM social_platforms WHERE platform = ?');
      const existingPlatform = stmt.get(platform.platform);
      
      if (!existingPlatform) {
        const id = generateId();
        const insertStmt = db.prepare(`
          INSERT INTO social_platforms (id, name, platform, isActive, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `);
        insertStmt.run(id, platform.name, platform.platform, platform.isActive ? 1 : 0);
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
    console.log('🚀 Iniciando inicialización de base de datos...');
    
    // Crear tablas
    createTables();
    
    // Crear usuarios
    await createAdminUser();
    await createTestUsers();
    
    // Poblar datos
    populateSocialPlatforms();
    
    console.log('✅ Base de datos inicializada correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
    return false;
  } finally {
    db.close();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  initializeDatabase().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { initializeDatabase };