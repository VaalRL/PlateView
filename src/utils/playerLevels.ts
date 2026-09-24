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
