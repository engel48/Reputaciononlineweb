// Base de datos PostgreSQL para la aplicación - Compatible con Supabase
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

// Pool de conexiones PostgreSQL
let pool: Pool | null = null;

const initializePool = () => {
  if (!pool) {
    // PRIORIZAR DATABASE_URL de .env (Supabase)
    const databaseUrl = process.env.DATABASE_URL;

    if (databaseUrl && databaseUrl.includes('supabase.co')) {
      console.log('🔧 DB: Usando Supabase desde DATABASE_URL');
      pool = new Pool({
        connectionString: databaseUrl,
        ssl: { rejectUnauthorized: false }, // Supabase requiere SSL
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });
      console.log('✅ PostgreSQL pool inicializado con Supabase');
    } else if (databaseUrl) {
      console.log('🔧 DB: Usando DATABASE_URL personalizada');
      pool = new Pool({
        connectionString: databaseUrl,
        ssl: false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });
      console.log('✅ PostgreSQL pool inicializado desde DATABASE_URL');
    } else {
      throw new Error('❌ DATABASE_URL no configurada. Configure la variable de entorno DATABASE_URL en .env.local');
    }
  }

  return pool;
};

// Funciones de usuario adaptadas para Supabase (snake_case)
export const userService = {
  // Crear usuario
  create: async (userData: {
    email: string;
    password: string;
    name?: string;
    company?: string;
  }) => {
    const client = initializePool();
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // Supabase usa snake_case y genera IDs automáticamente con gen_random_uuid()
    const query = `
      INSERT INTO users (email, password, name, company, created_at, updated_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, email, name, company
    `;

    const result = await client.query(query, [
      userData.email,
      hashedPassword,
      userData.name || null,
      userData.company || null
    ]);

    console.log('✅ DB: Usuario creado en Supabase:', result.rows[0]);
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
    console.log('🔍 DB: Buscando usuario por email:', email);
    const result = await client.query(query, [email]);
    console.log('🔍 DB: Usuarios encontrados:', result.rows.length);
    if (result.rows.length > 0) {
      console.log('✅ DB: Usuario encontrado:', result.rows[0].id);
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

  // Actualizar usuario - Mapea camelCase a snake_case de Supabase
  update: async (id: string, userData: any) => {
    const client = initializePool();
    const fields = [];
    const values = [];
    let paramCount = 1;

    // Mapeo de nombres camelCase (código) a snake_case (Supabase)
    const fieldMapping: { [key: string]: string } = {
      'avatarUrl': 'avatar_url',
      'profileType': 'profile_type',
      'brandName': 'brand_name',
      'otherCategory': 'other_category',
      'onboardingCompleted': 'onboarding_completed',
      'lastLogin': 'last_login',
      'nextBillingDate': 'next_billing_date',
      'additionalSources': 'additional_sources'
    };

    for (const [key, value] of Object.entries(userData)) {
      if (key !== 'id' && value !== undefined) {
        // Usar el nombre mapeado si existe, si no usar el key original
        const dbField = fieldMapping[key] || key;
        fields.push(`${dbField} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (fields.length === 0) return false;

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount}`;
    console.log('🔍 DB: Ejecutando UPDATE:', query);
    const result = await client.query(query, values);
    return (result.rowCount || 0) > 0;
  },

  // Actualizar último login
  updateLastLogin: async (id: string) => {
    const client = initializePool();
    const query = 'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1';
    await client.query(query, [id]);
  },

  // Obtener todos los usuarios
  findAll: async () => {
    const client = initializePool();
    const query = 'SELECT * FROM users ORDER BY created_at DESC';
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

// Funciones de redes sociales - Compatible con Supabase (snake_case)
export const socialMediaService = {
  // Obtener redes sociales del usuario
  getByUserId: async (userId: string) => {
    const client = initializePool();
    const query = 'SELECT * FROM social_media WHERE user_id = $1';
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

    const query = `
      INSERT INTO social_media
      (user_id, platform, username, profile_url, followers, following, posts, engagement, connected, last_sync, access_token, refresh_token, token_expiry)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, $10, $11, $12)
      ON CONFLICT (user_id, platform)
      DO UPDATE SET
        username = EXCLUDED.username,
        profile_url = EXCLUDED.profile_url,
        followers = EXCLUDED.followers,
        following = EXCLUDED.following,
        posts = EXCLUDED.posts,
        engagement = EXCLUDED.engagement,
        connected = EXCLUDED.connected,
        last_sync = CURRENT_TIMESTAMP,
        access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        token_expiry = EXCLUDED.token_expiry
      RETURNING id
    `;

    const result = await client.query(query, [
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

    return result.rows[0]?.id;
  }
};

// Funciones de estadísticas - Compatible con Supabase (snake_case)
export const statsService = {
  // Obtener estadísticas del usuario
  getByUserId: async (userId: string) => {
    const client = initializePool();
    const query = 'SELECT * FROM user_stats WHERE user_id = $1';
    const result = await client.query(query, [userId]);
    return result.rows[0];
  },

  // Crear o actualizar estadísticas
  upsert: async (userId: string, stats: any) => {
    const client = initializePool();

    const query = `
      INSERT INTO user_stats
      (user_id, total_mentions, positive_mentions, negative_mentions, neutral_mentions, sentiment_score, reach_estimate, engagement_rate, influence_score, trending_score, monthly_growth, last_calculated, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id)
      DO UPDATE SET
        total_mentions = EXCLUDED.total_mentions,
        positive_mentions = EXCLUDED.positive_mentions,
        negative_mentions = EXCLUDED.negative_mentions,
        neutral_mentions = EXCLUDED.neutral_mentions,
        sentiment_score = EXCLUDED.sentiment_score,
        reach_estimate = EXCLUDED.reach_estimate,
        engagement_rate = EXCLUDED.engagement_rate,
        influence_score = EXCLUDED.influence_score,
        trending_score = EXCLUDED.trending_score,
        monthly_growth = EXCLUDED.monthly_growth,
        last_calculated = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    `;

    await client.query(query, [
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

// Funciones de notificaciones - Compatible con Supabase (snake_case)
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

    const query = `
      INSERT INTO notifications (user_id, title, message, type, priority, metadata, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      RETURNING id
    `;

    const result = await client.query(query, [
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
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;
    const result = await client.query(query, [userId, limit]);
    return result.rows;
  },

  // Marcar como leída
  markAsRead: async (id: string) => {
    const client = initializePool();
    const query = 'UPDATE notifications SET is_read = true WHERE id = $1';
    const result = await client.query(query, [id]);
    return (result.rowCount || 0) > 0;
  }
};

// Funciones de configuraciones del sistema - Compatible con Supabase (snake_case)
export const systemSettingsService = {
  // Obtener una configuración por clave
  get: async (key: string) => {
    const client = initializePool();
    const query = 'SELECT * FROM system_settings WHERE key = $1';
    const result = await client.query(query, [key]);
    return result.rows[0];
  },

  // Obtener todas las configuraciones
  getAll: async () => {
    const client = initializePool();
    const query = 'SELECT * FROM system_settings ORDER BY key';
    const result = await client.query(query);
    return result.rows;
  },

  // Establecer o actualizar una configuración
  set: async (key: string, value: string, description?: string, updatedBy?: string) => {
    const client = initializePool();

    const query = `
      INSERT INTO system_settings (key, value, description, updated_by, updated_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      ON CONFLICT (key)
      DO UPDATE SET
        value = EXCLUDED.value,
        description = EXCLUDED.description,
        updated_by = EXCLUDED.updated_by,
        updated_at = CURRENT_TIMESTAMP
    `;

    await client.query(query, [key, value, description || null, updatedBy || null]);
    return true;
  },

  // Eliminar una configuración
  delete: async (key: string) => {
    const client = initializePool();
    const query = 'DELETE FROM system_settings WHERE key = $1';
    const result = await client.query(query, [key]);
    return (result.rowCount || 0) > 0;
  }
};

export const getDatabase = () => {
  return initializePool();
};

// Función para forzar la inicialización de la base de datos
export const forceInitializeDatabase = async () => {
  console.log('🐘 Forzando inicialización de base de datos PostgreSQL/Supabase...');
  try {
    const pool = initializePool();
    // Verificar conexión
    await pool.query('SELECT 1');
    console.log('✅ Base de datos PostgreSQL/Supabase inicializada correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error inicializando base de datos PostgreSQL/Supabase:', error);
    return false;
  }
};

export default getDatabase;
