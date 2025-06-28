// @ts-nocheck
// src/services/authServiceReal.ts
import { userService, socialMediaService, statsService } from '@/lib/database';
import jwt from 'jsonwebtoken';
import { User } from '@/context/UserContext';

const JWT_SECRET = process.env.JWT_SECRET || 'reputacion-online-secret-key-2025';

export interface LoginResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  company?: string;
  phone?: string;
  profileType?: string;
  plan?: string;
  credits?: number;
  role?: string;
  onboardingCompleted?: boolean;
}

// Registrar nuevo usuario
export const register = async (userData: RegisterData): Promise<LoginResponse> => {
  try {
    console.log('🔍 REGISTER: Iniciando registro para:', userData.email);
    
    // Verificar si el usuario ya existe
    const existingUser = userService.findByEmail(userData.email);

    if (existingUser) {
      console.log('❌ REGISTER: Usuario ya existe:', userData.email);
      return { success: false, message: 'El usuario ya existe' };
    }

    console.log('🔍 REGISTER: Creando usuario en SQLite...');
    
    // Crear el usuario (hash se hace internamente)
    const newUser = await userService.create({
      email: userData.email,
      password: userData.password,
      name: userData.name,
      company: userData.company
    });
    
    // Actualizar datos adicionales incluyendo profileType y plan
    const updateData = {
      phone: userData.phone,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=01257D&color=fff`,
      credits: userData.credits || 1000, // Créditos según el plan seleccionado
      onboardingCompleted: userData.onboardingCompleted ? 1 : 0,
      profileType: userData.profileType || 'personal',
      plan: userData.plan || 'basic',
      role: userData.role || 'user'
    };
    
    userService.update(newUser.id, updateData);

    console.log('✅ REGISTER: Usuario creado exitosamente:', newUser.id);

    // Generar token JWT
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Obtener usuario actualizado
    const userComplete = userService.findById(newUser.id);
    const socialMedia = socialMediaService.getByUserId(newUser.id);

    // Convertir a formato User del contexto
    const user: User = {
      id: userComplete.id,
      email: userComplete.email,
      name: userComplete.name || '',
      company: userComplete.company || '',
      phone: userComplete.phone || '',
      bio: userComplete.bio || '',
      avatarUrl: userComplete.avatarUrl,
      role: userComplete.role,
      plan: userComplete.plan,
      credits: userComplete.credits,
      profileType: userComplete.profileType,
      category: userComplete.category,
      brandName: userComplete.brandName,
      otherCategory: userComplete.otherCategory,
      onboardingCompleted: Boolean(userComplete.onboardingCompleted),
      createdAt: userComplete.createdAt,
      lastLogin: userComplete.lastLogin,
      nextBillingDate: userComplete.nextBillingDate,
      socialMedia: socialMedia.map(sm => ({
        platform: sm.platform,
        username: sm.username,
        followers: sm.followers,
        connected: Boolean(sm.connected),
        profileUrl: sm.profileUrl
      }))
    };

    return { success: true, user, token };
  } catch (error) {
    console.error('💥 REGISTER ERROR:', error);
    return { success: false, message: 'Error interno del servidor' };
  }
};

// Iniciar sesión
export const login = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    console.log('🔍 AUTH: Iniciando login para email:', email);
    
    // Buscar usuario en SQLite (con contraseña para verificación)
    console.log('🔍 AUTH: Buscando usuario en SQLite...');
    const user = userService.findByEmailWithPassword(email);

    if (!user) {
      console.log('❌ AUTH: Usuario no encontrado en BD:', email);
      return { success: false, message: 'Credenciales incorrectas' };
    }

    console.log('✅ AUTH: Usuario encontrado:', { id: user.id, name: user.name, email: user.email });

    // Verificar contraseña
    console.log('🔍 AUTH: Verificando contraseña...');
    const isPasswordValid = await userService.verifyPassword(password, user.password);
    console.log('🔍 AUTH: Resultado verificación contraseña:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('❌ AUTH: Contraseña incorrecta');
      return { success: false, message: 'Credenciales incorrectas' };
    }

    console.log('✅ AUTH: Contraseña válida, actualizando último login...');
    // Actualizar último login
    userService.updateLastLogin(user.id);

    console.log('🔍 AUTH: Generando token JWT...');
    // Generar token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    console.log('✅ AUTH: Token JWT generado exitosamente');

    // Obtener datos adicionales
    const socialMedia = socialMediaService.getByUserId(user.id);

    // Convertir a formato User del contexto
    const userResponse: User = {
      id: user.id,
      email: user.email,
      name: user.name || '',
      company: user.company || '',
      phone: user.phone || '',
      bio: user.bio || '',
      avatarUrl: user.avatarUrl,
      role: user.role,
      plan: user.plan,
      credits: user.credits,
      profileType: user.profileType,
      category: user.category,
      brandName: user.brandName,
      otherCategory: user.otherCategory,
      onboardingCompleted: Boolean(user.onboardingCompleted),
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      nextBillingDate: user.nextBillingDate,
      socialMedia: socialMedia.map(sm => ({
        platform: sm.platform,
        username: sm.username,
        followers: sm.followers,
        connected: Boolean(sm.connected),
        profileUrl: sm.profileUrl
      }))
    };

    console.log('✅ AUTH: Login exitoso para usuario:', userResponse.name);
    return { success: true, user: userResponse, token };
  } catch (error) {
    console.error('💥 AUTH ERROR:', error);
    return { success: false, message: 'Error interno del servidor' };
  }
};

// Obtener usuario por token
export const getUserByToken = async (token: string): Promise<User | null> => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    
    const user = userService.findById(decoded.userId);
    if (!user) return null;
    
    const socialMedia = socialMediaService.getByUserId(decoded.userId);
    const userStats = statsService.getByUserId(decoded.userId);

    return {
      id: user.id,
      email: user.email,
      name: user.name || '',
      company: user.company || '',
      phone: user.phone || '',
      bio: user.bio || '',
      avatarUrl: user.avatarUrl,
      role: user.role,
      plan: user.plan,
      credits: user.credits,
      profileType: user.profileType,
      category: user.category,
      brandName: user.brandName,
      otherCategory: user.otherCategory,
      onboardingCompleted: Boolean(user.onboardingCompleted),
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      nextBillingDate: user.nextBillingDate,
      socialMedia: socialMedia.map(sm => ({
        platform: sm.platform,
        username: sm.username,
        followers: sm.followers,
        connected: Boolean(sm.connected),
        profileUrl: sm.profileUrl
      }))
    };
  } catch (error) {
    console.error('Error getting user by token:', error);
    return null;
  }
};

// Actualizar perfil de usuario
export const updateUserProfile = async (userId: string, updateData: Partial<User>): Promise<LoginResponse> => {
  try {
    console.log('🔍 UPDATE: Actualizando perfil para usuario:', userId);
    
    // Preparar datos para actualización
    const dataToUpdate: any = {};
    if (updateData.name !== undefined) dataToUpdate.name = updateData.name;
    if (updateData.company !== undefined) dataToUpdate.company = updateData.company;
    if (updateData.phone !== undefined) dataToUpdate.phone = updateData.phone;
    if (updateData.bio !== undefined) dataToUpdate.bio = updateData.bio;
    if (updateData.avatarUrl !== undefined) dataToUpdate.avatarUrl = updateData.avatarUrl;
    if (updateData.profileType !== undefined) dataToUpdate.profileType = updateData.profileType;
    if (updateData.category !== undefined) dataToUpdate.category = updateData.category;
    if (updateData.brandName !== undefined) dataToUpdate.brandName = updateData.brandName;
    if (updateData.otherCategory !== undefined) dataToUpdate.otherCategory = updateData.otherCategory;
    if (updateData.onboardingCompleted !== undefined) dataToUpdate.onboardingCompleted = updateData.onboardingCompleted ? 1 : 0;
    if (updateData.plan !== undefined) dataToUpdate.plan = updateData.plan;
    if (updateData.settings !== undefined) dataToUpdate.settings = JSON.stringify(updateData.settings);
    
    // Campos adicionales para políticos
    if (updateData.partidoPolitico !== undefined) dataToUpdate.partidoPolitico = updateData.partidoPolitico;
    if (updateData.cargoActual !== undefined) dataToUpdate.cargoActual = updateData.cargoActual;
    if (updateData.propuestasPrincipales !== undefined) dataToUpdate.propuestasPrincipales = updateData.propuestasPrincipales;
    
    const success = userService.update(userId, dataToUpdate);
    
    if (!success) {
      return { success: false, message: 'Error actualizando el perfil' };
    }
    
    // Obtener usuario actualizado
    const updatedUser = userService.findById(userId);
    const socialMedia = socialMediaService.getByUserId(userId);

    const user: User = {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name || '',
      company: updatedUser.company || '',
      phone: updatedUser.phone || '',
      bio: updatedUser.bio || '',
      avatarUrl: updatedUser.avatarUrl,
      role: updatedUser.role,
      plan: updatedUser.plan,
      credits: updatedUser.credits,
      profileType: updatedUser.profileType,
      category: updatedUser.category,
      brandName: updatedUser.brandName,
      otherCategory: updatedUser.otherCategory,
      onboardingCompleted: Boolean(updatedUser.onboardingCompleted),
      createdAt: updatedUser.createdAt,
      lastLogin: updatedUser.lastLogin,
      nextBillingDate: updatedUser.nextBillingDate,
      partidoPolitico: updatedUser.partidoPolitico,
      cargoActual: updatedUser.cargoActual,
      propuestasPrincipales: updatedUser.propuestasPrincipales,
      settings: updatedUser.settings ? JSON.parse(updatedUser.settings) : {},
      darkMode: false,
      notifications: true,
      socialMedia: socialMedia.map(sm => ({
        platform: sm.platform,
        username: sm.username,
        followers: sm.followers,
        connected: Boolean(sm.connected),
        profileUrl: sm.profileUrl
      }))
    };

    console.log('✅ UPDATE: Perfil actualizado exitosamente');
    return { success: true, user };
  } catch (error) {
    console.error('💥 UPDATE ERROR:', error);
    return { success: false, message: 'Error actualizando el perfil' };
  }
};

// Guardar token en localStorage (cliente)
export const saveAuthToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('authToken', token);
  }
};

// Obtener token desde localStorage (cliente)
export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken');
  }
  return null;
};

// Limpiar datos de autenticación
export const logout = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    window.location.href = '/login';
  }
};

// Verificar si está autenticado
export const isAuthenticated = (): boolean => {
  return getAuthToken() !== null;
};

// Obtener todos los usuarios (para admin)
export const getAllUsers = async () => {
  try {
    console.log('🔍 ADMIN: Obteniendo todos los usuarios...');
    
    const users = userService.findAll();
    
    if (users) {
      console.log('✅ ADMIN: Usuarios obtenidos exitosamente:', users.length);
      return { 
        success: true, 
        users: users.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          company: user.company,
          phone: user.phone,
          profileType: user.profileType,
          plan: user.plan,
          credits: user.credits,
          role: user.role,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
          onboardingCompleted: Boolean(user.onboardingCompleted)
        }))
      };
    } else {
      return { success: false, message: 'No se pudieron obtener los usuarios' };
    }
  } catch (error) {
    console.error('💥 ADMIN ERROR:', error);
    return { success: false, message: 'Error interno del servidor' };
  }
};
