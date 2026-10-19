import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Columns3, X } from 'lucide-react';
import { useComparisonPlayersQuery } from '../services/queries';
import { getPlayerHeadshotUrl } from '../services/mlbApi';
import { useLanguage } from '../hooks/useLanguage';
import { ComparePlayerPicker } from '../components/compare/ComparePlayerPicker';
import { PlayerHoverCard } from '../components/common/PlayerHoverCard';
import { getCurrentMlbSeason } from '../utils/season';
import { teamDisplayName } from '../utils/teams';
import {
  COMPARE_ROWS,
  MAX_COMPARED,
  addToComparison,
  bestColumns,
  compareValue,
  defaultCompareGroup,
  hasGroupLine,
  loadComparison,
  parseCompareIds,
  saveComparison,
  type CompareGroup,
} from '../utils/comparison';
import type { PlayerStatGroup } from '../utils/playerLevels';
import playersData from '../data/players-zh-tw.json';

const zhNames = new Map(playersData.map((p) => [p.id, p.nameZh]));

/**
 * Up to four big leaguers side by side for this season, the best value of
 * each row marked. The list lives in the URL (`?players=1,2,3`), so a
 * comparison can be shared, and in storage, so the player page can add to it.
 */
export const ComparePage: React.FC = () => {
  const { lang, t } = useLanguage();
  const [params, setParams] = useSearchParams();
  const ids = useMemo(() => parseCompareIds(params.get('players')), [params]);
  const setIds = (next: number[]) => setParams({ players: next.join(',') }, { replace: true });

  // Opened without a list (from a bookmark or the menu): pick up the last one
  useEffect(() => {
    if (!params.has('players')) {
      const stored = loadComparison();
      if (stored.length > 0) setParams({ players: stored.join(',') }, { replace: true });
    }
    // Only on arrival; afterwards the URL is the source
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (params.has('players')) saveComparison(ids);
  }, [ids, params]);

  const season = getCurrentMlbSeason();
  const { data, isLoading, isError } = useComparisonPlayersQuery(ids, season);
  const people = useMemo(() => {
    const byId = new Map((data?.people ?? []).map((p) => [p.id, p]));
    return ids.map((id) => byId.get(id)).filter((p): p is NonNullable<typeof p> => !!p);
  }, [data, ids]);

  const [groupChoice, setGroupChoice] = useState<CompareGroup | null>(null);
  const group = groupChoice ?? defaultCompareGroup(people.map((p) => p.primaryPosition?.type));
  const rows = COMPARE_ROWS[group];
  const statsOf = (p: (typeof people)[number]) => p.stats as PlayerStatGroup[] | undefined;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">
      <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-main transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>{t('team.back')}</span>
      </Link>

      <div className="space-y-1.5">
        <h1 className="text-2xl font-extrabold text-main flex items-center gap-2">
          <Columns3 className="w-6 h-6 text-team-primary" />
          {t('compare.title')}
        </h1>
        <p className="text-sm text-muted">{t('compare.subtitle', { season })}</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <ComparePlayerPicker selected={ids} full={ids.length >= MAX_COMPARED} onAdd={(id) => setIds(addToComparison(ids, id))} />
        <div role="group" aria-label={t('compare.group_label')} className="flex p-1 bg-card border border-border rounded-lg text-xs font-semibold">
          {(['hitting', 'pitching'] as const).map((g) => (
            <button
              key={g}
              type="button"
              aria-pressed={group === g}
              onClick={() => setGroupChoice(g)}
              className={`px-3 py-1 rounded-md transition-colors ${
                group === g ? 'bg-team-primary text-white shadow-sm' : 'text-muted hover:text-main'
              }`}
            >
              {t(g === 'hitting' ? 'compare.hitting' : 'compare.pitching')}
            </button>
          ))}
        </div>
      </div>

      {ids.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-8 text-center text-sm text-muted">
          {t('compare.empty')}
        </div>
      ) : isError ? (
        <div className="bg-card border border-border rounded-2xl p-8 text-center text-sm text-rose-500">
          {t('compare.error')}
        </div>
      ) : isLoading ? (
        <div className="bg-card border border-border rounded-2xl h-96 animate-pulse" />
      ) : (
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="sticky left-0 bg-card text-left text-xs font-medium text-muted px-3 py-3 min-w-[84px]">
                  {t('compare.stat')}
                </th>
                {people.map((p) => {
                  const zh = lang === 'zh' ? zhNames.get(p.id) : undefined;
                  const team = teamDisplayName(p.currentTeam?.id, lang, p.currentTeam?.name);
                  return (
                    <th key={p.id} scope="col" className="px-3 py-3 align-top min-w-[132px]">
                      <div className="flex flex-col items-center gap-1.5 text-center">
                        <div className="relative">
                          <img
                            src={getPlayerHeadshotUrl(p.id)}
                            alt=""
                            className="w-12 h-12 rounded-full bg-page object-cover border border-border"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.visibility = 'hidden';
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setIds(ids.filter((id) => id !== p.id))}
                            aria-label={t('compare.remove', { name: p.fullName })}
                            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-page border border-border text-muted hover:text-rose-500 flex items-center justify-center"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <PlayerHoverCard personId={p.id}>
                          <Link to={`/players/${p.id}`} className="font-bold text-main hover:text-team-primary leading-tight">
                            {p.fullName}
                          </Link>
                        </PlayerHoverCard>
                        {zh && <span className="text-xs font-semibold text-main/80">{zh}</span>}
                        <span className="text-[11px] font-normal text-muted">
                          {[p.primaryPosition?.abbreviation, team].filter(Boolean).join(' · ')}
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {rows.map((r) => {
                const values = people.map((p) => (hasGroupLine(statsOf(p), group) ? compareValue(statsOf(p), group, r) : undefined));
                const best = bestColumns(values, r);
                return (
                  <tr key={r.key}>
                    <th scope="row" className="sticky left-0 bg-card text-left text-xs font-medium text-muted px-3 py-2 whitespace-nowrap">
                      {r.label[lang]}
                    </th>
                    {values.map((v, i) => (
                      <td
                        key={people[i].id}
                        className={`px-3 py-2 text-center font-mono ${
                          best.has(i) ? 'font-black text-team-primary bg-team-primary/10' : 'text-main'
                        }`}
                      >
                        {hasGroupLine(statsOf(people[i]), group) ? r.format(v) : '—'}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {people.some((p) => !hasGroupLine(statsOf(p), group)) && (
            <p className="px-3 py-2 text-[11px] text-muted border-t border-border/40">{t('compare.no_line')}</p>
          )}
        </div>
      )}
    </div>
  );
};
