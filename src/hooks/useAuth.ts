/**
 * Hook de autenticación con SWR
 *
 * Características:
 * - Caché de sesión para evitar re-fetch innecesarios
 * - Persistencia entre navegaciones
 * - Manejo robusto de errores (no desloguea por errores de red)
 * - Revalidación inteligente
 */

import useSWR from 'swr';
import { useCallback, useEffect } from 'react';
import { CACHE_KEYS, REVALIDATE_INTERVALS } from '@/lib/swr-config';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  bio?: string;
  profileType?: 'personal' | 'political' | 'business';
  category?: string;
  brandName?: string;
  avatarUrl: string;
  role: 'user' | 'admin';
  createdAt: string;
  lastLogin?: string;
  plan: 'free' | 'basic' | 'pro' | 'enterprise';
  credits: number;
  onboardingCompleted?: boolean;
  darkMode?: boolean;
  notifications?: boolean;
  nextBillingDate?: string;
  socialMedia?: any[];
}

interface AuthResponse {
  success: boolean;
  user: AuthUser;
}

// Fetcher específico para autenticación con mejor manejo de errores
const authFetcher = async (url: string): Promise<AuthUser | null> => {
  try {
    const token = typeof window !== 'undefined'
      ? localStorage.getItem('auth-token')
      : null;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      headers,
      credentials: 'include',
    });

    // Si hay error de autenticación, retornar null (no lanzar error)
    if (res.status === 401 || res.status === 403) {
      return null;
    }

    if (!res.ok) {
      // Para otros errores, mantener los datos previos
      throw new Error(`Error ${res.status}`);
    }

    const data: AuthResponse = await res.json();

    if (data.success && data.user) {
      return data.user;
    }

    return null;
  } catch (error) {
    // En caso de error de red, mantener datos previos
    throw error;
  }
};

/**
 * Hook principal de autenticación
 */
export function useAuth() {
  const { data: user, error, isLoading, isValidating, mutate } = useSWR<AuthUser | null>(
    CACHE_KEYS.USER,
    authFetcher,
    {
      // Revalidar cada 10 minutos
      refreshInterval: REVALIDATE_INTERVALS.USER,
      // No revalidar al enfocar ventana (evita logouts)
      revalidateOnFocus: false,
      // Mantener datos previos mientras revalida
      keepPreviousData: true,
      // No reintentar en errores de auth
      shouldRetryOnError: (error: any) => {
        return error?.message !== 'Error 401' && error?.message !== 'Error 403';
      },
      // Fallback a datos en caché si hay error de red
      errorRetryCount: 2,
      errorRetryInterval: 5000,
      // Callback de error para logging
      onError: (error) => {
        console.warn('Auth validation error:', error?.message);
      },
    }
  );

  // Función de logout
  const logout = useCallback(async () => {
    try {
      // Limpiar tokens
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-token');
        document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }

      // Llamar API de logout
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      // Limpiar caché de SWR
      await mutate(null, false);

      // Redirigir a login
      window.location.href = '/login';
    } catch (error) {
      console.error('Error during logout:', error);
      // Forzar redirección incluso si hay error
      window.location.href = '/login';
    }
  }, [mutate]);

  // Función para actualizar usuario en caché
  const updateUser = useCallback(async (updates: Partial<AuthUser>) => {
    if (!user) return;

    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token') || ''}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: user.id,
          ...updates,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.user) {
          // Actualizar caché inmediatamente
          await mutate({ ...user, ...result.user }, false);
        }
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  }, [user, mutate]);

  // Función para refrescar manualmente
  const refresh = useCallback(() => {
    return mutate();
  }, [mutate]);

  return {
    user,
    isLoading,
    isValidating,
    isAuthenticated: !!user,
    error,
    logout,
    updateUser,
    refresh,
  };
}

/**
 * Hook para verificar si el usuario tiene rol de admin
 */
export function useIsAdmin() {
  const { user } = useAuth();
  return user?.role === 'admin';
}

/**
 * Hook para obtener el plan del usuario
 */
export function useUserPlan() {
  const { user } = useAuth();
  return {
    plan: user?.plan || 'free',
    isPro: user?.plan === 'pro' || user?.plan === 'enterprise',
    isEnterprise: user?.plan === 'enterprise',
  };
}

export default useAuth;
