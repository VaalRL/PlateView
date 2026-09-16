import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GameSchedule } from '../../types/mlb';
import { formatBilingualGameTime } from '../../utils/timezone';
import { getTeamLogoUrl } from '../../services/mlbApi';
import { BasesDiamond } from './BasesDiamond';
import { CountDisplay } from './CountDisplay';
import { useLanguage } from '../../hooks/useLanguage';
import teamsData from '../../data/teams.json';
import playersData from '../../data/players-zh-tw.json';
import { ChevronRight, AlertCircle } from 'lucide-react';

interface ScoreboardCardProps {
  game: GameSchedule;
}

export const ScoreboardCard: React.FC<ScoreboardCardProps> = ({ game }) => {
  const navigate = useNavigate();
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

  const awayTeamMeta = teamsData.find((tItem) => tItem.id === teams.away.team.id);
  const homeTeamMeta = teamsData.find((tItem) => tItem.id === teams.home.team.id);

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

  const awayScore = teams.away.score;
  const homeScore = teams.home.score;

  const isAwayWinner = isFinal && (teams.away.isWinner || (awayScore ?? 0) > (homeScore ?? 0));
  const isHomeWinner = isFinal && (teams.home.isWinner || (homeScore ?? 0) > (awayScore ?? 0));

  const awayHits = linescore?.teams?.away.hits;
  const homeHits = linescore?.teams?.home.hits;
  const awayErrors = linescore?.teams?.away.errors;
  const homeErrors = linescore?.teams?.home.errors;

  const totalInnings = linescore?.innings?.length || 9;
  const isExtraInnings = isFinal && totalInnings > 9;

  const getPlayerDisplayName = (person?: { id?: number; fullName?: string }) => {
    if (!person?.fullName) return '';
    if (lang === 'zh' && person.id) {
      const zhMeta = playersData.find((p) => p.id === person.id);
      if (zhMeta?.nameZh) return zhMeta.nameZh;
    }
    return person.fullName;
  };

  /**
   * A game only has a detail page worth opening once it has started: before
   * first pitch there is no box score, no lineup and no alignment, and the
   * probable pitchers are already on this card.
   */
  const hasStarted = isLive || isFinal;

  const handleCardClick = () => {
    if (hasStarted) navigate(`/games/${game.gamePk}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`bg-card border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group/card ${
        hasStarted ? 'cursor-pointer hover:border-team-primary/60' : ''
      } ${
        isLive
          ? 'border-red-500/60 shadow-[0_0_16px_rgba(239,68,68,0.12)] ring-1 ring-red-500/30'
          : 'border-border'
      }`}
    >
      {/* 1. Header Bar: Game Status + Venue (MLB.com layout) */}
      <div className="flex items-center justify-between pb-2.5 border-b border-border text-xs">
        {isLive && (
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-500/15 text-red-500 font-black tracking-wider text-[11px] animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              {linescore?.inningHalf === 'Top' ? '▲' : '▼'}{' '}
              {linescore?.currentInningOrdinal || `${linescore?.currentInning || ''}${lang === 'zh' ? '局' : ''}`}
            </span>

            {/* Live Count */}
            <CountDisplay
              balls={linescore?.balls ?? 0}
              strikes={linescore?.strikes ?? 0}
              outs={linescore?.outs ?? 0}
            />
          </div>
        )}

        {isPostponed && (
          <div className="flex items-center gap-1 text-amber-500 font-bold">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{status.detailedState || t('sb.postponed')}</span>
          </div>
        )}

        {isFinal && (
          <div className="flex items-center gap-2">
            <span className="font-bold text-muted uppercase tracking-wider text-[11px]">
              {isExtraInnings ? `${t('sb.final')} / ${totalInnings}` : t('sb.final')}
            </span>
          </div>
        )}

        {isPreview && (
          <div className="flex items-center gap-1.5 font-bold text-team-primary text-[11px]">
            <span>{formatBilingualGameTime(game.gameDate, lang)}</span>
            <span className="text-muted font-normal">({t('sb.scheduled')})</span>
          </div>
        )}

        {/* Right side of Header: Bases Diamond if Live or Venue Name + Expand Indicator */}
        <div className="flex items-center gap-2">
          {isLive ? (
            <BasesDiamond
              hasFirst={hasFirstBase}
              hasSecond={hasSecondBase}
              hasThird={hasThirdBase}
            />
          ) : (
            <span
              className="text-muted text-[11px] truncate max-w-[140px] text-right font-sans opacity-80"
              title={game.venue?.name}
            >
              {game.venue?.name}
            </span>
          )}

          {hasStarted && (
            <span
              className="text-muted group-hover/card:text-team-primary transition-colors p-0.5"
              title={t('game.open_full_box')}
            >
              <ChevronRight className="w-3.5 h-3.5 opacity-60 group-hover/card:opacity-100" />
            </span>
          )}
        </div>
      </div>

      {/* 2. Main Scoreboard: 2 Rows with R / H / E table header (MLB.com official style) */}
      <div className="py-3">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-[10px] font-mono text-muted uppercase tracking-wider">
              <th className="text-left font-medium pb-1.5 pl-1">{t('sb.team')}</th>
              <th className="w-8 text-center font-bold text-main pb-1.5">{t('sb.runs_col')}</th>
              <th className="w-8 text-center font-medium text-muted pb-1.5">{t('sb.hits_col')}</th>
              <th className="w-8 text-center font-medium text-muted pb-1.5 pr-1">{t('sb.errors_col')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20 text-sm">
            {/* Away Team Row */}
            <tr className="group">
              <td className="py-2 pl-1">
                <Link
                  to={`/teams/${teams.away.team.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-2.5 hover:text-team-primary transition-colors"
                >
                  <img
                    src={getTeamLogoUrl(teams.away.team.id)}
                    alt={awayName}
                    className="w-6 h-6 object-contain shrink-0 drop-shadow-sm group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-2">
                    <span
                      className={`text-sm ${
                        isAwayWinner
                          ? 'font-black text-main'
                          : isFinal
                          ? 'font-medium text-muted'
                          : 'font-bold text-main'
                      }`}
                    >
                      {awayName}
                    </span>
                    <span className="text-[10px] text-muted font-mono">
                      ({teams.away.leagueRecord.wins}-{teams.away.leagueRecord.losses})
                    </span>
                  </div>
                </Link>
              </td>

              {/* Away Runs */}
              <td
                className={`text-center font-mono text-lg ${
                  isAwayWinner || (isLive && (awayScore ?? 0) > (homeScore ?? 0))
                    ? 'font-black text-main'
                    : isFinal
                    ? 'font-semibold text-muted'
                    : 'font-bold text-main'
                }`}
              >
                {awayScore !== undefined ? awayScore : '-'}
              </td>

              {/* Away Hits */}
              <td className="text-center font-mono text-xs text-muted">
                {awayHits !== undefined ? awayHits : '-'}
              </td>

              {/* Away Errors */}
              <td className="text-center font-mono text-xs text-muted pr-1">
                {awayErrors !== undefined ? awayErrors : '-'}
              </td>
            </tr>

            {/* Home Team Row */}
            <tr className="group">
              <td className="py-2 pl-1">
                <Link
                  to={`/teams/${teams.home.team.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-2.5 hover:text-team-primary transition-colors"
                >
                  <img
                    src={getTeamLogoUrl(teams.home.team.id)}
                    alt={homeName}
                    className="w-6 h-6 object-contain shrink-0 drop-shadow-sm group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-2">
                    <span
                      className={`text-sm ${
                        isHomeWinner
                          ? 'font-black text-main'
                          : isFinal
                          ? 'font-medium text-muted'
                          : 'font-bold text-main'
                      }`}
                    >
                      {homeName}
                    </span>
                    <span className="text-[10px] text-muted font-mono">
                      ({teams.home.leagueRecord.wins}-{teams.home.leagueRecord.losses})
                    </span>
                  </div>
                </Link>
              </td>

              {/* Home Runs */}
              <td
                className={`text-center font-mono text-lg ${
                  isHomeWinner || (isLive && (homeScore ?? 0) > (awayScore ?? 0))
                    ? 'font-black text-main'
                    : isFinal
                    ? 'font-semibold text-muted'
                    : 'font-bold text-main'
                }`}
              >
                {homeScore !== undefined ? homeScore : '-'}
              </td>

              {/* Home Hits */}
              <td className="text-center font-mono text-xs text-muted">
                {homeHits !== undefined ? homeHits : '-'}
              </td>

              {/* Home Errors */}
              <td className="text-center font-mono text-xs text-muted pr-1">
                {homeErrors !== undefined ? homeErrors : '-'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 3. Bottom Pitcher / Batter Decision Strip (MLB.com signature strip) */}
      {isLive && (linescore?.defense?.pitcher || linescore?.offense?.batter) && (
        <div className="pt-2 border-t border-border text-[11px] text-muted grid grid-cols-2 gap-2 bg-page/50 p-2 rounded-xl">
          <div className="truncate">
            <span className="text-[10px] font-bold text-team-primary uppercase mr-1">
              {t('sb.pitcher_short')}:
            </span>
            {linescore.defense?.pitcher?.id ? (
              <Link
                to={`/players/${linescore.defense.pitcher.id}`}
                onClick={(e) => e.stopPropagation()}
                className="font-semibold text-main hover:text-team-primary hover:underline transition-colors"
                title={linescore.defense.pitcher.fullName}
              >
                {getPlayerDisplayName(linescore.defense.pitcher)}
              </Link>
            ) : (
              <span className="font-semibold text-main">
                {linescore.defense?.pitcher?.fullName || 'Pitcher'}
              </span>
            )}
          </div>
          <div className="truncate text-right">
            <span className="text-[10px] font-bold text-team-primary uppercase mr-1">
              {t('sb.batter_short')}:
            </span>
            {linescore.offense?.batter?.id ? (
              <Link
                to={`/players/${linescore.offense.batter.id}`}
                onClick={(e) => e.stopPropagation()}
                className="font-semibold text-main hover:text-team-primary hover:underline transition-colors"
                title={linescore.offense.batter.fullName}
              >
                {getPlayerDisplayName(linescore.offense.batter)}
              </Link>
            ) : (
              <span className="font-semibold text-main">
                {linescore.offense?.batter?.fullName || 'Batter'}
              </span>
            )}
          </div>
        </div>
      )}

      {isPreview && (
        <div className="pt-2 border-t border-border text-[11px] text-muted grid grid-cols-2 gap-2 bg-page/30 p-2 rounded-xl">
          <div className="truncate">
            <span className="opacity-75">{t('sb.sp_away')}: </span>
            {teams.away.probablePitcher?.id ? (
              <Link
                to={`/players/${teams.away.probablePitcher.id}`}
                onClick={(e) => e.stopPropagation()}
                className="font-medium text-main hover:text-team-primary hover:underline transition-colors"
                title={teams.away.probablePitcher.fullName}
              >
                {getPlayerDisplayName(teams.away.probablePitcher)}
              </Link>
            ) : (
              <span className="font-medium text-main">
                {teams.away.probablePitcher?.fullName || t('sb.tbd')}
              </span>
            )}
          </div>
          <div className="truncate text-right">
            <span className="opacity-75">{t('sb.sp_home')}: </span>
            {teams.home.probablePitcher?.id ? (
              <Link
                to={`/players/${teams.home.probablePitcher.id}`}
                onClick={(e) => e.stopPropagation()}
                className="font-medium text-main hover:text-team-primary hover:underline transition-colors"
                title={teams.home.probablePitcher.fullName}
              >
                {getPlayerDisplayName(teams.home.probablePitcher)}
              </Link>
            ) : (
              <span className="font-medium text-main">
                {teams.home.probablePitcher?.fullName || t('sb.tbd')}
              </span>
            )}
          </div>
        </div>
      )}

      {isFinal && game.decisions && (
        <div className="pt-2 border-t border-border text-[11px] text-muted flex flex-wrap items-center gap-x-3 gap-y-1 bg-page/30 p-2 rounded-xl">
          {game.decisions.winner && (
            <span>
              <strong className="text-emerald-500 font-bold">{t('sb.win_short')}:</strong>{' '}
              {game.decisions.winner.id ? (
                <Link
                  to={`/players/${game.decisions.winner.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-main hover:text-team-primary hover:underline transition-colors font-medium"
                  title={game.decisions.winner.fullName}
                >
                  {getPlayerDisplayName(game.decisions.winner)}
                </Link>
              ) : (
                <span>{game.decisions.winner.fullName}</span>
              )}
            </span>
          )}
          {game.decisions.loser && (
            <span>
              <strong className="text-rose-500 font-bold">{t('sb.loss_short')}:</strong>{' '}
              {game.decisions.loser.id ? (
                <Link
                  to={`/players/${game.decisions.loser.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-main hover:text-team-primary hover:underline transition-colors font-medium"
                  title={game.decisions.loser.fullName}
                >
                  {getPlayerDisplayName(game.decisions.loser)}
                </Link>
              ) : (
                <span>{game.decisions.loser.fullName}</span>
              )}
            </span>
          )}
          {game.decisions.save && (
            <span>
              <strong className="text-amber-500 font-bold">{t('sb.save_short')}:</strong>{' '}
              {game.decisions.save.id ? (
                <Link
                  to={`/players/${game.decisions.save.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-main hover:text-team-primary hover:underline transition-colors font-medium"
                  title={game.decisions.save.fullName}
                >
                  {getPlayerDisplayName(game.decisions.save)}
                </Link>
              ) : (
                <span>{game.decisions.save.fullName}</span>
              )}
            </span>
          )}
        </div>
      )}

      {/* 4. Link through to the standalone game page, once there is one */}
      {hasStarted && (
        <div className="pt-2.5 mt-2 border-t border-border flex justify-center">
          <Link
            to={`/games/${game.gamePk}`}
            onClick={(e) => e.stopPropagation()}
            /* Short visible label, full description for assistive tech */
            aria-label={t('game.open_full_box')}
            title={t('game.open_full_box')}
            /* Neutral fill rather than the team colour: a light primary such as
               the Pirates' gold leaves white text at about 1.7:1 */
            className="inline-flex items-center justify-center px-4 py-1 rounded-lg border border-border bg-card-hover text-main text-[11px] font-bold tracking-wide shadow-sm hover:border-team-primary hover:text-team-primary active:translate-y-px transition-colors"
          >
            Box
          </Link>
        </div>
      )}
    </div>
  );
};
