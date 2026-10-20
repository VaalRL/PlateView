import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../hooks/useLanguage';
import { teamDisplayName, teamsById } from '../../utils/teams';
import type { YearRow } from '../../utils/yearByYear';
import type { LevelSplit } from '../../utils/playerLevels';

type Stat = LevelSplit['stat'];

interface Column {
  zh: string;
  en: string;
  value: (stat: Stat) => React.ReactNode;
  /** The column the eye goes to first */
  key?: boolean;
}

const HITTING: Column[] = [
  { zh: '出賽', en: 'G', value: (s) => s?.gamesPlayed },
  { zh: '打數', en: 'AB', value: (s) => s?.atBats },
  { zh: '得分', en: 'R', value: (s) => s?.runs },
  { zh: '安打', en: 'H', value: (s) => s?.hits },
  { zh: '全壘打', en: 'HR', value: (s) => s?.homeRuns, key: true },
  { zh: '打點', en: 'RBI', value: (s) => s?.rbi },
  { zh: '盜壘', en: 'SB', value: (s) => s?.stolenBases },
  { zh: '保送', en: 'BB', value: (s) => s?.baseOnBalls },
  { zh: '三振', en: 'SO', value: (s) => s?.strikeOuts },
  { zh: 'AVG', en: 'AVG', value: (s) => s?.avg, key: true },
  { zh: 'OBP', en: 'OBP', value: (s) => s?.obp },
  { zh: 'OPS', en: 'OPS', value: (s) => s?.ops, key: true },
];

const PITCHING: Column[] = [
  { zh: '出賽', en: 'G', value: (s) => s?.gamesPlayed },
  { zh: '先發', en: 'GS', value: (s) => s?.gamesStarted },
  { zh: '勝', en: 'W', value: (s) => s?.wins },
  { zh: '敗', en: 'L', value: (s) => s?.losses },
  { zh: '救援', en: 'SV', value: (s) => s?.saves },
  { zh: '局數', en: 'IP', value: (s) => s?.inningsPitched },
  { zh: '被安打', en: 'H', value: (s) => s?.hits },
  { zh: '保送', en: 'BB', value: (s) => s?.baseOnBalls },
  { zh: '三振', en: 'SO', value: (s) => s?.strikeOuts, key: true },
  { zh: 'ERA', en: 'ERA', value: (s) => s?.era, key: true },
  { zh: 'WHIP', en: 'WHIP', value: (s) => s?.whip },
];

/** A big league club as its abbreviation with a link; any other club by name */
const TeamCell: React.FC<{ row: YearRow }> = ({ row }) => {
  const { lang, t } = useLanguage();
  if (row.numTeams) return <span className="font-sans font-semibold text-main">{t('player.years_teams', { count: row.numTeams })}</span>;
  const id = row.team?.id;
  const club = id !== undefined ? teamsById.get(id) : undefined;
  const name = teamDisplayName(id, lang, row.team?.name) ?? '—';
  if (!club) {
    return (
      <span className="font-sans block truncate max-w-[140px]" title={name}>
        {name}
      </span>
    );
  }
  return (
    <Link to={`/teams/${club.id}`} title={name} className="font-bold hover:text-team-primary hover:underline">
      {club.abbrev}
    </Link>
  );
};

interface Props {
  rows: YearRow[];
  career?: Stat;
  role: 'hitting' | 'pitching';
  isLoading: boolean;
  isError: boolean;
}

/**
 * A player's seasons at one level, newest first, under a career line. A
 * season split between clubs shows its total, then each club's part.
 */
export const YearByYearTable: React.FC<Props> = ({ rows, career, role, isLoading, isError }) => {
  const { lang, t } = useLanguage();
  const columns = role === 'pitching' ? PITCHING : HITTING;

  if (isError) {
    return <p className="bg-card border border-border rounded-2xl p-8 text-center text-sm text-rose-500">{t('player.years_error')}</p>;
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-x-auto shadow-sm">
      <table className="w-full text-xs text-left font-mono whitespace-nowrap">
        <thead>
          <tr className="border-b border-border text-muted text-[11px] bg-page/60">
            <th className="py-3 px-4 font-medium font-sans">{t('player.years_season')}</th>
            <th className="py-3 px-3 font-medium font-sans">{t('player.years_team')}</th>
            {columns.map((c) => (
              <th key={c.en} className="py-3 px-2 text-center font-medium">
                {lang === 'zh' ? c.zh : c.en}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {career && rows.length > 0 && (
            <tr className="bg-team-primary/10 font-bold text-main">
              <td colSpan={2} className="py-2.5 px-4 font-sans">
                {t('player.years_career')}
              </td>
              {columns.map((c) => (
                <td key={c.en} className={`py-2.5 px-2 text-center ${c.key ? 'text-team-primary' : ''}`}>
                  {c.value(career) ?? '—'}
                </td>
              ))}
            </tr>
          )}
          {rows.map((row, i) => (
            <tr
              key={`${row.season}-${row.team?.id ?? 'total'}-${i}`}
              className={row.isPart ? 'text-muted text-[11px]' : 'text-main hover:bg-card-hover/50 transition-colors'}
            >
              <td className={`py-2.5 px-4 font-semibold ${row.isPart ? 'invisible' : ''}`}>{row.season}</td>
              <td className={`py-2.5 px-3 ${row.isPart ? 'pl-6' : ''}`}>
                <TeamCell row={row} />
              </td>
              {columns.map((c) => (
                <td key={c.en} className={`py-2.5 px-2 text-center ${c.key && !row.isPart ? 'font-bold' : ''}`}>
                  {c.value(row.stat) ?? '—'}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length + 2} className="py-8 text-center text-muted font-sans">
                {isLoading ? '…' : t('player.years_empty')}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
