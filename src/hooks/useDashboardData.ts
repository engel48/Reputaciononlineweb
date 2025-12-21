/**
 * Hooks de SWR para datos del dashboard
 *
 * Estos hooks implementan:
 * - Caché automático con SWR
 * - Revalidación en segundo plano
 * - Manejo de estados de carga y error
 * - Datos persistentes entre navegaciones
 */

import useSWR from 'swr';
import { CACHE_KEYS, REVALIDATE_INTERVALS } from '@/lib/swr-config';

// Fetcher con autenticación
const authFetcher = async (url: string) => {
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

  const data = await res.json();
  return data.data || data;
};

/**
 * Hook para obtener analytics del dashboard
 * Datos: menciones, sentimiento, tendencias
 */
export function useDashboardAnalytics() {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    CACHE_KEYS.DASHBOARD_ANALYTICS,
    authFetcher,
    {
      refreshInterval: REVALIDATE_INTERVALS.ANALYTICS,
      revalidateOnFocus: false,
      dedupingInterval: 60000, // Deduplicar requests por 1 minuto
    }
  );

  return {
    analytics: data,
    isLoading,
    isValidating,
    error,
    refresh: mutate,
  };
}

/**
 * Hook para obtener menciones recientes
 */
export function useMentions(limit: number = 20) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    `${CACHE_KEYS.MENTIONS}?limit=${limit}`,
    authFetcher,
    {
      refreshInterval: REVALIDATE_INTERVALS.MENTIONS,
      revalidateOnFocus: false,
    }
  );

  return {
    mentions: data?.mentions || [],
    total: data?.total || 0,
    isLoading,
    isValidating,
    error,
    refresh: mutate,
  };
}

/**
 * Hook para obtener menciones de noticias
 */
export function useNewsMentions(limit: number = 20) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    `${CACHE_KEYS.NEWS_MENTIONS}?limit=${limit}`,
    authFetcher,
    {
      refreshInterval: REVALIDATE_INTERVALS.MENTIONS,
      revalidateOnFocus: false,
    }
  );

  return {
    newsMentions: data?.mentions || [],
    total: data?.total || 0,
    isLoading,
    isValidating,
    error,
    refresh: mutate,
  };
}

/**
 * Hook para obtener redes sociales conectadas
 */
export function useSocialMedia() {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    CACHE_KEYS.SOCIAL_MEDIA,
    authFetcher,
    {
      refreshInterval: REVALIDATE_INTERVALS.USER,
      revalidateOnFocus: false,
    }
  );

  return {
    socialMedia: data?.platforms || data || [],
    isLoading,
    isValidating,
    error,
    refresh: mutate,
  };
}

/**
 * Hook para obtener créditos del usuario
 */
export function useCredits() {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    CACHE_KEYS.CREDITS,
    authFetcher,
    {
      refreshInterval: REVALIDATE_INTERVALS.CREDITS,
      revalidateOnFocus: true, // Revalidar al volver a la ventana para créditos
    }
  );

  return {
    credits: data?.credits || 0,
    transactions: data?.transactions || [],
    isLoading,
    isValidating,
    error,
    refresh: mutate,
  };
}

/**
 * Hook para obtener notificaciones
 */
export function useNotifications() {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    CACHE_KEYS.NOTIFICATIONS,
    authFetcher,
    {
      refreshInterval: REVALIDATE_INTERVALS.NOTIFICATIONS,
      revalidateOnFocus: true,
    }
  );

  return {
    notifications: data?.notifications || [],
    unreadCount: data?.unreadCount || 0,
    isLoading,
    isValidating,
    error,
    refresh: mutate,
  };
}

/**
 * Hook para obtener estadísticas del usuario
 */
export function useUserStats() {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    CACHE_KEYS.USER_STATS,
    authFetcher,
    {
      refreshInterval: REVALIDATE_INTERVALS.ANALYTICS,
      revalidateOnFocus: false,
    }
  );

  return {
    stats: data,
    isLoading,
    isValidating,
    error,
    refresh: mutate,
  };
}

/**
 * Hook combinado para el dashboard principal
 * Combina múltiples fuentes de datos con una sola llamada
 */
export function useDashboardCombined() {
  const analytics = useDashboardAnalytics();
  const socialMedia = useSocialMedia();

  return {
    analytics: analytics.analytics,
    socialMedia: socialMedia.socialMedia,
    isLoading: analytics.isLoading || socialMedia.isLoading,
    isValidating: analytics.isValidating || socialMedia.isValidating,
    error: analytics.error || socialMedia.error,
    refresh: async () => {
      await Promise.all([
        analytics.refresh(),
        socialMedia.refresh(),
      ]);
    },
  };
}
