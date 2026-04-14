'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { AppLanguage } from '@/lib/i18n';
import { tKey } from '@/lib/i18n';

const STORAGE_KEY = 'af_language';

type LanguageContextValue = {
  language: AppLanguage;
  setLanguage: (value: AppLanguage) => void;
  t: (key: string, fallback?: string, vars?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>('en');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'en' || stored === 'hi' || stored === 'te') {
        setLanguageState(stored);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {}
  }, [language]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage: setLanguageState,
      t: (key, fallback, vars) => tKey(language, key, fallback, vars),
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return ctx;
}

