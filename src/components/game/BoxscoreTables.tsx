import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../hooks/useLanguage';
import { BoxscoreTeamSide } from '../../types/mlb';
import { getPitchingDecisions, formatDecisionRecord } from '../../utils/statsFormatters';
import { DECISION_ACCENT } from '../../constants/gameStatus';

interface TableProps {
  teamBox: BoxscoreTeamSide;
  title: string;
  /** Cap the rows rendered; the collapsed panel uses it, the full page does not */
  limit?: number;
}

/**
 * Batting and pitching tables for the game detail page. `limit` exists for any
 * caller that needs a condensed view; the page itself renders every row.
 */
export const BattingTable: React.FC<TableProps> = ({ teamBox, title, limit }) => {
  const { lang, t } = useLanguage();
  const batterIds: number[] = teamBox?.batters || [];
  const players = teamBox?.players || {};
  const visibleIds = limit ? batterIds.slice(0, limit) : batterIds;

  return (
    <div className="space-y-2">
      <div className="font-bold text-xs text-main border-b border-border/40 pb-1 flex justify-between items-center">
        <span>
          {title} - {t('team.boxscore_batting')}
        </span>
        <span className="text-[10px] text-muted font-mono">
          {teamBox?.teamStats?.batting?.hits ?? 0} H &bull;{' '}
          {teamBox?.teamStats?.batting?.homeRuns ?? 0} HR &bull;{' '}
          {teamBox?.teamStats?.batting?.rbi ?? 0} RBI
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[11px] font-mono text-left">
          <thead>
            <tr className="text-muted border-b border-border/30 text-[10px]">
              <th className="py-1 font-medium">{lang === 'zh' ? '打者' : 'Batter'}</th>
              <th className="py-1 text-center font-medium">AB</th>
              <th className="py-1 text-center font-medium">R</th>
              <th className="py-1 text-center font-medium">H</th>
              <th className="py-1 text-center font-medium">RBI</th>
              <th className="py-1 text-center font-medium">BB</th>
              <th className="py-1 text-center font-medium">SO</th>
              <th className="py-1 text-center font-medium" title={lang === 'zh' ? '殘壘' : 'Left on base'}>
                LOB
              </th>
              <th className="py-1 text-right font-medium">AVG</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {visibleIds.map((bId) => {
              const p = players['ID' + bId];
              if (!p) return null;
              const s = p.stats?.batting;
              if (!s || s.atBats === undefined) return null;

              const personId = p.person?.id || bId;
              const displayName = p.person?.fullName;

              // Headline events beside the name, rather than more columns in an
              // already wide table. Doubles and triples stay out of it: "2B"
              // and "3B" are also position abbreviations, and a second baseman
              // who doubled would read "2B 2B". MLB's own `info` notes, shown
              // under the box tab, already list them by player.
              const extras: string[] = (
                [
                  [s.homeRuns, 'HR'],
                  [s.stolenBases, 'SB'],
                ] as Array<[number | undefined, string]>
              )
                .filter(([count]) => Number(count ?? 0) > 0)
                .map(([count, label]) => (Number(count) > 1 ? `${label}x${count}` : label));

              return (
                <tr key={bId} className="hover:bg-card-hover/40 group">
                  <td className="py-1 font-sans font-medium text-main truncate max-w-[150px]">
                    <Link
                      to={`/players/${personId}`}
                      className="hover:text-team-primary hover:underline transition-colors inline-flex items-center gap-1 group-hover:text-team-primary"
                      title={p.person?.fullName}
                    >
                      <span className="truncate">{displayName}</span>
                      <span className="text-[9px] text-muted font-mono">
                        {p.position?.abbreviation}
                      </span>
                    </Link>
                    {!!extras.length && (
                      <span className="ml-1 text-[9px] font-bold text-team-primary font-mono">
                        {extras.join(' ')}
                      </span>
                    )}
                  </td>
                  <td className="py-1 text-center">{s.atBats}</td>
                  <td className="py-1 text-center">{s.runs}</td>
                  <td className="py-1 text-center font-bold text-team-primary">{s.hits}</td>
                  <td className="py-1 text-center">{s.rbi}</td>
                  <td className="py-1 text-center">{s.baseOnBalls}</td>
                  <td className="py-1 text-center">{s.strikeOuts}</td>
                  <td className="py-1 text-center text-muted">{s.leftOnBase ?? '-'}</td>
                  {/* Rate stats only exist under seasonStats in the boxscore API */}
                  <td className="py-1 text-right text-muted">{p.seasonStats?.batting?.avg ?? '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const PitchingTable: React.FC<TableProps> = ({ teamBox, title }) => {
  const { lang, t } = useLanguage();
  const pitcherIds: number[] = teamBox?.pitchers || [];
  const players = teamBox?.players || {};

  return (
    <div className="space-y-2">
      <div className="font-bold text-xs text-main border-b border-border/40 pb-1 flex justify-between items-center">
        <span>
          {title} - {t('team.boxscore_pitching')}
        </span>
        <span className="text-[10px] text-muted font-mono">
          {teamBox?.teamStats?.pitching?.inningsPitched ?? '0.0'} IP &bull;{' '}
          {teamBox?.teamStats?.pitching?.strikeOuts ?? 0} K &bull;{' '}
          {teamBox?.teamStats?.pitching?.era ?? '0.00'} ERA
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[11px] font-mono text-left">
          <thead>
            <tr className="text-muted border-b border-border/30 text-[10px]">
              <th className="py-1 font-medium">{lang === 'zh' ? '投手' : 'Pitcher'}</th>
              <th className="py-1 text-center font-medium">IP</th>
              <th className="py-1 text-center font-medium">H</th>
              <th className="py-1 text-center font-medium">R</th>
              <th className="py-1 text-center font-medium">ER</th>
              <th className="py-1 text-center font-medium">HR</th>
              <th className="py-1 text-center font-medium">BB</th>
              <th className="py-1 text-center font-medium">SO</th>
              <th className="py-1 text-center font-medium" title={lang === 'zh' ? '總球數-好球數' : 'Pitches-Strikes'}>
                P-S
              </th>
              <th className="py-1 text-center font-medium" title={lang === 'zh' ? '面對打者數' : 'Batters faced'}>
                BF
              </th>
              <th className="py-1 text-right font-medium">ERA</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {pitcherIds.map((pId) => {
              const p = players['ID' + pId];
              if (!p) return null;
              const s = p.stats?.pitching;
              if (!s || s.inningsPitched === undefined) return null;

              const personId = p.person?.id || pId;
              const displayName = p.person?.fullName;

              // A single outing can earn more than one: a blown save and then
              // the win both land on the same reliever
              const decisions = getPitchingDecisions(s);
              const seasonPitching = p.seasonStats?.pitching;
              const inherited = Number(s.inheritedRunners ?? 0);

              return (
                <tr key={pId} className="hover:bg-card-hover/40 group align-top">
                  <td className="py-1 font-sans font-medium text-main max-w-[150px]">
                    <span className="flex flex-wrap items-center gap-1">
                      <Link
                        to={`/players/${personId}`}
                        className="hover:text-team-primary hover:underline transition-colors truncate max-w-[110px] group-hover:text-team-primary"
                        title={p.person?.fullName}
                      >
                        {displayName}
                      </Link>
                      {decisions.map((decision) => {
                        const record = formatDecisionRecord(decision, seasonPitching);
                        return (
                          <span
                            key={decision}
                            className={`shrink-0 text-[9px] font-bold px-1 py-px rounded border ${
                              DECISION_ACCENT[decision] ?? 'border-border text-muted'
                            }`}
                          >
                            {record ? `${decision} (${record})` : decision}
                          </span>
                        );
                      })}
                    </span>
                    {inherited > 0 && (
                      <span
                        className="block text-[9px] text-muted"
                        title={lang === 'zh' ? '繼承跑者－其中回本壘得分' : 'Inherited runners-scored'}
                      >
                        IR {inherited}-{Number(s.inheritedRunnersScored ?? 0)}
                      </span>
                    )}
                  </td>
                  <td className="py-1 text-center font-semibold">{s.inningsPitched}</td>
                  <td className="py-1 text-center">{s.hits}</td>
                  <td className="py-1 text-center">{s.runs}</td>
                  <td className="py-1 text-center">{s.earnedRuns}</td>
                  <td className="py-1 text-center">{s.homeRuns ?? '-'}</td>
                  <td className="py-1 text-center">{s.baseOnBalls}</td>
                  <td className="py-1 text-center font-bold text-team-primary">{s.strikeOuts}</td>
                  <td className="py-1 text-center text-muted">
                    {s.numberOfPitches !== undefined && s.strikes !== undefined
                      ? `${s.numberOfPitches}-${s.strikes}`
                      : '-'}
                  </td>
                  <td className="py-1 text-center text-muted">{s.battersFaced ?? '-'}</td>
                  {/* Rate stats only exist under seasonStats in the boxscore API */}
                  <td className="py-1 text-right text-muted">{seasonPitching?.era ?? '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
