import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Columns3, X } from 'lucide-react';
import { useTeamsPreviousGameQueries } from '../services/queries';
import { getTeamLogoUrl } from '../services/mlbApi';
import { useLanguage } from '../hooks/useLanguage';
import { CompareTabs } from '../components/compare/CompareTabs';
import { PlayerHoverCard } from '../components/common/PlayerHoverCard';
import { TeamHoverCard } from '../components/common/TeamHoverCard';
import { teamResult } from '../utils/gameStatus';
import { bestIndexes } from '../utils/comparison';
import { teamDisplayName, teamsById } from '../utils/teams';
import {
  DEFENSE_POSITIONS,
  MAX_COMPARED_TEAMS,
  addTeamToComparison,
  lineupOps,
  loadTeamComparison,
  parseCompareTeamIds,
  saveTeamComparison,
  startingDefense,
  startingLineup,
  teamSide,
  type DefensePosition,
  type Starter,
} from '../utils/teamComparison';

import type { GameSchedule } from '../types/mlb';
import type { TranslationKey } from '../i18n/translations';
import { zhNameOf } from '../utils/players';

type View = 'offense' | 'defense';

/** ".850" style, as box scores print it */
const formatOps = (n: number | null) => (n === null ? '—' : n.toFixed(3).replace(/^0/, ''));

/** A club's column, or why it has none yet */
type Column =
  | { state: 'loading' | 'error' | 'none'; teamId: number }
  | { state: 'ready'; teamId: number; game: GameSchedule; lineup: Starter[]; defense: ReturnType<typeof startingDefense> };

/**
 * Up to four clubs side by side: who started where in each one's last
 * completed game. The list lives in the URL (`?teams=119,147`) and in
 * storage, like the player comparison.
 */
export const TeamComparePage: React.FC = () => {
  const { lang, t } = useLanguage();
  const [params, setParams] = useSearchParams();
  const ids = useMemo(() => parseCompareTeamIds(params.get('teams')), [params]);
  const setIds = (next: number[]) => setParams({ teams: next.join(',') }, { replace: true });

  // Opened without a list (a bookmark, or the tab link while already here):
  // pick up the last one. An emptied list keeps its empty `teams=`
  useEffect(() => {
    if (!params.has('teams')) {
      const stored = loadTeamComparison();
      if (stored.length > 0) setParams({ teams: stored.join(',') }, { replace: true });
    }
  }, [params, setParams]);
  useEffect(() => {
    if (params.has('teams')) saveTeamComparison(ids);
  }, [ids, params]);

  const results = useTeamsPreviousGameQueries(ids);
  const columns: Column[] = ids.map((teamId, i) => {
    const r = results[i];
    if (!r || r.isLoading) return { state: 'loading', teamId };
    if (r.isError) return { state: 'error', teamId };
    const side = r.data ? teamSide(r.data.boxscore, teamId) : null;
    if (!r.data || !side) return { state: 'none', teamId };
    const lineup = startingLineup(side);
    return { state: 'ready', teamId, game: r.data.game, lineup, defense: startingDefense(side, lineup) };
  });

  const [view, setView] = useState<View>('offense');
  const name = (id: number) => teamDisplayName(id, lang) ?? String(id);
  const choices = [...teamsById.values()]
    .filter((team) => !ids.includes(team.id))
    .sort((a, b) => name(a.id).localeCompare(name(b.id), lang === 'zh' ? 'zh-Hant' : 'en'));
  const full = ids.length >= MAX_COMPARED_TEAMS;

  /** The starter a row shows for a column, if the column has loaded */
  const starterAt = (c: Column, row: number | string): Starter | undefined => {
    if (c.state !== 'ready') return undefined;
    return typeof row === 'number' ? c.lineup.find((s) => s.slot === row) : c.defense[row as DefensePosition];
  };

  const rows: { key: string; label: string; starters: (Starter | undefined)[]; best: Set<number> }[] =
    view === 'offense'
      ? [1, 2, 3, 4, 5, 6, 7, 8, 9].map((slot) => {
          const starters = columns.map((c) => starterAt(c, slot));
          const ops = starters.map((s) => (s?.ops ? parseFloat(s.ops) : null));
          return { key: `slot-${slot}`, label: t('compare_teams.slot', { n: slot }), starters, best: bestIndexes(ops, 'high') };
        })
      : DEFENSE_POSITIONS.map((pos) => {
          const starters = columns.map((c) => starterAt(c, pos));
          const era = starters.map((s) => (pos === 'P' && s?.era ? parseFloat(s.era) : null));
          return {
            key: pos,
            label: t(`compare_teams.pos.${pos}` as TranslationKey),
            starters,
            best: bestIndexes(era, 'low'),
          };
        });

  const meanOps = columns.map((c) => (c.state === 'ready' ? lineupOps(c.lineup) : null));
  const bestMean = bestIndexes(meanOps, 'high');

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">
      <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-main transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>{t('team.back')}</span>
      </Link>

      <CompareTabs />

      <div className="space-y-1.5">
        <h1 className="text-2xl font-extrabold text-main flex items-center gap-2">
          <Columns3 className="w-6 h-6 text-team-primary" />
          {t('compare_teams.title')}
        </h1>
        <p className="text-sm text-muted">{t('compare_teams.subtitle')}</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <select
          value=""
          disabled={full}
          onChange={(e) => e.target.value && setIds(addTeamToComparison(ids, Number(e.target.value)))}
          aria-label={t('compare_teams.add')}
          className="w-full max-w-xs rounded-xl border border-border bg-card px-3 py-2 text-sm text-main focus:outline-none focus:border-team-primary disabled:cursor-not-allowed disabled:text-muted"
        >
          <option value="">{full ? t('compare_teams.full') : t('compare_teams.add')}</option>
          {choices.map((team) => (
            <option key={team.id} value={team.id}>
              {name(team.id)}
            </option>
          ))}
        </select>
        <div role="group" aria-label={t('compare_teams.view_label')} className="flex p-1 bg-card border border-border rounded-lg text-xs font-semibold">
          {(['offense', 'defense'] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={`px-3 py-1 rounded-md transition-colors ${
                view === v ? 'bg-team-primary text-white shadow-sm' : 'text-muted hover:text-main'
              }`}
            >
              {t(v === 'offense' ? 'compare_teams.offense' : 'compare_teams.defense')}
            </button>
          ))}
        </div>
      </div>

      {ids.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-8 text-center text-sm text-muted">{t('compare_teams.empty')}</div>
      ) : (
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="sticky left-0 z-10 bg-card w-24 min-w-[72px]" />
                {columns.map((c) => (
                  <th key={c.teamId} scope="col" className="px-3 py-3 align-top min-w-[160px]">
                    <div className="flex flex-col items-center gap-1.5 text-center">
                      <div className="relative">
                        <img src={getTeamLogoUrl(c.teamId)} alt="" className="w-10 h-10 object-contain" />
                        <button
                          type="button"
                          onClick={() => setIds(ids.filter((id) => id !== c.teamId))}
                          aria-label={t('compare_teams.remove', { name: name(c.teamId) })}
                          className="absolute -top-1 -right-3 w-5 h-5 rounded-full bg-page border border-border text-muted hover:text-rose-500 flex items-center justify-center"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <TeamHoverCard teamId={c.teamId}>
                        <Link to={`/teams/${c.teamId}`} className="font-bold text-main hover:text-team-primary leading-tight">
                          {name(c.teamId)}
                        </Link>
                      </TeamHoverCard>
                      <GameLine column={c} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {rows.map((r) => (
                <tr key={r.key}>
                  <th scope="row" className="sticky left-0 z-10 bg-card text-left text-xs font-medium text-muted px-3 py-2 whitespace-nowrap">
                    {r.label}
                  </th>
                  {columns.map((c, i) => (
                    <td
                      key={c.teamId}
                      className={`px-3 py-2 text-center align-top ${best(r.best, i)}`}
                    >
                      <StarterCell column={c} starter={r.starters[i]} view={view} />
                    </td>
                  ))}
                </tr>
              ))}
              {view === 'offense' && (
                <tr className="border-t border-border">
                  <th scope="row" className="sticky left-0 z-10 bg-card text-left text-xs font-medium text-muted px-3 py-2 whitespace-nowrap">
                    {t('compare_teams.lineup_ops')}
                  </th>
                  {columns.map((c, i) => (
                    <td key={c.teamId} className={`px-3 py-2 text-center font-mono ${best(bestMean, i) || 'text-main'}`}>
                      {c.state === 'ready' ? formatOps(meanOps[i]) : ''}
                    </td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
          <p className="px-3 py-2 text-[11px] text-muted border-t border-border/40">
            {t(view === 'offense' ? 'compare_teams.offense_note' : 'compare_teams.defense_note')}
          </p>
        </div>
      )}
    </div>
  );
};

const best = (set: Set<number>, i: number) => (set.has(i) ? 'text-team-primary bg-team-primary/10' : '');

/** Date, opponent and result of the game the column is read from, linked to it */
const GameLine: React.FC<{ column: Column }> = ({ column }) => {
  const { t } = useLanguage();
  if (column.state === 'loading') return <span className="h-4 w-24 rounded bg-page animate-pulse" />;
  if (column.state === 'error') return <span className="text-[11px] font-normal text-rose-500">{t('compare_teams.error')}</span>;
  if (column.state !== 'ready') return <span className="text-[11px] font-normal text-muted">{t('compare_teams.no_game')}</span>;

  const { game, teamId } = column;
  const isHome = game.teams.home.team.id === teamId;
  const mine = isHome ? game.teams.home : game.teams.away;
  const theirs = isHome ? game.teams.away : game.teams.home;
  const opponent = teamsById.get(theirs.team.id)?.abbrev ?? theirs.team.name;
  const [year, month, day] = game.officialDate.split('-').map(Number);
  const date = year === new Date().getFullYear() ? `${month}/${day}` : `${year}/${month}/${day}`;
  const result = teamResult(game, teamId);

  return (
    <Link to={`/games/${game.gamePk}`} className="text-[11px] font-normal text-muted hover:text-team-primary">
      {t('compare_teams.previous')} {date} {isHome ? 'vs' : '@'} {opponent}{' '}
      <span className={result === 'W' ? 'font-bold text-emerald-500' : result === 'L' ? 'font-bold text-rose-500' : ''}>
        {result ?? ''} {mine.score}-{theirs.score}
      </span>
    </Link>
  );
};

/** One starter: his name, and the line that row compares */
const StarterCell: React.FC<{ column: Column; starter?: Starter; view: View }> = ({ column, starter, view }) => {
  const { lang, t } = useLanguage();
  if (column.state === 'loading') return <span className="inline-block h-8 w-24 rounded bg-page animate-pulse" />;
  if (!starter) return <span className="text-muted">{column.state === 'ready' ? '—' : ''}</span>;

  const zh = lang === 'zh' ? zhNameOf(starter.personId) : undefined;
  let line: string;
  if (view === 'offense') {
    line = [starter.position, starter.avg && `AVG ${starter.avg}`, starter.ops && `OPS ${starter.ops}`, starter.homeRuns !== undefined && `HR ${starter.homeRuns}`]
      .filter(Boolean)
      .join(' · ');
  } else if (starter.position === 'P') {
    line = [starter.era && `ERA ${starter.era}`, starter.wins !== undefined && `${starter.wins}-${starter.losses ?? 0}`]
      .filter(Boolean)
      .join(' · ');
  } else if (starter.position === 'DH') {
    line = starter.ops ? `OPS ${starter.ops}` : '';
  } else {
    line = starter.fieldingPct ? t('compare_teams.fielding', { pct: starter.fieldingPct, errors: starter.errors ?? 0 }) : '';
  }

  return (
    <div className="flex flex-col items-center gap-0.5">
      <PlayerHoverCard personId={starter.personId}>
        <Link to={`/players/${starter.personId}`} className="font-semibold text-main hover:text-team-primary leading-tight">
          {starter.fullName}
        </Link>
      </PlayerHoverCard>
      {zh && (
        <span className="text-xs font-semibold text-main/80">{zh}</span>
      )}
      {line && <span className="text-[11px] font-mono text-muted whitespace-nowrap">{line}</span>}
    </div>
  );
};
