import { MINORS_AGGREGATE_SPORT_ID, MLB_SPORT_ID } from '../constants/levels';

export interface StatLevel {
  id: number;
  abbreviation: string;
}

export interface LevelSplit {
  sport?: { id?: number; abbreviation?: string };
  team?: { id?: number; name?: string };
  /** Set on the combined line of a player who split a level between teams */
  numTeams?: number;
  date?: string;
  /** R = regular season; see isPostseasonGameType */
  gameType?: string;
  /** Game log splits only */
  game?: { gamePk?: number };
  // Stat lines carry dozens of counting and rate fields that the player page reads directly
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stat?: any;
}

export interface PlayerStatGroup {
  group?: { displayName?: string };
  type?: { displayName?: string };
  splits?: LevelSplit[];
}

type StatGroupName = 'hitting' | 'pitching';

/** Splits without a sport predate leagueListId requests and are big league stats */
const sportIdOf = (split: LevelSplit) => split.sport?.id ?? MLB_SPORT_ID;

function findSplits(stats: PlayerStatGroup[] | undefined, group: StatGroupName, type: string): LevelSplit[] {
  return (
    stats?.find((s) => s.group?.displayName === group && s.type?.displayName === type)?.splits ?? []
  );
}

/**
 * Levels a player has a stat line at, MLB first and then down the ladder
 * (sport ids ascend from AAA = 11 to ROK = 16). The all-minors aggregate
 * (sport 21) is a sum, not a level, so it is left out.
 */
export function getStatLevels(
  stats: PlayerStatGroup[] | undefined,
  group: StatGroupName,
  type: string
): StatLevel[] {
  const levels = new Map<number, string>();
  findSplits(stats, group, type).forEach((split) => {
    const id = sportIdOf(split);
    if (id !== MINORS_AGGREGATE_SPORT_ID && !levels.has(id)) {
      levels.set(id, split.sport?.abbreviation ?? 'MLB');
    }
  });
  return [...levels.entries()].sort(([a], [b]) => a - b).map(([id, abbreviation]) => ({ id, abbreviation }));
}

/**
 * The stat line for one level. A player who played for two clubs at a level
 * has one line per club plus a combined line without a team; the combined
 * one is the season as a whole.
 */
export function getLevelStat(
  stats: PlayerStatGroup[] | undefined,
  group: StatGroupName,
  type: string,
  sportId: number
): LevelSplit['stat'] | undefined {
  const atLevel = findSplits(stats, group, type).filter((s) => sportIdOf(s) === sportId);
  return (atLevel.find((s) => !s.team) ?? atLevel[0])?.stat;
}

/**
 * Which level the stats open on: the one the player is at now, so a player
 * just optioned down or called up sees the line he is building, then MLB,
 * then whatever he has.
 */
export function getDefaultLevel(levels: StatLevel[], currentSportId?: number): number {
  if (currentSportId !== undefined && levels.some((l) => l.id === currentSportId)) return currentSportId;
  if (levels.length === 0 || levels.some((l) => l.id === MLB_SPORT_ID)) return MLB_SPORT_ID;
  return levels[0].id;
}

/**
 * Newest first. A multi-level game log comes back grouped by level, so a
 * recent call-up's MLB games can sit before months-old minor league games.
 */
export function sortGameLogsByDate<T extends { date?: string }>(logs: T[]): T[] {
  return [...logs].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
}

/** The most recent game in a log, whichever level it was at */
export function getLatestGameLog<T extends { date?: string }>(logs: T[]): T | undefined {
  return sortGameLogsByDate(logs)[0];
}

/**
 * Postseason game types: `P` is the postseason as a whole, the others its
 * rounds (wild card, division series, LCS, World Series).
 */
const POSTSEASON_GAME_TYPES = new Set(['P', 'F', 'D', 'L', 'W']);

export function isPostseasonGameType(gameType?: string): boolean {
  return gameType !== undefined && POSTSEASON_GAME_TYPES.has(gameType);
}

/**
 * Add the postseason game log to a player's stats. Stats requests default to
 * the regular season (`gameType=R`), so postseason games come from a second
 * request and are appended to the matching game log group, or added as a new
 * group when the player has no regular season log in that group. Only splits
 * tagged as postseason are taken, so a response that ignored `gameType=P`
 * cannot list the regular season twice, and a game already in the log (same
 * gamePk) is not added again.
 */
export function mergeGameLogs<T extends PlayerStatGroup>(stats: T[] | undefined, extra: T[] | undefined): T[] {
  const merged = (stats ?? []).map((g) => ({ ...g, splits: [...(g.splits ?? [])] }));
  (extra ?? []).forEach((group) => {
    if (group.type?.displayName !== 'gameLog') return;
    const target = merged.find(
      (g) => g.type?.displayName === 'gameLog' && g.group?.displayName === group.group?.displayName
    );
    const known = new Set(target?.splits.map((s) => s.game?.gamePk).filter((pk) => pk !== undefined));
    const games = (group.splits ?? []).filter(
      (s) => isPostseasonGameType(s.gameType) && (s.game?.gamePk === undefined || !known.has(s.game.gamePk))
    );
    if (games.length === 0) return;
    if (target) target.splits.push(...games);
    else merged.push({ ...group, splits: games });
  });
  return merged;
}
