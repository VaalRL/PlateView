import teamsData from '../data/teams.json';
import { POSTSEASON_FIRST_SEASON } from '../constants/season';
import type { StandingsResponse } from '../types/mlb';
import type {
  PostseasonGame,
  PostseasonSeriesEntry,
  PostseasonSeriesResponse,
} from '../types/postseason';

export type BracketRound = 'F' | 'D' | 'L' | 'W';
export type BracketLeague = 'AL' | 'NL';

export interface BracketTeam {
  id: number;
  name: string;
  /** Stand-in such as "AL Wild Card #3" for a slot that is not decided yet */
  isPlaceholder: boolean;
  wins: number;
  seed?: number;
}

export interface BracketSeries {
  id: string;
  round: BracketRound;
  league: BracketLeague | null;
  /** Home team of game 1, i.e. the higher seed */
  top: BracketTeam;
  bottom: BracketTeam;
  bestOf: number;
  isOver: boolean;
  winnerId: number | null;
  games: PostseasonGame[];
  /** Earlier-round series whose winner advances into this one */
  feeders: BracketSeries[];
}

export interface PostseasonBracket {
  /** League championship series, the root of each league's subtree */
  AL: BracketSeries | null;
  NL: BracketSeries | null;
  worldSeries: BracketSeries | null;
}

const ROUNDS: readonly BracketRound[] = ['F', 'D', 'L', 'W'];

const mlbTeamLeague = new Map<number, BracketLeague>(
  teamsData.map((t) => [t.id, t.league as BracketLeague])
);

/** Seasons the bracket page offers, newest first */
export function getPostseasonSeasons(currentSeason: number): number[] {
  const seasons: number[] = [];
  for (let y = currentSeason; y >= POSTSEASON_FIRST_SEASON; y--) seasons.push(y);
  return seasons;
}

/** Group order for seeding: division winners, 2020 second-place qualifiers, wild cards */
const CLINCH_GROUP: Record<string, number> = { z: 0, y: 0, x: 1, w: 2 };

/**
 * Derive postseason seeds from the standings. The API has no seed field, so
 * qualifiers are grouped by clinchIndicator and ordered by leagueRank within
 * each group, per league.
 */
export function computePostseasonSeeds(standings?: StandingsResponse): Map<number, number> {
  const seeds = new Map<number, number>();
  const qualifiers = (standings?.records ?? [])
    .flatMap((r) => r.teamRecords ?? [])
    .filter((tr) => tr.clinchIndicator && CLINCH_GROUP[tr.clinchIndicator] !== undefined);

  (['AL', 'NL'] as const).forEach((league) => {
    qualifiers
      .filter((tr) => mlbTeamLeague.get(tr.team.id) === league)
      .sort(
        (a, b) =>
          CLINCH_GROUP[a.clinchIndicator!] - CLINCH_GROUP[b.clinchIndicator!] ||
          Number(a.leagueRank) - Number(b.leagueRank)
      )
      .forEach((tr, i) => seeds.set(tr.team.id, i + 1));
  });
  return seeds;
}

function leagueOf(entry: PostseasonSeriesEntry): BracketLeague | null {
  const match = entry.games[0]?.description?.match(/^(AL|NL)/);
  return match ? (match[1] as BracketLeague) : null;
}

function toSeries(entry: PostseasonSeriesEntry): BracketSeries {
  const round = entry.series.id.charAt(0) as BracketRound;
  const games = [...entry.games].sort(
    (a, b) => (a.seriesGameNumber ?? 0) - (b.seriesGameNumber ?? 0) || a.gameDate.localeCompare(b.gameDate)
  );
  const first = games[0];
  const bestOf = first?.gamesInSeries ?? 1;

  // Postponed entries stay in the list next to their make-up game, so only
  // final results count toward the series score.
  const wins = new Map<number, number>();
  games
    .filter((g) => g.status.abstractGameState === 'Final')
    .forEach((g) => {
      const winner = [g.teams.away, g.teams.home].find((t) => t.isWinner);
      if (winner) wins.set(winner.team.id, (wins.get(winner.team.id) ?? 0) + 1);
    });

  const team = (side: 'home' | 'away'): BracketTeam => {
    const { id, name } = first.teams[side].team;
    return { id, name, isPlaceholder: !mlbTeamLeague.has(id), wins: wins.get(id) ?? 0 };
  };
  const top = team('home');
  const bottom = team('away');
  const needed = Math.floor(bestOf / 2) + 1;
  const winner = [top, bottom].find((t) => !t.isPlaceholder && t.wins >= needed);

  return {
    id: entry.series.id,
    round,
    league: round === 'W' ? null : leagueOf(entry),
    top,
    bottom,
    bestOf,
    isOver: !!winner,
    winnerId: winner?.id ?? null,
    games,
    feeders: [],
  };
}

const hasTeam = (s: BracketSeries, id: number | null) => id !== null && (s.top.id === id || s.bottom.id === id);
const placeholderSlots = (s: BracketSeries) => [s.top, s.bottom].filter((t) => t.isPlaceholder).length;
const byId = (a: BracketSeries, b: BracketSeries) =>
  a.id.localeCompare(b.id, undefined, { numeric: true });

/**
 * Attach each earlier-round series to the later-round series its winner
 * reached. The API does not say which wild card series feeds which division
 * series, and the mapping has changed between seasons, so it is matched by
 * team. Series still undecided fill the remaining placeholder slots, pairing
 * ascending ids with descending ids (the 2022+ convention: D_1 <- F_2).
 */
function linkFeeders(earlier: BracketSeries[], later: BracketSeries[]) {
  const unmatched: BracketSeries[] = [];
  earlier.forEach((s) => {
    const target = later.find((l) => hasTeam(l, s.winnerId));
    if (target) target.feeders.push(s);
    else unmatched.push(s);
  });

  // A bye seed that is not known yet is a placeholder too, so spread the
  // undecided series over the emptiest open slots rather than filling one.
  const open = [...later].sort(byId).reverse();
  unmatched.sort(byId).forEach((s) => {
    const target = open
      .filter((l) => l.feeders.length < placeholderSlots(l))
      .reduce<BracketSeries | undefined>((best, l) => (!best || l.feeders.length < best.feeders.length ? l : best), undefined);
    if (target) target.feeders.push(s);
  });
  later.forEach((l) => l.feeders.sort(byId));
}

/**
 * Turn the flat list of postseason series into a tree per league, rooted at
 * each league championship series, plus the World Series.
 */
export function buildPostseasonBracket(
  response?: PostseasonSeriesResponse,
  standings?: StandingsResponse
): PostseasonBracket | null {
  const all = (response?.series ?? [])
    .filter((e) => e.games.length > 0 && ROUNDS.includes(e.series.id.charAt(0) as BracketRound))
    .map(toSeries);
  if (all.length === 0) return null;

  const inRound = (round: BracketRound, league?: BracketLeague) =>
    all.filter((s) => s.round === round && (league === undefined || s.league === league));

  (['AL', 'NL'] as const).forEach((league) => {
    linkFeeders(inRound('F', league), inRound('D', league));
    linkFeeders(inRound('D', league), inRound('L', league));
  });

  // Seeds read from the standings are only final once the regular season is
  // over, which is exactly when every first-round slot holds a real club.
  const firstRound = inRound('F');
  const seedsReady = firstRound.length > 0 && firstRound.every((s) => !s.top.isPlaceholder && !s.bottom.isPlaceholder);
  if (seedsReady) {
    const seeds = computePostseasonSeeds(standings);
    all.forEach((s) =>
      [s.top, s.bottom].forEach((t) => {
        t.seed = seeds.get(t.id);
      })
    );
  }

  return {
    AL: inRound('L', 'AL')[0] ?? null,
    NL: inRound('L', 'NL')[0] ?? null,
    worldSeries: inRound('W')[0] ?? null,
  };
}
