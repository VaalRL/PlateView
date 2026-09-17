import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../hooks/useLanguage';
import { BoxscoreTeamSide } from '../../types/mlb';
import { buildLineup } from '../../utils/lineup';
import { ArrowRight } from 'lucide-react';

interface LineupOrderBoardProps {
  teamBox: BoxscoreTeamSide;
  teamName: string;
}

/**
 * The 1-9 batting order with each slot's substitution chain.
 *
 * A slot holds more than one player whenever a pinch hitter, pinch runner or
 * double switch came through it; MLB encodes that in the `battingOrder` suffix,
 * which `buildLineup()` unpacks into an ordered chain.
 */
export const LineupOrderBoard: React.FC<LineupOrderBoardProps> = ({ teamBox, teamName }) => {
  const { t } = useLanguage();
  const lineup = buildLineup(teamBox);

  if (lineup.length === 0) {
    return <div className="py-8 text-center text-xs text-muted">{t('game.lineup_empty')}</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-bold text-main">{teamName}</h3>
        <span className="text-[10px] text-muted">{t('game.lineup_note')}</span>
      </div>

      {/* Column header for the season rate stats on the right of each slot */}
      <div className="flex items-center justify-end px-2">
        <span className="font-mono text-[9px] text-muted tracking-wider">AVG / OPS</span>
      </div>

      <ol className="space-y-1.5">
        {lineup.map(({ slot, entries }) => {
          // Rate stats describe a season, never a single game, so the box score
          // carries them under seasonStats; show the player holding the slot now
          const current = entries[entries.length - 1];
          const avg = current?.seasonBattingStats?.avg ?? '-';
          const ops = current?.seasonBattingStats?.ops ?? '-';

          return (
            <li
              key={slot}
              className="flex items-start gap-2 rounded-lg px-2 py-1.5 bg-page/60 border border-border/40"
            >
              <span className="w-5 h-5 shrink-0 mt-0.5 rounded-md bg-team-primary text-white font-mono text-[11px] font-bold flex items-center justify-center">
                {slot}
              </span>
              <div className="min-w-0 flex-1 flex flex-wrap items-center gap-x-1.5 gap-y-1">
                {entries.map((entry, idx) => (
                  <React.Fragment key={entry.personId}>
                    {idx > 0 && <ArrowRight className="w-3 h-3 shrink-0 text-muted" />}
                    <Link
                      to={`/players/${entry.personId}`}
                      className="text-xs text-main hover:text-team-primary hover:underline truncate max-w-[150px]"
                      title={entry.fullName}
                    >
                      {entry.fullName}
                    </Link>
                    <span className="font-mono text-[10px] text-muted shrink-0">
                      {entry.allPositions.length > 1
                        ? entry.allPositions.join('-')
                        : entry.position || '-'}
                    </span>
                    {!entry.isStarter && (
                      <span className="shrink-0 text-[9px] font-bold px-1 py-px rounded bg-amber-500/15 text-amber-600 dark:text-amber-400">
                        {t('game.substitute_badge')}
                      </span>
                    )}
                  </React.Fragment>
                ))}
              </div>

              <div className="shrink-0 mt-0.5 text-right font-mono text-[10px] leading-tight">
                <span className="font-semibold text-main">{avg}</span>
                <span className="text-muted"> / {ops}</span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
};
