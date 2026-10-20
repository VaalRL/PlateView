import { sportIdOf, type LevelSplit, type PlayerStatGroup } from './playerLevels';

export interface YearByYearSplit extends LevelSplit {
  season?: string;
}

export interface YearRow {
  season: number;
  team?: { id?: number; name?: string };
  /** Clubs in a combined line; set only on the season's total */
  numTeams?: number;
  /** One club's part of a season played for several */
  isPart: boolean;
  stat: LevelSplit['stat'];
}

function yearSplits(stats: PlayerStatGroup[] | undefined, group: 'hitting' | 'pitching'): YearByYearSplit[] {
  return (stats?.find((s) => s.group?.displayName === group && s.type?.displayName === 'yearByYear')?.splits ??
    []) as YearByYearSplit[];
}

/**
 * Every season a player has a line in, at any level, newest first: the
 * choices for his game log.
 */
export function seasonsOf(stats: PlayerStatGroup[] | undefined): number[] {
  const seasons = (['hitting', 'pitching'] as const).flatMap((g) => yearSplits(stats, g).map((s) => Number(s.season)));
  return [...new Set(seasons.filter((y) => Number.isInteger(y) && y > 0))].sort((a, b) => b - a);
}

/**
 * One level's seasons, newest first. A season split between clubs reads as
 * its total first and then each club's part, the order the API lists the
 * clubs in (the order he played for them).
 */
export function yearRows(stats: PlayerStatGroup[] | undefined, group: 'hitting' | 'pitching', sportId: number): YearRow[] {
  const bySeason = new Map<number, YearByYearSplit[]>();
  yearSplits(stats, group)
    .filter((s) => sportIdOf(s) === sportId && Number.isInteger(Number(s.season)))
    .forEach((s) => {
      const season = Number(s.season);
      bySeason.set(season, [...(bySeason.get(season) ?? []), s]);
    });
  return [...bySeason.entries()]
    .sort(([a], [b]) => b - a)
    .flatMap(([season, splits]) => {
      const total = splits.find((s) => !s.team);
      const parts = splits.filter((s) => s.team);
      if (!total || parts.length < 2) {
        // One club, or no total to head the clubs: each line stands alone
        return (parts.length > 0 ? parts : [total!]).map((s) => ({ season, team: s.team, isPart: false, stat: s.stat }));
      }
      return [
        { season, numTeams: total.numTeams ?? parts.length, isPart: false, stat: total.stat },
        ...parts.map((p) => ({ season, team: p.team, isPart: true, stat: p.stat })),
      ];
    });
}
