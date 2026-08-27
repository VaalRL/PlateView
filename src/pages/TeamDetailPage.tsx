import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  useTeamRosterQuery,
  useTeamDetailQuery,
  useStandingsQuery,
  useTeamScheduleQuery,
} from '../services/queries';
import { getTeamLogoUrl, getPlayerHeadshotUrl } from '../services/mlbApi';
import { useFavorites } from '../hooks/useFavorites';
import { useLanguage } from '../hooks/useLanguage';
import { GameBoxscorePanel } from '../components/team/GameBoxscorePanel';
import { formatRateStat, formatEra, formatWhip } from '../utils/statsFormatters';
import { formatBilingualGameTime } from '../utils/timezone';
import teamsData from '../data/teams.json';
import {
  Star,
  ArrowLeft,
  Users,
  ShieldAlert,
  MapPin,
  Trophy,
  Calendar,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

type MainViewTab = 'roster' | 'schedule';
type RosterTab = 'active' | '40Man' | 'il';

export const TeamDetailPage: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const idNum = parseInt(teamId || '0', 10);
  const teamMeta = teamsData.find((t) => t.id === idNum);

  const [mainTab, setMainTab] = useState<MainViewTab>('schedule');
  const [activeRosterTab, setActiveRosterTab] = useState<RosterTab>('active');
  const [expandedGamePk, setExpandedGamePk] = useState<number | null>(null);
  const { lang, t } = useLanguage();

  const {
    data: rosterData,
    isLoading: isRosterLoading,
    isError: isRosterError,
  } = useTeamRosterQuery(
    idNum,
    activeRosterTab === '40Man' ? '40Man' : 'active'
  );

  const { data: scheduleData, isLoading: isScheduleLoading, isError: isScheduleError } =
    useTeamScheduleQuery(idNum);

  const { data: teamDetail } = useTeamDetailQuery(idNum);
  const { data: standingsData } = useStandingsQuery();

  const { isFavoriteTeam, toggleFavoriteTeam } = useFavorites();
  const isFav = isFavoriteTeam(idNum);

  const rawRoster = rosterData?.roster || [];

  // Filter injured list players
  const ilPlayers = rawRoster.filter(
    (p: any) =>
      p.status?.code?.includes('I') ||
      p.status?.description?.toLowerCase().includes('injured') ||
      p.status?.description?.toLowerCase().includes('il')
  );

  const displayRoster = activeRosterTab === 'il' ? ilPlayers : rawRoster;

  const pitchers = displayRoster.filter((p: any) => p.position?.type === 'Pitcher');
  const positionPlayers = displayRoster.filter((p: any) => p.position?.type !== 'Pitcher');

  // Find standings record
  let teamRecord: any = null;
  standingsData?.records.forEach((div) => {
    const found = div.teamRecords.find((tr) => tr.team.id === idNum);
    if (found) teamRecord = found;
  });

  const venueName = teamDetail?.teams?.[0]?.venue?.name || teamMeta?.name || 'MLB Stadium';
  const teamTitle = lang === 'zh' ? teamMeta?.nameZh || 'MLB 球隊' : teamMeta?.name || 'MLB Team';
  const teamSubTitle = lang === 'zh' ? teamMeta?.name : teamMeta?.nameZh;
  const divisionText = lang === 'zh' ? teamMeta?.divisionZh : `${teamMeta?.league} ${teamMeta?.division}`;

  // Parse and sort team recent schedule games
  const recentGames = useMemo(() => {
    if (!scheduleData?.dates) return [];
    const list: any[] = [];
    scheduleData.dates.forEach((d: any) => {
      d.games?.forEach((g: any) => {
        list.push({
          ...g,
          gameDateStr: d.date,
        });
      });
    });
    // Sort newest games first
    return list.sort((a, b) => b.gameDateStr.localeCompare(a.gameDateStr));
  }, [scheduleData]);

  // Calculate recent 10-game win-loss
  const recent10Stats = useMemo(() => {
    const completed = recentGames.filter((g) => g.status?.abstractGameState === 'Final');
    const last10 = completed.slice(0, 10);
    let wins = 0;
    let losses = 0;

    last10.forEach((g) => {
      const isHome = g.teams.home.team.id === idNum;
      const isWinner = isHome ? g.teams.home.isWinner : g.teams.away.isWinner;
      if (isWinner) wins++;
      else losses++;
    });

    return { wins, losses, count: last10.length };
  }, [recentGames, idNum]);

  const toggleExpandGame = (gamePk: number) => {
    setExpandedGamePk((prev) => (prev === gamePk ? null : gamePk));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Back Button */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-main transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{t('team.back')}</span>
      </Link>

      {/* Team Header Banner */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          <img
            src={getTeamLogoUrl(idNum)}
            alt={teamTitle}
            className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-md"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-main">
                {teamTitle}
              </h1>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-page border border-border text-muted font-bold">
                {teamMeta?.abbrev}
              </span>
              {teamRecord && (
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-team-primary/15 text-team-primary font-bold">
                  {teamRecord.wins} {t('standings.wins')} {teamRecord.losses} {t('standings.losses')} ({teamRecord.winningPercentage})
                </span>
              )}
            </div>

            <p className="text-sm text-muted mt-1 font-medium">{teamSubTitle}</p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-3 text-xs text-muted">
              <span className="flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span>
                  {divisionText} ({t('team.division_rank', { rank: teamRecord?.divisionRank || '-' })})
                </span>
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-team-primary" />
                <span>{t('team.stadium')}：{venueName}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Favorite Button */}
        <button
          onClick={() => toggleFavoriteTeam(idNum)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
            isFav
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-500 shadow-sm'
              : 'bg-page border-border text-muted hover:text-main hover:border-team-primary'
          }`}
        >
          <Star className={`w-4 h-4 ${isFav ? 'fill-amber-500 text-amber-500' : ''}`} />
          <span>{isFav ? t('team.fav_active') : t('team.fav_btn')}</span>
        </button>
      </div>

      {/* Main View Switcher (Schedule vs Roster) */}
      <div className="flex items-center gap-3 border-b border-border pb-3">
        <button
          onClick={() => setMainTab('schedule')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            mainTab === 'schedule'
              ? 'bg-team-primary text-white shadow-md'
              : 'bg-card border border-border text-muted hover:text-main'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>{t('team.tab_view_schedule')}</span>
        </button>

        <button
          onClick={() => setMainTab('roster')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            mainTab === 'roster'
              ? 'bg-team-primary text-white shadow-md'
              : 'bg-card border border-border text-muted hover:text-main'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{t('team.tab_view_roster')}</span>
        </button>
      </div>

      {/* VIEW 1: Recent Games & Matchup Scores */}
      {mainTab === 'schedule' && (
        <div className="space-y-4">
          {/* Summary Widget */}
          {recent10Stats.count > 0 && (
            <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2 text-sm font-bold text-main">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>
                  {lang === 'zh'
                    ? `近 ${recent10Stats.count} 場戰績：${recent10Stats.wins} 勝 ${recent10Stats.losses} 敗`
                    : `Last ${recent10Stats.count} Games: ${recent10Stats.wins}W - ${recent10Stats.losses}L`}
                </span>
              </div>
              <span className="text-xs text-muted font-mono">
                {lang === 'zh' ? '點擊任一場次可展開完整 Box 數據' : 'Click any matchup to view Box Score'}
              </span>
            </div>
          )}

          {isScheduleLoading && (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="bg-card border border-border rounded-xl p-4 h-20 animate-pulse" />
              ))}
            </div>
          )}

          {isScheduleError && (
            <div className="bg-card border border-border rounded-xl p-8 text-center text-rose-500 text-sm">
              {t('team.load_error')}
            </div>
          )}

          {!isScheduleLoading && !isScheduleError && (
            <div className="space-y-3">
              {recentGames.map((g: any) => {
                const isHome = g.teams.home.team.id === idNum;
                const myScore = isHome ? g.teams.home.score : g.teams.away.score;
                const oppScore = isHome ? g.teams.away.score : g.teams.home.score;
                const oppTeamData = isHome ? g.teams.away.team : g.teams.home.team;
                const oppMeta = teamsData.find((tItem) => tItem.id === oppTeamData.id);
                const oppDisplayName =
                  lang === 'zh'
                    ? oppMeta?.nameZh || oppTeamData.name
                    : oppMeta?.name || oppTeamData.name;

                const isFinal = g.status?.abstractGameState === 'Final';
                const isLive = g.status?.abstractGameState === 'Live';
                const isPreview = g.status?.abstractGameState === 'Preview';

                const isWinner = isHome ? g.teams.home.isWinner : g.teams.away.isWinner;
                const isExpanded = expandedGamePk === g.gamePk;

                const awayTeamMeta = teamsData.find((tItem) => tItem.id === g.teams.away.team.id);
                const homeTeamMeta = teamsData.find((tItem) => tItem.id === g.teams.home.team.id);

                return (
                  <div
                    key={g.gamePk}
                    className="bg-card border border-border rounded-2xl p-4 shadow-sm hover:border-team-primary/40 transition-all overflow-hidden"
                  >
                    <div
                      onClick={() => toggleExpandGame(g.gamePk)}
                      className="cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 select-none"
                    >
                      {/* Left: Date, Matchup & Opponent */}
                      <div className="flex items-center gap-3.5">
                        <span className="text-xs font-mono text-muted w-20 shrink-0 font-semibold">
                          {g.gameDateStr}
                        </span>

                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-bold text-muted uppercase">
                            {isHome ? t('team.matchup_vs') : t('team.matchup_at')}
                          </span>
                          <div className="flex items-center gap-2 font-bold text-sm text-main">
                            <img
                              src={getTeamLogoUrl(oppTeamData.id)}
                              alt={oppDisplayName}
                              className="w-6 h-6 object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            <span>{oppDisplayName}</span>
                          </div>
                        </div>
                      </div>

                      {/* Middle: Decisions summary if Final OR Probable Pitchers if Preview */}
                      {isFinal && g.decisions && (
                        <div className="hidden lg:flex items-center gap-3 text-xs text-muted font-sans">
                          {g.decisions.winner && (
                            <span>
                              <strong className="text-emerald-500 font-bold">W:</strong>{' '}
                              {g.decisions.winner.id ? (
                                <Link
                                  to={`/players/${g.decisions.winner.id}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="hover:underline hover:text-team-primary text-main"
                                >
                                  {g.decisions.winner.fullName}
                                </Link>
                              ) : (
                                <span>{g.decisions.winner.fullName}</span>
                              )}
                            </span>
                          )}
                          {g.decisions.loser && (
                            <span>
                              <strong className="text-rose-500 font-bold">L:</strong>{' '}
                              {g.decisions.loser.id ? (
                                <Link
                                  to={`/players/${g.decisions.loser.id}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="hover:underline hover:text-team-primary text-main"
                                >
                                  {g.decisions.loser.fullName}
                                </Link>
                              ) : (
                                <span>{g.decisions.loser.fullName}</span>
                              )}
                            </span>
                          )}
                          {g.decisions.save && (
                            <span>
                              <strong className="text-amber-500 font-bold">SV:</strong>{' '}
                              {g.decisions.save.id ? (
                                <Link
                                  to={`/players/${g.decisions.save.id}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="hover:underline hover:text-team-primary text-main"
                                >
                                  {g.decisions.save.fullName}
                                </Link>
                              ) : (
                                <span>{g.decisions.save.fullName}</span>
                              )}
                            </span>
                          )}
                        </div>
                      )}

                      {isPreview && (g.teams?.away?.probablePitcher || g.teams?.home?.probablePitcher) && (
                        <div className="hidden md:flex items-center gap-2 text-xs text-muted font-sans">
                          <span className="font-semibold text-main">
                            <span className="text-muted font-normal">{t('sb.sp_away')}:</span>{' '}
                            {g.teams?.away?.probablePitcher?.id ? (
                              <Link
                                to={`/players/${g.teams.away.probablePitcher.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="hover:underline hover:text-team-primary text-main"
                              >
                                {g.teams.away.probablePitcher.fullName}
                              </Link>
                            ) : (
                              <span className="text-main font-medium">{g.teams?.away?.probablePitcher?.fullName || t('sb.tbd')}</span>
                            )}
                          </span>
                          <span className="text-muted/40">&bull;</span>
                          <span className="font-semibold text-main">
                            <span className="text-muted font-normal">{t('sb.sp_home')}:</span>{' '}
                            {g.teams?.home?.probablePitcher?.id ? (
                              <Link
                                to={`/players/${g.teams.home.probablePitcher.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="hover:underline hover:text-team-primary text-main"
                              >
                                {g.teams.home.probablePitcher.fullName}
                              </Link>
                            ) : (
                              <span className="text-main font-medium">{g.teams?.home?.probablePitcher?.fullName || t('sb.tbd')}</span>
                            )}
                          </span>
                        </div>
                      )}

                      {/* Right: Score, Result Tag & Expand Trigger */}
                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        {isFinal && (
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs px-2.5 py-1 rounded-lg font-mono font-black border ${
                                isWinner
                                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                                  : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                              }`}
                            >
                              {isWinner ? t('team.win_badge') : t('team.loss_badge')}{' '}
                              {myScore !== undefined ? `${myScore} - ${oppScore}` : ''}
                            </span>
                          </div>
                        )}

                        {isLive && (
                          <span className="text-xs px-2.5 py-1 rounded-lg font-mono font-bold bg-red-500/20 border border-red-500/40 text-red-400 animate-pulse">
                            🔴 LIVE {myScore} - {oppScore}
                          </span>
                        )}

                        {isPreview && (
                          <span className="text-xs px-2.5 py-1 rounded-lg font-mono font-bold bg-page border border-border text-team-primary shadow-sm">
                            {formatBilingualGameTime(g.gameDate, lang)}
                          </span>
                        )}

                        <button
                          type="button"
                          className="p-1 rounded-lg text-muted hover:text-main hover:bg-page transition-colors"
                          aria-label={isExpanded ? t('team.hide_boxscore') : t('team.view_boxscore')}
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-team-primary" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* EXPANDED SECTION: Linescore & Box Score Panel or Preview SP Matchup */}
                    {isExpanded && (
                      <div className="mt-4 pt-3 border-t border-border space-y-4 animate-in fade-in duration-200">
                        {isPreview ? (
                          <div className="p-4 bg-page/60 rounded-xl border border-border/40 space-y-3 text-xs">
                            <div className="flex items-center justify-between pb-2 border-b border-border/40 font-bold text-main">
                              <span>⚾ {lang === 'zh' ? '預定先發投手對決' : 'Probable Pitchers Matchup'}</span>
                              <span className="text-team-primary font-mono">{formatBilingualGameTime(g.gameDate, lang, true)}</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="bg-card p-3 rounded-lg border border-border/60">
                                <span className="text-muted block text-[11px] font-semibold">{g.teams.away.team.name} ({t('sb.sp_away')})</span>
                                {g.teams?.away?.probablePitcher?.id ? (
                                  <Link
                                    to={`/players/${g.teams.away.probablePitcher.id}`}
                                    className="text-main font-bold text-sm block mt-0.5 hover:text-team-primary hover:underline"
                                  >
                                    {g.teams.away.probablePitcher.fullName}
                                  </Link>
                                ) : (
                                  <span className="text-main font-bold text-sm block mt-0.5">
                                    {g.teams?.away?.probablePitcher?.fullName || t('sb.tbd')}
                                  </span>
                                )}
                              </div>
                              <div className="bg-card p-3 rounded-lg border border-border/60">
                                <span className="text-muted block text-[11px] font-semibold">{g.teams.home.team.name} ({t('sb.sp_home')})</span>
                                {g.teams?.home?.probablePitcher?.id ? (
                                  <Link
                                    to={`/players/${g.teams.home.probablePitcher.id}`}
                                    className="text-main font-bold text-sm block mt-0.5 hover:text-team-primary hover:underline"
                                  >
                                    {g.teams.home.probablePitcher.fullName}
                                  </Link>
                                ) : (
                                  <span className="text-main font-bold text-sm block mt-0.5">
                                    {g.teams?.home?.probablePitcher?.fullName || t('sb.tbd')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            {/* 1. Inning-by-Inning Linescore Table */}
                            {g.linescore?.innings && g.linescore.innings.length > 0 && (
                              <div className="overflow-x-auto bg-page/60 p-3 rounded-xl">
                                <table className="w-full text-center text-xs font-mono">
                                  <thead>
                                    <tr className="text-muted border-b border-border/50 text-[10px]">
                                      <th className="text-left font-normal py-1 pr-2">{t('sb.team')}</th>
                                      {g.linescore.innings.map((inn: any) => (
                                        <th key={inn.num} className="font-normal px-1.5 py-1">
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
                                        {awayTeamMeta?.abbrev || g.teams.away.team.name}
                                      </td>
                                      {g.linescore.innings.map((inn: any) => (
                                        <td key={inn.num} className="px-1.5 py-1">
                                          {inn.away?.runs ?? '-'}
                                        </td>
                                      ))}
                                      <td className="font-bold px-2 py-1 text-main border-l border-border/30">
                                        {g.linescore.teams?.away?.runs ?? g.teams.away.score ?? 0}
                                      </td>
                                      <td className="px-1.5 py-1 text-muted">
                                        {g.linescore.teams?.away?.hits ?? '-'}
                                      </td>
                                      <td className="px-1.5 py-1 text-muted">
                                        {g.linescore.teams?.away?.errors ?? '-'}
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="text-left py-1 pr-2 font-semibold text-muted">
                                        {homeTeamMeta?.abbrev || g.teams.home.team.name}
                                      </td>
                                      {g.linescore.innings.map((inn: any) => (
                                        <td key={inn.num} className="px-1.5 py-1">
                                          {inn.home?.runs ?? '-'}
                                        </td>
                                      ))}
                                      <td className="font-bold px-2 py-1 text-main border-l border-border/30">
                                        {g.linescore.teams?.home?.runs ?? g.teams.home.score ?? 0}
                                      </td>
                                      <td className="px-1.5 py-1 text-muted">
                                        {g.linescore.teams?.home?.hits ?? '-'}
                                      </td>
                                      <td className="px-1.5 py-1 text-muted">
                                        {g.linescore.teams?.home?.errors ?? '-'}
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            )}

                            {/* 2. Detailed Boxscore Panel (Batters & Pitchers) */}
                            <GameBoxscorePanel gamePk={g.gamePk} />
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {recentGames.length === 0 && (
                <div className="py-12 text-center text-muted text-sm bg-card border border-border rounded-xl">
                  {t('team.no_schedule')}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: Roster List */}
      {mainTab === 'roster' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-team-primary" />
              <h2 className="text-lg font-bold text-main">{t('team.roster_title')}</h2>
            </div>

            <div className="flex items-center p-1 bg-card border border-border rounded-lg text-xs font-semibold">
              <button
                onClick={() => setActiveRosterTab('active')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  activeRosterTab === 'active'
                    ? 'bg-team-primary text-white shadow-sm'
                    : 'text-muted hover:text-main'
                }`}
              >
                {t('team.tab_active')}
              </button>
              <button
                onClick={() => setActiveRosterTab('40Man')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  activeRosterTab === '40Man'
                    ? 'bg-team-primary text-white shadow-sm'
                    : 'text-muted hover:text-main'
                }`}
              >
                {t('team.tab_40man')}
              </button>
              <button
                onClick={() => setActiveRosterTab('il')}
                className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 ${
                  activeRosterTab === 'il'
                    ? 'bg-team-primary text-white shadow-sm'
                    : 'text-muted hover:text-main'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>{t('team.tab_il')}</span>
              </button>
            </div>
          </div>

          {isRosterLoading && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card border border-border rounded-xl p-6 h-72 animate-pulse" />
              <div className="bg-card border border-border rounded-xl p-6 h-72 animate-pulse" />
            </div>
          )}

          {isRosterError && (
            <div className="bg-card border border-border rounded-xl p-8 text-center text-rose-500 text-sm">
              {t('team.load_error')}
            </div>
          )}

          {!isRosterLoading && !isRosterError && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pitchers Column */}
              <div className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <h3 className="font-bold text-sm text-team-primary flex items-center gap-1.5">
                    <span>{t('team.pitchers_group')}</span>
                    <span className="text-xs text-muted font-normal">
                      ({t('team.persons_count', { count: pitchers.length })})
                    </span>
                  </h3>
                  <span className="text-[11px] text-muted font-mono">{t('team.pitcher_header')}</span>
                </div>

                <div className="divide-y divide-border/40 max-h-[700px] overflow-y-auto">
                  {pitchers.map((item: any) => {
                    const seasonPitching = item.person?.stats?.[0]?.splits?.[0]?.stat;

                    return (
                      <Link
                        key={item.person.id}
                        to={`/players/${item.person.id}`}
                        className="py-2.5 px-2 flex items-center justify-between hover:bg-card-hover/70 rounded-lg transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={getPlayerHeadshotUrl(item.person.id)}
                            alt={item.person.fullName}
                            className="w-9 h-9 rounded-full bg-page object-cover border border-border group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="%2394a3b8" viewBox="0 0 16 16"%3E%3Cpath d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"%3E%3C/path%3E%3Cpath fill-rule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z"%3E%3C/path%3E%3C/svg%3E';
                            }}
                          />
                          <div>
                            <div className="text-sm font-semibold text-main group-hover:text-team-primary flex items-center gap-1.5">
                              <span>{item.person.fullName}</span>
                              {item.status?.code?.includes('I') && (
                                <span className="text-[10px] px-1 rounded bg-rose-500/20 text-rose-400 font-mono font-bold">
                                  IL
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted">
                              #{item.jerseyNumber || '--'} &bull; {item.position?.abbreviation} &bull;{' '}
                              {item.person?.pitchHand?.code || 'R'}
                            </div>
                          </div>
                        </div>

                        <div className="text-right font-mono text-xs">
                          {seasonPitching ? (
                            <div>
                              <span className="font-bold text-main">{formatEra(seasonPitching.era)} ERA</span>
                              <span className="text-muted text-[11px] block">
                                {seasonPitching.wins}-{seasonPitching.losses} &bull;{' '}
                                {formatWhip(seasonPitching.whip)} WHIP
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted text-[11px]">{item.status?.description || 'Active'}</span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                  {pitchers.length === 0 && (
                    <div className="py-8 text-center text-xs text-muted">{t('team.empty_roster')}</div>
                  )}
                </div>
              </div>

              {/* Position Players Column */}
              <div className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <h3 className="font-bold text-sm text-team-primary flex items-center gap-1.5">
                    <span>{t('team.position_group')}</span>
                    <span className="text-xs text-muted font-normal">
                      ({t('team.persons_count', { count: positionPlayers.length })})
                    </span>
                  </h3>
                  <span className="text-[11px] text-muted font-mono">{t('team.position_header')}</span>
                </div>

                <div className="divide-y divide-border/40 max-h-[700px] overflow-y-auto">
                  {positionPlayers.map((item: any) => {
                    const seasonHitting = item.person?.stats?.[0]?.splits?.[0]?.stat;

                    return (
                      <Link
                        key={item.person.id}
                        to={`/players/${item.person.id}`}
                        className="py-2.5 px-2 flex items-center justify-between hover:bg-card-hover/70 rounded-lg transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={getPlayerHeadshotUrl(item.person.id)}
                            alt={item.person.fullName}
                            className="w-9 h-9 rounded-full bg-page object-cover border border-border group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="%2394a3b8" viewBox="0 0 16 16"%3E%3Cpath d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"%3E%3C/path%3E%3Cpath fill-rule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z"%3E%3C/path%3E%3C/svg%3E';
                            }}
                          />
                          <div>
                            <div className="text-sm font-semibold text-main group-hover:text-team-primary flex items-center gap-1.5">
                              <span>{item.person.fullName}</span>
                              {item.status?.code?.includes('I') && (
                                <span className="text-[10px] px-1 rounded bg-rose-500/20 text-rose-400 font-mono font-bold">
                                  IL
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted">
                              #{item.jerseyNumber || '--'} &bull; {item.position?.abbreviation} &bull;{' '}
                              {item.person?.batSide?.code || 'R'}
                            </div>
                          </div>
                        </div>

                        <div className="text-right font-mono text-xs">
                          {seasonHitting ? (
                            <div>
                              <span className="font-bold text-main">{formatRateStat(seasonHitting.avg)}</span>
                              <span className="text-muted text-[11px] block">
                                {seasonHitting.homeRuns} HR &bull; {formatRateStat(seasonHitting.ops)} OPS
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted text-[11px]">{item.status?.description || 'Active'}</span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                  {positionPlayers.length === 0 && (
                    <div className="py-8 text-center text-xs text-muted">{t('team.empty_roster')}</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
