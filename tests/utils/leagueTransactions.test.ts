import { describe, it, expect } from 'vitest';
import {
  daysBefore,
  filterLeagueTransactions,
  groupByDate,
  inCategory,
  movesOf,
} from '../../src/utils/leagueTransactions';
import type { Transaction } from '../../src/types/transactions';

const move = (id: number, typeDesc: string, date: string, extra: Partial<Transaction> = {}): Transaction => ({
  id,
  typeDesc,
  date,
  person: { id: 1000 + id, fullName: `Player ${id}` },
  ...extra,
});

const moves = [
  move(1, 'Trade', '2026-11-02', { fromTeam: { id: 119 }, toTeam: { id: 147 } }),
  move(2, 'Optioned', '2026-11-03', { fromTeam: { id: 119 }, toTeam: { id: 238 } }),
  move(3, 'Signed as Free Agent', '2026-11-03', { toTeam: { id: 116 } }),
  move(4, 'Declared Free Agency', '2026-11-01', { fromTeam: { id: 147 } }),
  move(5, 'Status Change', '2026-11-03', { toTeam: { id: 147 } }),
  { id: 6, typeDesc: 'Trade', date: '2026-11-03', description: 'Cash considerations' },
];

describe('inCategory', () => {
  it('counts trades, signings and departures as key moves', () => {
    expect(moves.filter((m) => inCategory(m, 'notable')).map((m) => m.id)).toEqual([1, 3, 4, 6]);
    expect(moves.filter((m) => inCategory(m, 'trades')).map((m) => m.id)).toEqual([1, 6]);
    expect(moves.filter((m) => inCategory(m, 'signings')).map((m) => m.id)).toEqual([3]);
    expect(moves.filter((m) => inCategory(m, 'departures')).map((m) => m.id)).toEqual([4]);
    expect(moves.filter((m) => inCategory(m, 'all'))).toHaveLength(6);
  });
});

describe('filterLeagueTransactions', () => {
  it('keeps moves about a player in the category, newest first', () => {
    expect(filterLeagueTransactions(moves, { category: 'notable' }).map((m) => m.id)).toEqual([3, 1, 4]);
  });

  it('keeps one club’s moves, coming or going', () => {
    expect(filterLeagueTransactions(moves, { category: 'all', teamId: 147 }).map((m) => m.id)).toEqual([5, 1, 4]);
  });

  it('is empty without data', () => {
    expect(filterLeagueTransactions(undefined, { category: 'all' })).toEqual([]);
  });
});

describe('movesOf', () => {
  it('keeps every move of the given players', () => {
    expect(movesOf(moves, new Set([1002, 1005])).map((m) => m.id)).toEqual([5, 2]);
  });
});

describe('groupByDate', () => {
  it('groups consecutive moves of one day', () => {
    const groups = groupByDate(filterLeagueTransactions(moves, { category: 'all' }));
    expect(groups.map((g) => [g.date, g.moves.map((m) => m.id)])).toEqual([
      ['2026-11-03', [5, 3, 2]],
      ['2026-11-02', [1]],
      ['2026-11-01', [4]],
    ]);
  });
});

describe('daysBefore', () => {
  it('steps back across months and years', () => {
    expect(daysBefore('2026-11-03', 13)).toBe('2026-10-21');
    expect(daysBefore('2027-01-05', 6)).toBe('2026-12-30');
    expect(daysBefore('2026-03-01', 1)).toBe('2026-02-28');
  });
});
