import { useQuery } from '@tanstack/react-query';
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
  searchPeople,
  getLeaderboards,
  getPeopleBatch,
  getFavoritePlayersGameLog,
} from './mlbApi';
import { formatApiDate } from '../utils/timezone';
import { ScheduleResponse } from '../types/mlb';

/** True when any game in the schedule response is currently live */
export function scheduleHasLiveGames(data?: ScheduleResponse): boolean {
  const games = data?.dates?.[0]?.games ?? [];
  return games.some((g) => g?.status?.abstractGameState === 'Live');
}

export function useScheduleQuery(date: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['schedule', date],
    queryFn: () => getSchedule(date),
    enabled,
    // Poll only while games are actually live; idle days stay quiet
    refetchInterval: (query) => (scheduleHasLiveGames(query.state.data) ? 30000 : false),
    staleTime: (query) => (scheduleHasLiveGames(query.state.data) ? 20000 : 300000), // 20s or 5min
  });
}

export function useStandingsQuery(season?: number) {
  return useQuery({
    queryKey: ['standings', season],
    queryFn: () => getStandings(season),
    staleTime: 1000 * 60 * 15, // 15 minutes
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

export function useTeamScheduleQuery(teamId?: number) {
  // Query 35 days in the past up to 2 days ahead
  const pastDate = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000);
  const futureDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
  const startDate = formatApiDate(pastDate);
  const endDate = formatApiDate(futureDate);

  return useQuery({
    queryKey: ['team-schedule', teamId, startDate, endDate],
    queryFn: () => getTeamSchedule(teamId!, startDate, endDate),
    enabled: !!teamId,
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
 * Venue dimensions. A ballpark is remodelled between seasons at most, and there
 * are only 30 of them, so this is effectively static for the session.
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

export function usePeopleSearchQuery(query: string) {
  return useQuery({
    queryKey: ['people-search', query],
    queryFn: () => searchPeople(query),
    enabled: query.trim().length >= 2,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

export function useLeaderboardsQuery(params: {
  statGroup: 'hitting' | 'pitching';
  categories?: string[];
  leagueId?: number;
  season?: number;
  limit?: number;
}) {
  const { statGroup, categories, leagueId, season, limit } = params;
  return useQuery({
    queryKey: ['leaderboards', statGroup, categories, leagueId, season, limit],
    queryFn: () => getLeaderboards(params),
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

export function useFavoritePlayersGameLogQuery(personIds: number[]) {
  return useQuery({
    queryKey: ['fav-players-gamelog', personIds.slice().sort().join(',')],
    queryFn: () => getFavoritePlayersGameLog(personIds),
    enabled: personIds.length > 0,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 60 * 5, // 5 minutes background auto refresh
  });
}
