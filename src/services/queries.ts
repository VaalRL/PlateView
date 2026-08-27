import { useQuery } from '@tanstack/react-query';
import {
  getSchedule,
  getStandings,
  getTeamRoster,
  getTeamDetail,
  getTeamSchedule,
  getPlayerDetail,
  searchPeople,
} from './mlbApi';
import { formatApiDate } from '../utils/timezone';

export function useScheduleQuery(date: string, hasLiveGames: boolean = false) {
  return useQuery({
    queryKey: ['schedule', date],
    queryFn: () => getSchedule(date),
    refetchInterval: hasLiveGames ? 30000 : false, // 30s auto polling when live
    staleTime: hasLiveGames ? 20000 : 300000,     // 20s or 5min
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
