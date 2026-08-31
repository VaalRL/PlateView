import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language, TranslationKey } from '../i18n/translations';
import { STORAGE_KEYS, FAVORITES_UPDATED_EVENT } from '../constants/storage';

interface LanguageContextType {
  lang: Language;
  setLang: (l: Language) => void;
  toggleLang: () => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEYS.language);
      if (saved === 'zh' || saved === 'en') return saved;
      // Default to Traditional Chinese
      return 'zh';
    }
    return 'zh';
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem(STORAGE_KEYS.language, newLang);
    document.documentElement.setAttribute('lang', newLang === 'zh' ? 'zh-TW' : 'en');
  };

  // Re-sync when a backup restore (or another tab) rewrites the stored language
  useEffect(() => {
    const reload = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.language);
        if (saved === 'zh' || saved === 'en') {
          setLangState((prev) => (prev === saved ? prev : saved));
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

  const toggleLang = () => {
    setLang(lang === 'zh' ? 'en' : 'zh');
  };

  useEffect(() => {
    document.documentElement.setAttribute('lang', lang === 'zh' ? 'zh-TW' : 'en');
  }, [lang]);

  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    const dict = translations[lang] || translations.zh;
    let text: string = dict[key] || translations.zh[key] || key;

    if (params) {
      Object.entries(params).forEach(([paramKey, val]) => {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(val));
      });
    }

    return text;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage(): LanguageContextType {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Graceful fallback for components rendered outside of Provider in isolated tests
    const defaultLang: Language = 'zh';
    return {
      lang: defaultLang,
      setLang: () => {},
      toggleLang: () => {},
      t: (key: TranslationKey, params?: Record<string, string | number>) => {
        let text: string = translations.zh[key] || key;
        if (params) {
          Object.entries(params).forEach(([paramKey, val]) => {
            text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(val));
          });
        }
        return text;
      },
    };
  }
  return ctx;
}
