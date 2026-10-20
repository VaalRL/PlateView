import { describe, it, expect } from 'vitest';
import { seasonsOf, yearRows, type YearByYearSplit } from '../../src/utils/yearByYear';
import type { PlayerStatGroup } from '../../src/utils/playerLevels';

const MLB = { id: 1, abbreviation: 'MLB' };
const AAA = { id: 11, abbreviation: 'AAA' };
const MINORS = { id: 21, abbreviation: 'Minors' };

const line = (season: string, sport: typeof MLB, team?: number, extra: Partial<YearByYearSplit> = {}): YearByYearSplit => ({
  season,
  sport,
  ...(team !== undefined ? { team: { id: team, name: `Team ${team}` } } : {}),
  stat: { gamesPlayed: Number(season.slice(2)) },
  ...extra,
});

const groups = (hitting: YearByYearSplit[], pitching: YearByYearSplit[] = []): PlayerStatGroup[] => [
  { group: { displayName: 'hitting' }, type: { displayName: 'yearByYear' }, splits: hitting },
  { group: { displayName: 'pitching' }, type: { displayName: 'yearByYear' }, splits: pitching },
  // Not a year-by-year group: ignored
  { group: { displayName: 'hitting' }, type: { displayName: 'career' }, splits: [line('1999', MLB, 119)] },
];

describe('seasonsOf', () => {
  it('lists every season in either role once, newest first', () => {
    expect(seasonsOf(groups([line('2024', MLB, 119), line('2025', AAA, 431)], [line('2026', MLB, 119), line('2024', MLB, 119)]))).toEqual([
      2026, 2025, 2024,
    ]);
    expect(seasonsOf(undefined)).toEqual([]);
  });
});

describe('yearRows', () => {
  it('keeps one level’s seasons, newest first', () => {
    const rows = yearRows(groups([line('2024', MLB, 119), line('2025', AAA, 431), line('2026', MLB, 119)]), 'hitting', 1);
    expect(rows.map((r) => [r.season, r.team?.id, r.isPart])).toEqual([
      [2026, 119, false],
      [2024, 119, false],
    ]);
  });

  it('heads a season split between clubs with its total, then each club', () => {
    const rows = yearRows(
      groups([
        line('2021', MLB, 120),
        line('2021', MLB, 119),
        line('2021', MLB, undefined, { numTeams: 2 }),
        line('2022', MLB, 121),
      ]),
      'hitting',
      1
    );
    expect(rows.map((r) => [r.season, r.numTeams, r.team?.id, r.isPart])).toEqual([
      [2022, undefined, 121, false],
      [2021, 2, undefined, false],
      [2021, undefined, 120, true],
      [2021, undefined, 119, true],
    ]);
  });

  it('keeps the all-minors total apart from each level', () => {
    const splits = [line('2022', MINORS, undefined, { numTeams: 2 }), line('2022', AAA, 431)];
    expect(yearRows(groups(splits), 'hitting', 11)).toHaveLength(1);
    expect(yearRows(groups(splits), 'hitting', 21)).toHaveLength(1);
  });

  it('reads the role asked for', () => {
    const rows = yearRows(groups([line('2024', MLB, 119)], [line('2023', MLB, 108)]), 'pitching', 1);
    expect(rows.map((r) => r.season)).toEqual([2023]);
    expect(yearRows(undefined, 'pitching', 1)).toEqual([]);
  });
});
