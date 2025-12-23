// Supabase Server Client - Para usar en Server Components y API Routes
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// Cliente de Supabase con Service Role Key (solo servidor)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

// Cliente con privilegios de servicio (bypass RLS)
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Servicios de usuario usando Supabase SDK
export const userService = {
  // Crear usuario
  create: async (userData: {
    email: string;
    password: string;
    name?: string;
    company?: string;
  }) => {
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    const { data, error } = await supabase
      .from('users')
      .insert({
        email: userData.email,
        password: hashedPassword,
        name: userData.name || null,
        company: userData.company || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ SUPABASE: Error creando usuario:', error);
      throw new Error(`Error creating user: ${error.message}`);
    }

    console.log('✅ SUPABASE: Usuario creado:', data.id);
    return data;
  },

  // Buscar por email
  findByEmail: async (email: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('❌ SUPABASE: Error buscando usuario por email:', error);
      return null;
    }

    // No devolver la contraseña y convertir snake_case a camelCase
    if (data && data.password) {
      const { password, ...userWithoutPassword } = data;

      // Convertir campos snake_case a camelCase
      const convertedUser: any = {};
      for (const [key, value] of Object.entries(userWithoutPassword)) {
        // Mapeo inverso: snake_case → camelCase
        const camelCaseKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        convertedUser[camelCaseKey] = value;
      }

      return convertedUser;
    }

    return data;
  },

  // Buscar por email con contraseña (para autenticación)
  findByEmailWithPassword: async (email: string) => {
    console.log('🔍 SUPABASE: Buscando usuario por email:', email);

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      console.log('❌ SUPABASE: Error o usuario no encontrado:', error.code);
      return null;
    }

    console.log('✅ SUPABASE: Usuario encontrado:', data?.id);
    return data;
  },

  // Buscar por ID
  findById: async (id: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('❌ SUPABASE: Error buscando usuario por ID:', error);
      return null;
    }

    // No devolver la contraseña y convertir snake_case a camelCase
    if (data && data.password) {
      const { password, ...userWithoutPassword } = data;

      // Convertir campos snake_case a camelCase
      const convertedUser: any = {};
      for (const [key, value] of Object.entries(userWithoutPassword)) {
        // Mapeo inverso: snake_case → camelCase
        const camelCaseKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        convertedUser[camelCaseKey] = value;
      }

      console.log('✅ SUPABASE: Usuario convertido a camelCase:', convertedUser.id);
      return convertedUser;
    }

    return data;
  },

  // Buscar por ID con contraseña
  findByIdWithPassword: async (id: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('❌ SUPABASE: Error buscando usuario por ID:', error);
      return null;
    }

    return data;
  },

  // Verificar contraseña
  verifyPassword: async (plainPassword: string, hashedPassword: string) => {
    return await bcrypt.compare(plainPassword, hashedPassword);
  },

  // Actualizar usuario
  update: async (id: string, userData: any) => {
    // Mapeo de camelCase a snake_case para Supabase
    const fieldMapping: { [key: string]: string } = {
      'avatarUrl': 'avatar_url',
      'profileType': 'profile_type',
      'brandName': 'brand_name',
      'otherCategory': 'other_category',
      'onboardingCompleted': 'onboarding_completed',
      'lastLogin': 'last_login',
      'nextBillingDate': 'next_billing_date',
      'additionalSources': 'additional_sources',
      'updatedAt': 'updated_at',
      // Campos para perfil político
      'partidoPolitico': 'partido_politico',
      'cargoActual': 'cargo_actual',
      'propuestasPrincipales': 'propuestas_principales'
    };

    const updateData: any = {};
    for (const [key, value] of Object.entries(userData)) {
      if (key !== 'id' && value !== undefined) {
        const dbField = fieldMapping[key] || key;
        updateData[dbField] = value;
      }
    }

    // Solo agregar updated_at si no viene en los datos
    if (!updateData.updated_at) {
      updateData.updated_at = new Date().toISOString();
    }

    console.log('🔍 SUPABASE: Actualizando usuario', id);
    console.log('🔍 SUPABASE: Campos a actualizar:', Object.keys(updateData));
    console.log('🔍 SUPABASE: Valores:', updateData);

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ SUPABASE: Error actualizando usuario');
      console.error('❌ SUPABASE: Error code:', error.code);
      console.error('❌ SUPABASE: Error message:', error.message);
      console.error('❌ SUPABASE: Error details:', error.details);
      console.error('❌ SUPABASE: Error hint:', error.hint);
      throw new Error(`Error updating user: ${error.message} (code: ${error.code})`);
    }

    console.log('✅ SUPABASE: Usuario actualizado exitosamente');
    console.log('✅ SUPABASE: Datos actualizados:', data);
    return true;
  },

  // Actualizar último login
  updateLastLogin: async (id: string) => {
    const { error } = await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('❌ SUPABASE: Error actualizando last_login:', error);
    }
  },

  // Obtener todos los usuarios
  findAll: async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ SUPABASE: Error obteniendo usuarios:', error);
      return [];
    }

    // No devolver contraseñas y convertir snake_case a camelCase
    return data.map(user => {
      const { password, ...userWithoutPassword } = user;

      // Convertir campos snake_case a camelCase
      const convertedUser: any = {};
      for (const [key, value] of Object.entries(userWithoutPassword)) {
        // Mapeo inverso: snake_case → camelCase
        const camelCaseKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        convertedUser[camelCaseKey] = value;
      }

      return convertedUser;
    });
  },

  // Eliminar usuario
  delete: async (id: string) => {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ SUPABASE: Error eliminando usuario:', error);
      return false;
    }

    return true;
  }
};

// Servicios de redes sociales usando Supabase SDK
export const socialMediaService = {
  // Obtener redes sociales del usuario
  getByUserId: async (userId: string) => {
    const { data, error } = await supabase
      .from('social_media')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('❌ SUPABASE: Error obteniendo redes sociales:', error);
      return [];
    }

    return data || [];
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
    const { data: result, error } = await supabase
      .from('social_media')
      .upsert({
        user_id: data.userId,
        platform: data.platform,
        username: data.username || null,
        profile_url: data.profileUrl || null,
        followers: data.followers || 0,
        following: data.following || 0,
        posts: data.posts || 0,
        engagement: data.engagement || 0,
        connected: data.connected || false,
        last_sync: new Date().toISOString(),
        access_token: data.accessToken || null,
        refresh_token: data.refreshToken || null,
        token_expiry: data.tokenExpiry || null
      }, {
        onConflict: 'user_id,platform'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ SUPABASE: Error en upsert de social_media:', error);
      return null;
    }

    return result?.id;
  }
};

// Servicios de estadísticas usando Supabase SDK
export const statsService = {
  // Obtener estadísticas del usuario
  getByUserId: async (userId: string) => {
    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ SUPABASE: Error obteniendo estadísticas:', error);
      return null;
    }

    return data;
  },

  // Crear o actualizar estadísticas
  upsert: async (userId: string, stats: any) => {
    const { error } = await supabase
      .from('user_stats')
      .upsert({
        user_id: userId,
        total_mentions: stats.totalMentions || 0,
        positive_mentions: stats.positiveMentions || 0,
        negative_mentions: stats.negativeMentions || 0,
        neutral_mentions: stats.neutralMentions || 0,
        sentiment_score: stats.sentimentScore || 0,
        reach_estimate: stats.reachEstimate || 0,
        engagement_rate: stats.engagementRate || 0,
        influence_score: stats.influenceScore || 0,
        trending_score: stats.trendingScore || 0,
        monthly_growth: stats.monthlyGrowth || 0,
        last_calculated: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('❌ SUPABASE: Error en upsert de user_stats:', error);
    }
  }
};

// Servicios de notificaciones usando Supabase SDK
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
    const { data: result, error } = await supabase
      .from('notifications')
      .insert({
        user_id: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        priority: data.priority || 'normal',
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ SUPABASE: Error creando notificación:', error);
      return null;
    }

    return result?.id;
  },

  // Obtener notificaciones del usuario
  getByUserId: async (userId: string, limit = 50) => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ SUPABASE: Error obteniendo notificaciones:', error);
      return [];
    }

    return data || [];
  },

  // Marcar como leída
  markAsRead: async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (error) {
      console.error('❌ SUPABASE: Error marcando notificación como leída:', error);
      return false;
    }

    return true;
  }
};

// Servicios de configuraciones del sistema usando Supabase SDK
export const systemSettingsService = {
  // Obtener una configuración por clave
  get: async (key: string) => {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('key', key)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ SUPABASE: Error obteniendo configuración:', error);
      return null;
    }

    return data;
  },

  // Obtener todas las configuraciones
  getAll: async () => {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .order('key');

    if (error) {
      console.error('❌ SUPABASE: Error obteniendo configuraciones:', error);
      return [];
    }

    return data || [];
  },

  // Establecer o actualizar una configuración
  set: async (key: string, value: string, description?: string, updatedBy?: string) => {
    const { error } = await supabase
      .from('system_settings')
      .upsert({
        key,
        value,
        description: description || null,
        updated_by: updatedBy || null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'key'
      });

    if (error) {
      console.error('❌ SUPABASE: Error estableciendo configuración:', error);
      return false;
    }

    return true;
  },

  // Eliminar una configuración
  delete: async (key: string) => {
    const { error } = await supabase
      .from('system_settings')
      .delete()
      .eq('key', key);

    if (error) {
      console.error('❌ SUPABASE: Error eliminando configuración:', error);
      return false;
    }

    return true;
  }
};

export default supabase;
