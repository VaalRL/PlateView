import React, { useMemo } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useLanguage } from '../../hooks/useLanguage';
import { LanguageSelector } from './LanguageSelector';
import teamsData from '../../data/teams.json';

type TeamItem = (typeof teamsData)[number];

export const ThemeSelector: React.FC = () => {
  const { mode, toggleMode, team, setTeam } = useTheme();
  const { lang, t: translate } = useLanguage();

  // Group teams by division
  const groupedTeams = useMemo(() => {
    const isZh = lang === 'zh';
    const groups: Record<string, TeamItem[]> = {
      [isZh ? '美聯東區 (AL East)' : 'AL East']: [],
      [isZh ? '美聯中區 (AL Central)' : 'AL Central']: [],
      [isZh ? '美聯西區 (AL West)' : 'AL West']: [],
      [isZh ? '國聯東區 (NL East)' : 'NL East']: [],
      [isZh ? '國聯中區 (NL Central)' : 'NL Central']: [],
      [isZh ? '國聯西區 (NL West)' : 'NL West']: [],
    };

    teamsData.forEach((t) => {
      if (t.league === 'AL' && t.division === 'East')
        groups[isZh ? '美聯東區 (AL East)' : 'AL East'].push(t);
      else if (t.league === 'AL' && t.division === 'Central')
        groups[isZh ? '美聯中區 (AL Central)' : 'AL Central'].push(t);
      else if (t.league === 'AL' && t.division === 'West')
        groups[isZh ? '美聯西區 (AL West)' : 'AL West'].push(t);
      else if (t.league === 'NL' && t.division === 'East')
        groups[isZh ? '國聯東區 (NL East)' : 'NL East'].push(t);
      else if (t.league === 'NL' && t.division === 'Central')
        groups[isZh ? '國聯中區 (NL Central)' : 'NL Central'].push(t);
      else if (t.league === 'NL' && t.division === 'West')
        groups[isZh ? '國聯西區 (NL West)' : 'NL West'].push(t);
    });

    return groups;
  }, [lang]);

  const currentTeamMeta = teamsData.find((t) => t.code === team) || teamsData[0];
  const teamDisplayName = lang === 'zh' ? currentTeamMeta.nameZh : currentTeamMeta.name;

  return (
    <div className="flex items-center gap-2">
      {/* 30-Team Theme Dropdown */}
      <div className="relative flex items-center">
        <div
          className="w-3 h-3 rounded-full absolute left-2.5 pointer-events-none transition-colors border border-black/20"
          style={{ backgroundColor: currentTeamMeta.primaryColor }}
          title={`${teamDisplayName} ${translate('theme.team_color')}`}
        />
        <select
          value={team}
          onChange={(e) => setTeam(e.target.value)}
          aria-label={translate('theme.team_color')}
          className="text-xs md:text-sm bg-card border border-border text-main rounded-lg pl-7 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-team-primary cursor-pointer hover:border-team-primary transition-all font-medium"
        >
          {Object.entries(groupedTeams).map(([divName, list]) => (
            <optgroup key={divName} label={divName}>
              {list.map((item) => (
                <option key={item.code} value={item.code}>
                  {lang === 'zh' ? item.nameZh : item.name} ({item.abbrev})
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Control Group: Language Toggle & Dark/Light Toggle side by side */}
      <div className="flex items-center gap-1.5">
        <LanguageSelector />

        {/* Dark / Light Toggle */}
        <button
          onClick={toggleMode}
          aria-label="Toggle theme mode"
          className="p-2 rounded-lg border border-border hover:bg-card-hover text-muted hover:text-main transition-colors"
          title={mode === 'dark' ? translate('theme.toggle_light') : translate('theme.toggle_dark')}
        >
          {mode === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
        </button>
      </div>
    </div>
  );
};
