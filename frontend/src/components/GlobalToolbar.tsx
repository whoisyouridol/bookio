import { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage, LANGUAGES } from '@/contexts/LanguageContext';

export function ThemeToggle() {
  const { t } = useTranslation();
  const { isDark, toggleDark } = useTheme();

  return (
    <button
      onClick={toggleDark}
      className="p-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--color-hover)] transition-colors"
      aria-label={isDark ? t('components.globalToolbar.switchToLightMode') : t('components.globalToolbar.switchToDarkMode')}
      title={isDark ? t('components.globalToolbar.lightMode') : t('components.globalToolbar.darkMode')}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-[var(--color-text-secondary)]" />
      ) : (
        <Moon className="w-4 h-4 text-[var(--color-text-secondary)]" />
      )}
    </button>
  );
}

export function LanguageSwitcher() {
  const { t } = useTranslation();
  const { language, setLanguage, currentFlag } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 p-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--color-hover)] transition-colors"
        aria-label={t('components.globalToolbar.changeLanguage')}
        title={t('components.globalToolbar.language')}
      >
        <Globe className="w-4 h-4 text-[var(--color-text-secondary)]" />
        <span className="text-xs text-[var(--color-text-secondary)] hidden sm:inline">{currentFlag}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-36 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] shadow-[var(--shadow-lg)] py-1 z-50 animate-[fadeIn_150ms_ease-out]">
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => { setLanguage(lang.code); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                language === lang.code
                  ? 'text-[var(--color-primary)] bg-[var(--color-primary-subtle)] font-medium'
                  : 'text-[var(--color-text)] hover:bg-[var(--color-hover)]'
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function GlobalToolbar() {
  return (
    <div className="flex items-center gap-0.5">
      <LanguageSwitcher />
      <ThemeToggle />
    </div>
  );
}
