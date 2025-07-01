// Base de datos SQLite para desarrollo local
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

// Asegurar que el directorio data existe
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Inicializar base de datos SQLite
const db = new Database(path.join(dataDir, 'app.db'));
db.pragma('journal_mode = WAL');

// Crear tablas si no existen
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
    onboardingCompleted INTEGER DEFAULT 0,
    isActive INTEGER DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    lastLogin DATETIME,
    nextBillingDate DATETIME
  );

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
    connected INTEGER DEFAULT 0,
    lastSync DATETIME,
    accessToken TEXT,
    refreshToken TEXT,
    tokenExpiry DATETIME,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(userId, platform)
  );

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
  );
`);

// Intentar agregar columna isActive si no existe
try {
  db.exec(`ALTER TABLE users ADD COLUMN isActive INTEGER DEFAULT 1`);
  console.log('✅ Columna isActive agregada a la tabla users');
} catch (error) {
  // La columna ya existe, no hay problema
}

// Función para generar IDs
const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Funciones de usuario adaptadas para SQLite
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
      INSERT INTO users (id, email, password, name, company)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run(id, userData.email, hashedPassword, userData.name || null, userData.company || null);
    
    return { id, email: userData.email, name: userData.name, company: userData.company };
  },

  // Buscar por email
  findByEmail: async (email: string) => {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    const user = stmt.get(email);
    if (user && user.password) {
      delete user.password; // No devolver la contraseña
    }
    return user;
  },

  // Buscar por email con contraseña (para autenticación)
  findByEmailWithPassword: async (email: string) => {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email);
  },

  // Buscar por ID
  findById: async (id: string) => {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    const user = stmt.get(id);
    if (user && user.password) {
      delete user.password; // No devolver la contraseña
    }
    return user;
  },

  // Verificar contraseña
  verifyPassword: async (plainPassword: string, hashedPassword: string) => {
    return await bcrypt.compare(plainPassword, hashedPassword);
  },

  // Actualizar usuario
  update: async (id: string, userData: any) => {
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
    
    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    const stmt = db.prepare(query);
    const result = stmt.run(...values);
    return result.changes > 0;
  },

  // Actualizar último login
  updateLastLogin: async (id: string) => {
    const stmt = db.prepare('UPDATE users SET lastLogin = CURRENT_TIMESTAMP WHERE id = ?');
    stmt.run(id);
  },

  // Obtener todos los usuarios
  findAll: async () => {
    const stmt = db.prepare('SELECT * FROM users ORDER BY createdAt DESC');
    const users = stmt.all();
    // Eliminar contraseñas antes de devolver
    return users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  },

  // Eliminar usuario
  delete: async (id: string) => {
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
};

// Funciones de redes sociales
export const socialMediaService = {
  // Obtener redes sociales del usuario
  getByUserId: async (userId: string) => {
    const stmt = db.prepare('SELECT * FROM social_media WHERE userId = ?');
    return stmt.all(userId);
  },

  // Crear o actualizar conexión de red social
  upsert: async (data: any) => {
    const id = generateId();
    
    const stmt = db.prepare(`
      INSERT INTO social_media (
        id, userId, platform, username, profileUrl, followers, following, posts, 
        engagement, connected, lastSync, accessToken, refreshToken, tokenExpiry
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?)
      ON CONFLICT(userId, platform) 
      DO UPDATE SET
        username = excluded.username,
        profileUrl = excluded.profileUrl,
        followers = excluded.followers,
        following = excluded.following,
        posts = excluded.posts,
        engagement = excluded.engagement,
        connected = excluded.connected,
        lastSync = CURRENT_TIMESTAMP,
        accessToken = excluded.accessToken,
        refreshToken = excluded.refreshToken,
        tokenExpiry = excluded.tokenExpiry
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
      data.connected || 0,
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
  getByUserId: async (userId: string) => {
    const stmt = db.prepare('SELECT * FROM user_stats WHERE userId = ?');
    return stmt.get(userId);
  }
};

export default db;