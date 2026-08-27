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
  const data = await fetchMlb<any>(`/people/${personId}`, {
    hydrate:
      'currentTeam(league,sport,parentOrg),team,stats(group=[hitting,pitching],type=[season,career,gameLog,sabermetrics,seasonAdvanced])',
  });

  const person = data?.people?.[0];
  if (!person) return data;

  const hasStats = person.stats && person.stats.some((s: any) => s.splits && s.splits.length > 0);

  // If no stats found with default MLB sportId=1, check if player has a currentTeam with a minor league sportId
  if (!hasStats && person.currentTeam) {
    let teamSportId = person.currentTeam.sport?.id;
    if (!teamSportId) {
      try {
        const teamRes = await fetchMlb<any>(`/teams/${person.currentTeam.id}`);
        teamSportId = teamRes?.teams?.[0]?.sport?.id;
      } catch {
        // ignore fallback errors
      }
    }

    if (teamSportId && teamSportId !== 1) {
      try {
        const milbData = await fetchMlb<any>(`/people/${personId}`, {
          hydrate: `currentTeam(league,sport,parentOrg),team,stats(group=[hitting,pitching],type=[season,career,gameLog,sabermetrics,seasonAdvanced],sportId=${teamSportId})`,
        });
        if (milbData?.people?.[0]?.stats && milbData.people[0].stats.length > 0) {
          person.stats = milbData.people[0].stats;
        }
      } catch {
        // ignore fallback errors
      }
    }
  }

  return data;
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
