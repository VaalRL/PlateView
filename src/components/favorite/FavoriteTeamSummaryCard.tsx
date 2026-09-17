import React from 'react';
import { Link } from 'react-router-dom';
import { getTeamLogoUrl } from '../../services/mlbApi';
import { useLanguage } from '../../hooks/useLanguage';
import { GameSchedule } from '../../types/mlb';
import { formatBilingualGameTime } from '../../utils/timezone';
import teamsData from '../../data/teams.json';
import { Radio, Flag, CalendarClock, ArrowRight } from 'lucide-react';
import { LIVE_ACCENT } from '../../constants/gameStatus';

interface FavoriteTeamSummaryCardProps {
  teamId: number;
  /** The team's game on the summarized date */
  game?: GameSchedule;
  /** The team's game one calendar day earlier */
  previousGame?: GameSchedule;
}

interface DayView {
  isLive: boolean;
  isFinal: boolean;
  matchupText: string;
  statusText: string;
  statusClass: string;
  isWinner: boolean;
  isLoser: boolean;
  hasScore: boolean;
  myScore?: number;
  oppScore?: number;
  hits?: number;
  errors?: number;
  oppAbbrev: string;
  record: string;
  awayPitcher: string;
  homePitcher: string;
}

export const FavoriteTeamSummaryCard: React.FC<FavoriteTeamSummaryCardProps> = ({
  teamId,
  game,
  previousGame,
}) => {
  const { lang, t } = useLanguage();

  const teamMeta = teamsData.find((item) => item.id === teamId);

  const buildDayView = (dayGame?: GameSchedule): DayView | null => {
    if (!dayGame) return null;

    const isAway = dayGame.teams.away.team.id === teamId;
    const myGameTeam = isAway ? dayGame.teams.away : dayGame.teams.home;
    const oppGameTeam = isAway ? dayGame.teams.home : dayGame.teams.away;

    const oppMeta = teamsData.find((item) => item.id === oppGameTeam.team.id);
    const oppAbbrev =
      oppMeta?.abbrev ||
      oppGameTeam.team.abbreviation ||
      oppGameTeam.team.name.slice(0, 3).toUpperCase();

    const { status, linescore } = dayGame;
    const isLive = status.abstractGameState === 'Live';
    const isPostponed =
      status.detailedState?.toLowerCase().includes('postponed') ||
      status.detailedState?.toLowerCase().includes('delayed') ||
      status.detailedState?.toLowerCase().includes('suspended') ||
      status.statusCode === 'DO' ||
      status.statusCode === 'DR';
    const isFinal = status.abstractGameState === 'Final';
    const isPreview = status.abstractGameState === 'Preview' && !isPostponed;

    const myScore = myGameTeam.score;
    const oppScore = oppGameTeam.score;
    // The schedule API already returns 0-0 before first pitch, so a scoreline is
    // only meaningful once the game is actually under way
    const hasScore =
      myScore !== undefined && oppScore !== undefined && !isPreview && !isPostponed;

    const isWinner = isFinal && (myGameTeam.isWinner || (myScore ?? 0) > (oppScore ?? 0));
    const myLine = isAway ? linescore?.teams?.away : linescore?.teams?.home;

    const vsPrefix = isAway ? '@' : t('fav.live_vs');

    let statusText = t('sb.scheduled');
    let statusClass = 'bg-team-primary/10 text-team-primary border-team-primary/30';
    if (isLive) {
      statusText = `${linescore?.inningHalf === 'Top' ? '▲' : '▼'} ${
        linescore?.currentInningOrdinal || linescore?.currentInning || ''
      }`;
      statusClass = `${LIVE_ACCENT.badge} animate-pulse`;
    } else if (isFinal) {
      statusText = t('sb.final');
      statusClass = 'bg-page text-muted border-border/50';
    } else if (isPostponed) {
      statusText = status.detailedState || t('sb.postponed');
      statusClass = 'bg-amber-500/15 text-amber-500 border-amber-500/30';
    } else {
      statusText = formatBilingualGameTime(dayGame.gameDate, lang);
    }

    return {
      isLive,
      isFinal,
      matchupText: hasScore
        ? `${myScore} - ${oppScore} ${vsPrefix} ${oppAbbrev}`
        : `${vsPrefix} ${oppAbbrev}`,
      statusText,
      statusClass,
      isWinner,
      isLoser: isFinal && !isWinner,
      hasScore,
      myScore,
      oppScore,
      hits: myLine?.hits,
      errors: myLine?.errors,
      oppAbbrev,
      record: `(${myGameTeam.leagueRecord.wins}-${myGameTeam.leagueRecord.losses})`,
      awayPitcher: dayGame.teams.away.probablePitcher?.fullName || t('sb.tbd'),
      homePitcher: dayGame.teams.home.probablePitcher?.fullName || t('sb.tbd'),
    };
  };

  const todayView = buildDayView(game);
  const previousView = buildDayView(previousGame);

  const teamName =
    (lang === 'zh' ? teamMeta?.nameZh : teamMeta?.name) ||
    game?.teams.away.team.name ||
    `#${teamId}`;

  const subTitle =
    todayView?.record ||
    previousView?.record ||
    (lang === 'zh' ? teamMeta?.divisionZh : `${teamMeta?.league} ${teamMeta?.division}`);

  const renderDayRow = (label: string, view: DayView | null, detailed: boolean) => (
    <div className="pt-3 space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-bold text-muted bg-page px-1.5 py-0.5 rounded border border-border/50 shrink-0">
          {label}
        </span>

        {view ? (
          <>
            {view.isLive ? (
              <Radio className={`w-4 h-4 shrink-0 ${LIVE_ACCENT.text}`} />
            ) : view.isFinal ? (
              <Flag className="w-4 h-4 text-team-primary shrink-0" />
            ) : (
              <CalendarClock className="w-4 h-4 text-muted shrink-0" />
            )}
            <span className="font-mono text-sm font-black text-main tracking-tight">
              {view.matchupText}
            </span>
            {view.isWinner && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                {t('team.win_badge')}
              </span>
            )}
            {view.isLoser && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-500 border border-rose-500/30">
                {t('team.loss_badge')}
              </span>
            )}
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border shrink-0 ${view.statusClass}`}
            >
              {view.statusText}
            </span>
          </>
        ) : (
          <span className="text-xs text-muted">{t('fav.team_no_game')}</span>
        )}
      </div>

      {/* Stat breakdown pills (summarized day only) */}
      {detailed && view && (
        <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono bg-page/60 p-2 rounded-xl border border-border/50">
          {view.hasScore ? (
            <>
              <div className="text-muted truncate">
                <span>{t('sb.runs_col')}: </span>
                <strong className="text-main font-bold">{view.myScore}</strong>
              </div>
              <div className="text-muted truncate">
                <span>{t('sb.hits_col')}: </span>
                <strong className="text-main font-bold">{view.hits ?? '-'}</strong>
              </div>
              <div className="text-muted truncate">
                <span>{t('sb.errors_col')}: </span>
                <strong className="text-main font-bold">{view.errors ?? '-'}</strong>
              </div>
              <div className="text-muted truncate">
                <span>{view.oppAbbrev}: </span>
                <strong className="text-main font-bold">{view.oppScore}</strong>
              </div>
            </>
          ) : (
            <>
              <div className="text-muted truncate">
                <span>{t('sb.sp_away')}: </span>
                <strong className="text-main font-bold">{view.awayPitcher}</strong>
              </div>
              <div className="text-muted truncate">
                <span>{t('sb.sp_home')}: </span>
                <strong className="text-main font-bold">{view.homePitcher}</strong>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-team-primary/40 transition-all flex flex-col justify-between group">
      <div>
        {/* Top Team Info */}
        <div className="flex items-center gap-2.5 min-w-0 pb-3 border-b border-border/40">
          <Link
            to={`/teams/${teamId}`}
            className="relative shrink-0 group-hover:scale-105 transition-transform"
          >
            <img
              src={getTeamLogoUrl(teamId)}
              alt={teamName}
              className="w-11 h-11 rounded-full bg-page object-contain border border-border shadow-xs p-1"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </Link>

          <div className="min-w-0">
            <Link
              to={`/teams/${teamId}`}
              className="text-sm font-bold text-main truncate hover:text-team-primary transition-colors block"
              title={teamName}
            >
              {teamName}
            </Link>
            <div className="text-[11px] text-muted font-mono truncate">{subTitle}</div>
          </div>
        </div>

        {/* Today then yesterday, so a finished night game stays visible */}
        {renderDayRow(t('fav.team_today'), todayView, true)}
        <div className="border-t border-border/30 mt-3" />
        {renderDayRow(t('fav.team_yesterday'), previousView, false)}
      </div>

      {/* Bottom Link */}
      <div className="pt-2.5 mt-2 border-t border-border/30 flex justify-end">
        <Link
          to={`/teams/${teamId}`}
          className="text-[11px] font-semibold text-muted group-hover:text-team-primary flex items-center gap-1 transition-colors"
        >
          <span>{t('fav.view_team')}</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
};
