import { BoxscoreResponse, ScheduleResponse, StandingsResponse, VenuesResponse } from '../types/mlb';
import { PeopleResponse } from '../types/favorites';
import { PostseasonSeriesResponse } from '../types/postseason';
import { TransactionsResponse } from '../types/transactions';
import { getCurrentMlbSeason } from '../utils/season';
import { MLB_LEVEL, MLB_MILB_LEAGUE_LIST, MLB_SPORT_ID } from '../constants/levels';
import { mergeGameLogs, type PlayerStatGroup } from '../utils/playerLevels';
import type { PostseasonStatsResponse } from '../utils/postseasonLeaders';
import { COMPARED_GAME_TYPES, lastCompletedGame } from '../utils/teamComparison';
import {
  HITTING_LEADER_CATEGORIES,
  PITCHING_LEADER_CATEGORIES,
} from '../constants/leaderboards';

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
export async function getSchedule(date: string, sportId: number = MLB_SPORT_ID): Promise<ScheduleResponse> {
  return fetchMlb<ScheduleResponse>('/schedule', {
    sportId,
    date,
    hydrate: 'linescore,team,probablePitcher(note),decisions',
  });
}

/**
 * Fetch division standings and wild card rankings
 */
export async function getStandings(
  season: number = new Date().getFullYear(),
  leagueIds: readonly number[] = MLB_LEVEL.leagueIds
): Promise<StandingsResponse> {
  return fetchMlb<StandingsResponse>('/standings', {
    leagueId: leagueIds.join(','),
    season,
    // league: a league with no divisions is headed by its own name
    hydrate: 'division,conference,league',
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
export async function getTeamSchedule(
  teamId: number,
  startDate: string,
  endDate: string,
  sportId: number = MLB_SPORT_ID
) {
  return fetchMlb<any>('/schedule', {
    sportId,
    teamId,
    startDate,
    endDate,
    hydrate: 'linescore,decisions,team,probablePitcher',
  });
}

/**
 * Fetch a single game's schedule entry (status, score, decisions, linescore).
 *
 * The /schedule response shape is identical to the daily scoreboard, so the
 * game detail page reuses the existing GameSchedule type and formatters.
 */
export async function getGameSchedule(gamePk: number): Promise<ScheduleResponse> {
  return fetchMlb<ScheduleResponse>('/schedule', {
    sportId: 1,
    gamePk,
    hydrate: 'linescore,team,probablePitcher(note),decisions,venue',
  });
}

/**
 * A club's big league games of one season, trimmed to what finding its last
 * completed game needs (status, date, teams, score): about 40 KB for a full
 * season instead of several hundred.
 */
export async function getTeamSeasonGames(teamId: number, season: number): Promise<ScheduleResponse> {
  return fetchMlb<ScheduleResponse>('/schedule', {
    sportId: MLB_SPORT_ID,
    teamId,
    season,
    gameType: COMPARED_GAME_TYPES.join(','),
    fields:
      'dates,games,gamePk,gameType,gameDate,officialDate,status,abstractGameState,codedGameState,detailedState,' +
      'teams,away,home,team,id,name,score,isWinner',
  });
}

/**
 * A club's last completed game and its boxscore. Before opening day the
 * season has none yet, so the previous season's last game stands in.
 */
export async function getTeamPreviousGame(teamId: number, season: number = getCurrentMlbSeason()) {
  for (const year of [season, season - 1]) {
    const game = lastCompletedGame(await getTeamSeasonGames(teamId, year), teamId);
    if (game) {
      const boxscore: BoxscoreResponse = await getGameBoxscore(game.gamePk);
      return { game, boxscore };
    }
  }
  return null;
}

/**
 * Fetch detailed box score for a specific game
 */
export async function getGameBoxscore(gamePk: number) {
  return fetchMlb<any>(`/game/${gamePk}/boxscore`);
}

/**
 * Fetch every postseason series of a season with its games.
 *
 * `fields=` trims the response to what the bracket reads (about 20 KB instead
 * of 65 KB for a full postseason); see docs/adr/0004-postseason-bracket.md.
 */
export async function getPostseasonSeries(season: number): Promise<PostseasonSeriesResponse> {
  return fetchMlb<PostseasonSeriesResponse>('/schedule/postseason/series', {
    season,
    sportId: 1,
    fields:
      'series,series,id,gameType,games,gamePk,gameDate,officialDate,status,abstractGameState,detailedState,' +
      'teams,away,home,team,id,name,isWinner,score,description,gamesInSeries,seriesGameNumber,ifNecessary',
  });
}

/**
 * Fetch a venue's published field dimensions.
 *
 * `fieldInfo` carries the home run fence distance in feet at up to seven named
 * angles; the alignment chart reconstructs the outfield shape from them.
 */
export async function getVenue(venueId: number): Promise<VenuesResponse> {
  return fetchMlb<VenuesResponse>(`/venues/${venueId}`, {
    hydrate: 'fieldInfo,location',
  });
}

/**
 * Fetch detailed player info, season stats, career stats, and game logs.
 *
 * `leagueListId=mlb_milb` returns every level in one response, each split
 * tagged with its `sport`, so a player who moved between the majors and the
 * minors keeps both lines (see docs/adr/0005-minor-league-support.md).
 */
export async function getPlayerDetail(personId: number) {
  return fetchMlb<any>(`/people/${personId}`, {
    hydrate: `currentTeam(league,sport,parentOrg),team,stats(group=[hitting,pitching],type=[season,career,gameLog,sabermetrics,seasonAdvanced],leagueListId=${MLB_MILB_LEAGUE_LIST})`,
  });
}

/**
 * Every roster move on a player's record (trades, signings, options,
 * releases, injured list ...), across MLB and the minors.
 */
export async function getPlayerTransactions(personId: number): Promise<TransactionsResponse> {
  return fetchMlb<TransactionsResponse>('/transactions', { playerId: personId });
}

/**
 * Every roster move filed by a big league club between two dates
 * (YYYY-MM-DD, inclusive): signings, trades, releases, options, injured
 * list moves and assignments to its minor league clubs.
 */
export async function getLeagueTransactions(startDate: string, endDate: string): Promise<TransactionsResponse> {
  return fetchMlb<TransactionsResponse>('/transactions', { sportId: MLB_SPORT_ID, startDate, endDate });
}

/**
 * Who a player is and where he plays now, for the player hover card.
 * `parentOrg` names the big league club behind a minor league team.
 */
export async function getPersonSummary(personId: number): Promise<PeopleResponse> {
  return fetchMlb<PeopleResponse>(`/people/${personId}`, {
    hydrate: 'currentTeam(league,sport,parentOrg)',
  });
}

/**
 * Season and sabermetric lines for several big leaguers at once, for the
 * comparison page: one request however many players are compared.
 */
export async function getPlayersForComparison(personIds: number[], season: number): Promise<PeopleResponse> {
  if (personIds.length === 0) return { people: [] };
  return fetchMlb<PeopleResponse>('/people', {
    personIds: personIds.join(','),
    hydrate: `currentTeam,stats(group=[hitting,pitching],type=[season,sabermetrics],season=${season})`,
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
 * Get multiple people batch by IDs via official MLB API
 */
export async function getPeopleBatch(personIds: number[]): Promise<PeopleResponse> {
  if (personIds.length === 0) return { people: [] };
  return fetchMlb<PeopleResponse>('/people', {
    personIds: personIds.join(','),
  });
}

/**
 * Fetch batch player profiles with gameLogs for daily favorite summary
 */
export async function getFavoritePlayersGameLog(personIds: number[]): Promise<PeopleResponse> {
  if (personIds.length === 0) return { people: [] };
  return fetchMlb<PeopleResponse>('/people', {
    personIds: personIds.join(','),
    // Every level, so a favorite optioned to the minors still shows his games
    hydrate: `currentTeam,stats(group=[hitting,pitching],type=[gameLog],season=${getCurrentMlbSeason()},leagueListId=${MLB_MILB_LEAGUE_LIST})`,
  });
}

/**
 * Postseason game logs for one or more players. Stats default to the regular
 * season, so these need a request of their own (`gameType=P`). It is a query
 * of its own too (see usePostseasonGameLogsQuery): it neither holds up the
 * regular season log nor takes it down when it fails.
 */
export async function getPostseasonGameLogs(personIds: number[], season?: number): Promise<PeopleResponse> {
  if (personIds.length === 0) return { people: [] };
  const seasonParam = season === undefined ? '' : `,season=${season}`;
  return fetchMlb<PeopleResponse>('/people', {
    personIds: personIds.join(','),
    hydrate: `stats(group=[hitting,pitching],type=[gameLog],gameType=P${seasonParam},leagueListId=${MLB_MILB_LEAGUE_LIST})`,
  });
}

/**
 * A player's postseason lines: one season's and his career's. MLB only, as
 * the minors' playoffs are not postseason games to the API.
 */
export async function getPlayerPostseasonStats(personId: number, season: number) {
  return fetchMlb<any>(`/people/${personId}`, {
    hydrate: `stats(group=[hitting,pitching],type=[season,career],gameType=P,season=${season})`,
  });
}

/** The stat fields the postseason leaderboards read, per group */
const POSTSEASON_LEADER_FIELDS = {
  hitting: 'gamesPlayed,plateAppearances,avg,obp,slg,ops,homeRuns,rbi,hits,stolenBases',
  pitching: 'gamesPlayed,era,whip,strikeOuts,wins,saves,holds,strikeoutsPer9Inn,inningsPitched',
} as const;

/**
 * Every big leaguer's line of one postseason, for the postseason
 * leaderboards: `/stats/leaders` ignores `gameType=P`, `/stats` does not.
 * The whole player pool comes back (a few hundred), trimmed with `fields=`.
 */
export async function getPostseasonPlayerStats(
  group: 'hitting' | 'pitching',
  season: number
): Promise<PostseasonStatsResponse> {
  return fetchMlb<PostseasonStatsResponse>('/stats', {
    stats: 'season',
    group,
    gameType: 'P',
    season,
    sportId: MLB_SPORT_ID,
    playerPool: 'ALL',
    limit: 1000,
    fields: `stats,splits,stat,${POSTSEASON_LEADER_FIELDS[group]},player,id,fullName,team,id,name`,
  });
}

/** Fold each player's postseason game log into the main response */
export function withPostseasonGameLogs<T extends { people?: Array<{ id: number; stats?: PlayerStatGroup[] }> }>(
  response: T | undefined,
  postseason: PeopleResponse | undefined
): T | undefined {
  if (!response?.people || !postseason?.people?.length) return response;
  return {
    ...response,
    people: response.people.map((person) => {
      const extra = postseason.people.find((p) => p.id === person.id)?.stats;
      return extra?.length ? { ...person, stats: mergeGameLogs(person.stats, extra) } : person;
    }),
  };
}

/**
 * Get MLB official player headshot image URL
 */
export function getPlayerHeadshotUrl(personId: number): string {
  return `https://img.mlbstatic.com/mlb-photos/image/upload/w_213,q_auto:best/v1/people/${personId}/headshot/67/current`;
}

/**
 * Team cap logo drawn for a dark background, used on the team-coloured
 * tiles of the postseason bracket
 */
export function getTeamCapLogoUrl(teamId: number): string {
  return `https://www.mlbstatic.com/team-logos/team-cap-on-dark/${teamId}.svg`;
}

/**
 * Get MLB official team SVG logo URL
 */
export function getTeamLogoUrl(teamId: number): string {
  return `https://www.mlbstatic.com/team-logos/${teamId}.svg`;
}

/**
 * Fetch MLB League Leaderboards
 */
export async function getLeaderboards(params: {
  statGroup: 'hitting' | 'pitching';
  categories?: string[];
  leagueId?: number;
  season?: number;
  limit?: number;
}) {
  const { statGroup, categories, leagueId, season = getCurrentMlbSeason(), limit = 5 } = params;
  const cats =
    categories && categories.length > 0
      ? categories
      : statGroup === 'hitting'
      ? [...HITTING_LEADER_CATEGORIES]
      : [...PITCHING_LEADER_CATEGORIES];

  const queryParams: Record<string, string | number> = {
    leaderCategories: cats.join(','),
    statGroup,
    season,
    limit,
    sportId: 1,
    hydrate: 'person,team',
  };

  if (leagueId) {
    queryParams.leagueId = leagueId;
  }

  return fetchMlb<import('../types/leaderboards').LeaderboardsResponse>('/stats/leaders', queryParams);
}
