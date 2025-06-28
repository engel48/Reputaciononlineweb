// Base de datos SQLite local para la aplicación
import Database from 'better-sqlite3';
import { join } from 'path';
import bcrypt from 'bcryptjs';

// Ruta de la base de datos
const dbPath = join(process.cwd(), 'data', 'app.db');

// Crear directorio data si no existe
import { mkdirSync } from 'fs';
try {
  mkdirSync(join(process.cwd(), 'data'), { recursive: true });
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

// Configurar timeouts para evitar locks durante build
db.timeout(30000); // 30 segundos timeout

// Crear tablas
const initTables = () => {
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
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email) as any;
  },

  // Buscar por ID
  findById: (id: string) => {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    const user = stmt.get(id) as any;
    if (user) {
      delete user.password; // No devolver la contraseña
    }
    return user;
  },

  // Buscar por ID con contraseña (para autenticación)
  findByIdWithPassword: (id: string) => {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id) as any;
  },

  // Buscar por email con contraseña (para autenticación)
  findByEmailWithPassword: (email: string) => {
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
    const stmt = db.prepare('UPDATE users SET lastLogin = CURRENT_TIMESTAMP WHERE id = ?');
    stmt.run(id);
  },

  // Obtener todos los usuarios
  findAll: () => {
    const stmt = db.prepare('SELECT * FROM users ORDER BY createdAt DESC');
    const users = stmt.all() as any[];
    return users.map(user => {
      delete user.password; // No devolver las contraseñas
      return user;
    });
  },

  // Eliminar usuario
  delete: (id: string) => {
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    return stmt.run(id).changes > 0;
  }
};

// Funciones de redes sociales
export const socialMediaService = {
  // Obtener redes sociales del usuario
  getByUserId: (userId: string) => {
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
    const stmt = db.prepare('SELECT * FROM user_stats WHERE userId = ?');
    return stmt.get(userId);
  },

  // Crear o actualizar estadísticas
  upsert: (userId: string, stats: any) => {
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
    const stmt = db.prepare('UPDATE notifications SET isRead = 1 WHERE id = ?');
    return stmt.run(id).changes > 0;
  }
};

// Inicializar base de datos solo si no es durante el build
if (process.env.NODE_ENV !== 'production' || !process.env.NIXPACKS_PATH) {
  initTables();
}

// Migraciones para añadir columnas faltantes
const runMigrations = () => {
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
if (process.env.NODE_ENV !== 'production' || !process.env.NIXPACKS_PATH) {
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

// Solo crear admin en runtime, no durante build
if (process.env.NODE_ENV !== 'production' || !process.env.NIXPACKS_PATH) {
  createAdminUser();
}

export default db;