"use client";

import { useCallback, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'auto';

const STORAGE_KEY = 'theme';

/** Aplica el tema al <html> (clase `dark`). `auto` respeta el SO. */
export function applyTheme(mode: ThemeMode): void {
  if (typeof document === 'undefined') return;
  const isDark =
    mode === 'dark' ||
    (mode === 'auto' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', isDark);
}

/**
 * Hook de tema para toda la web. Persiste en localStorage y togglea la clase
 * `dark` en <html> (Tailwind darkMode:'class'). El script inline del root layout
 * aplica el tema guardado antes del primer paint para evitar parpadeo.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>('auto');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = (typeof localStorage !== 'undefined'
      ? (localStorage.getItem(STORAGE_KEY) as ThemeMode | null)
      : null);
    const initial = saved || 'auto';
    setThemeState(initial);
    applyTheme(initial);
    setMounted(true);

    // Si está en 'auto', reaccionar a cambios del SO.
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      const current = (localStorage.getItem(STORAGE_KEY) as ThemeMode | null) || 'auto';
      if (current === 'auto') applyTheme('auto');
    };
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* ignore */
    }
    applyTheme(mode);
  }, []);

  return { theme, setTheme, mounted };
}
