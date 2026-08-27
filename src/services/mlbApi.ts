import { ScheduleResponse, StandingsResponse } from '../types/mlb';

const BASE_URL = 'https://statsapi.mlb.com/api/v1';

export async function fetchMlb<T>(endpoint: string, params: Record<string, string | number> = {}): Promise<T> {
  const url = new URL(`${BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([key, val]) => {
    url.searchParams.append(key, String(val));
  });

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`MLB API Error: ${response.status} ${response.statusText} for ${endpoint}`);
  }

  return response.json();
}

/**
 * Fetch daily schedule and live scores
 */
export async function getSchedule(date: string): Promise<ScheduleResponse> {
  return fetchMlb<ScheduleResponse>('/schedule', {
    sportId: 1,
    date,
    hydrate: 'linescore,team,probablePitcher(note),decisions',
  });
}

/**
 * Fetch division standings and wild card rankings
 */
export async function getStandings(season: number = new Date().getFullYear()): Promise<StandingsResponse> {
  return fetchMlb<StandingsResponse>('/standings', {
    leagueId: '103,104',
    season,
    hydrate: 'division,conference',
  });
}

/**
 * Fetch active roster or 40-man roster for a team
 */
export async function getTeamRoster(teamId: number, rosterType: string = 'active') {
  return fetchMlb<any>(`/teams/${teamId}/roster`, {
    rosterType,
    hydrate: 'person(stats(group=[hitting,pitching],type=[season]))',
  });
}

/**
 * Fetch team basic details
 */
export async function getTeamDetail(teamId: number) {
  return fetchMlb<any>(`/teams/${teamId}`, {
    hydrate: 'venue,division,league',
  });
}

/**
 * Fetch team schedule and game results
 */
export async function getTeamSchedule(teamId: number, startDate: string, endDate: string) {
  return fetchMlb<any>('/schedule', {
    sportId: 1,
    teamId,
    startDate,
    endDate,
    hydrate: 'linescore,decisions,team,probablePitcher',
  });
}

/**
 * Fetch detailed box score for a specific game
 */
export async function getGameBoxscore(gamePk: number) {
  return fetchMlb<any>(`/game/${gamePk}/boxscore`);
}

/**
 * Fetch detailed player info, season stats, career stats, and game logs
 */
export async function getPlayerDetail(personId: number) {
  return fetchMlb<any>(`/people/${personId}`, {
    hydrate: 'currentTeam,team,stats(group=[hitting,pitching],type=[season,career,gameLog])',
  });
}

/**
 * Search people by name via official MLB API
 */
export async function searchPeople(name: string) {
  return fetchMlb<any>('/people/search', {
    names: name,
    sportId: 1,
  });
}

/**
 * Get MLB official player headshot image URL
 */
export function getPlayerHeadshotUrl(personId: number): string {
  return `https://img.mlbstatic.com/mlb-photos/image/upload/w_213,q_auto:best/v1/people/${personId}/headshot/67/current`;
}

/**
 * Get MLB official team SVG logo URL
 */
export function getTeamLogoUrl(teamId: number): string {
  return `https://www.mlbstatic.com/team-logos/${teamId}.svg`;
}
