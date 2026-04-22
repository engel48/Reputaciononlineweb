'use client';

import { useEffect, useState } from 'react';

/**
 * Hook que determina si el usuario actual tiene alguna red social conectada
 * y/o menciones registradas en los últimos 30 días. Usado por empty states.
 *
 * Returns:
 *   loading: true mientras consulta
 *   hasConnections: >=1 red conectada
 *   hasMentions: >=1 mention registrada
 *   hasAnyData: cualquiera de las dos anteriores
 */
export function useHasMentionsData() {
  const [loading, setLoading] = useState(true);
  const [hasConnections, setHasConnections] = useState(false);
  const [hasMentions, setHasMentions] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [connRes, analyticsRes] = await Promise.all([
          fetch('/api/social-connect', { credentials: 'include' }).catch(() => null),
          fetch('/api/dashboard-analytics', { credentials: 'include' }).catch(() => null),
        ]);

        if (cancelled) return;

        if (connRes?.ok) {
          const data = await connRes.json();
          const networks = data?.connections || data?.data || data?.networks || [];
          const connected = Array.isArray(networks)
            ? networks.some((n: any) => n?.connected === true)
            : Object.values(networks || {}).some((n: any) => n?.connected === true);
          setHasConnections(!!connected);
        }

        if (analyticsRes?.ok) {
          const data = await analyticsRes.json();
          const total = data?.data?.mentions?.total || 0;
          setHasMentions(total > 0);
        }
      } catch (err) {
        console.error('[useHasMentionsData] error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    loading,
    hasConnections,
    hasMentions,
    hasAnyData: hasConnections || hasMentions,
  };
}
