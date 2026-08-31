import { useState, useEffect } from 'react';
import {
  STORAGE_KEYS,
  DEFAULT_THEME_TEAM,
  FAVORITES_UPDATED_EVENT,
} from '../constants/storage';

export type ThemeMode = 'dark' | 'light';

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.themeMode);
      if (saved === 'light' || saved === 'dark') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'dark';
    } catch {
      return 'dark';
    }
  });

  const [team, setTeam] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.themeTeam) || DEFAULT_THEME_TEAM;
    } catch {
      return DEFAULT_THEME_TEAM;
    }
  });

  // Re-sync when a backup restore (or another tab) rewrites the stored theme
  useEffect(() => {
    const reload = () => {
      try {
        const savedMode = localStorage.getItem(STORAGE_KEYS.themeMode);
        if (savedMode === 'light' || savedMode === 'dark') {
          setMode((prev) => (prev === savedMode ? prev : savedMode));
        }
        const savedTeam = localStorage.getItem(STORAGE_KEYS.themeTeam);
        if (savedTeam) {
          setTeam((prev) => (prev === savedTeam ? prev : savedTeam));
        }
      } catch {}
    };
    window.addEventListener('storage', reload);
    window.addEventListener(FAVORITES_UPDATED_EVENT, reload);
    return () => {
      window.removeEventListener('storage', reload);
      window.removeEventListener(FAVORITES_UPDATED_EVENT, reload);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.themeMode, mode);
      const root = document.documentElement;
      if (mode === 'dark') {
        root.classList.add('dark');
        root.setAttribute('data-mode', 'dark');
      } else {
        root.classList.remove('dark');
        root.setAttribute('data-mode', 'light');
      }
    } catch {
      // Ignore storage error
    }
  }, [mode]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.themeTeam, team);
      document.documentElement.setAttribute('data-team', team);
    } catch {
      // Ignore storage error
    }
  }, [team]);

  const toggleMode = () => {
    setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return {
    mode,
    setMode,
    toggleMode,
    team,
    setTeam,
  };
}
