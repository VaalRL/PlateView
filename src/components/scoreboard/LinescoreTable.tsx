import React from 'react';
import { Linescore } from '../../types/mlb';
import { useLanguage } from '../../hooks/useLanguage';

interface LinescoreTableProps {
  linescore: Linescore;
  awayAbbrev: string;
  homeAbbrev: string;
  /** Falls back to the schedule score when linescore totals are absent */
  awayScore?: number;
  homeScore?: number;
  isLive?: boolean;
}

/** Inning-by-inning line score with R/H/E, shared by the scoreboard card and game page. */
export const LinescoreTable: React.FC<LinescoreTableProps> = ({
  linescore,
  awayAbbrev,
  homeAbbrev,
  awayScore,
  homeScore,
  isLive = false,
}) => {
  const { t } = useLanguage();
  const innings = linescore.innings || [];

  if (innings.length === 0) return null;

  return (
    <div className="overflow-x-auto pb-1 bg-page/40 p-2.5 rounded-xl border border-border/40">
      <table className="w-full text-center text-xs font-mono">
        <thead>
          <tr className="text-muted border-b border-border/50 text-[10px]">
            <th className="text-left font-normal py-1 pr-2">{t('sb.team')}</th>
            {innings.map((inn) => (
              <th
                key={inn.num}
                className={`font-normal px-1.5 py-1 ${
                  isLive && inn.num === linescore.currentInning ? 'text-red-400 font-bold' : ''
                }`}
              >
                {inn.num}
              </th>
            ))}
            <th className="font-bold px-2 py-1 text-main border-l border-border/30">R</th>
            <th className="font-normal px-1.5 py-1">H</th>
            <th className="font-normal px-1.5 py-1">E</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30 text-[11px]">
          <tr>
            <td className="text-left py-1 pr-2 font-semibold text-muted">{awayAbbrev}</td>
            {innings.map((inn) => (
              <td key={inn.num} className="px-1.5 py-1">
                {inn.away.runs ?? '-'}
              </td>
            ))}
            <td className="font-bold px-2 py-1 text-main border-l border-border/30">
              {linescore.teams?.away.runs ?? awayScore ?? 0}
            </td>
            <td className="px-1.5 py-1 text-muted">{linescore.teams?.away.hits ?? '-'}</td>
            <td className="px-1.5 py-1 text-muted">{linescore.teams?.away.errors ?? '-'}</td>
          </tr>
          <tr>
            <td className="text-left py-1 pr-2 font-semibold text-muted">{homeAbbrev}</td>
            {innings.map((inn) => (
              <td key={inn.num} className="px-1.5 py-1">
                {inn.home.runs ?? '-'}
              </td>
            ))}
            <td className="font-bold px-2 py-1 text-main border-l border-border/30">
              {linescore.teams?.home.runs ?? homeScore ?? 0}
            </td>
            <td className="px-1.5 py-1 text-muted">{linescore.teams?.home.hits ?? '-'}</td>
            <td className="px-1.5 py-1 text-muted">{linescore.teams?.home.errors ?? '-'}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
