"use client";

/**
 * Configuración global de SWR para caché y revalidación inteligente
 *
 * Esta configuración optimiza:
 * - Caché en memoria para navegación rápida
 * - Revalidación en segundo plano (stale-while-revalidate)
 * - Persistencia de datos durante la sesión
 * - Prevención de múltiples requests simultáneos
 */

import { SWRConfig, SWRConfiguration } from 'swr';
import { ReactNode, useCallback, useMemo } from 'react';

// Cache en memoria para persistir datos entre navegaciones
const localStorageProvider = (): Map<string, any> => {
  if (typeof window === 'undefined') {
    return new Map();
  }

  // Intentar recuperar caché de sessionStorage
  const cacheKey = 'app-swr-cache';
  let map: Map<string, any>;

  try {
    const cached = sessionStorage.getItem(cacheKey);
    map = new Map(cached ? JSON.parse(cached) : []);
  } catch {
    map = new Map();
  }

  // Sincronizar con sessionStorage al cambiar
  const originalSet = map.set.bind(map);
  map.set = (key: string, value: any) => {
    const result = originalSet(key, value);
    try {
      // Solo guardar datos serializables
      const entries = Array.from(map.entries()).filter(([k, v]) => {
        try {
          JSON.stringify(v);
          return true;
        } catch {
          return false;
        }
      });
      sessionStorage.setItem(cacheKey, JSON.stringify(entries));
    } catch {
      // Ignorar errores de storage
    }
    return result;
  };

  return map;
};

// Fetcher global con manejo de errores y autenticación
const globalFetcher = async (url: string) => {
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

  if (!res.ok) {
    const error = new Error('Error en la petición') as Error & { status?: number };
    error.status = res.status;
    throw error;
  }

  return res.json();
};

// Configuración global de SWR
const swrConfig: SWRConfiguration = {
  fetcher: globalFetcher,
  // Caché de 5 minutos antes de revalidar
  dedupingInterval: 5 * 60 * 1000,
  // No revalidar al enfocar ventana (evita requests innecesarios)
  revalidateOnFocus: false,
  // Revalidar al reconectar
  revalidateOnReconnect: true,
  // Mantener datos previos mientras revalida
  keepPreviousData: true,
  // No reintentar en error 401/403
  shouldRetryOnError: (error: any) => {
    return error?.status !== 401 && error?.status !== 403;
  },
  // Reintentos con backoff exponencial
  errorRetryCount: 3,
  errorRetryInterval: 3000,
  // Suspense desactivado por defecto
  suspense: false,
  // Callback global de error
  onError: (error, key) => {
    if (error?.status === 401) {
      console.warn('Sesión expirada, redirigiendo a login...');
      // No redirigir automáticamente, dejar que el componente maneje esto
    }
  },
};

interface SWRProviderProps {
  children: ReactNode;
}

export function SWRProvider({ children }: SWRProviderProps) {
  const provider = useMemo(() => {
    if (typeof window === 'undefined') return () => new Map();
    return localStorageProvider;
  }, []);

  return (
    <SWRConfig value={{ ...swrConfig, provider }}>
      {children}
    </SWRConfig>
  );
}

// Keys de caché para usar consistentemente en toda la app
export const CACHE_KEYS = {
  USER: '/api/auth/verify',
  DASHBOARD_ANALYTICS: '/api/dashboard-analytics',
  SOCIAL_MEDIA: '/api/social-media',
  MENTIONS: '/api/mentions',
  NEWS_MENTIONS: '/api/news-mentions',
  CREDITS: '/api/credits',
  NOTIFICATIONS: '/api/notifications',
  USER_STATS: '/api/user-stats',
} as const;

// Tiempos de revalidación por tipo de dato
export const REVALIDATE_INTERVALS = {
  USER: 10 * 60 * 1000,      // 10 minutos - datos de usuario cambian poco
  ANALYTICS: 5 * 60 * 1000,  // 5 minutos - analytics se actualizan periódicamente
  MENTIONS: 2 * 60 * 1000,   // 2 minutos - menciones pueden ser más dinámicas
  CREDITS: 30 * 1000,        // 30 segundos - créditos cambian con acciones
  NOTIFICATIONS: 60 * 1000,  // 1 minuto - notificaciones frecuentes
} as const;

export default SWRProvider;
