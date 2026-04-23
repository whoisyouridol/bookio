import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from 'react';

interface ThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  fontFamily: string;
  borderRadius: string;
}

const defaultTheme: ThemeColors = {
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

  // Apply data-theme attribute for dark mode
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  // Apply default theme CSS variables once
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', defaultTheme.primary);
    root.style.setProperty('--color-primary-dark', defaultTheme.primaryDark);
    root.style.setProperty('--color-primary-light', defaultTheme.primaryLight);
    root.style.setProperty('--color-accent', defaultTheme.accent);
    root.style.setProperty('--border-radius', defaultTheme.borderRadius);
    root.style.setProperty('--font-family', defaultTheme.fontFamily);
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    localStorage.setItem('bookvisit-theme-mode', mode);
  }, []);

  const toggleDark = useCallback(() => {
    setThemeMode(isDark ? 'light' : 'dark');
  }, [isDark, setThemeMode]);

  return (
    <ThemeContext.Provider value={{ isDark, themeMode, setThemeMode, toggleDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
