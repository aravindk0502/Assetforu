'use client';

import { Globe } from 'lucide-react';
import { APP_LANGUAGES, type AppLanguage } from '@/lib/i18n';
import { useLanguage } from '@/components/LanguageProvider';

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, t } = useLanguage();
  return (
    <label
      className={`inline-flex items-center rounded-lg border border-slate-200 bg-white text-slate-700 ${
        compact ? 'px-2 py-1.5' : 'px-2.5 py-2'
      }`}
      aria-label={t('lang.label', 'Language')}
      title={t('lang.label', 'Language')}
    >
      <Globe className={`${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} mr-1.5 text-slate-500`} />
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as AppLanguage)}
        className={`bg-transparent outline-none font-semibold ${
          compact ? 'text-[11px]' : 'text-xs'
        }`}
      >
        {APP_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
    </label>
  );
}

