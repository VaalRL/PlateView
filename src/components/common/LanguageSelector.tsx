import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';

export const LanguageSelector: React.FC = () => {
  const { lang, toggleLang, t } = useLanguage();

  return (
    <button
      onClick={toggleLang}
      aria-label={t('lang.toggle_label')}
      title={t('lang.toggle_label')}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-card hover:bg-card-hover text-xs font-semibold text-main transition-colors"
    >
      <Globe className="w-3.5 h-3.5 text-team-primary shrink-0" />
      <span className="font-mono">{lang === 'zh' ? '繁中' : 'EN'}</span>
    </button>
  );
};
