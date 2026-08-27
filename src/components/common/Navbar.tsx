import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Compass, Coffee, Trophy } from 'lucide-react';
import { ThemeSelector } from './ThemeSelector';
import { SearchModal } from './SearchModal';
import { PlateViewLogo } from './PlateViewLogo';
import { useLanguage } from '../../hooks/useLanguage';

export const Navbar: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const handleStandingsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const el = document.getElementById('standings');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
    } else {
      const el = document.getElementById('standings');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b border-border transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <PlateViewLogo className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 drop-shadow-md group-hover:scale-105 transition-transform" />
            <div>
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-main">
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
          <div className="flex items-center gap-1.5 sm:gap-3">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="md:hidden p-2 text-muted hover:text-main"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Leaderboards Page Link */}
            <Link
              to="/leaders"
              className={`flex items-center gap-1 text-sm font-medium transition-colors px-2 py-1 rounded-lg hover:bg-card-hover ${
                location.pathname === '/leaders'
                  ? 'text-team-primary bg-team-primary/10 font-bold'
                  : 'text-muted hover:text-main'
              }`}
              title={t('nav.leaders')}
            >
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="hidden sm:inline">{t('nav.leaders')}</span>
            </Link>

            {/* Standings Quick Scroll Button */}
            <button
              onClick={handleStandingsClick}
              className="hidden sm:flex items-center gap-1 text-sm font-medium text-muted hover:text-main transition-colors px-2 py-1 rounded-lg hover:bg-card-hover"
            >
              <Compass className="w-4 h-4 text-team-primary" />
              <span>{t('nav.standings')}</span>
            </button>

            {/* Sponsor Icon Button with Hover Tooltip */}
            <div className="relative group inline-flex items-center justify-center">
              <a
                href="https://buymeacoffee.com/whoami885"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t('nav.sponsor')}
                title={t('nav.sponsor')}
                className="p-2 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-black transition-all shadow-sm flex items-center justify-center"
              >
                <Coffee className="w-4 h-4" />
              </a>

              {/* Hover Tooltip */}
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-main text-page text-[11px] font-medium rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap z-50">
                <span>{t('nav.sponsor')}</span>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-main" />
              </div>
            </div>

            <div className="h-4 w-px bg-border hidden sm:block" />

            <ThemeSelector />
          </div>
        </div>
      </header>

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};
