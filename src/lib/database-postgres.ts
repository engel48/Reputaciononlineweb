// Base de datos PostgreSQL para producción
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

// Pool de conexiones PostgreSQL
let pool: Pool | null = null;

const initializePool = () => {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    
    if (!connectionString) {
      throw new Error('DATABASE_URL o POSTGRES_URL no configurada');
    }
    
    pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    
    console.log('🐘 PostgreSQL pool inicializado');
  }
  
  return pool;
};

// Función para generar IDs
const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Crear todas las tablas
export const initTables = async () => {
  const client = initializePool();
  
  try {
    console.log('📊 Creando tablas PostgreSQL...');
    
    // Tabla de usuarios
    await client.query(`
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
    await client.query(`
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
    await client.query(`
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
    await client.query(`
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
    await client.query(`
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
    await client.query(`
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
    await client.query(`
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
    await client.query(`
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
    await client.query(`
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
    await client.query(`
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
    console.error('❌ Error creando tablas PostgreSQL:', error);
    throw error;
  }
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
    const result = await client.query(query, [email]);
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

// Función para crear usuario admin
export const createAdminUser = async () => {
  try {
    const adminExists = await userService.findByEmail('admin@admin.com');
    if (!adminExists) {
      console.log('👤 Creando usuario administrador...');
      await userService.create({
        email: 'admin@admin.com',
        password: 'admin',
        name: 'Administrador',
        company: 'Sistema'
      });
      
      // Actualizar el usuario para que sea admin
      const admin = await userService.findByEmail('admin@admin.com');
      if (admin) {
        await userService.update(admin.id, { 
          role: 'admin',
          plan: 'enterprise',
          credits: 999999,
          onboardingCompleted: true
        });
        console.log('✅ Usuario administrador creado exitosamente');
      }
    }
  } catch (error) {
    console.log('Usuario admin ya existe o error al crear:', error instanceof Error ? error.message : error);
  }
};

// Inicialización completa de la base de datos
export const initializeDatabase = async () => {
  try {
    console.log('🚀 Inicializando base de datos PostgreSQL...');
    await initTables();
    await createAdminUser();
    console.log('✅ Base de datos PostgreSQL inicializada correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error inicializando base de datos PostgreSQL:', error);
    return false;
  }
};

export const getDatabase = () => {
  return initializePool();
};

export default getDatabase;