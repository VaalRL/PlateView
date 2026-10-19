import type { BoxscoreTeamSide, GameSchedule, ScheduleResponse } from '../types/mlb';
import { STORAGE_KEYS } from '../constants/storage';
import { isCompletedGame } from './gameStatus';
import { buildLineup, getPositionNumber } from './lineup';
import { teamsById } from './teams';

/**
 * Pure helpers for the team comparison page: which game each club last
 * finished, and who started in it at the plate and in the field.
 */

export const MAX_COMPARED_TEAMS = 4;

/** Regular season and postseason; spring training lineups say little */
export const COMPARED_GAME_TYPES = ['R', 'F', 'D', 'L', 'W'] as const;

/** The defensive rows, in scorekeeping order with the DH last */
export const DEFENSE_POSITIONS = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'] as const;

export type DefensePosition = (typeof DEFENSE_POSITIONS)[number];

export interface Starter {
  personId: number;
  fullName: string;
  /** Position he started the game at */
  position: string;
  /** Batting slot, or null for a starting pitcher who did not bat */
  slot: number | null;
  /** Season line as of that game, from the boxscore */
  avg?: string;
  ops?: string;
  homeRuns?: number;
  era?: string;
  wins?: number;
  losses?: number;
  fieldingPct?: string;
  errors?: number;
}

/**
 * The club's most recent game played to the end. Postponed, cancelled and
 * suspended entries are skipped, as are game types outside the comparison;
 * a doubleheader's second game wins over its first by start time.
 */
export function lastCompletedGame(schedule: ScheduleResponse | undefined, teamId: number): GameSchedule | null {
  const games = (schedule?.dates ?? [])
    .flatMap((d) => d.games ?? [])
    .filter(
      (g) =>
        isCompletedGame(g) &&
        (COMPARED_GAME_TYPES as readonly string[]).includes(g.gameType) &&
        (g.teams?.home?.team?.id === teamId || g.teams?.away?.team?.id === teamId)
    );
  return games.reduce<GameSchedule | null>(
    (latest, g) => (!latest || Date.parse(g.gameDate) > Date.parse(latest.gameDate) ? g : latest),
    null
  );
}

/** The club's side of a boxscore, matched by team id rather than home or away */
export function teamSide(
  boxscore: { teams?: { away: BoxscoreTeamSide; home: BoxscoreTeamSide } } | undefined,
  teamId: number
): BoxscoreTeamSide | null {
  const { away, home } = boxscore?.teams ?? {};
  if (home?.team?.id === teamId) return home;
  if (away?.team?.id === teamId) return away;
  return null;
}

type PlayerEntry = NonNullable<BoxscoreTeamSide['players']>[string];

function starterOf(p: PlayerEntry, position: string, slot: number | null): Starter {
  const batting = p.seasonStats?.batting;
  const pitching = p.seasonStats?.pitching;
  const fielding = p.seasonStats?.fielding;
  return {
    personId: p.person?.id ?? 0,
    fullName: p.person?.fullName ?? '',
    position,
    slot,
    avg: batting?.avg,
    ops: batting?.ops,
    homeRuns: batting?.homeRuns,
    era: pitching?.era,
    wins: pitching?.wins,
    losses: pitching?.losses,
    fieldingPct: fielding?.fielding,
    errors: fielding?.errors,
  };
}

/**
 * The nine who started at the plate, by slot. `allPositions` lists the
 * positions a player covered in the order he covered them, so its first
 * entry is where he started; `position` is only where he ended.
 */
export function startingLineup(teamBox: BoxscoreTeamSide | null | undefined): Starter[] {
  return buildLineup(teamBox).flatMap(({ slot, entries }) => {
    const first = entries.find((e) => e.isStarter);
    const p = first && teamBox?.players?.['ID' + first.personId];
    if (!first || !p) return [];
    return [starterOf(p, first.allPositions[0] ?? first.position, slot)];
  });
}

/**
 * Who started at each position. The starting pitcher is the first in
 * `pitchers`, as in a DH game he never bats. Under the two-way rule a
 * pitcher can also start at DH, so a pitcher who batted fills that row too.
 */
export function startingDefense(teamBox: BoxscoreTeamSide | null | undefined): Partial<Record<DefensePosition, Starter>> {
  const defense: Partial<Record<DefensePosition, Starter>> = {};
  const lineup = startingLineup(teamBox);

  lineup.forEach((s) => {
    const isField = getPositionNumber(s.position) !== null && s.position !== 'P';
    if ((isField || s.position === 'DH') && !defense[s.position as DefensePosition]) {
      defense[s.position as DefensePosition] = s;
    }
  });

  const starterId = teamBox?.pitchers?.[0];
  const p = starterId ? teamBox?.players?.['ID' + starterId] : undefined;
  if (p?.person?.id) {
    const slot = lineup.find((s) => s.personId === p.person?.id)?.slot ?? null;
    defense.P = starterOf(p, 'P', slot);
    if (!defense.DH && slot !== null) {
      const allPositions = (p.allPositions ?? []).map((pos) => pos?.abbreviation);
      if (allPositions.includes('DH')) defense.DH = { ...defense.P, position: 'DH' };
    }
  }

  return defense;
}

/** Mean season OPS of the starting nine, or null without at least one */
export function lineupOps(lineup: Starter[]): number | null {
  const values = lineup.map((s) => parseFloat(s.ops ?? '')).filter((n) => Number.isFinite(n));
  if (values.length === 0) return null;
  return values.reduce((sum, n) => sum + n, 0) / values.length;
}

/** Columns holding the best value; none unless at least two columns have one */
export function bestIndexes(values: (number | null | undefined)[], better: 'high' | 'low'): Set<number> {
  const present = values.filter((n): n is number => typeof n === 'number' && Number.isFinite(n));
  if (present.length < 2) return new Set();
  const best = better === 'high' ? Math.max(...present) : Math.min(...present);
  return new Set(values.flatMap((n, i) => (n === best ? [i] : [])));
}

/** The 30 big league clubs only, each once, at most four */
export function parseCompareTeamIds(param: string | null | undefined): number[] {
  const ids = (param ?? '')
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => teamsById.has(n));
  return [...new Set(ids)].slice(0, MAX_COMPARED_TEAMS);
}

/** Add a club; when full, the oldest makes room */
export function addTeamToComparison(ids: number[], id: number): number[] {
  if (ids.includes(id)) return ids;
  return [...ids, id].slice(-MAX_COMPARED_TEAMS);
}

export function loadTeamComparison(): number[] {
  try {
    return parseCompareTeamIds(localStorage.getItem(STORAGE_KEYS.compareTeams));
  } catch {
    return [];
  }
}

export function saveTeamComparison(ids: number[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.compareTeams, ids.join(','));
  } catch {
    // Storage unavailable: the URL still carries the list
  }
}
