import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Compass } from 'lucide-react';
import { ThemeSelector } from './ThemeSelector';
import { LanguageSelector } from './LanguageSelector';
import { SearchModal } from './SearchModal';
import { useLanguage } from '../../hooks/useLanguage';

export const Navbar: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <>
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b border-border transition-colors">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-team-primary flex items-center justify-center text-white font-black text-xl shadow-md group-hover:scale-105 transition-transform">
              P
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-main">
                Plate<span className="text-team-primary">View</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs px-2 py-0.5 rounded-full bg-team-primary/10 text-team-primary font-medium">
                {t('nav.badge')}
              </span>
            </div>
          </Link>

          {/* Center Search Trigger */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex-1 max-w-md hidden md:flex items-center justify-between px-3.5 py-1.5 rounded-lg bg-page border border-border text-muted hover:text-main hover:border-team-primary/50 text-sm transition-all"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              <span>{t('nav.search_placeholder')}</span>
            </div>
            <kbd className="text-xs bg-card border border-border px-1.5 py-0.5 rounded font-mono">
              Ctrl+K
            </kbd>
          </button>

          {/* Right Actions */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="md:hidden p-2 text-muted hover:text-main"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            <Link
              to="/#standings"
              className="hidden sm:flex items-center gap-1 text-sm font-medium text-muted hover:text-main transition-colors"
            >
              <Compass className="w-4 h-4" />
              <span>{t('nav.standings')}</span>
            </Link>

            <div className="h-4 w-px bg-border hidden sm:block" />

            <LanguageSelector />

            <ThemeSelector />
          </div>
        </div>
      </header>

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};
