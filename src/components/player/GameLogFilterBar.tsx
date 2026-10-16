import React from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { teamDisplayName } from '../../utils/teams';
import type { TranslationKey } from '../../i18n/translations';
import {
  DEFAULT_GAME_LOG_FILTER,
  isFilterActive,
  type GameLogFilter,
  type GameLogFilterOptions,
} from '../../utils/gameLogFilters';

interface Props {
  options: GameLogFilterOptions;
  filter: GameLogFilter;
  onChange: (filter: GameLogFilter) => void;
}

const FilterSelect: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}> = ({ label, value, onChange, children }) => (
  <label className="flex items-center gap-1.5 text-[11px] text-muted shrink-0">
    <span>{label}</span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`bg-card border rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:border-team-primary ${
        value === 'all' ? 'border-border text-main' : 'border-team-primary text-team-primary'
      }`}
    >
      {children}
    </select>
  </label>
);

/**
 * Filters for a player's game log. A filter shows only when the log holds
 * more than one value for it, so a player who never left the majors sees no
 * level filter and there is no postseason choice before October.
 */
export const GameLogFilterBar: React.FC<Props> = ({ options, filter, onChange }) => {
  const { lang, t } = useLanguage();
  const set = <K extends keyof GameLogFilter>(key: K, value: GameLogFilter[K]) => onChange({ ...filter, [key]: value });
  const all = <option value="all">{t('player.filter_all')}</option>;

  const monthLabel = (month: string) => {
    const [year, mm] = month.split('-').map(Number);
    return lang === 'zh'
      ? `${year} 年 ${mm} 月`
      : new Date(Date.UTC(year, mm - 1, 1)).toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
  };
  const choice = (key: TranslationKey, value: string) => <option value={value}>{t(key)}</option>;

  return (
    <div
      role="group"
      aria-label={t('player.filter_label')}
      className="flex flex-wrap items-center gap-x-3 gap-y-2"
    >
      {options.hasPostseason && (
        <FilterSelect
          label={t('player.filter_game_type')}
          value={filter.gameType}
          onChange={(v) => set('gameType', v as GameLogFilter['gameType'])}
        >
          {all}
          {choice('player.filter_regular', 'regular')}
          {choice('player.filter_postseason', 'postseason')}
        </FilterSelect>
      )}
      {options.levels.length > 1 && (
        <FilterSelect
          label={t('player.level')}
          value={String(filter.level)}
          onChange={(v) => set('level', v === 'all' ? 'all' : Number(v))}
        >
          {all}
          {options.levels.map((l) => (
            <option key={l.id} value={l.id}>
              {l.abbreviation}
            </option>
          ))}
        </FilterSelect>
      )}
      <FilterSelect
        label={t('player.filter_venue')}
        value={filter.venue}
        onChange={(v) => set('venue', v as GameLogFilter['venue'])}
      >
        {all}
        {choice('player.filter_home', 'home')}
        {choice('player.filter_away', 'away')}
      </FilterSelect>
      {options.opponents.length > 1 && (
        <FilterSelect
          label={t('player.filter_opponent')}
          value={String(filter.opponentId)}
          onChange={(v) => set('opponentId', v === 'all' ? 'all' : Number(v))}
        >
          {all}
          {options.opponents.map((o) => (
            <option key={o.id} value={o.id}>
              {teamDisplayName(o.id, lang, o.name)}
            </option>
          ))}
        </FilterSelect>
      )}
      {options.months.length > 1 && (
        <FilterSelect label={t('player.filter_month')} value={filter.month} onChange={(v) => set('month', v)}>
          {all}
          {options.months.map((m) => (
            <option key={m} value={m}>
              {monthLabel(m)}
            </option>
          ))}
        </FilterSelect>
      )}
      {isFilterActive(filter) && (
        <button
          type="button"
          onClick={() => onChange(DEFAULT_GAME_LOG_FILTER)}
          className="flex items-center gap-1 text-[11px] font-semibold text-muted hover:text-main shrink-0"
        >
          <X className="w-3.5 h-3.5" />
          {t('player.filter_clear')}
        </button>
      )}
    </div>
  );
};
