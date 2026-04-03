import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import i18n from 'i18next';

export type Language = 'en' | 'ru' | 'ka';

export interface LanguageOption {
  code: Language;
  label: string;
  flag: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', flag: 'EN' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'ka', label: 'ქართული', flag: '🇬🇪' },
];

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  currentLabel: string;
  currentFlag: string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function getStoredLanguage(): Language {
  const stored = localStorage.getItem('bookvisit-language');
  if (stored === 'en' || stored === 'ru' || stored === 'ka') return stored;
  return (i18n.language?.slice(0, 2) as Language) || 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLangState] = useState<Language>(getStoredLanguage);

  // Sync i18next language on mount
  useEffect(() => {
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
    document.documentElement.setAttribute('lang', language);
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    setLangState(lang);
    localStorage.setItem('bookvisit-language', lang);
    document.documentElement.setAttribute('lang', lang);
    i18n.changeLanguage(lang);
  }, []);

  const current = LANGUAGES.find(l => l.code === language)!;

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      currentLabel: current.label,
      currentFlag: current.flag,
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
