import React from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../../hooks/useLanguage';

/** Switches between the player and team comparison pages; each keeps its own list */
export const CompareTabs: React.FC = () => {
  const { t } = useLanguage();
  const tabs = [
    { to: '/compare', label: t('compare.tab_players') },
    { to: '/compare/teams', label: t('compare.tab_teams') },
  ];
  return (
    <nav className="flex gap-1 border-b border-border">
      {tabs.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          end
          className={({ isActive }) =>
            `px-4 py-2 -mb-px border-b-2 text-sm font-bold transition-colors ${
              isActive ? 'border-team-primary text-team-primary' : 'border-transparent text-muted hover:text-main'
            }`
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
};
