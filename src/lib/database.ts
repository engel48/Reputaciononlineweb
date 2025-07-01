// Base de datos PostgreSQL para la aplicación (migrado desde SQLite)
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

// Pool de conexiones PostgreSQL
let pool: Pool | null = null;

const initializePool = () => {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error('DATABASE_URL no configurada');
    }
    
    pool = new Pool({
      connectionString,
      ssl: false, // Coolify interno no requiere SSL
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    
    console.log('🐘 PostgreSQL pool inicializado');
  }
  
  return pool;
};

// Función para generar IDs
const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Funciones de usuario adaptadas para PostgreSQL
export const userService = {
  // Crear usuario
  create: async (userData: {
    email: string;
    password: string;
    name?: string;
    company?: string;
  }) => {
    const client = initializePool();
    const id = generateId();
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    
    const query = `
      INSERT INTO users (id, email, password, name, company, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, email, name, company
    `;
    
    const result = await client.query(query, [
      id, 
      userData.email, 
      hashedPassword, 
      userData.name || null, 
      userData.company || null
    ]);
    
    console.log('🔍 DB: Usuario creado en PostgreSQL:', result.rows[0]);
    return result.rows[0];
  },

  // Buscar por email
  findByEmail: async (email: string) => {
    const client = initializePool();
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await client.query(query, [email]);
    const user = result.rows[0];
    if (user && user.password) {
      delete user.password; // No devolver la contraseña
    }
    return user;
  },

  // Buscar por email con contraseña (para autenticación)
  findByEmailWithPassword: async (email: string) => {
    const client = initializePool();
    const query = 'SELECT * FROM users WHERE email = $1';
    console.log('🔍 DB: Ejecutando consulta findByEmailWithPassword para:', email);
    const result = await client.query(query, [email]);
    console.log('🔍 DB: Resultado consulta - filas encontradas:', result.rows.length);
    if (result.rows.length > 0) {
      console.log('🔍 DB: Usuario encontrado con ID:', result.rows[0].id);
    }
    return result.rows[0];
  },

  // Buscar por ID
  findById: async (id: string) => {
    const client = initializePool();
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await client.query(query, [id]);
    const user = result.rows[0];
    if (user && user.password) {
      delete user.password; // No devolver la contraseña
    }
    return user;
  },

  // Buscar por ID con contraseña (para autenticación)
  findByIdWithPassword: async (id: string) => {
    const client = initializePool();
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await client.query(query, [id]);
    return result.rows[0];
  },

  // Verificar contraseña
  verifyPassword: async (plainPassword: string, hashedPassword: string) => {
    return await bcrypt.compare(plainPassword, hashedPassword);
  },

  // Actualizar usuario
  update: async (id: string, userData: any) => {
    const client = initializePool();
    const fields = [];
    const values = [];
    let paramCount = 1;
    
    for (const [key, value] of Object.entries(userData)) {
      if (key !== 'id' && value !== undefined) {
        fields.push(`"${key}" = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }
    
    if (fields.length === 0) return false;
    
    fields.push(`"updatedAt" = CURRENT_TIMESTAMP`);
    values.push(id);
    
    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount}`;
    const result = await client.query(query, values);
    return (result.rowCount || 0) > 0;
  },

  // Actualizar último login
  updateLastLogin: async (id: string) => {
    const client = initializePool();
    const query = 'UPDATE users SET "lastLogin" = CURRENT_TIMESTAMP WHERE id = $1';
    await client.query(query, [id]);
  },

  // Obtener todos los usuarios
  findAll: async () => {
    const client = initializePool();
    const query = 'SELECT * FROM users ORDER BY "createdAt" DESC';
    const result = await client.query(query);
    return result.rows.map(user => {
      delete user.password; // No devolver las contraseñas
      return user;
    });
  },

  // Eliminar usuario
  delete: async (id: string) => {
    const client = initializePool();
    const query = 'DELETE FROM users WHERE id = $1';
    const result = await client.query(query, [id]);
    return (result.rowCount || 0) > 0;
  }
};

// Funciones de redes sociales
export const socialMediaService = {
  // Obtener redes sociales del usuario
  getByUserId: async (userId: string) => {
    const client = initializePool();
    const query = 'SELECT * FROM social_media WHERE "userId" = $1';
    const result = await client.query(query, [userId]);
    return result.rows;
  },

  // Crear o actualizar conexión de red social
  upsert: async (data: {
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
    const client = initializePool();
    const id = generateId();
    
    const query = `
      INSERT INTO social_media 
      (id, "userId", platform, username, "profileUrl", followers, following, posts, engagement, connected, "lastSync", "accessToken", "refreshToken", "tokenExpiry")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, $11, $12, $13)
      ON CONFLICT ("userId", platform) 
      DO UPDATE SET
        username = EXCLUDED.username,
        "profileUrl" = EXCLUDED."profileUrl",
        followers = EXCLUDED.followers,
        following = EXCLUDED.following,
        posts = EXCLUDED.posts,
        engagement = EXCLUDED.engagement,
        connected = EXCLUDED.connected,
        "lastSync" = CURRENT_TIMESTAMP,
        "accessToken" = EXCLUDED."accessToken",
        "refreshToken" = EXCLUDED."refreshToken",
        "tokenExpiry" = EXCLUDED."tokenExpiry"
      RETURNING id
    `;
    
    const result = await client.query(query, [
      id,
      data.userId,
      data.platform,
      data.username || null,
      data.profileUrl || null,
      data.followers || 0,
      data.following || 0,
      data.posts || 0,
      data.engagement || 0,
      data.connected || false,
      data.accessToken || null,
      data.refreshToken || null,
      data.tokenExpiry || null
    ]);
    
    return result.rows[0]?.id || id;
  }
};

// Funciones de estadísticas
export const statsService = {
  // Obtener estadísticas del usuario
  getByUserId: async (userId: string) => {
    const client = initializePool();
    const query = 'SELECT * FROM user_stats WHERE "userId" = $1';
    const result = await client.query(query, [userId]);
    return result.rows[0];
  },

  // Crear o actualizar estadísticas
  upsert: async (userId: string, stats: any) => {
    const client = initializePool();
    const id = generateId();
    
    const query = `
      INSERT INTO user_stats 
      (id, "userId", "totalMentions", "positiveMentions", "negativeMentions", "neutralMentions", "sentimentScore", "reachEstimate", "engagementRate", "influenceScore", "trendingScore", "monthlyGrowth", "lastCalculated", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT ("userId")
      DO UPDATE SET
        "totalMentions" = EXCLUDED."totalMentions",
        "positiveMentions" = EXCLUDED."positiveMentions",
        "negativeMentions" = EXCLUDED."negativeMentions",
        "neutralMentions" = EXCLUDED."neutralMentions",
        "sentimentScore" = EXCLUDED."sentimentScore",
        "reachEstimate" = EXCLUDED."reachEstimate",
        "engagementRate" = EXCLUDED."engagementRate",
        "influenceScore" = EXCLUDED."influenceScore",
        "trendingScore" = EXCLUDED."trendingScore",
        "monthlyGrowth" = EXCLUDED."monthlyGrowth",
        "lastCalculated" = CURRENT_TIMESTAMP,
        "updatedAt" = CURRENT_TIMESTAMP
    `;
    
    await client.query(query, [
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
    ]);
  }
};

// Funciones de notificaciones
export const notificationService = {
  // Crear notificación
  create: async (data: {
    userId: string;
    title: string;
    message: string;
    type: string;
    priority?: string;
    metadata?: any;
  }) => {
    const client = initializePool();
    const id = generateId();
    
    const query = `
      INSERT INTO notifications (id, "userId", title, message, type, priority, metadata, "createdAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      RETURNING id
    `;
    
    const result = await client.query(query, [
      id,
      data.userId,
      data.title,
      data.message,
      data.type,
      data.priority || 'normal',
      data.metadata ? JSON.stringify(data.metadata) : null
    ]);
    
    return result.rows[0].id;
  },

  // Obtener notificaciones del usuario
  getByUserId: async (userId: string, limit = 50) => {
    const client = initializePool();
    const query = `
      SELECT * FROM notifications 
      WHERE "userId" = $1 
      ORDER BY "createdAt" DESC 
      LIMIT $2
    `;
    const result = await client.query(query, [userId, limit]);
    return result.rows;
  },

  // Marcar como leída
  markAsRead: async (id: string) => {
    const client = initializePool();
    const query = 'UPDATE notifications SET "isRead" = true WHERE id = $1';
    const result = await client.query(query, [id]);
    return (result.rowCount || 0) > 0;
  }
};

export const getDatabase = () => {
  return initializePool();
};

// Función para forzar la inicialización de la base de datos
export const forceInitializeDatabase = async () => {
  console.log('🐘 Forzando inicialización de base de datos PostgreSQL...');
  try {
    initializePool();
    console.log('✅ Base de datos PostgreSQL inicializada correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error inicializando base de datos PostgreSQL:', error);
    return false;
  }
};

export default getDatabase;