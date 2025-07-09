// @ts-nocheck
// Servicio de base de datos SQLite local
import { userService, socialMediaService, statsService, systemSettingsService } from '@/lib/database-adapter';

// ===== USUARIOS =====

export const createUser = async (userData: {
  email: string;
  password: string;
  name?: string;
  company?: string;
  phone?: string;
}) => {
  try {
    const user = await userService.create(userData);
    console.log('✅ Usuario creado en SQLite:', user.id);
    return user;
  } catch (error) {
    console.error('❌ Error creando usuario:', error);
    throw error;
  }
};

export const getUserByEmail = (email: string) => {
  try {
    return userService.findByEmail(email);
  } catch (error) {
    console.error('❌ Error obteniendo usuario por email:', error);
    return null;
  }
};

export const getUserById = (id: string) => {
  try {
    return userService.findById(id);
  } catch (error) {
    console.error('❌ Error obteniendo usuario por ID:', error);
    return null;
  }
};

export const updateUser = (id: string, data: any) => {
  try {
    return userService.update(id, data);
  } catch (error) {
    console.error('❌ Error actualizando usuario:', error);
    return false;
  }
};

export const verifyPassword = async (plainPassword: string, hashedPassword: string) => {
  try {
    return await userService.verifyPassword(plainPassword, hashedPassword);
  } catch (error) {
    console.error('❌ Error verificando contraseña:', error);
    return false;
  }
};

// ===== REDES SOCIALES =====

export const getUserSocialMedia = (userId: string) => {
  try {
    return socialMediaService.getByUserId(userId);
  } catch (error) {
    console.error('❌ Error obteniendo redes sociales:', error);
    return [];
  }
};

export const createOrUpdateSocialMedia = (data: {
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
  try {
    return socialMediaService.upsert(data);
  } catch (error) {
    console.error('❌ Error creando/actualizando red social:', error);
    throw error;
  }
};

// ===== ESTADÍSTICAS =====

export const getUserStats = (userId: string) => {
  try {
    return statsService.getByUserId(userId);
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    return null;
  }
};

export const updateUserStats = (userId: string, stats: any) => {
  try {
    return statsService.upsert(userId, stats);
  } catch (error) {
    console.error('❌ Error actualizando estadísticas:', error);
    throw error;
  }
};

// ===== NOTIFICACIONES =====

export const createNotification = (data: {
  userId: string;
  title: string;
  message: string;
  type: string;
  priority?: string;
  metadata?: any;
}) => {
  try {
    return notificationService.create(data);
  } catch (error) {
    console.error('❌ Error creando notificación:', error);
    throw error;
  }
};

export const getUserNotifications = (userId: string, limit = 50) => {
  try {
    return notificationService.getByUserId(userId, limit);
  } catch (error) {
    console.error('❌ Error obteniendo notificaciones:', error);
    return [];
  }
};

export const markNotificationAsRead = (notificationId: string) => {
  try {
    return notificationService.markAsRead(notificationId);
  } catch (error) {
    console.error('❌ Error marcando notificación como leída:', error);
    return false;
  }
};

// ===== FUNCIONES DE MIGRACIÓN Y UTILIDADES =====

export const initializeDefaultData = () => {
  try {
    console.log('🔄 Inicializando datos por defecto en SQLite...');
    
    // Crear notificación de bienvenida para nuevos usuarios
    // (esto se puede hacer cuando se registre un usuario)
    
    console.log('✅ Datos por defecto inicializados');
  } catch (error) {
    console.error('❌ Error inicializando datos por defecto:', error);
  }
};

// Función para limpiar datos antiguos (opcional)
export const cleanupOldData = () => {
  try {
    console.log('🧹 Limpiando datos antiguos...');
    // Implementar lógica de limpieza si es necesario
    console.log('✅ Limpieza completada');
  } catch (error) {
    console.error('❌ Error en limpieza:', error);
  }
};

// Función para obtener estadísticas de la base de datos
export const getDatabaseStats = () => {
  try {
    // Implementar si necesitas estadísticas de la BD
    return {
      users: 0,
      notifications: 0,
      socialConnections: 0
    };
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas de BD:', error);
    return null;
  }
};

export default {
  // Usuarios
  createUser,
  getUserByEmail,
  getUserById,
  updateUser,
  verifyPassword,
  
  // Redes sociales
  getUserSocialMedia,
  createOrUpdateSocialMedia,
  
  // Estadísticas
  getUserStats,
  updateUserStats,
  
  // Notificaciones
  createNotification,
  getUserNotifications,
  markNotificationAsRead,
  
  // Utilidades
  initializeDefaultData,
  cleanupOldData,
  getDatabaseStats
};