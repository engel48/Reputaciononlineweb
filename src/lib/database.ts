// Base de datos SQLite local para la aplicación
import Database from 'better-sqlite3';
import { join } from 'path';
import bcrypt from 'bcryptjs';

// Ruta de la base de datos SQLite
const dbPath = join(process.cwd(), 'data', 'app.db');

// Crear directorio data si no existe
import { mkdirSync } from 'fs';
try {
  mkdirSync(join(process.cwd(), 'data'), { recursive: true });
} catch (error) {
  // El directorio ya existe
}

// Inicializar base de datos solo si no es durante el build
let db: Database.Database;

const initDatabase = () => {
  if (!db) {
    db = new Database(dbPath);
    
    // Configuraciones de SQLite para manejar concurrencia
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.pragma('synchronous = NORMAL');
    db.pragma('cache_size = 1000000');
    db.pragma('locking_mode = NORMAL');
    db.pragma('temp_store = MEMORY');
    db.pragma('busy_timeout = 30000'); // 30 segundos timeout
  }
  return db;
};

// Solo inicializar durante runtime, no durante build
if (!process.env.NIXPACKS_PATH && !process.env.NEXT_PHASE) {
  db = initDatabase();
}

// Crear tablas
const initTables = () => {
  if (!db) db = initDatabase();
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

  console.log('✅ Tablas de SQLite inicializadas correctamente');
};

// Funciones auxiliares
const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Funciones de usuario
export const userService = {
  // Crear usuario
  create: async (userData: {
    email: string;
    password: string;
    name?: string;
    company?: string;
  }) => {
    if (!db) db = initDatabase();
    const id = generateId();
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    
    const stmt = db.prepare(`
      INSERT INTO users (id, email, password, name, company, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
    
    stmt.run(id, userData.email, hashedPassword, userData.name || null, userData.company || null);
    return { id, ...userData, password: undefined };
  },

  // Buscar por email
  findByEmail: (email: string) => {
    if (!db) db = initDatabase();
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email) as any;
  },

  // Buscar por ID
  findById: (id: string) => {
    if (!db) db = initDatabase();
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    const user = stmt.get(id) as any;
    if (user) {
      delete user.password; // No devolver la contraseña
    }
    return user;
  },

  // Buscar por ID con contraseña (para autenticación)
  findByIdWithPassword: (id: string) => {
    if (!db) db = initDatabase();
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id) as any;
  },

  // Buscar por email con contraseña (para autenticación)
  findByEmailWithPassword: (email: string) => {
    if (!db) db = initDatabase();
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email) as any;
  },

  // Actualizar usuario
  update: (id: string, userData: any) => {
    const fields = [];
    const values = [];
    
    for (const [key, value] of Object.entries(userData)) {
      if (key !== 'id' && value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }
    
    if (fields.length === 0) return false;
    
    fields.push('updatedAt = CURRENT_TIMESTAMP');
    values.push(id);
    
    if (!db) db = initDatabase();
    const stmt = db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`);
    const result = stmt.run(...values);
    return result.changes > 0;
  },

  // Verificar contraseña
  verifyPassword: async (plainPassword: string, hashedPassword: string) => {
    return await bcrypt.compare(plainPassword, hashedPassword);
  },

  // Actualizar último login
  updateLastLogin: (id: string) => {
    if (!db) db = initDatabase();
    const stmt = db.prepare('UPDATE users SET lastLogin = CURRENT_TIMESTAMP WHERE id = ?');
    stmt.run(id);
  },

  // Obtener todos los usuarios
  findAll: () => {
    if (!db) db = initDatabase();
    const stmt = db.prepare('SELECT * FROM users ORDER BY createdAt DESC');
    const users = stmt.all() as any[];
    return users.map(user => {
      delete user.password; // No devolver las contraseñas
      return user;
    });
  },

  // Eliminar usuario
  delete: (id: string) => {
    if (!db) db = initDatabase();
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    return stmt.run(id).changes > 0;
  }
};

// Funciones de redes sociales
export const socialMediaService = {
  // Obtener redes sociales del usuario
  getByUserId: (userId: string) => {
    if (!db) db = initDatabase();
    const stmt = db.prepare('SELECT * FROM social_media WHERE userId = ?');
    return stmt.all(userId);
  },

  // Crear o actualizar conexión de red social
  upsert: (data: {
    userId: string;
    platform: string;
    username?: string;
    profileUrl?: string;
    followers?: number;
    following?: number;
    posts?: number;
    engagement?: number;
    connected?: boolean;
    accessToken?: string;
    refreshToken?: string;
    tokenExpiry?: Date;
  }) => {
    if (!db) db = initDatabase();
    const id = generateId();
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO social_media 
      (id, userId, platform, username, profileUrl, followers, following, posts, engagement, connected, lastSync, accessToken, refreshToken, tokenExpiry)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      data.userId,
      data.platform,
      data.username || null,
      data.profileUrl || null,
      data.followers || 0,
      data.following || 0,
      data.posts || 0,
      data.engagement || 0,
      data.connected ? 1 : 0,
      data.accessToken || null,
      data.refreshToken || null,
      data.tokenExpiry || null
    );
    
    return id;
  }
};

// Funciones de estadísticas
export const statsService = {
  // Obtener estadísticas del usuario
  getByUserId: (userId: string) => {
    if (!db) db = initDatabase();
    const stmt = db.prepare('SELECT * FROM user_stats WHERE userId = ?');
    return stmt.get(userId);
  },

  // Crear o actualizar estadísticas
  upsert: (userId: string, stats: any) => {
    if (!db) db = initDatabase();
    const id = generateId();
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO user_stats 
      (id, userId, totalMentions, positiveMentions, negativeMentions, neutralMentions, sentimentScore, reachEstimate, engagementRate, influenceScore, trendingScore, monthlyGrowth, lastCalculated, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
    
    stmt.run(
      id,
      userId,
      stats.totalMentions || 0,
      stats.positiveMentions || 0,
      stats.negativeMentions || 0,
      stats.neutralMentions || 0,
      stats.sentimentScore || 0,
      stats.reachEstimate || 0,
      stats.engagementRate || 0,
      stats.influenceScore || 0,
      stats.trendingScore || 0,
      stats.monthlyGrowth || 0
    );
  }
};

// Funciones de notificaciones
export const notificationService = {
  // Crear notificación
  create: (data: {
    userId: string;
    title: string;
    message: string;
    type: string;
    priority?: string;
    metadata?: any;
  }) => {
    if (!db) db = initDatabase();
    const id = generateId();
    const stmt = db.prepare(`
      INSERT INTO notifications (id, userId, title, message, type, priority, metadata, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    
    stmt.run(
      id,
      data.userId,
      data.title,
      data.message,
      data.type,
      data.priority || 'normal',
      data.metadata ? JSON.stringify(data.metadata) : null
    );
    
    return id;
  },

  // Obtener notificaciones del usuario
  getByUserId: (userId: string, limit = 50) => {
    if (!db) db = initDatabase();
    const stmt = db.prepare(`
      SELECT * FROM notifications 
      WHERE userId = ? 
      ORDER BY createdAt DESC 
      LIMIT ?
    `);
    return stmt.all(userId, limit);
  },

  // Marcar como leída
  markAsRead: (id: string) => {
    if (!db) db = initDatabase();
    const stmt = db.prepare('UPDATE notifications SET isRead = 1 WHERE id = ?');
    return stmt.run(id).changes > 0;
  }
};

// Inicializar base de datos solo si no es durante el build de Nixpacks
// NIXPACKS_PATH solo existe durante el build, no en runtime
if (!process.env.NIXPACKS_PATH && !process.env.NEXT_PHASE) {
  initTables();
}

// Migraciones para añadir columnas faltantes
const runMigrations = () => {
  if (!db) db = initDatabase();
  try {
    // Añadir columnas para políticos si no existen
    const columns = ['partidoPolitico', 'cargoActual', 'propuestasPrincipales', 'settings'];
    
    columns.forEach(column => {
      try {
        db.exec(`ALTER TABLE users ADD COLUMN ${column} TEXT`);
        console.log(`✅ Columna ${column} añadida`);
      } catch (error) {
        // La columna ya existe, no hacer nada
      }
    });

    // Añadir columna isActive para habilitar/deshabilitar usuarios
    try {
      db.exec(`ALTER TABLE users ADD COLUMN isActive BOOLEAN DEFAULT 1`);
      console.log(`✅ Columna isActive añadida`);
    } catch (error) {
      // La columna ya existe, no hacer nada
    }
  } catch (error) {
    console.log('Migraciones completadas o ya aplicadas');
  }
};

// Solo ejecutar migraciones y crear admin en runtime, no durante build
if (!process.env.NIXPACKS_PATH && !process.env.NEXT_PHASE) {
  runMigrations();
}

// Crear usuario admin si no existe
const createAdminUser = async () => {
  try {
    const adminExists = userService.findByEmail('admin@admin.com');
    if (!adminExists) {
      console.log('🔧 Creando usuario administrador...');
      await userService.create({
        email: 'admin@admin.com',
        password: 'admin',
        name: 'Administrador',
        company: 'Sistema'
      });
      
      // Actualizar el usuario para que sea admin
      const admin = userService.findByEmail('admin@admin.com');
      if (admin) {
        userService.update(admin.id, { 
          role: 'admin',
          plan: 'enterprise',
          credits: 999999,
          onboardingCompleted: 1
        });
        console.log('✅ Usuario administrador creado exitosamente');
      }
    }
  } catch (error) {
    console.log('Usuario admin ya existe o error al crear:', error instanceof Error ? error.message : error);
  }
};

// Poblar plataformas sociales con configuración OAuth
const populateSocialPlatforms = async () => {
  try {
    const platforms = [
      { 
        name: 'Facebook', 
        platform: 'facebook', 
        isActive: true,
        oauthConfig: JSON.stringify({
          clientId: process.env.FACEBOOK_CLIENT_ID || '',
          clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
          scope: 'pages_read_engagement,pages_show_list,email',
          redirectUri: (process.env.NEXTAUTH_URL || 'http://localhost:3000') + '/api/auth/callback/facebook'
        })
      },
      { 
        name: 'X', 
        platform: 'x', 
        isActive: true,
        oauthConfig: JSON.stringify({
          clientId: process.env.TWITTER_CLIENT_ID || '',
          clientSecret: process.env.TWITTER_CLIENT_SECRET || '',
          scope: 'tweet.read,users.read,follows.read',
          redirectUri: (process.env.NEXTAUTH_URL || 'http://localhost:3000') + '/api/auth/callback/twitter'
        })
      },
      { 
        name: 'Instagram', 
        platform: 'instagram', 
        isActive: true,
        oauthConfig: JSON.stringify({
          clientId: process.env.INSTAGRAM_CLIENT_ID || '',
          clientSecret: process.env.INSTAGRAM_CLIENT_SECRET || '',
          scope: 'user_profile,user_media',
          redirectUri: (process.env.NEXTAUTH_URL || 'http://localhost:3000') + '/api/auth/callback/instagram'
        })
      },
      { 
        name: 'Threads', 
        platform: 'threads', 
        isActive: true,
        oauthConfig: JSON.stringify({
          clientId: process.env.INSTAGRAM_CLIENT_ID || '',
          clientSecret: process.env.INSTAGRAM_CLIENT_SECRET || '',
          scope: 'threads_basic,threads_content_publish',
          redirectUri: (process.env.NEXTAUTH_URL || 'http://localhost:3000') + '/api/auth/callback/threads'
        })
      },
      { 
        name: 'LinkedIn', 
        platform: 'linkedin', 
        isActive: true,
        oauthConfig: JSON.stringify({
          clientId: process.env.LINKEDIN_CLIENT_ID || '',
          clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
          scope: 'r_liteprofile,r_emailaddress,w_member_social',
          redirectUri: (process.env.NEXTAUTH_URL || 'http://localhost:3000') + '/api/auth/callback/linkedin'
        })
      },
      { 
        name: 'YouTube', 
        platform: 'youtube', 
        isActive: true,
        oauthConfig: JSON.stringify({
          clientId: process.env.YOUTUBE_CLIENT_ID || '',
          clientSecret: process.env.YOUTUBE_CLIENT_SECRET || '',
          scope: 'https://www.googleapis.com/auth/youtube.readonly',
          redirectUri: (process.env.NEXTAUTH_URL || 'http://localhost:3000') + '/api/auth/callback/youtube'
        })
      },
      { 
        name: 'TikTok', 
        platform: 'tiktok', 
        isActive: true,
        oauthConfig: JSON.stringify({
          clientId: process.env.TIKTOK_CLIENT_ID || '',
          clientSecret: process.env.TIKTOK_CLIENT_SECRET || '',
          scope: 'user.info.basic,video.list',
          redirectUri: (process.env.NEXTAUTH_URL || 'http://localhost:3000') + '/api/auth/callback/tiktok'
        })
      }
    ];

    for (const platform of platforms) {
      if (!db) db = initDatabase();
      const existingPlatform = db.prepare('SELECT * FROM social_platforms WHERE platform = ?').get(platform.platform);
      if (!existingPlatform) {
        const id = generateId();
        const stmt = db.prepare(`
          INSERT INTO social_platforms (id, name, platform, isActive, oauthConfig, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `);
        stmt.run(id, platform.name, platform.platform, platform.isActive ? 1 : 0, platform.oauthConfig);
      }
    }
    console.log('✅ Plataformas sociales pobladas correctamente');
  } catch (error) {
    console.error('Error poblando plataformas sociales:', error);
  }
};

// Poblar medios de comunicación colombianos
const populateMediaSources = async () => {
  try {
    const mediaSources = [
      // Medios nacionales
      { name: 'El Tiempo', url: 'https://www.eltiempo.com', category: 'nacional', description: 'Periódico nacional de Colombia', isDefault: true },
      { name: 'El Espectador', url: 'https://www.elespectador.com', category: 'nacional', description: 'Periódico nacional de Colombia', isDefault: true },
      { name: 'Semana', url: 'https://www.semana.com', category: 'nacional', description: 'Revista semanal de noticias', isDefault: true },
      { name: 'Caracol Radio', url: 'https://caracol.com.co', category: 'nacional', description: 'Cadena radial nacional', isDefault: true },
      { name: 'BluRadio', url: 'https://www.bluradio.com', category: 'nacional', description: 'Cadena radial nacional', isDefault: true },
      { name: 'RCN Radio', url: 'https://www.rcnradio.com', category: 'nacional', description: 'Cadena radial nacional', isDefault: true },
      { name: 'Noticias Caracol', url: 'https://noticias.caracoltv.com', category: 'nacional', description: 'Noticiero televisivo nacional', isDefault: true },
      { name: 'Noticias RCN', url: 'https://www.noticiasrcn.com', category: 'nacional', description: 'Noticiero televisivo nacional', isDefault: true },
      { name: 'CM&', url: 'https://www.cmi.com.co', category: 'nacional', description: 'Canal de televisión nacional', isDefault: true },
      { name: 'Canal 1', url: 'https://www.canal1.com.co', category: 'nacional', description: 'Canal de televisión nacional', isDefault: true },
      
      // Medios regionales
      { name: 'El Colombiano', url: 'https://www.elcolombiano.com', category: 'regional', description: 'Periódico de Medellín y Antioquia', isDefault: true },
      { name: 'El País', url: 'https://www.elpais.com.co', category: 'regional', description: 'Periódico de Cali y Valle del Cauca', isDefault: true },
      { name: 'El Heraldo', url: 'https://www.elheraldo.co', category: 'regional', description: 'Periódico de Barranquilla y Costa Caribe', isDefault: true },
      { name: 'El Universal', url: 'https://www.eluniversal.com.co', category: 'regional', description: 'Periódico de Cartagena y Bolívar', isDefault: true },
      { name: 'Vanguardia', url: 'https://www.vanguardia.com', category: 'regional', description: 'Periódico de Bucaramanga y Santander', isDefault: true },
      { name: 'La Opinión', url: 'https://www.laopinion.com.co', category: 'regional', description: 'Periódico de Cúcuta y Norte de Santander', isDefault: true },
      { name: 'Diario del Huila', url: 'https://www.diariodelhuila.com', category: 'regional', description: 'Periódico del Huila', isDefault: true },
      { name: 'La Patria', url: 'https://www.lapatria.com', category: 'regional', description: 'Periódico de Manizales y Caldas', isDefault: true },
      
      // Medios especializados
      { name: 'Portafolio', url: 'https://www.portafolio.co', category: 'especializado', description: 'Diario económico y financiero', isDefault: true },
      { name: 'La República', url: 'https://www.larepublica.co', category: 'especializado', description: 'Diario económico y empresarial', isDefault: true },
      { name: 'KIENYKE', url: 'https://www.kienyke.com', category: 'especializado', description: 'Medio digital de política y actualidad', isDefault: true },
      { name: 'Las2Orillas', url: 'https://www.las2orillas.co', category: 'especializado', description: 'Medio digital de opinión y análisis', isDefault: true },
      { name: 'El Nuevo Siglo', url: 'https://www.elnuevosiglo.com.co', category: 'especializado', description: 'Periódico de política y análisis', isDefault: true },
      { name: 'Razón Pública', url: 'https://www.razonpublica.com', category: 'especializado', description: 'Portal de análisis político y social', isDefault: true },
      
      // Medios internacionales relevantes
      { name: 'BBC Mundo', url: 'https://www.bbc.com/mundo', category: 'internacional', description: 'Servicio en español de BBC', isDefault: true },
      { name: 'CNN en Español', url: 'https://cnnespanol.cnn.com', category: 'internacional', description: 'Noticiero internacional en español', isDefault: true },
      { name: 'El País España', url: 'https://elpais.com', category: 'internacional', description: 'Diario español con cobertura latinoamericana', isDefault: true },
      { name: 'Infobae', url: 'https://www.infobae.com', category: 'internacional', description: 'Portal de noticias latinoamericano', isDefault: true }
    ];

    for (const media of mediaSources) {
      if (!db) db = initDatabase();
      const existingMedia = db.prepare('SELECT * FROM media_sources WHERE url = ?').get(media.url);
      if (!existingMedia) {
        const id = generateId();
        const stmt = db.prepare(`
          INSERT INTO media_sources (id, name, url, category, description, isActive, isDefault, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `);
        stmt.run(id, media.name, media.url, media.category, media.description, 1, media.isDefault ? 1 : 0);
      }
    }
    console.log('✅ Medios de comunicación poblados correctamente');
  } catch (error) {
    console.error('Error poblando medios de comunicación:', error);
  }
};

// Crear usuarios de prueba
const createTestUsers = async () => {
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
      const existingUser = userService.findByEmail(userData.email);
      if (!existingUser) {
        console.log(`🔧 Creando usuario de prueba: ${userData.email}...`);
        await userService.create(userData);
        
        // Actualizar campos adicionales
        const user = userService.findByEmail(userData.email);
        if (user) {
          userService.update(user.id, { 
            phone: userData.phone,
            bio: userData.bio,
            role: userData.role,
            plan: userData.plan,
            credits: userData.credits,
            profileType: userData.profileType,
            category: userData.category,
            brandName: userData.brandName,
            onboardingCompleted: userData.onboardingCompleted ? 1 : 0
          });
        }
      }
    }
    console.log('✅ Usuarios de prueba creados correctamente');
  } catch (error) {
    console.error('Error creando usuarios de prueba:', error);
  }
};

// Solo ejecutar en runtime, no durante build
if (!process.env.NIXPACKS_PATH && !process.env.NEXT_PHASE) {
  createAdminUser();
  populateSocialPlatforms();
  populateMediaSources();
  createTestUsers();
}

export const getDatabase = () => {
  if (!db) db = initDatabase();
  return db;
};

export default getDatabase;