import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Compass, Coffee, Trophy, Medal, SlidersHorizontal, MapPin, ArrowLeftRight, Award, type LucideIcon } from 'lucide-react';
import { ThemeSelector } from './ThemeSelector';
import { SearchModal } from './SearchModal';
import { PlateViewLogo } from './PlateViewLogo';
import { useLanguage } from '../../hooks/useLanguage';

/**
 * A label under an icon-only control, shown on hover and on keyboard focus.
 * Out of the layout until then: a hidden label near the edge would still
 * widen a phone's page.
 */
const NavTooltip: React.FC<{ label: string }> = ({ label }) => (
  <div
    aria-hidden="true"
    className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-main text-page text-[11px] font-medium rounded-md shadow-lg hidden group-hover:block group-focus-within:block pointer-events-none whitespace-nowrap z-50"
  >
    <span>{label}</span>
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-main" />
  </div>
);

interface IconNavItemProps {
  label: string;
  icon: LucideIcon;
  /** The icon's colour */
  tone?: string;
  /** Extra classes on the wrapper, e.g. to hide the item at some widths */
  className?: string;
}

const iconControlClass = (active = false) =>
  `p-1.5 sm:p-2 rounded-lg transition-colors hover:bg-card-hover ${active ? 'bg-team-primary/10' : ''}`;

/**
 * Every navbar entry is its icon alone; its name is the tooltip and the
 * accessible label. A page link marks the page it opens with aria-current.
 */
const IconNavLink: React.FC<IconNavItemProps & { to: string; active: boolean }> = ({
  to,
  label,
  icon: Icon,
  active,
  tone = 'text-team-primary',
  className = 'inline-flex',
}) => (
  <div className={`relative group ${className}`}>
    <Link to={to} aria-label={label} aria-current={active ? 'page' : undefined} className={iconControlClass(active)}>
      <Icon className={`w-4 h-4 ${tone}`} />
    </Link>
    <NavTooltip label={label} />
  </div>
);

/** An icon-only action, with its name as tooltip and accessible label */
const IconNavButton: React.FC<IconNavItemProps & { onClick: () => void }> = ({
  label,
  icon: Icon,
  onClick,
  tone = 'text-team-primary',
  className = 'inline-flex',
}) => (
  <div className={`relative group ${className}`}>
    <button type="button" onClick={onClick} aria-label={label} className={iconControlClass()}>
      <Icon className={`w-4 h-4 ${tone}`} />
    </button>
    <NavTooltip label={label} />
  </div>
);

export const Navbar: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  // Below xl, team colour, language and light/dark sit behind one settings
  // button: inline, the team dropdown alone is as wide as its longest team
  // name, and the row overflowed every phone and tablet width
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  useEffect(() => setIsSettingsOpen(false), [location.pathname]);
  useEffect(() => {
    if (!isSettingsOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!settingsRef.current?.contains(e.target as Node)) setIsSettingsOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsSettingsOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isSettingsOpen]);

  const handleStandingsClick = () => {
    if (location.pathname !== '/') {
      // HomePage scrolls to the section once mounted (see its scrollTo effect)
      navigate('/', { state: { scrollTo: 'standings' } });
    } else {
      document.getElementById('standings')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      {/* Opened from the home screen on iOS the page runs under the status bar; keep the bar below it */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b border-border transition-colors pt-[env(safe-area-inset-top)]">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <PlateViewLogo className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 drop-shadow-md group-hover:scale-105 transition-transform" />
            {/* Below 400px the mark alone has to stand for the name: the icons need the room */}
            <div className="max-[399px]:sr-only">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-main">
                Plate<span className="text-team-primary">View</span>
              </span>
              <span className="hidden xl:inline-block ml-2 text-xs px-2 py-0.5 rounded-full bg-team-primary/10 text-team-primary font-medium">
                {t('nav.badge')}
              </span>
            </div>
          </Link>

          {/* Center Search Trigger */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex-1 min-w-0 max-w-md hidden lg:flex items-center justify-between gap-2 px-3.5 py-1.5 rounded-lg bg-page border border-border text-muted hover:text-main hover:border-team-primary/50 text-sm transition-all"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Search className="w-4 h-4 shrink-0" />
              <span className="truncate">{t('nav.search_placeholder')}</span>
            </div>
            <kbd className="shrink-0 text-xs bg-card border border-border px-1.5 py-0.5 rounded font-mono">
              Ctrl+K
            </kbd>
          </button>

          {/* Right Actions */}
          <div className="flex items-center gap-0.5 sm:gap-3">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="lg:hidden p-1.5 sm:p-2 text-muted hover:text-main"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Pages and the standings shortcut, as icons named by their tooltips */}
            <IconNavLink
              to="/leaders"
              label={t('nav.leaders')}
              icon={Trophy}
              tone="text-amber-500"
              active={location.pathname === '/leaders'}
            />
            <IconNavLink
              to="/postseason"
              label={t('nav.postseason')}
              icon={Medal}
              tone="text-amber-500"
              active={location.pathname.startsWith('/postseason')}
            />
            <IconNavLink to="/awards" label={t('nav.awards')} icon={Award} active={location.pathname.startsWith('/awards')} />
            <IconNavLink
              to="/transactions"
              label={t('nav.moves')}
              icon={ArrowLeftRight}
              active={location.pathname === '/transactions'}
            />
            <IconNavLink to="/taiwan" label={t('nav.taiwan')} icon={MapPin} active={location.pathname === '/taiwan'} />
            {/* Not on a phone: the home page's standings are a short scroll away */}
            <IconNavButton
              label={t('nav.standings')}
              icon={Compass}
              onClick={handleStandingsClick}
              className="hidden sm:inline-flex"
            />

            {/* Sponsor Icon Button with Hover Tooltip */}
            <div className="relative group inline-flex items-center justify-center">
              <a
                href="https://buymeacoffee.com/whoami885"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t('nav.sponsor')}
                title={t('nav.sponsor')}
                className="p-1.5 sm:p-2 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-black transition-all shadow-sm flex items-center justify-center"
              >
                <Coffee className="w-4 h-4" />
              </a>

              <NavTooltip label={t('nav.sponsor')} />
            </div>

            <div className="h-4 w-px bg-border hidden xl:block" />

            <div className="hidden xl:block">
              <ThemeSelector />
            </div>

            <div ref={settingsRef} className="relative xl:hidden">
              <button
                type="button"
                onClick={() => setIsSettingsOpen((open) => !open)}
                aria-label={t('nav.settings')}
                aria-expanded={isSettingsOpen}
                aria-controls="navbar-settings"
                className={`p-1.5 sm:p-2 rounded-lg border transition-colors ${
                  isSettingsOpen
                    ? 'border-team-primary text-team-primary bg-team-primary/10'
                    : 'border-border text-muted hover:text-main hover:bg-card-hover'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
              {isSettingsOpen && (
                <div
                  id="navbar-settings"
                  className="absolute right-0 top-full mt-2 w-64 max-w-[calc(100vw-24px)] rounded-xl border border-border bg-card p-3 shadow-lg z-50"
                >
                  <ThemeSelector stacked />
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};
