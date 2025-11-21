// src/services/authService.ts
import { User } from '@/context/UserContext';

// Guardado del usuario actual en localStorage
const saveCurrentUser = (user: any) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('currentUser', JSON.stringify(user));
  }
};

// Obtener el usuario actual desde localStorage
export const getCurrentUser = () => {
  if (typeof window !== 'undefined') {
    const userString = localStorage.getItem('currentUser');
    if (userString) {
      try {
        return JSON.parse(userString);
      } catch (error) {
        console.error('Error parsing user from localStorage', error);
        return null;
      }
    }
  }
  return null;
};

// Obtener usuario autenticado desde API/Supabase
export const getAuthenticatedUser = async (): Promise<User | null> => {
  try {
    // Verificar sesión real
    const sessionResponse = await fetch('/api/auth/session');
    const session = await sessionResponse.json();

    if (!session?.user) {
      return null;
    }

    // Obtener datos REALES del usuario desde Supabase
    const userResponse = await fetch(`/api/users/${session.user.id}`);
    if (!userResponse.ok) {
      return null;
    }

    const userData = await userResponse.json();

    // Obtener redes sociales REALES conectadas vía OAuth
    const socialMediaResponse = await fetch(`/api/social-media?userId=${session.user.id}`);
    const socialMediaData = await socialMediaResponse.json();

    // Obtener menciones REALES desde Supabase
    const mentionsResponse = await fetch(`/api/mentions/recent?userId=${session.user.id}&limit=10`);
    const mentionsData = await mentionsResponse.json();

    return {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      plan: userData.plan,
      credits: userData.credits,
      socialMedia: socialMediaData.platforms || [],
      recentMentions: mentionsData.mentions || []
    };
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    return null;
  }
};

// Limpiar los datos de usuario al cerrar sesión
export const logout = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('currentUser');
    // Redireccionar al login
    window.location.href = '/login';
  }
};

// Inicio de sesión real con API
export const login = async (email: string, password: string) => {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok && data.user) {
      saveCurrentUser(data.user);
      return { success: true, user: data.user };
    }

    return { success: false, message: data.message || 'Credenciales incorrectas' };
  } catch (error) {
    console.error('Error during login:', error);
    return { success: false, message: 'Error al iniciar sesión. Por favor intenta de nuevo.' };
  }
};

// Verificar si el usuario está autenticado
export const isAuthenticated = () => {
  return getCurrentUser() !== null;
};
