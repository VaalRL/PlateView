import { useState, useEffect } from 'react';

export type ThemeMode = 'dark' | 'light';

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('plateview_mode');
      if (saved === 'light' || saved === 'dark') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'dark';
    } catch {
      return 'dark';
    }
  });

  const [team, setTeam] = useState<string>(() => {
    try {
      return localStorage.getItem('plateview_team') || 'lad';
    } catch {
      return 'lad';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('plateview_mode', mode);
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
      localStorage.setItem('plateview_team', team);
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
