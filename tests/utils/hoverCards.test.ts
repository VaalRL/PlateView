import { describe, it, expect } from 'vitest';
import { findLeaderRanks, findTeamStanding, levelAbbreviation, ordinal } from '../../src/utils/hoverCards';
import type { LeaderCategoryGroup } from '../../src/types/leaderboards';
import type { StandingsResponse } from '../../src/types/mlb';
import standings from '../fixtures/standings-2026.json';

const group = (leaderCategory: string, leaders: [number, number, string][]): LeaderCategoryGroup => ({
  leaderCategory,
  statGroup: 'hitting',
  season: '2026',
  leaders: leaders.map(([id, rank, value]) => ({
    rank,
    value,
    person: { id, fullName: `P${id}` },
    team: { id: 119, name: 'Los Angeles Dodgers' },
  })),
});

describe('findLeaderRanks', () => {
  it('lists the categories a player is in, best rank first', () => {
    const ranks = findLeaderRanks(660271, [
      group('battingAverage', [[1, 1, '.320'], [660271, 4, '.301']]),
      group('homeRuns', [[660271, 1, '54'], [2, 2, '50']]),
      group('stolenBases', [[3, 1, '60']]),
    ]);
    expect(ranks).toEqual([
      { category: 'homeRuns', rank: 1, value: '54' },
      { category: 'battingAverage', rank: 4, value: '.301' },
    ]);
  });

  it('is empty for a player on no leaderboard', () => {
    expect(findLeaderRanks(999, [group('homeRuns', [[1, 1, '54']])])).toEqual([]);
  });
});

describe('findTeamStanding', () => {
  it("finds a club's record in any division", () => {
    const record = findTeamStanding(standings as unknown as StandingsResponse, 139);
    expect(record?.team.id).toBe(139);
    expect(record?.divisionRank).toBe('1');
    expect(findTeamStanding(standings as unknown as StandingsResponse, 1)).toBeUndefined();
    expect(findTeamStanding(undefined, 139)).toBeUndefined();
  });
});

describe('ordinal', () => {
  it('writes English ordinals', () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 101].map(ordinal)).toEqual([
      '1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '21st', '22nd', '101st',
    ]);
  });
});

describe('levelAbbreviation', () => {
  it('names minor league levels', () => {
    expect(levelAbbreviation(11)).toBe('AAA');
    expect(levelAbbreviation(14)).toBe('A');
    expect(levelAbbreviation(99)).toBeUndefined();
  });
});
