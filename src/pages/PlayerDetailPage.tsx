import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  usePlayerDetailQuery,
  usePlayerPostseasonLogsQuery,
  usePlayerPostseasonStatsQuery,
  usePlayerSeasonGameLogsQuery,
  usePlayerYearByYearQuery,
} from '../services/queries';
import { getPlayerHeadshotUrl, getTeamLogoUrl, withPostseasonGameLogs } from '../services/mlbApi';
import { useFavorites } from '../hooks/useFavorites';
import { useLanguage } from '../hooks/useLanguage';
import {
  formatRateStat,
  formatEra,
  formatWhip,
  formatWar,
  formatPlusStat,
  formatFip,
  formatWoba,
  formatPer9,
  getPitchingDecision,
} from '../utils/statsFormatters';
import { formatPhysique } from '../utils/units';
import { daysUntilBirthday, formatBirthDate } from '../utils/birthdays';
import playersData from '../data/players-zh-tw.json';
import teamsData from '../data/teams.json';
import { GameLogSplit } from '../types/favorites';
import {
  getStatLevels,
  getLevelStat,
  getDefaultLevel,
  sortGameLogsByDate,
  isPostseasonGameType,
  type PlayerStatGroup,
  type StatLevel,
} from '../utils/playerLevels';
import { MLB_SPORT_ID } from '../constants/levels';
import { PlayerTransactions } from '../components/player/PlayerTransactions';
import { GameLogFilterBar } from '../components/player/GameLogFilterBar';
import { YearByYearTable } from '../components/player/YearByYearTable';
import { seasonsOf, yearRows } from '../utils/yearByYear';
import { TeamHoverCard } from '../components/common/TeamHoverCard';
import {
  DEFAULT_GAME_LOG_FILTER,
  filterGameLogs,
  getGameLogFilterOptions,
  isFilterActive,
  sumHitting,
  sumPitching,
  type GameLogFilter,
} from '../utils/gameLogFilters';
import { Star, ArrowLeft, Activity, Calendar, CalendarRange, Award, Zap, ArrowLeftRight, Columns3 } from 'lucide-react';
import { addToComparison, loadComparison } from '../utils/comparison';
import { latestPostseasonSeason } from '../utils/postseasonLeaders';
import { getCurrentMlbSeason } from '../utils/season';
import type { TranslationKey } from '../i18n/translations';

function gameLogsOf(stats: PlayerStatGroup[], group: 'hitting' | 'pitching'): GameLogSplit[] {
  const splits = stats.find((s) => s.group?.displayName === group && s.type?.displayName === 'gameLog')?.splits;
  return sortGameLogsByDate((splits || []) as GameLogSplit[]);
}

type HistoryTab = 'logs' | 'years' | 'transactions';

const HISTORY_TABS: { key: HistoryTab; Icon: typeof Calendar; title: TranslationKey; short: TranslationKey }[] = [
  { key: 'logs', Icon: Calendar, title: 'player.game_logs_title', short: 'player.tab_game_logs' },
  { key: 'years', Icon: CalendarRange, title: 'player.years_title', short: 'player.tab_years' },
  { key: 'transactions', Icon: ArrowLeftRight, title: 'player.transactions_title', short: 'player.tab_transactions' },
];

export const PlayerDetailPage: React.FC = () => {
  const { personId } = useParams<{ personId: string }>();
  const idNum = parseInt(personId || '0', 10);
  const zhPlayerMeta = playersData.find((p) => p.id === idNum);

  const [statTypeTab, setStatTypeTab] = useState<'season' | 'career'>('season');
  // The postseason view, like the level and the game log season, belongs to one player
  const [gameScopeChoice, setGameScopeChoice] = useState<{ personId: number; scope: 'postseason' } | null>(null);
  const gameScope = gameScopeChoice?.personId === idNum ? gameScopeChoice.scope : 'regular';
  const setGameScope = (scope: 'regular' | 'postseason') =>
    setGameScopeChoice(scope === 'postseason' ? { personId: idNum, scope } : null);
  const [roleTab, setRoleTab] = useState<'auto' | 'hitting' | 'pitching'>('auto');
  // Transactions load only once their tab is opened. The tab, like the game
  // log filters and "show all", belongs to one player (see the level choice below)
  const [historyChoice, setHistoryChoice] = useState<{ personId: number; tab: HistoryTab } | null>(null);
  const historyTab: HistoryTab = historyChoice?.personId === idNum ? historyChoice.tab : 'logs';
  const setHistoryTab = (tab: HistoryTab) => setHistoryChoice({ personId: idNum, tab });
  // Filters are also per role: a two-way player's hitting and pitching logs
  // have different opponents and levels to choose from
  const [logFilterChoice, setLogFilterChoice] = useState<{ key: string; filter: GameLogFilter } | null>(null);
  const [logsExpandedFor, setLogsExpandedFor] = useState<string | null>(null);
  // A past season's game log, for one player; null is this season's
  const [logSeasonChoice, setLogSeasonChoice] = useState<{ personId: number; season: number } | null>(null);
  const logSeason = logSeasonChoice?.personId === idNum ? logSeasonChoice.season : null;

  const { data: detail, isLoading, isError } = usePlayerDetailQuery(idNum);
  // Postseason games come from a query of their own, so they never hold up the page
  const postseasonLogs = usePlayerPostseasonLogsQuery(idNum);
  // Every season's line: the year-by-year table, and the game log's season choice
  const yearByYear = usePlayerYearByYearQuery(idNum);
  const yearGroups = yearByYear.data?.people?.[0]?.stats as PlayerStatGroup[] | undefined;
  const pastLogs = usePlayerSeasonGameLogsQuery(idNum, logSeason);
  const data = useMemo(() => withPostseasonGameLogs(detail, postseasonLogs.data), [detail, postseasonLogs.data]);
  const { isFavoritePlayer, toggleFavoritePlayer } = useFavorites();
  const navigate = useNavigate();
  const { lang, t } = useLanguage();

  const isFav = isFavoritePlayer(idNum);
  const person = data?.people?.[0];

  const statsGroups: PlayerStatGroup[] = useMemo(() => person?.stats || [], [person]);

  // Levels the player has a line at, this season and over his career. The
  // page opens on the level he is at now, so a player just optioned down or
  // called up sees the line he is building.
  // Keyed to the player: the route stays mounted when only :personId changes
  // (e.g. jumping from search), and one player's level means nothing for the next
  const [levelChoice, setLevelChoice] = useState<{ personId: number; level: number } | null>(null);
  const levelTab = levelChoice?.personId === idNum ? levelChoice.level : null;
  const { levels, defaultLevel } = useMemo(() => {
    const collect = (types: string[]) => {
      const found = new Map<number, StatLevel>();
      (['hitting', 'pitching'] as const).forEach((group) =>
        types.forEach((type) => getStatLevels(statsGroups, group, type).forEach((l) => found.set(l.id, l)))
      );
      return [...found.values()].sort((a, b) => a.id - b.id);
    };
    const seasonLevels = collect(['season']);
    const allLevels = collect(['season', 'career']);
    return {
      levels: allLevels,
      defaultLevel: getDefaultLevel(
        seasonLevels.length > 0 ? seasonLevels : allLevels,
        person?.currentTeam?.sport?.id
      ),
    };
  }, [statsGroups, person]);
  const level = levelTab ?? defaultLevel;
  // FIP, FIP+ and wRC+/OPS+ fall back to MLB league constants when the API has
  // no sabermetrics, which is always the case below MLB, so they are hidden there
  const showLeagueRelative = level === MLB_SPORT_ID;
  const levelLabel = levels.find((l) => l.id === level)?.abbreviation;

  // Season, career, sabermetrics & advanced stats at the selected level
  const hittingSeasonStats = getLevelStat(statsGroups, 'hitting', 'season', level);
  const pitchingSeasonStats = getLevelStat(statsGroups, 'pitching', 'season', level);
  const hittingCareerStats = getLevelStat(statsGroups, 'hitting', 'career', level);
  const pitchingCareerStats = getLevelStat(statsGroups, 'pitching', 'career', level);
  const hittingSabermetrics = getLevelStat(statsGroups, 'hitting', 'sabermetrics', level);
  const pitchingSabermetrics = getLevelStat(statsGroups, 'pitching', 'sabermetrics', level);
  const hittingAdvanced = getLevelStat(statsGroups, 'hitting', 'seasonAdvanced', level);
  const pitchingAdvanced = getLevelStat(statsGroups, 'pitching', 'seasonAdvanced', level);

  // Game logs mix every level and the API groups them by level, so sort by
  // date (most recent games first)
  const logGroups: PlayerStatGroup[] = useMemo(
    () => (logSeason === null ? statsGroups : (pastLogs.data?.people?.[0]?.stats as PlayerStatGroup[] | undefined) ?? []),
    [logSeason, statsGroups, pastLogs.data]
  );
  const sortedHittingGameLogs = useMemo(() => gameLogsOf(logGroups, 'hitting'), [logGroups]);
  const sortedPitchingGameLogs = useMemo(() => gameLogsOf(logGroups, 'pitching'), [logGroups]);
  // This season's log comes with the page; earlier ones are offered once known
  const currentSeason = getCurrentMlbSeason();
  const pastSeasons = useMemo(() => seasonsOf(yearGroups).filter((y) => y < currentSeason), [yearGroups, currentSeason]);
  const logsLoading = logSeason !== null && pastLogs.isLoading;
  const postseasonLogsFailed = logSeason === null ? postseasonLogs.isError : pastLogs.postseasonFailed;

  // True two-way player check (Ohtani or both significant hitting and pitching volume)
  const isTwoWay = useMemo(() => {
    if (idNum === 660271) return true; // Shohei Ohtani
    if (person?.primaryPosition?.name?.toLowerCase().includes('two-way')) return true;
    const atBats = (hittingSeasonStats?.atBats ?? 0) || (hittingCareerStats?.atBats ?? 0);
    const ip = parseFloat(pitchingSeasonStats?.inningsPitched ?? '0') || parseFloat(pitchingCareerStats?.inningsPitched ?? '0');
    return atBats >= 20 && ip >= 10;
  }, [idNum, person, hittingSeasonStats, hittingCareerStats, pitchingSeasonStats, pitchingCareerStats]);

  const hasHitting = !!(hittingSeasonStats || hittingCareerStats);
  const hasPitching = !!(pitchingSeasonStats || pitchingCareerStats);

  const effectiveRole =
    roleTab !== 'auto'
      ? roleTab
      : person?.primaryPosition?.type === 'Pitcher'
      ? 'pitching'
      : 'hitting';

  // Postseason lines exist for big league games only, and load when asked for
  const isPostseasonView = gameScope === 'postseason' && level === MLB_SPORT_ID;
  const postseasonSeason = latestPostseasonSeason();
  const postseasonStats = usePlayerPostseasonStatsQuery(idNum, postseasonSeason, isPostseasonView);
  const postseasonGroups = postseasonStats.data?.people?.[0]?.stats as PlayerStatGroup[] | undefined;
  const postseasonLine = (group: 'hitting' | 'pitching') =>
    getLevelStat(postseasonGroups, group, statTypeTab, MLB_SPORT_ID);

  const activeHittingStats = isPostseasonView
    ? postseasonLine('hitting')
    : statTypeTab === 'season'
    ? hittingSeasonStats
    : hittingCareerStats;
  const activePitchingStats = isPostseasonView
    ? postseasonLine('pitching')
    : statTypeTab === 'season'
    ? pitchingSeasonStats
    : pitchingCareerStats;
  const statsTitle = (group: 'hitting' | 'pitching') => {
    const key = `player.${isPostseasonView ? 'postseason_' : ''}${statTypeTab}_${group}_title` as TranslationKey;
    return t(key, { season: isPostseasonView ? postseasonSeason : getCurrentMlbSeason() });
  };

  // Derived pitching stats (FIP / FIP+)
  const derivedFip = useMemo(() => {
    if (pitchingSabermetrics?.fip !== undefined) return pitchingSabermetrics.fip;
    if (!activePitchingStats) return null;
    const hr = activePitchingStats.homeRuns ?? 0;
    const bb = activePitchingStats.baseOnBalls ?? 0;
    const hbp = activePitchingStats.hitBatsmen ?? 0;
    const k = activePitchingStats.strikeOuts ?? 0;
    const ip = parseFloat(activePitchingStats.inningsPitched ?? '0');
    if (!ip || ip <= 0) return null;
    return (13 * hr + 3 * (bb + hbp) - 2 * k) / ip + 3.10;
  }, [pitchingSabermetrics, activePitchingStats]);

  const derivedFipPlus = useMemo(() => {
    if (pitchingSabermetrics?.fipMinus !== undefined && pitchingSabermetrics.fipMinus > 0) {
      return (100 / pitchingSabermetrics.fipMinus) * 100;
    }
    if (derivedFip && derivedFip > 0) {
      return (4.15 / derivedFip) * 100;
    }
    return null;
  }, [pitchingSabermetrics, derivedFip]);

  // Derived hitting OPS+ / wRC+
  const derivedOpsPlus = useMemo(() => {
    if (hittingSabermetrics?.wRcPlus !== undefined) return hittingSabermetrics.wRcPlus;
    if (!activeHittingStats) return null;
    const obp = parseFloat(activeHittingStats.obp || '0');
    const slg = parseFloat(activeHittingStats.slg || '0');
    if (!obp && !slg) return null;
    const val = 100 * (obp / 0.315 + slg / 0.400 - 1);
    return Math.max(0, val);
  }, [hittingSabermetrics, activeHittingStats]);

  // Birthplace as the API spells it: city, state or province, country
  const birthPlace = [person?.birthCity, person?.birthStateProvince, person?.birthCountry].filter(Boolean).join(', ');

  // Primary name is always English; the dictionary Chinese name (when
  // available) shows as a secondary line in either language mode
  const primaryName = person?.fullName || zhPlayerMeta?.nameEn || 'MLB Player';
  const secondaryName = zhPlayerMeta?.nameZh || '';

  // Seasons at the level shown, in the role shown; a player with lines in
  // only one role gets that one
  const yearsRole: 'hitting' | 'pitching' =
    effectiveRole === 'pitching' ? (hasPitching ? 'pitching' : 'hitting') : hasHitting ? 'hitting' : 'pitching';
  const yearsRows = useMemo(() => yearRows(yearGroups, yearsRole, level), [yearGroups, yearsRole, level]);

  // The whole season's log is on hand; ten rows show until expanded
  const roleGameLogs = effectiveRole === 'pitching' ? sortedPitchingGameLogs : sortedHittingGameLogs;
  const logViewKey = `${idNum}:${effectiveRole}:${logSeason ?? 'current'}`;
  const logFilter = logFilterChoice?.key === logViewKey ? logFilterChoice.filter : DEFAULT_GAME_LOG_FILTER;
  const logsExpanded = logsExpandedFor === logViewKey;
  const logFilterOptions = useMemo(() => getGameLogFilterOptions(roleGameLogs), [roleGameLogs]);
  const filteredGameLogs = useMemo(() => filterGameLogs(roleGameLogs, logFilter), [roleGameLogs, logFilter]);
  const logFiltered = isFilterActive(logFilter);
  const activeGameLogs = logsExpanded ? filteredGameLogs : filteredGameLogs.slice(0, 10);
  const hittingTotals = logFiltered && effectiveRole !== 'pitching' ? sumHitting(filteredGameLogs) : null;
  const pitchingTotals = logFiltered && effectiveRole === 'pitching' ? sumPitching(filteredGameLogs) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Back Button */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-main transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{t('player.back')}</span>
      </Link>

      {/* Player Header Banner (Renders immediately using local or remote metadata) */}
      <div className="bg-card border border-border rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          <img
            src={getPlayerHeadshotUrl(idNum)}
            alt={primaryName}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-page object-cover border-2 border-border shadow-md"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="96" height="96" fill="%2394a3b8" viewBox="0 0 16 16"%3E%3Cpath d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"%3E%3C/path%3E%3Cpath fill-rule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z"%3E%3C/path%3E%3C/svg%3E';
            }}
          />
          <div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black text-main">
                {primaryName}
              </h1>
              {person?.primaryNumber && (
                <span className="text-sm font-mono px-2 py-0.5 rounded bg-team-primary/20 text-team-primary font-bold">
                  #{person.primaryNumber}
                </span>
              )}
              {isTwoWay && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold">
                  {t('player.two_way')}
                </span>
              )}
            </div>

            {(secondaryName || (zhPlayerMeta?.nicknames.length ?? 0) > 0) && (
              <p className="text-sm text-muted mt-0.5">
                {secondaryName}{' '}
                {zhPlayerMeta && zhPlayerMeta.nicknames.length > 0
                  ? `(${zhPlayerMeta.nicknames.slice(0, 3).join(' / ')})`
                  : ''}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3 text-xs text-muted">
              {person?.currentTeam ? (
                (() => {
                  const mlbTeam = teamsData.find((t) => t.id === person.currentTeam.id);
                  const parentOrgMlbTeam = person.currentTeam.parentOrgId
                    ? teamsData.find((t) => t.id === person.currentTeam.parentOrgId)
                    : null;

                  if (mlbTeam) {
                    return (
                      <TeamHoverCard teamId={person.currentTeam.id}>
                        <Link
                          to={`/teams/${person.currentTeam.id}`}
                          className="flex items-center gap-1.5 font-semibold text-main hover:text-team-primary"
                        >
                          <img
                            src={getTeamLogoUrl(person.currentTeam.id)}
                            alt={person.currentTeam.name}
                            className="w-4 h-4 object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          <span>{lang === 'zh' ? mlbTeam.nameZh : mlbTeam.name}</span>
                        </Link>
                      </TeamHoverCard>
                    );
                  }

                  // Minor league or affiliate team
                  return (
                    <span className="flex flex-wrap items-center gap-1.5 font-medium text-main">
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-500 text-[10px] font-bold">
                        {person.currentTeam.sport?.name || 'MiLB'}
                      </span>
                      <span>{person.currentTeam.name}</span>
                      {parentOrgMlbTeam && (
                        <span className="text-muted text-xs">
                          (
                          <TeamHoverCard teamId={parentOrgMlbTeam.id}>
                            <Link
                              to={`/teams/${parentOrgMlbTeam.id}`}
                              className="text-team-primary hover:underline font-semibold"
                            >
                              {lang === 'zh' ? parentOrgMlbTeam.nameZh : parentOrgMlbTeam.name}
                            </Link>
                          </TeamHoverCard>
                          {lang === 'zh' ? ' 旗下' : ' affiliate'})
                        </span>
                      )}
                    </span>
                  );
                })()
              ) : zhPlayerMeta?.team ? (
                <span className="font-semibold text-team-primary">{zhPlayerMeta.team}</span>
              ) : null}

              {person?.primaryPosition && (
                <>
                  <span>&bull;</span>
                  <span>{t('player.position')}：{person.primaryPosition.name}</span>
                </>
              )}
              {person?.pitchHand && person?.batSide && (
                <>
                  <span>&bull;</span>
                  <span>
                    {t('player.throw_bat')}：{person.pitchHand.code}/{person.batSide.code}
                  </span>
                </>
              )}
              {person?.currentAge && (
                <>
                  <span>&bull;</span>
                  <span>{t('player.age')}：{person.currentAge} {t('player.age_unit')}</span>
                </>
              )}
              {person?.height && person?.weight && (
                <>
                  <span>&bull;</span>
                  <span>
                    {t('player.physique')}：{formatPhysique(person.height, person.weight, lang)}
                  </span>
                </>
              )}
              {formatBirthDate(person?.birthDate, lang) && (
                <>
                  <span>&bull;</span>
                  <span>
                    {t('player.born')}：{formatBirthDate(person?.birthDate, lang)}
                    {birthPlace && (lang === 'zh' ? `（${birthPlace}）` : ` (${birthPlace})`)}
                    {daysUntilBirthday(person?.birthDate) === 0 && ` 🎂 ${t('player.birthday_today')}`}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Add to the comparison page's list and open it */}
          <button
            type="button"
            onClick={() => navigate(`/compare?players=${addToComparison(loadComparison(), idNum).join(',')}`)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border bg-page border-border text-muted hover:text-main hover:border-team-primary transition-all"
          >
            <Columns3 className="w-4 h-4" />
            <span>{t('player.compare_btn')}</span>
          </button>

          {/* Favorite Button */}
          <button
            onClick={() =>
              toggleFavoritePlayer(idNum, {
                nameZh: zhPlayerMeta?.nameZh,
                nameEn: person?.fullName,
              })
            }
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
              isFav
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-500 shadow-sm'
                : 'bg-page border-border text-muted hover:text-main hover:border-team-primary'
            }`}
          >
            <Star className={`w-4 h-4 ${isFav ? 'fill-amber-500 text-amber-500' : ''}`} />
            <span>{isFav ? t('player.fav_active') : t('player.fav_btn')}</span>
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="bg-card border border-border rounded-2xl p-8 h-64 animate-pulse" />
      )}

      {isError && (
        <div className="bg-card border border-border rounded-2xl p-8 text-center text-rose-500 text-sm">
          {t('player.load_error')}
        </div>
      )}

      {!isLoading && !isError && person && (
        <>
          {/* Stats Controls & Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-team-primary" />
              <h2 className="text-lg font-bold text-main">{t('player.stats_title')}</h2>
              {/* The label comes from the stats shown, never from the current club */}
              {levels.length === 1 && level !== MLB_SPORT_ID && levelLabel && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-500 font-bold border border-amber-500/30 shadow-sm">
                  {levelLabel}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Level Switcher (MLB / AAA / ...) for a player with more than one level */}
              {levels.length > 1 && (
                <div
                  role="group"
                  aria-label={t('player.level')}
                  className="flex items-center p-1 bg-card border border-border rounded-lg text-xs font-semibold"
                >
                  {levels.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => setLevelChoice({ personId: idNum, level: l.id })}
                      aria-pressed={level === l.id}
                      className={`px-3 py-1 rounded-md transition-colors ${
                        level === l.id ? 'bg-team-primary text-white shadow-sm' : 'text-muted hover:text-main'
                      }`}
                    >
                      {l.abbreviation}
                    </button>
                  ))}
                </div>
              )}

              {/* Regular Season vs Postseason, big league lines only */}
              {level === MLB_SPORT_ID && (
                <div role="group" aria-label={t('player.game_scope_label')} className="flex items-center p-1 bg-card border border-border rounded-lg text-xs font-semibold">
                  {(['regular', 'postseason'] as const).map((scope) => (
                    <button
                      key={scope}
                      type="button"
                      aria-pressed={gameScope === scope}
                      onClick={() => setGameScope(scope)}
                      className={`px-3 py-1 rounded-md transition-colors ${
                        gameScope === scope ? 'bg-team-primary text-white shadow-sm' : 'text-muted hover:text-main'
                      }`}
                    >
                      {t(scope === 'regular' ? 'player.tab_regular' : 'player.tab_postseason')}
                    </button>
                  ))}
                </div>
              )}

              {/* Season vs Career Switcher */}
              <div className="flex items-center p-1 bg-card border border-border rounded-lg text-xs font-semibold">
                <button
                  onClick={() => setStatTypeTab('season')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    statTypeTab === 'season'
                      ? 'bg-team-primary text-white shadow-sm'
                      : 'text-muted hover:text-main'
                  }`}
                >
                  {t('player.tab_season')}
                </button>
                <button
                  onClick={() => setStatTypeTab('career')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    statTypeTab === 'career'
                      ? 'bg-team-primary text-white shadow-sm'
                      : 'text-muted hover:text-main'
                  }`}
                >
                  {t('player.tab_career')}
                </button>
              </div>

              {/* Two-Way Player Hitting / Pitching Switcher */}
              {isTwoWay && (
                <div className="flex items-center p-1 bg-card border border-border rounded-lg text-xs font-semibold">
                  <button
                    onClick={() => setRoleTab('hitting')}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      effectiveRole === 'hitting'
                        ? 'bg-amber-500 text-black font-bold shadow-sm'
                        : 'text-muted hover:text-main'
                    }`}
                  >
                    {t('player.tab_hitting')}
                  </button>
                  <button
                    onClick={() => setRoleTab('pitching')}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      effectiveRole === 'pitching'
                        ? 'bg-amber-500 text-black font-bold shadow-sm'
                        : 'text-muted hover:text-main'
                    }`}
                  >
                    {t('player.tab_pitching')}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Stats Display Cards */}
          <div className="space-y-6">
            {/* Batting Card */}
            {(effectiveRole === 'hitting' || !hasPitching) && activeHittingStats && (
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs text-muted uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-team-primary" />
                    <span>
                      🏏 {statsTitle('hitting')}
                    </span>
                  </h3>
                  <span className="text-xs font-mono text-muted">
                    {t('player.games_played', { count: activeHittingStats.gamesPlayed ?? 0 })} &bull;{' '}
                    {t('player.at_bats', { count: activeHittingStats.atBats ?? 0 })}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                  <div className="p-3.5 bg-page rounded-xl text-center border border-border/50">
                    <span className="text-[11px] text-muted block font-medium">{t('stat.avg')}</span>
                    <span className="text-2xl font-mono font-black text-team-primary">
                      {formatRateStat(activeHittingStats.avg)}
                    </span>
                  </div>
                  <div className="p-3.5 bg-page rounded-xl text-center border border-border/50">
                    <span className="text-[11px] text-muted block font-medium">{t('stat.hr')}</span>
                    <span className="text-2xl font-mono font-black text-main">
                      {activeHittingStats.homeRuns ?? 0}
                    </span>
                  </div>
                  <div className="p-3.5 bg-page rounded-xl text-center border border-border/50">
                    <span className="text-[11px] text-muted block font-medium">{t('stat.rbi')}</span>
                    <span className="text-2xl font-mono font-black text-main">
                      {activeHittingStats.rbi ?? 0}
                    </span>
                  </div>
                  <div className="p-3.5 bg-page rounded-xl text-center border border-border/50">
                    <span className="text-[11px] text-muted block font-medium">{t('stat.ops')}</span>
                    <span className="text-2xl font-mono font-black text-emerald-400">
                      {activeHittingStats.ops ?? '---'}
                    </span>
                  </div>
                  <div className="p-3.5 bg-page rounded-xl text-center border border-border/50">
                    <span className="text-[11px] text-muted block font-medium">{t('stat.hits')}</span>
                    <span className="text-2xl font-mono font-bold text-main">
                      {activeHittingStats.hits ?? 0}
                    </span>
                  </div>
                  <div className="p-3.5 bg-page rounded-xl text-center border border-border/50">
                    <span className="text-[11px] text-muted block font-medium">{t('stat.obp')}</span>
                    <span className="text-2xl font-mono font-bold text-main">
                      {formatRateStat(activeHittingStats.obp)}
                    </span>
                  </div>
                  <div className="p-3.5 bg-page rounded-xl text-center border border-border/50">
                    <span className="text-[11px] text-muted block font-medium">{t('stat.sb')}</span>
                    <span className="text-2xl font-mono font-bold text-main">
                      {activeHittingStats.stolenBases ?? 0}
                    </span>
                  </div>
                </div>

                {/* Advanced Sabermetrics Panel */}
                {/* Postseason lines have no sabermetrics */}
                {!isPostseasonView && (
                <div className="pt-3 border-t border-border/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-main">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>{t('player.advanced_stats_title')}</span>
                    </div>
                    {showLeagueRelative && (
                      <span className="text-[10px] text-muted flex items-center gap-1">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400/80" />
                        {t('stat.league_avg_hint')}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                    {/* WAR */}
                    <div className="p-2.5 bg-page/80 rounded-xl text-center border border-border/40 hover:border-amber-500/30 transition-colors">
                      <span className="text-[10px] text-muted block font-medium">{t('stat.war')}</span>
                      <span
                        className={`text-xl font-mono font-black ${
                          (hittingSabermetrics?.war ?? 0) >= 3.0
                            ? 'text-amber-400'
                            : (hittingSabermetrics?.war ?? 0) >= 1.5
                            ? 'text-emerald-400'
                            : 'text-main'
                        }`}
                      >
                        {formatWar(hittingSabermetrics?.war)}
                      </span>
                    </div>

                    {/* wRC+ / OPS+ */}
                    {showLeagueRelative && (
                      <div className="p-2.5 bg-page/80 rounded-xl text-center border border-border/40 hover:border-amber-500/30 transition-colors">
                        <span className="text-[10px] text-muted block font-medium">{t('stat.wrc_plus')}</span>
                        <div className="flex items-baseline justify-center gap-1">
                          <span
                            className={`text-xl font-mono font-black ${
                              (derivedOpsPlus ?? 0) >= 130
                                ? 'text-emerald-400'
                                : (derivedOpsPlus ?? 0) >= 100
                                ? 'text-team-primary'
                                : 'text-muted'
                            }`}
                          >
                            {formatPlusStat(derivedOpsPlus)}
                          </span>
                          {derivedOpsPlus !== null && (
                            <span className="text-[9px] font-mono text-muted">
                              {derivedOpsPlus >= 100
                                ? `+${Math.round(derivedOpsPlus - 100)}%`
                                : `${Math.round(derivedOpsPlus - 100)}%`}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* OPS */}
                    <div className="p-2.5 bg-page/80 rounded-xl text-center border border-border/40 hover:border-amber-500/30 transition-colors">
                      <span className="text-[10px] text-muted block font-medium">{t('stat.ops')}</span>
                      <span className="text-xl font-mono font-black text-emerald-400">
                        {activeHittingStats.ops ?? '---'}
                      </span>
                    </div>

                    {/* wOBA */}
                    <div className="p-2.5 bg-page/80 rounded-xl text-center border border-border/40 hover:border-amber-500/30 transition-colors">
                      <span className="text-[10px] text-muted block font-medium">{t('stat.woba')}</span>
                      <span className="text-xl font-mono font-bold text-main">
                        {formatWoba(hittingSabermetrics?.woba)}
                      </span>
                    </div>

                    {/* BABIP */}
                    <div className="p-2.5 bg-page/80 rounded-xl text-center border border-border/40 hover:border-amber-500/30 transition-colors">
                      <span className="text-[10px] text-muted block font-medium">{t('stat.babip')}</span>
                      <span className="text-xl font-mono font-bold text-main">
                        {formatRateStat(activeHittingStats.babip || hittingAdvanced?.babip)}
                      </span>
                    </div>

                    {/* ISO */}
                    <div className="p-2.5 bg-page/80 rounded-xl text-center border border-border/40 hover:border-amber-500/30 transition-colors">
                      <span className="text-[10px] text-muted block font-medium">{t('stat.iso')}</span>
                      <span className="text-xl font-mono font-bold text-main">
                        {formatRateStat(
                          hittingAdvanced?.iso ||
                            (activeHittingStats.slg && activeHittingStats.avg
                              ? (parseFloat(activeHittingStats.slg) - parseFloat(activeHittingStats.avg)).toFixed(3)
                              : undefined)
                        )}
                      </span>
                    </div>
                  </div>
                </div>
                )}
              </div>
            )}

            {/* Pitching Card */}
            {(effectiveRole === 'pitching' || !hasHitting) && activePitchingStats && (
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs text-muted uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-team-primary" />
                    <span>
                      ⚾ {statsTitle('pitching')}
                    </span>
                  </h3>
                  <span className="text-xs font-mono text-muted">
                    {t('player.games_played', { count: activePitchingStats.gamesPlayed ?? 0 })} &bull;{' '}
                    {t('player.games_started', { count: activePitchingStats.gamesStarted ?? 0 })}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                  <div className="p-3.5 bg-page rounded-xl text-center border border-border/50">
                    <span className="text-[11px] text-muted block font-medium">{t('stat.era')}</span>
                    <span className="text-2xl font-mono font-black text-team-primary">
                      {formatEra(activePitchingStats.era)}
                    </span>
                  </div>
                  <div className="p-3.5 bg-page rounded-xl text-center border border-border/50">
                    <span className="text-[11px] text-muted block font-medium">{t('stat.wl')}</span>
                    <span className="text-2xl font-mono font-black text-main">
                      {activePitchingStats.wins ?? 0}-{activePitchingStats.losses ?? 0}
                    </span>
                  </div>
                  <div className="p-3.5 bg-page rounded-xl text-center border border-border/50">
                    <span className="text-[11px] text-muted block font-medium">{t('stat.so')}</span>
                    <span className="text-2xl font-mono font-black text-main">
                      {activePitchingStats.strikeOuts ?? 0}
                    </span>
                  </div>
                  <div className="p-3.5 bg-page rounded-xl text-center border border-border/50">
                    <span className="text-[11px] text-muted block font-medium">{t('stat.whip')}</span>
                    <span className="text-2xl font-mono font-black text-emerald-400">
                      {formatWhip(activePitchingStats.whip)}
                    </span>
                  </div>
                  <div className="p-3.5 bg-page rounded-xl text-center border border-border/50">
                    <span className="text-[11px] text-muted block font-medium">{t('stat.ip')}</span>
                    <span className="text-2xl font-mono font-bold text-main">
                      {activePitchingStats.inningsPitched ?? '0.0'}
                    </span>
                  </div>
                  <div className="p-3.5 bg-page rounded-xl text-center border border-border/50">
                    <span className="text-[11px] text-muted block font-medium">{t('stat.h_allowed')}</span>
                    <span className="text-2xl font-mono font-bold text-main">
                      {activePitchingStats.hits ?? 0}
                    </span>
                  </div>
                  <div className="p-3.5 bg-page rounded-xl text-center border border-border/50">
                    <span className="text-[11px] text-muted block font-medium">{t('stat.sv')}</span>
                    <span className="text-2xl font-mono font-bold text-main">
                      {activePitchingStats.saves ?? 0}
                    </span>
                  </div>
                </div>

                {/* Advanced Sabermetrics Panel */}
                {/* Postseason lines have no sabermetrics */}
                {!isPostseasonView && (
                <div className="pt-3 border-t border-border/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-main">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>{t('player.advanced_stats_title')}</span>
                    </div>
                    {showLeagueRelative && (
                      <span className="text-[10px] text-muted flex items-center gap-1">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400/80" />
                        {t('stat.league_avg_hint')}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                    {/* WAR */}
                    <div className="p-2.5 bg-page/80 rounded-xl text-center border border-border/40 hover:border-amber-500/30 transition-colors">
                      <span className="text-[10px] text-muted block font-medium">{t('stat.war')}</span>
                      <span
                        className={`text-xl font-mono font-black ${
                          (pitchingSabermetrics?.war ?? 0) >= 3.0
                            ? 'text-amber-400'
                            : (pitchingSabermetrics?.war ?? 0) >= 1.5
                            ? 'text-emerald-400'
                            : 'text-main'
                        }`}
                      >
                        {formatWar(pitchingSabermetrics?.war ?? pitchingSabermetrics?.ra9War)}
                      </span>
                    </div>

                    {showLeagueRelative && (
                      <>
                        {/* FIP */}
                        <div className="p-2.5 bg-page/80 rounded-xl text-center border border-border/40 hover:border-amber-500/30 transition-colors">
                          <span className="text-[10px] text-muted block font-medium">{t('stat.fip')}</span>
                          <span className="text-xl font-mono font-black text-team-primary">
                            {formatFip(derivedFip)}
                          </span>
                        </div>

                        {/* FIP+ */}
                        <div className="p-2.5 bg-page/80 rounded-xl text-center border border-border/40 hover:border-amber-500/30 transition-colors">
                          <span className="text-[10px] text-muted block font-medium">{t('stat.fip_plus')}</span>
                          <div className="flex items-baseline justify-center gap-1">
                            <span
                              className={`text-xl font-mono font-black ${
                                (derivedFipPlus ?? 0) >= 125
                                  ? 'text-emerald-400'
                                  : (derivedFipPlus ?? 0) >= 100
                                  ? 'text-team-primary'
                                  : 'text-muted'
                              }`}
                            >
                              {formatPlusStat(derivedFipPlus)}
                            </span>
                            {derivedFipPlus !== null && (
                              <span className="text-[9px] font-mono text-muted">
                                {derivedFipPlus >= 100
                                  ? `+${Math.round(derivedFipPlus - 100)}%`
                                  : `${Math.round(derivedFipPlus - 100)}%`}
                              </span>
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    {/* xFIP */}
                    <div className="p-2.5 bg-page/80 rounded-xl text-center border border-border/40 hover:border-amber-500/30 transition-colors">
                      <span className="text-[10px] text-muted block font-medium">{t('stat.xfip')}</span>
                      <span className="text-xl font-mono font-bold text-main">
                        {formatFip(pitchingSabermetrics?.xfip)}
                      </span>
                    </div>

                    {/* K/9 */}
                    <div className="p-2.5 bg-page/80 rounded-xl text-center border border-border/40 hover:border-amber-500/30 transition-colors">
                      <span className="text-[10px] text-muted block font-medium">{t('stat.k9')}</span>
                      <span className="text-xl font-mono font-bold text-main">
                        {formatPer9(activePitchingStats.strikeoutsPer9Inn || pitchingAdvanced?.strikeoutsPer9)}
                      </span>
                    </div>

                    {/* BB/9 */}
                    <div className="p-2.5 bg-page/80 rounded-xl text-center border border-border/40 hover:border-amber-500/30 transition-colors">
                      <span className="text-[10px] text-muted block font-medium">{t('stat.bb9')}</span>
                      <span className="text-xl font-mono font-bold text-main">
                        {formatPer9(activePitchingStats.walksPer9Inn || pitchingAdvanced?.baseOnBallsPer9)}
                      </span>
                    </div>
                  </div>
                </div>
                )}
              </div>
            )}

            {/* If no hitting or pitching stats exist */}
            {isPostseasonView && postseasonStats.isLoading && (
              <div className="bg-card border border-border rounded-2xl h-48 animate-pulse" />
            )}
            {isPostseasonView && postseasonStats.isError && (
              <div className="bg-card border border-border rounded-2xl p-8 text-center text-sm text-rose-500">
                {t('player.postseason_stats_error')}
              </div>
            )}
            {isPostseasonView && postseasonStats.isSuccess && !activeHittingStats && !activePitchingStats && (
              <div className="bg-card border border-border rounded-2xl p-8 text-center text-sm text-muted">
                {statTypeTab === 'season'
                  ? t('player.postseason_none_season', { season: postseasonSeason })
                  : t('player.postseason_none_career')}
              </div>
            )}
            {!isPostseasonView && !activeHittingStats && !activePitchingStats && (
              <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-3 shadow-sm">
                <div className="text-4xl">🌱</div>
                <h3 className="text-base font-bold text-main">
                  {lang === 'zh' ? '尚無出賽數據' : 'No Statistics Available'}
                </h3>
                <p className="text-xs text-muted max-w-md mx-auto leading-relaxed">
                  {lang === 'zh'
                    ? `${primaryName} 目前尚未記錄到常規賽統計數據。`
                    : `No regular season statistics have been recorded for ${primaryName} yet.`}
                </p>
              </div>
            )}
          </div>

          {/* Game Logs / Transactions, one tab at a time */}
          <div className="space-y-4">
            <div className="flex items-end justify-between gap-3 border-b border-border">
              <div
                role="tablist"
                aria-label={t('player.history_tabs')}
                className="flex items-end gap-4 sm:gap-6"
                onKeyDown={(e) => {
                  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
                  const at = HISTORY_TABS.findIndex((tab) => tab.key === historyTab);
                  const step = e.key === 'ArrowRight' ? 1 : HISTORY_TABS.length - 1;
                  const next = HISTORY_TABS[(at + step) % HISTORY_TABS.length].key;
                  setHistoryTab(next);
                  document.getElementById(`player-tab-${next}`)?.focus();
                }}
              >
                {HISTORY_TABS.map(({ key, Icon, title, short }) => {
                  const selected = historyTab === key;
                  return (
                    <button
                      key={key}
                      id={`player-tab-${key}`}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      aria-controls={`player-panel-${key}`}
                      tabIndex={selected ? 0 : -1}
                      onClick={() => setHistoryTab(key)}
                      className={`flex items-center gap-2 pb-3 -mb-px border-b-2 font-bold transition-colors ${
                        selected
                          ? 'border-team-primary text-main'
                          : 'border-transparent text-muted hover:text-main'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${selected ? 'text-team-primary' : ''}`} />
                      {/* Three full titles side by side need a wide screen */}
                      <span className="hidden lg:inline text-lg">{t(title)}</span>
                      <span className="lg:hidden text-base">{t(short)}</span>
                    </button>
                  );
                })}
              </div>
              {historyTab === 'logs' && (
                <span className="hidden sm:inline text-xs text-muted pb-3 shrink-0">
                  {effectiveRole === 'pitching' ? t('player.pitching_logs') : t('player.hitting_logs')}
                </span>
              )}
              {historyTab === 'years' && (
                <span className="hidden sm:inline text-xs text-muted pb-3 shrink-0">
                  {yearsRole === 'pitching' ? t('player.years_pitching') : t('player.years_hitting')}
                </span>
              )}
            </div>

            {historyTab === 'years' && (
              <div role="tabpanel" id="player-panel-years" aria-labelledby="player-tab-years">
                <YearByYearTable
                  rows={yearsRows}
                  career={yearsRole === 'pitching' ? pitchingCareerStats : hittingCareerStats}
                  role={yearsRole}
                  isLoading={yearByYear.isLoading}
                  isError={yearByYear.isError}
                />
              </div>
            )}

            {historyTab === 'transactions' && (
              <div role="tabpanel" id="player-panel-transactions" aria-labelledby="player-tab-transactions">
                <PlayerTransactions personId={idNum} />
              </div>
            )}

            <div
              role="tabpanel"
              id="player-panel-logs"
              aria-labelledby="player-tab-logs"
              hidden={historyTab !== 'logs'}
              className="space-y-3"
            >
              {pastSeasons.length > 0 && (
                <label className="flex items-center gap-2 text-xs text-muted">
                  {t('player.logs_season')}
                  <select
                    value={logSeason ?? ''}
                    onChange={(e) =>
                      setLogSeasonChoice(e.target.value ? { personId: idNum, season: Number(e.target.value) } : null)
                    }
                    className="rounded-lg border border-border bg-card px-2 py-1 text-xs text-main focus:outline-none focus:border-team-primary"
                  >
                    <option value="">{t('player.logs_this_season', { season: currentSeason })}</option>
                    {pastSeasons.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {pastLogs.isError && logSeason !== null && (
                <p className="text-[11px] text-rose-500">{t('player.logs_season_error', { season: logSeason })}</p>
              )}
              {postseasonLogsFailed && (
                <p className="text-[11px] text-amber-500">{t('player.postseason_logs_error')}</p>
              )}
              {roleGameLogs.length > 0 && (
                <GameLogFilterBar
                  options={logFilterOptions}
                  filter={logFilter}
                  onChange={(filter) => setLogFilterChoice({ key: logViewKey, filter })}
                />
              )}

              <div className="bg-card border border-border rounded-2xl overflow-x-auto shadow-sm">
                <table className="w-full text-xs text-left font-mono">
                  <thead>
                    <tr className="border-b border-border text-muted text-[11px] bg-page/60">
                      <th className="py-3 px-4 font-medium">{lang === 'zh' ? '日期' : 'Date'}</th>
                      <th className="py-3 px-3 font-medium">
                        {lang === 'zh' ? '所屬 / 對戰' : 'Team / Matchup'}
                      </th>
                      {effectiveRole === 'pitching' ? (
                        <>
                          <th className="py-3 px-2 text-center font-medium">{lang === 'zh' ? '結果' : 'Dec'}</th>
                          <th className="py-3 px-2 text-center font-medium">{lang === 'zh' ? '局數' : 'IP'}</th>
                          <th className="py-3 px-2 text-center font-medium">{lang === 'zh' ? '安打' : 'H'}</th>
                          <th className="py-3 px-2 text-center font-medium">{lang === 'zh' ? '失分' : 'R'}</th>
                          <th className="py-3 px-2 text-center font-medium">{lang === 'zh' ? '責失' : 'ER'}</th>
                          <th className="py-3 px-2 text-center font-medium">{lang === 'zh' ? '三振' : 'K'}</th>
                          <th className="py-3 px-2 text-center font-medium">{lang === 'zh' ? '保送' : 'BB'}</th>
                          <th className="py-3 px-2 text-center font-medium">ERA</th>
                        </>
                      ) : (
                        <>
                          <th className="py-3 px-2 text-center font-medium">{lang === 'zh' ? '打數' : 'AB'}</th>
                          <th className="py-3 px-2 text-center font-medium">{lang === 'zh' ? '得分' : 'R'}</th>
                          <th className="py-3 px-2 text-center font-medium">{lang === 'zh' ? '安打' : 'H'}</th>
                          <th className="py-3 px-2 text-center font-medium">{lang === 'zh' ? '打點' : 'RBI'}</th>
                          <th className="py-3 px-2 text-center font-medium">{lang === 'zh' ? '全壘打' : 'HR'}</th>
                          <th className="py-3 px-2 text-center font-medium">{lang === 'zh' ? '保送' : 'BB'}</th>
                          <th className="py-3 px-2 text-center font-medium">{lang === 'zh' ? '三振' : 'SO'}</th>
                          <th className="py-3 px-2 text-center font-medium">AVG</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {(hittingTotals || pitchingTotals) && filteredGameLogs.length > 0 && (
                      <tr className="bg-team-primary/10 font-bold text-main whitespace-nowrap">
                        <td colSpan={2} className="py-2.5 px-4 font-sans">
                          {t('player.filter_total', { count: filteredGameLogs.length })}
                          <span className="ml-2 font-mono font-semibold text-muted">
                            {hittingTotals ? `OPS ${hittingTotals.ops}` : `WHIP ${pitchingTotals!.whip}`}
                          </span>
                        </td>
                        {pitchingTotals ? (
                          <>
                            <td className="py-2.5 px-2 text-center">{pitchingTotals.record}</td>
                            <td className="py-2.5 px-2 text-center">{pitchingTotals.inningsPitched}</td>
                            <td className="py-2.5 px-2 text-center">{pitchingTotals.hits}</td>
                            <td className="py-2.5 px-2 text-center">{pitchingTotals.runs}</td>
                            <td className="py-2.5 px-2 text-center">{pitchingTotals.earnedRuns}</td>
                            <td className="py-2.5 px-2 text-center">{pitchingTotals.strikeOuts}</td>
                            <td className="py-2.5 px-2 text-center">{pitchingTotals.baseOnBalls}</td>
                            <td className="py-2.5 px-2 text-center text-team-primary">{pitchingTotals.era}</td>
                          </>
                        ) : (
                          hittingTotals && (
                            <>
                              <td className="py-2.5 px-2 text-center">{hittingTotals.atBats}</td>
                              <td className="py-2.5 px-2 text-center">{hittingTotals.runs}</td>
                              <td className="py-2.5 px-2 text-center">{hittingTotals.hits}</td>
                              <td className="py-2.5 px-2 text-center">{hittingTotals.rbi}</td>
                              <td className="py-2.5 px-2 text-center">{hittingTotals.homeRuns}</td>
                              <td className="py-2.5 px-2 text-center">{hittingTotals.baseOnBalls}</td>
                              <td className="py-2.5 px-2 text-center">{hittingTotals.strikeOuts}</td>
                              <td className="py-2.5 px-2 text-center text-team-primary">{hittingTotals.avg}</td>
                            </>
                          )
                        )}
                      </tr>
                    )}
                    {activeGameLogs.map((log: GameLogSplit, idx: number) => {
                      const oppTeam = teamsData.find((t) => t.id === log.opponent?.id);
                      const oppDisplayName =
                        lang === 'zh' ? oppTeam?.nameZh || log.opponent?.name : log.opponent?.name || 'MLB';

                      // The team he played FOR that day: the only way to read a
                      // log that spans a mid-season trade
                      const ownTeam = teamsData.find((t) => t.id === log.team?.id);
                      const ownDisplayName =
                        (lang === 'zh' ? ownTeam?.nameZh : ownTeam?.name) || log.team?.name || '';
                      const gamePk = log.game?.gamePk;

                      return (
                        <tr key={idx} className="hover:bg-card-hover/50 transition-colors">
                          <td className="py-2.5 px-4 text-main font-semibold">
                            {gamePk ? (
                              <Link
                                to={`/games/${gamePk}`}
                                className="hover:text-team-primary hover:underline transition-colors"
                                title={t('game.open_full_box')}
                              >
                                {log.date}
                              </Link>
                            ) : (
                              log.date
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center gap-1.5">
                              {isPostseasonGameType(log.gameType) && (
                                <span
                                  className="px-1 rounded bg-team-primary/15 text-team-primary text-[9px] font-bold shrink-0"
                                  title={t('player.postseason_title')}
                                >
                                  {t('player.postseason_badge')}
                                </span>
                              )}
                              {log.sport?.id !== undefined && log.sport.id !== MLB_SPORT_ID && (
                                <span className="px-1 rounded bg-amber-500/15 text-amber-500 text-[9px] font-bold shrink-0">
                                  {log.sport.abbreviation}
                                </span>
                              )}
                              {/* The team he played for reads as an abbreviation,
                                  not a crest: a crest that fails to load would
                                  take the whole answer with it */}
                              <span
                                className="text-main text-[11px] font-bold shrink-0 w-8"
                                title={ownDisplayName}
                              >
                                {ownTeam?.abbrev || log.team?.name?.slice(0, 3).toUpperCase() || '—'}
                              </span>
                              <span className="text-muted text-[10px] font-medium shrink-0">
                                {log.isHome === false ? '@' : log.isHome ? 'vs' : '-'}
                              </span>
                              {oppTeam ? (
                                <TeamHoverCard teamId={oppTeam.id}>
                                  <Link
                                    to={`/teams/${oppTeam.id}`}
                                    className="inline-flex items-center gap-1.5 hover:text-team-primary hover:underline font-semibold text-main transition-colors group"
                                  >
                                    <img
                                      src={getTeamLogoUrl(oppTeam.id)}
                                      alt={oppDisplayName}
                                      className="w-4 h-4 object-contain shrink-0 group-hover:scale-110 transition-transform"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                      }}
                                    />
                                    <span className="truncate max-w-[92px] sm:max-w-none">
                                      {oppDisplayName}
                                    </span>
                                  </Link>
                                </TeamHoverCard>
                              ) : (
                                <span className="text-muted font-medium truncate max-w-[92px] sm:max-w-none">
                                  {oppDisplayName}
                                </span>
                              )}
                            </span>
                          </td>
                          {effectiveRole === 'pitching' ? (
                            <>
                              <td className="py-2.5 px-2 text-center font-bold text-main">
                                {getPitchingDecision(log.stat)}
                              </td>
                              <td className="py-2.5 px-2 text-center">{log.stat?.inningsPitched}</td>
                              <td className="py-2.5 px-2 text-center">{log.stat?.hits}</td>
                              <td className="py-2.5 px-2 text-center">{log.stat?.runs}</td>
                              <td className="py-2.5 px-2 text-center">{log.stat?.earnedRuns}</td>
                              <td className="py-2.5 px-2 text-center font-bold text-team-primary">
                                {log.stat?.strikeOuts}
                              </td>
                              <td className="py-2.5 px-2 text-center">{log.stat?.baseOnBalls}</td>
                              <td className="py-2.5 px-2 text-center">{log.stat?.era}</td>
                            </>
                          ) : (
                            <>
                              <td className="py-2.5 px-2 text-center">{log.stat?.atBats}</td>
                              <td className="py-2.5 px-2 text-center">{log.stat?.runs}</td>
                              <td className="py-2.5 px-2 text-center font-bold text-team-primary">
                                {log.stat?.hits}
                              </td>
                              <td className="py-2.5 px-2 text-center">{log.stat?.rbi}</td>
                              <td className="py-2.5 px-2 text-center font-bold text-main">
                                {log.stat?.homeRuns}
                              </td>
                              <td className="py-2.5 px-2 text-center">{log.stat?.baseOnBalls}</td>
                              <td className="py-2.5 px-2 text-center">{log.stat?.strikeOuts}</td>
                              <td className="py-2.5 px-2 text-center font-semibold text-main">
                                {log.stat?.avg}
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                    {activeGameLogs.length === 0 && (
                      <tr>
                        <td colSpan={10} className="py-8 text-center text-muted font-sans">
                          {logsLoading
                            ? '…'
                            : roleGameLogs.length > 0
                            ? t('player.filter_no_match')
                            : t('player.empty_logs')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {filteredGameLogs.length > 10 && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setLogsExpandedFor(logsExpanded ? null : logViewKey)}
                    className="text-xs font-semibold text-team-primary hover:underline"
                  >
                    {logsExpanded
                      ? t('player.logs_collapse')
                      : t('player.logs_show_all', { count: filteredGameLogs.length })}
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
