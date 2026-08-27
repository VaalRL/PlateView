import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { GameSchedule } from '../../types/mlb';
import { formatGameTime } from '../../utils/timezone';
import { getTeamLogoUrl } from '../../services/mlbApi';
import { BasesDiamond } from './BasesDiamond';
import { CountDisplay } from './CountDisplay';
import { useLanguage } from '../../hooks/useLanguage';
import teamsData from '../../data/teams.json';
import { ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

interface ScoreboardCardProps {
  game: GameSchedule;
}

export const ScoreboardCard: React.FC<ScoreboardCardProps> = ({ game }) => {
  const [showLinescore, setShowLinescore] = useState(false);
  const { lang, t } = useLanguage();
  const { status, teams, linescore } = game;
  
  const isLive = status.abstractGameState === 'Live';
  const isFinal = status.abstractGameState === 'Final';
  const isPostponed =
    status.detailedState?.toLowerCase().includes('postponed') ||
    status.detailedState?.toLowerCase().includes('delayed') ||
    status.detailedState?.toLowerCase().includes('suspended') ||
    status.statusCode === 'DO' ||
    status.statusCode === 'DR';
  const isPreview = status.abstractGameState === 'Preview' && !isPostponed;

  const awayTeamMeta = teamsData.find((t) => t.id === teams.away.team.id);
  const homeTeamMeta = teamsData.find((t) => t.id === teams.home.team.id);

  const awayName =
    lang === 'zh'
      ? awayTeamMeta?.nameZh || teams.away.team.name
      : awayTeamMeta?.name || teams.away.team.name;
  const homeName =
    lang === 'zh'
      ? homeTeamMeta?.nameZh || teams.home.team.name
      : homeTeamMeta?.name || teams.home.team.name;

  const hasFirstBase = !!linescore?.offense?.first;
  const hasSecondBase = !!linescore?.offense?.second;
  const hasThirdBase = !!linescore?.offense?.third;

  const isAwayWinning = (teams.away.score ?? 0) > (teams.home.score ?? 0);
  const isHomeWinning = (teams.home.score ?? 0) > (teams.away.score ?? 0);

  return (
    <div className={`bg-card border rounded-xl p-4 shadow-sm hover:shadow-md transition-all ${
      isLive ? 'border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.1)]' : 'border-border'
    }`}>
      {/* Header / Status Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-border text-xs">
        {isLive && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-red-500 font-bold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span>
                {linescore?.inningHalf === 'Top' ? '▲' : '▼'}{' '}
                {linescore?.currentInningOrdinal || `${linescore?.currentInning || ''}${lang === 'zh' ? '局' : ''}`}
              </span>
            </div>

            {/* Live Count Display */}
            <CountDisplay
              balls={linescore?.balls ?? 0}
              strikes={linescore?.strikes ?? 0}
              outs={linescore?.outs ?? 0}
            />
          </div>
        )}

        {isPostponed && (
          <div className="flex items-center gap-1 text-amber-500 font-semibold">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{status.detailedState || t('sb.postponed')}</span>
          </div>
        )}

        {isFinal && (
          <span className="font-semibold text-muted">
            {status.detailedState || t('sb.final')}
          </span>
        )}

        {isPreview && (
          <span className="font-semibold text-team-primary">
            {formatGameTime(game.gameDate)} ({t('sb.scheduled')})
          </span>
        )}

        {/* Live Diamond indicator or Venue */}
        {isLive ? (
          <BasesDiamond
            hasFirst={hasFirstBase}
            hasSecond={hasSecondBase}
            hasThird={hasThirdBase}
          />
        ) : (
          <span className="text-muted text-[11px] truncate max-w-[130px]" title={game.venue?.name}>
            {game.venue?.name}
          </span>
        )}
      </div>

      {/* Teams and Scores */}
      <div className="py-3 space-y-2.5">
        {/* Away Team */}
        <div className="flex items-center justify-between">
          <Link
            to={`/teams/${teams.away.team.id}`}
            className="flex items-center gap-2.5 hover:text-team-primary transition-colors flex-1"
          >
            <img
              src={getTeamLogoUrl(teams.away.team.id)}
              alt={awayName}
              className="w-6 h-6 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <span className={`text-sm ${isFinal && isAwayWinning ? 'font-black text-main' : 'font-semibold text-main'}`}>
              {awayName}
            </span>
            <span className="text-[11px] text-muted font-mono">
              ({teams.away.leagueRecord.wins}-{teams.away.leagueRecord.losses})
            </span>
          </Link>
          <span
            className={`text-lg font-mono px-2 ${
              isFinal && isAwayWinning
                ? 'font-black text-main'
                : isLive
                ? 'font-black text-main'
                : 'font-semibold text-muted'
            }`}
          >
            {teams.away.score !== undefined ? teams.away.score : '-'}
          </span>
        </div>

        {/* Home Team */}
        <div className="flex items-center justify-between">
          <Link
            to={`/teams/${teams.home.team.id}`}
            className="flex items-center gap-2.5 hover:text-team-primary transition-colors flex-1"
          >
            <img
              src={getTeamLogoUrl(teams.home.team.id)}
              alt={homeName}
              className="w-6 h-6 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <span className={`text-sm ${isFinal && isHomeWinning ? 'font-black text-main' : 'font-semibold text-main'}`}>
              {homeName}
            </span>
            <span className="text-[11px] text-muted font-mono">
              ({teams.home.leagueRecord.wins}-{teams.home.leagueRecord.losses})
            </span>
          </Link>
          <span
            className={`text-lg font-mono px-2 ${
              isFinal && isHomeWinning
                ? 'font-black text-main'
                : isLive
                ? 'font-black text-main'
                : 'font-semibold text-muted'
            }`}
          >
            {teams.home.score !== undefined ? teams.home.score : '-'}
          </span>
        </div>
      </div>

      {/* Live Batter / Pitcher Matchup */}
      {isLive && (linescore?.defense?.pitcher || linescore?.offense?.batter) && (
        <div className="pt-2 border-t border-border text-[11px] text-muted grid grid-cols-2 gap-2 bg-page/40 p-2 rounded-lg my-1">
          <div className="truncate">
            <span className="opacity-75">{t('sb.pitcher_short')}: </span>
            <span className="font-semibold text-main">
              {linescore.defense?.pitcher?.fullName || 'Pitcher'}
            </span>
          </div>
          <div className="truncate text-right">
            <span className="opacity-75">{t('sb.batter_short')}: </span>
            <span className="font-semibold text-main">
              {linescore.offense?.batter?.fullName || 'Batter'}
            </span>
          </div>
        </div>
      )}

      {/* Pitcher Preview */}
      {isPreview && (
        <div className="pt-2 border-t border-border text-[11px] text-muted grid grid-cols-2 gap-2">
          <div className="truncate">
            <span className="opacity-75">{t('sb.sp_away')}: </span>
            <span className="font-medium text-main">
              {teams.away.probablePitcher?.fullName || t('sb.tbd')}
            </span>
          </div>
          <div className="truncate text-right">
            <span className="opacity-75">{t('sb.sp_home')}: </span>
            <span className="font-medium text-main">
              {teams.home.probablePitcher?.fullName || t('sb.tbd')}
            </span>
          </div>
        </div>
      )}

      {/* Final Decision Pitchers */}
      {isFinal && game.decisions && (
        <div className="pt-2 border-t border-border text-[11px] text-muted flex flex-wrap gap-x-3 gap-y-1">
          {game.decisions.winner && (
            <span>
              <strong className="text-emerald-500 font-bold">{t('sb.win_short')}:</strong> {game.decisions.winner.fullName}
            </span>
          )}
          {game.decisions.loser && (
            <span>
              <strong className="text-rose-500 font-bold">{t('sb.loss_short')}:</strong> {game.decisions.loser.fullName}
            </span>
          )}
          {game.decisions.save && (
            <span>
              <strong className="text-amber-500 font-bold">{t('sb.save_short')}:</strong> {game.decisions.save.fullName}
            </span>
          )}
        </div>
      )}

      {/* Linescore Collapse / Expand */}
      {linescore && linescore.innings && linescore.innings.length > 0 && (
        <div className="pt-2 mt-2 border-t border-border">
          <button
            onClick={() => setShowLinescore(!showLinescore)}
            className="w-full flex items-center justify-center gap-1 text-[11px] text-muted hover:text-main transition-colors"
          >
            <span>{showLinescore ? t('sb.collapse_linescore') : t('sb.expand_linescore')}</span>
            {showLinescore ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {showLinescore && (
            <div className="mt-2 overflow-x-auto pb-1">
              <table className="w-full text-center text-xs font-mono">
                <thead>
                  <tr className="text-muted border-b border-border/50 text-[10px]">
                    <th className="text-left font-normal py-1 pr-2">{t('sb.team')}</th>
                    {linescore.innings.map((inn) => (
                      <th
                        key={inn.num}
                        className={`font-normal px-1.5 py-1 ${
                          isLive && inn.num === linescore.currentInning
                            ? 'text-red-400 font-bold'
                            : ''
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
                    <td className="text-left py-1 pr-2 font-semibold text-muted">
                      {awayTeamMeta?.abbrev || 'AWAY'}
                    </td>
                    {linescore.innings.map((inn) => (
                      <td key={inn.num} className="px-1.5 py-1">
                        {inn.away.runs ?? '-'}
                      </td>
                    ))}
                    <td className="font-bold px-2 py-1 text-main border-l border-border/30">
                      {linescore.teams?.away.runs ?? teams.away.score ?? 0}
                    </td>
                    <td className="px-1.5 py-1 text-muted">
                      {linescore.teams?.away.hits ?? '-'}
                    </td>
                    <td className="px-1.5 py-1 text-muted">
                      {linescore.teams?.away.errors ?? '-'}
                    </td>
                  </tr>
                  <tr>
                    <td className="text-left py-1 pr-2 font-semibold text-muted">
                      {homeTeamMeta?.abbrev || 'HOME'}
                    </td>
                    {linescore.innings.map((inn) => (
                      <td key={inn.num} className="px-1.5 py-1">
                        {inn.home.runs ?? '-'}
                      </td>
                    ))}
                    <td className="font-bold px-2 py-1 text-main border-l border-border/30">
                      {linescore.teams?.home.runs ?? teams.home.score ?? 0}
                    </td>
                    <td className="px-1.5 py-1 text-muted">
                      {linescore.teams?.home.hits ?? '-'}
                    </td>
                    <td className="px-1.5 py-1 text-muted">
                      {linescore.teams?.home.errors ?? '-'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
