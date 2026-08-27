import React from 'react';
import { Heart, Github } from 'lucide-react';
import { PlateViewLogo } from './PlateViewLogo';
import { useLanguage } from '../../hooks/useLanguage';

export const Footer: React.FC = () => {
  const { lang, t } = useLanguage();

  return (
    <footer className="mt-16 border-t border-border bg-card/50 py-10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 text-center space-y-6">
        {/* Brand, Version & GitHub Link */}
        <div className="flex items-center justify-center gap-3">
          <div className="flex items-center gap-2">
            <PlateViewLogo className="w-5 h-5 shrink-0" />
            <span className="font-bold text-main">PlateView ⚾</span>
            <span className="text-xs text-muted">v1.0.0</span>
          </div>

          <span className="text-border text-xs">&bull;</span>

          {/* GitHub Repo Icon Link with Tooltip */}
          <div className="relative group inline-flex items-center justify-center">
            <a
              href="https://github.com/VaalRL/PlateView"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub Repository"
              title={lang === 'zh' ? 'GitHub 專案原始碼' : 'GitHub Repository'}
              className="p-1.5 rounded-lg border border-border text-muted hover:text-main hover:bg-card-hover hover:border-team-primary/50 transition-all flex items-center justify-center"
            >
              <Github className="w-4 h-4" />
            </a>

            {/* Custom Tooltip */}
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-main text-page text-[11px] font-medium rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap z-20">
              <span>{lang === 'zh' ? 'GitHub 專案原始碼' : 'GitHub Repository'}</span>
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-main" />
            </div>
          </div>
        </div>

        {/* Buy Me a Coffee Section (Official Badge Image) */}
        <div className="max-w-md mx-auto bg-card border border-border p-5 rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center justify-center gap-2 text-sm font-bold text-main">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
            <span>{t('footer.sponsor_title')}</span>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            {t('footer.sponsor_desc')}
          </p>
          <div className="pt-1">
            <a
              href="https://buymeacoffee.com/whoami885"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Buy Me a Coffee"
              className="inline-block transition-transform hover:scale-105 active:scale-95"
            >
              <img
                src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
                alt="Buy Me A Coffee"
                className="h-11 w-auto mx-auto rounded-xl shadow-sm hover:shadow-md transition-shadow"
              />
            </a>
          </div>
        </div>

        {/* Legal Disclaimer */}
        <div className="max-w-3xl mx-auto text-xs text-muted leading-relaxed space-y-2">
          <p>{t('footer.disclaimer')}</p>
          {lang === 'zh' && (
            <p className="text-[11px] opacity-75">
              PlateView is an open-source, non-commercial baseball statistics explorer designed for
              personal research and educational purposes. All MLB trademarks, logos, team names, player
              photos, and statistical data are the intellectual property of Major League Baseball and its
              clubs. This project is not affiliated with, endorsed by, or sponsored by Major League
              Baseball.
            </p>
          )}
        </div>

        <div className="pt-2 text-xs text-muted">
          MIT License &bull; Data directly fetched from MLB Stats API &bull; Built with React & Vite
        </div>
      </div>
    </footer>
  );
};
