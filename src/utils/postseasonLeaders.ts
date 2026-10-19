import type { LeaderCategoryGroup, LeaderItem } from '../types/leaderboards';
import { getCurrentMlbSeason, mayHavePostseasonGames } from './season';
import { teamsById } from './teams';

/**
 * Postseason leaderboards, ranked here from every player's postseason line:
 * `/stats/leaders` only ranks the regular season.
 */

export interface PostseasonStatSplit {
  stat?: Record<string, string | number | undefined>;
  player?: { id: number; fullName?: string };
  team?: { id: number; name?: string };
}

export interface PostseasonStatsResponse {
  stats?: Array<{ splits?: PostseasonStatSplit[] }>;
}

type Qualifier = 'plateAppearances' | 'innings';

interface LeaderRule {
  field: string;
  better: 'high' | 'low';
  /** Rates need enough playing time, or one hot at-bat leads */
  qualifier?: Qualifier;
}

/** How each leaderboard category reads a `/stats` line */
export const POSTSEASON_LEADER_RULES: Record<string, LeaderRule> = {
  battingAverage: { field: 'avg', better: 'high', qualifier: 'plateAppearances' },
  onBasePlusSlugging: { field: 'ops', better: 'high', qualifier: 'plateAppearances' },
  onBasePercentage: { field: 'obp', better: 'high', qualifier: 'plateAppearances' },
  sluggingPercentage: { field: 'slg', better: 'high', qualifier: 'plateAppearances' },
  homeRuns: { field: 'homeRuns', better: 'high' },
  runsBattedIn: { field: 'rbi', better: 'high' },
  hits: { field: 'hits', better: 'high' },
  stolenBases: { field: 'stolenBases', better: 'high' },
  earnedRunAverage: { field: 'era', better: 'low', qualifier: 'innings' },
  walksAndHitsPerInningPitched: { field: 'whip', better: 'low', qualifier: 'innings' },
  strikeoutsPer9Inn: { field: 'strikeoutsPer9Inn', better: 'high', qualifier: 'innings' },
  strikeouts: { field: 'strikeOuts', better: 'high' },
  wins: { field: 'wins', better: 'high' },
  saves: { field: 'saves', better: 'high' },
  holds: { field: 'holds', better: 'high' },
  inningsPitched: { field: 'inningsPitched', better: 'high' },
};

/** The regular season's qualifying rates, per game the club played */
const PA_PER_TEAM_GAME = 3.1;
const OUTS_PER_TEAM_GAME = 3;

/**
 * The latest postseason that can have games: this season's from late
 * September, last season's before that.
 */
export function latestPostseasonSeason(date: Date = new Date()): number {
  const season = getCurrentMlbSeason(date);
  return mayHavePostseasonGames(date) ? season : season - 1;
}

const splitsOf = (r: PostseasonStatsResponse | undefined) => r?.stats?.[0]?.splits ?? [];

/** "12.1" innings, a third of an inning per digit after the point, as outs */
export function outsOfInnings(ip: unknown): number {
  const [whole, part] = String(ip ?? '').split('.');
  const innings = Number(whole);
  if (!Number.isFinite(innings)) return NaN;
  return innings * 3 + (Number(part) || 0);
}

/**
 * Games each club played, read off its hitters: someone plays every game.
 * Clubs knocked out early played fewer, so their players need less to
 * qualify.
 */
export function teamGamesOf(hitting: PostseasonStatsResponse | undefined): Map<number, number> {
  const games = new Map<number, number>();
  splitsOf(hitting).forEach((s) => {
    const id = s.team?.id;
    const played = Number(s.stat?.gamesPlayed ?? 0);
    if (id !== undefined && played > (games.get(id) ?? 0)) games.set(id, played);
  });
  return games;
}

function qualifies(s: PostseasonStatSplit, qualifier: Qualifier | undefined, teamGames: Map<number, number>) {
  if (!qualifier) return true;
  const games = teamGames.get(s.team?.id ?? -1) ?? 0;
  if (games === 0) return false;
  return qualifier === 'plateAppearances'
    ? Number(s.stat?.plateAppearances ?? 0) >= PA_PER_TEAM_GAME * games
    : outsOfInnings(s.stat?.inningsPitched) >= OUTS_PER_TEAM_GAME * games;
}

const numeric = (rule: LeaderRule, value: unknown) =>
  rule.field === 'inningsPitched' ? outsOfInnings(value) : parseFloat(String(value ?? ''));

/**
 * The top `limit` of each category, shaped like `/stats/leaders` so the
 * leaderboards page renders both alike. Ties share a rank (1, 1, 3) and a
 * count of zero leads nobody. `leagueId` keeps one league's clubs.
 */
export function buildPostseasonLeaders(
  stats: PostseasonStatsResponse | undefined,
  hitting: PostseasonStatsResponse | undefined,
  options: { statGroup: 'hitting' | 'pitching'; categories: string[]; season: number; leagueId?: number; limit?: number }
): LeaderCategoryGroup[] {
  const { statGroup, categories, season, leagueId, limit = 5 } = options;
  const league = leagueId === 103 ? 'AL' : leagueId === 104 ? 'NL' : undefined;
  const teamGames = teamGamesOf(hitting);
  const pool = splitsOf(stats).filter(
    (s) => s.player?.id !== undefined && (!league || teamsById.get(s.team?.id ?? -1)?.league === league)
  );

  return categories.flatMap((category) => {
    const rule = POSTSEASON_LEADER_RULES[category];
    if (!rule) return [];
    const ranked = pool
      .filter((s) => qualifies(s, rule.qualifier, teamGames))
      .map((s) => ({ s, n: numeric(rule, s.stat?.[rule.field]) }))
      .filter(({ n }) => Number.isFinite(n) && (rule.better === 'low' || n > 0))
      .sort((a, b) => (rule.better === 'high' ? b.n - a.n : a.n - b.n));

    const leaders: LeaderItem[] = [];
    ranked.slice(0, limit).forEach(({ s, n }, i) => {
      const rank = i > 0 && n === ranked[i - 1].n ? leaders[i - 1].rank : i + 1;
      leaders.push({
        rank,
        value: String(s.stat?.[rule.field]),
        person: { id: s.player!.id, fullName: s.player?.fullName ?? '' },
        team: { id: s.team?.id ?? 0, name: s.team?.name ?? '' },
      });
    });
    return [{ leaderCategory: category, statGroup, season: String(season), leaders }];
  });
}
