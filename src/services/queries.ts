import { useMemo } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import {
  getSchedule,
  getStandings,
  getTeamRoster,
  getTeamDetail,
  getTeamSchedule,
  getGameSchedule,
  getGameBoxscore,
  getVenue,
  getPlayerDetail,
  getPlayerTransactions,
  getPlayerSeasons,
  getPlayerSeasonGameLogs,
  getLeagueTransactions,
  getAwardRecipients,
  getPersonSummary,
  getPlayersForComparison,
  searchPeople,
  getLeaderboards,
  getPeopleBatch,
  getFavoritePlayersGameLog,
  getPostseasonGameLogs,
  withPostseasonGameLogs,
  getPostseasonSeries,
  getTeamPreviousGame,
  getPlayerPostseasonStats,
  getPostseasonPlayerStats,
} from './mlbApi';
import { getCurrentMlbSeason, mayHavePostseasonGames } from '../utils/season';
import { MLB_SPORT_ID } from '../constants/levels';
import { formatApiDate } from '../utils/timezone';
import { buildPostseasonLeaders } from '../utils/postseasonLeaders';
import { ScheduleResponse } from '../types/mlb';

/** True when any game in the schedule response is currently live */
export function scheduleHasLiveGames(data?: ScheduleResponse): boolean {
  const games = data?.dates?.[0]?.games ?? [];
  return games.some((g) => g?.status?.abstractGameState === 'Live');
}

export function useScheduleQuery(date: string, enabled: boolean = true, sportId: number = MLB_SPORT_ID) {
  return useQuery({
    queryKey: ['schedule', date, sportId],
    queryFn: () => getSchedule(date, sportId),
    enabled,
    // Poll only while games are actually live; idle days stay quiet
    refetchInterval: (query) => (scheduleHasLiveGames(query.state.data) ? 30000 : false),
    staleTime: (query) => (scheduleHasLiveGames(query.state.data) ? 20000 : 300000), // 20s or 5min
  });
}

export function useStandingsQuery(season?: number, leagueIds?: readonly number[], enabled: boolean = true) {
  return useQuery({
    queryKey: ['standings', season, leagueIds?.join(',')],
    queryFn: () => getStandings(season, leagueIds),
    enabled,
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
}

/**
 * Postseason series for the bracket. A past postseason never changes; the
 * current one moves at most a few times a day, and live scores are the
 * scoreboard's job, so the bracket does not poll.
 */
export function usePostseasonQuery(season: number) {
  return useQuery({
    queryKey: ['postseason', season],
    queryFn: () => getPostseasonSeries(season),
    staleTime: season < getCurrentMlbSeason() ? 1000 * 60 * 60 * 24 : 1000 * 60 * 5, // 24 hours or 5 minutes
  });
}

export function useTeamRosterQuery(teamId?: number, rosterType: string = 'active') {
  return useQuery({
    queryKey: ['team-roster', teamId, rosterType],
    queryFn: () => getTeamRoster(teamId!, rosterType),
    enabled: !!teamId,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useTeamDetailQuery(teamId?: number) {
  return useQuery({
    queryKey: ['team-detail', teamId],
    queryFn: () => getTeamDetail(teamId!),
    enabled: !!teamId,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}

/**
 * A team's recent and upcoming games. A minor league club's games live under
 * its own sportId, so the query waits until the level is known.
 */
export function useTeamScheduleQuery(teamId?: number, sportId?: number) {
  // Query 35 days in the past up to 2 days ahead
  const pastDate = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000);
  const futureDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
  const startDate = formatApiDate(pastDate);
  const endDate = formatApiDate(futureDate);

  return useQuery({
    queryKey: ['team-schedule', teamId, startDate, endDate, sportId],
    queryFn: () => getTeamSchedule(teamId!, startDate, endDate, sportId),
    enabled: !!teamId && sportId !== undefined,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Single game schedule entry, used by the game detail page header.
 * Shares `scheduleHasLiveGames` with the daily scoreboard so a live game keeps
 * the same 30s cadence everywhere.
 */
export function useGameScheduleQuery(gamePk?: number) {
  return useQuery({
    queryKey: ['game-schedule', gamePk],
    queryFn: () => getGameSchedule(gamePk!),
    enabled: !!gamePk,
    refetchInterval: (query) => (scheduleHasLiveGames(query.state.data) ? 30000 : false),
    staleTime: (query) => (scheduleHasLiveGames(query.state.data) ? 20000 : 1000 * 60 * 30),
  });
}

/**
 * Box score for a game. Completed games are effectively immutable, so they stay
 * cached for 30 minutes; a live game polls alongside the scoreboard instead.
 */
export function useGameBoxscoreQuery(gamePk?: number, isLive: boolean = false) {
  return useQuery({
    queryKey: ['game-boxscore', gamePk],
    queryFn: () => getGameBoxscore(gamePk!),
    enabled: !!gamePk,
    refetchInterval: isLive ? 30000 : false,
    staleTime: isLive ? 20000 : 1000 * 60 * 30, // 30 minutes for completed games
  });
}

/**
 * Dimensions of a park not built into src/data/venues.json (a game away from
 * the 30 clubs' homes). Remodelled between seasons at most, so effectively
 * static for the session.
 */
export function useVenueQuery(venueId?: number) {
  return useQuery({
    queryKey: ['venue', venueId],
    queryFn: () => getVenue(venueId!),
    enabled: !!venueId,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}

export function usePlayerDetailQuery(personId?: number) {
  return useQuery({
    queryKey: ['player-detail', personId],
    queryFn: () => getPlayerDetail(personId!),
    enabled: !!personId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/** A player's roster moves; they change a few times a season at most */
export function usePlayerTransactionsQuery(personId?: number) {
  return useQuery({
    queryKey: ['player-transactions', personId],
    queryFn: () => getPlayerTransactions(personId!),
    enabled: !!personId,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

/** A player's name, position and current club, for the hover card */
export function usePersonSummaryQuery(personId?: number) {
  return useQuery({
    queryKey: ['person-summary', personId],
    queryFn: () => getPersonSummary(personId!),
    enabled: !!personId,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

/** The players on the comparison page, in one request; order does not matter to the cache */
export function useComparisonPlayersQuery(personIds: number[], season: number) {
  return useQuery({
    queryKey: ['compare-players', personIds.slice().sort((a, b) => a - b).join(','), season],
    queryFn: () => getPlayersForComparison(personIds, season),
    enabled: personIds.length > 0,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/** Each compared club's last completed game with its boxscore; a finished game does not change */
export function useTeamsPreviousGameQueries(teamIds: number[]) {
  return useQueries({
    queries: teamIds.map((teamId) => ({
      queryKey: ['team-previous-game', teamId],
      queryFn: () => getTeamPreviousGame(teamId),
      staleTime: 1000 * 60 * 10, // 10 minutes
    })),
  });
}

/** A player's postseason lines, fetched once the postseason view is opened */
export function usePlayerPostseasonStatsQuery(personId: number | undefined, season: number, enabled: boolean) {
  return useQuery({
    queryKey: ['player-postseason-stats', personId, season],
    queryFn: () => getPlayerPostseasonStats(personId!, season),
    enabled: enabled && !!personId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Postseason leaderboards, ranked from every player's line. The hitters'
 * lines are always fetched, as they tell how many games each club played,
 * which rate stats qualify by. Switching league reuses the same data.
 */
export function usePostseasonLeadersQuery(
  params: { statGroup: 'hitting' | 'pitching'; categories: string[]; leagueId?: number; season: number; limit?: number },
  enabled: boolean
) {
  const { statGroup, categories, leagueId, season, limit } = params;
  const options = { staleTime: 1000 * 60 * 10 }; // 10 minutes
  const hitting = useQuery({
    queryKey: ['postseason-stats', 'hitting', season],
    queryFn: () => getPostseasonPlayerStats('hitting', season),
    enabled,
    ...options,
  });
  const pitching = useQuery({
    queryKey: ['postseason-stats', 'pitching', season],
    queryFn: () => getPostseasonPlayerStats('pitching', season),
    enabled: enabled && statGroup === 'pitching',
    ...options,
  });
  const source = statGroup === 'pitching' ? pitching : hitting;
  const data = useMemo(
    () =>
      source.data && hitting.data
        ? { leagueLeaders: buildPostseasonLeaders(source.data, hitting.data, { statGroup, categories, season, leagueId, limit }) }
        : undefined,
    // categories is rebuilt by the caller on every render; its content is what matters
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [source.data, hitting.data, statGroup, categories.join(','), season, leagueId, limit]
  );
  return {
    data,
    isLoading: hitting.isLoading || source.isLoading,
    isError: hitting.isError || source.isError,
    refetch: () => {
      hitting.refetch();
      if (statGroup === 'pitching') pitching.refetch();
    },
  };
}

/** Every big league club's moves between two dates, for the moves page */
export function useLeagueTransactionsQuery(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['league-transactions', startDate, endDate],
    queryFn: () => getLeagueTransactions(startDate, endDate),
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
}

/** Seasons a player has played, for the game log's season choice */
export function usePlayerSeasonsQuery(personId?: number) {
  return useQuery({
    queryKey: ['player-seasons', personId],
    queryFn: () => getPlayerSeasons(personId!),
    enabled: !!personId,
    staleTime: 1000 * 60 * 60, // an hour: a new season shows up once a year
  });
}

/**
 * A past season's game log with its postseason games folded in. The two are
 * separate queries, so a postseason request that failed is retried rather
 * than cached as part of a success; until then the regular season shows.
 */
export function usePlayerSeasonGameLogsQuery(personId: number | undefined, season: number | null) {
  const enabled = !!personId && season !== null;
  const options = { staleTime: 1000 * 60 * 60 }; // an hour: a finished season does not change
  const regular = useQuery({
    queryKey: ['player-season-game-logs', personId, season],
    queryFn: () => getPlayerSeasonGameLogs(personId!, season!),
    enabled,
    ...options,
  });
  const postseason = useQuery({
    queryKey: ['postseason-gamelogs', String(personId), season],
    queryFn: () => getPostseasonGameLogs([personId!], season!),
    enabled,
    ...options,
  });
  const data = useMemo(() => withPostseasonGameLogs(regular.data, postseason.data), [regular.data, postseason.data]);
  return { data, isLoading: regular.isLoading, isError: regular.isError, postseasonFailed: postseason.isError };
}

/** One season's winners of each award, a request per award */
export function useSeasonAwardsQueries(awardIds: readonly string[], season: number) {
  return useQueries({
    queries: awardIds.map((awardId) => ({
      queryKey: ['award-recipients', awardId, season],
      queryFn: () => getAwardRecipients(awardId, season),
      staleTime: 1000 * 60 * 60, // an hour: awards are announced once a year
    })),
  });
}

/** Every season's winners of one award */
export function useAwardHistoryQuery(awardId: string | undefined) {
  return useQuery({
    queryKey: ['award-history', awardId],
    queryFn: () => getAwardRecipients(awardId!),
    enabled: !!awardId,
    staleTime: 1000 * 60 * 60,
  });
}

export function usePeopleSearchQuery(query: string) {
  return useQuery({
    queryKey: ['people-search', query],
    queryFn: () => searchPeople(query),
    enabled: query.trim().length >= 2,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

export function useLeaderboardsQuery(
  params: {
    statGroup: 'hitting' | 'pitching';
    categories?: string[];
    leagueId?: number;
    season?: number;
    limit?: number;
  },
  enabled: boolean = true
) {
  const { statGroup, categories, leagueId, season, limit } = params;
  return useQuery({
    queryKey: ['leaderboards', statGroup, categories, leagueId, season, limit],
    queryFn: () => getLeaderboards(params),
    enabled,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function usePeopleBatchQuery(personIds: number[]) {
  return useQuery({
    queryKey: ['people-batch', personIds.slice().sort().join(',')],
    queryFn: () => getPeopleBatch(personIds),
    enabled: personIds.length > 0,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}

/**
 * Players' postseason game logs, a query apart from the regular season log so
 * it never holds that log up and a failure is retried rather than cached as
 * "no postseason games". Off outside the postseason, when it can only be empty.
 */
function usePostseasonGameLogsQuery(
  personIds: number[],
  season: number | undefined,
  timing: { staleTime: number; refetchInterval?: number }
) {
  return useQuery({
    queryKey: ['postseason-gamelogs', personIds.slice().sort().join(','), season],
    queryFn: () => getPostseasonGameLogs(personIds, season),
    enabled: personIds.length > 0 && mayHavePostseasonGames(),
    ...timing,
  });
}

/** Postseason game log for the player page, merged in by the page */
export function usePlayerPostseasonLogsQuery(personId?: number) {
  // No season, like the player detail request it completes
  return usePostseasonGameLogsQuery(personId ? [personId] : [], undefined, {
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Favorites' game logs with their postseason games folded in. Returns the
 * fields the summary drawer reads; `postseasonError` is set while the
 * postseason games could not be loaded.
 */
export function useFavoritePlayersGameLogQuery(personIds: number[]) {
  const timing = {
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 60 * 5, // 5 minutes background auto refresh
  };
  const logs = useQuery({
    queryKey: ['fav-players-gamelog', personIds.slice().sort().join(',')],
    queryFn: () => getFavoritePlayersGameLog(personIds),
    enabled: personIds.length > 0,
    ...timing,
  });
  const postseason = usePostseasonGameLogsQuery(personIds, getCurrentMlbSeason(), timing);
  const data = useMemo(() => withPostseasonGameLogs(logs.data, postseason.data), [logs.data, postseason.data]);

  return {
    data,
    isLoading: logs.isLoading,
    isFetching: logs.isFetching || postseason.isFetching,
    postseasonError: postseason.isError,
    // refetch() runs even a disabled query, so only ask for the postseason when it is on
    refetch: () =>
      Promise.all([logs.refetch(), ...(personIds.length > 0 && mayHavePostseasonGames() ? [postseason.refetch()] : [])]),
  };
}
