import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from 'react';
import type { SalonTheme } from '@/types';

const defaultTheme: SalonTheme = {
  primary: '#B8623A',
  primaryDark: '#9E5230',
  primaryLight: '#FBF0E8',
  accent: '#2D6A5A',
  background: '#FAF8F5',
  surface: '#FFFFFF',
  text: '#1A1614',
  textSecondary: '#6E6259',
  border: '#E8E2DA',
  fontFamily: '"Outfit", system-ui, sans-serif',
  borderRadius: '10px',
};

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: SalonTheme;
  setTheme: (theme: SalonTheme) => void;
  resetTheme: () => void;
  isDark: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleDark: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getSystemPreference(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function getStoredMode(): ThemeMode {
  const stored = localStorage.getItem('bookvisit-theme-mode');
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  return 'system';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<SalonTheme>(defaultTheme);
  const [themeMode, setThemeModeState] = useState<ThemeMode>(getStoredMode);
  const [systemDark, setSystemDark] = useState(getSystemPreference);

  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemDark);

  // Listen for system preference changes
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Apply data-theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  // Apply salon-specific CSS variable overrides
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', theme.primary);
    root.style.setProperty('--color-primary-dark', theme.primaryDark);
    root.style.setProperty('--color-primary-light', theme.primaryLight);
    root.style.setProperty('--color-accent', theme.accent);
    root.style.setProperty('--border-radius', theme.borderRadius);
    root.style.setProperty('--font-family', theme.fontFamily);
  }, [theme]);

  const setTheme = useCallback((newTheme: SalonTheme) => setThemeState(newTheme), []);
  const resetTheme = useCallback(() => {
    setThemeState(defaultTheme);
    // Clear inline overrides so CSS theme.css takes over
    const root = document.documentElement;
    root.style.removeProperty('--color-primary');
    root.style.removeProperty('--color-primary-dark');
    root.style.removeProperty('--color-primary-light');
    root.style.removeProperty('--color-accent');
    root.style.removeProperty('--border-radius');
    root.style.removeProperty('--font-family');
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    localStorage.setItem('bookvisit-theme-mode', mode);
  }, []);

  const toggleDark = useCallback(() => {
    setThemeMode(isDark ? 'light' : 'dark');
  }, [isDark, setThemeMode]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resetTheme, isDark, themeMode, setThemeMode, toggleDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

export { defaultTheme };
