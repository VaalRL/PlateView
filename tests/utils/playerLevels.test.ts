import { describe, it, expect } from 'vitest';
import {
  getStatLevels,
  getLevelStat,
  getDefaultLevel,
  sortGameLogsByDate,
  getLatestGameLog,
  type PlayerStatGroup,
} from '../../src/utils/playerLevels';
// Real /people responses hydrated with leagueListId=mlb_milb (game logs trimmed)
import promoted from '../fixtures/player-promoted-serven.json';
import demoted from '../fixtures/player-demoted.json';
import traded from '../fixtures/player-traded-halvorsen.json';

const statsOf = (r: unknown) => (r as { people: { stats: PlayerStatGroup[] }[] }).people[0].stats;

describe('getStatLevels', () => {
  it('lists every level a player has stats at, big leagues first', () => {
    expect(getStatLevels(statsOf(promoted), 'hitting', 'season').map((l) => l.id)).toEqual([1, 11]);
  });

  it('leaves out the all-minors aggregate row', () => {
    const career = getStatLevels(statsOf(promoted), 'hitting', 'career');
    expect(career.map((l) => l.id)).toEqual([1, 11, 12, 13, 14, 16]);
    expect(career.map((l) => l.abbreviation)).toEqual(['MLB', 'AAA', 'AA', 'A+', 'A', 'ROK']);
  });

  it('returns an empty list when the group has no stats', () => {
    expect(getStatLevels(statsOf(promoted), 'pitching', 'season')).toEqual([]);
    expect(getStatLevels(undefined, 'hitting', 'season')).toEqual([]);
  });
});

describe('getLevelStat', () => {
  it('reads the stat line for the requested level', () => {
    expect(getLevelStat(statsOf(promoted), 'hitting', 'season', 1)?.gamesPlayed).toBe(28);
    expect(getLevelStat(statsOf(promoted), 'hitting', 'season', 11)?.gamesPlayed).toBe(61);
  });

  it('uses the combined line when a player split a level between teams', () => {
    // Halvorsen: Rockies 21 + Dodgers 11 in MLB, two AAA clubs 10 + 16
    expect(getLevelStat(statsOf(traded), 'pitching', 'season', 1)?.gamesPlayed).toBe(32);
    expect(getLevelStat(statsOf(traded), 'pitching', 'season', 11)?.gamesPlayed).toBe(26);
  });

  it('returns undefined for a level the player never reached', () => {
    expect(getLevelStat(statsOf(promoted), 'hitting', 'season', 12)).toBeUndefined();
  });

  it('treats splits without a sport as big league stats', () => {
    const legacy: PlayerStatGroup[] = [
      {
        group: { displayName: 'hitting' },
        type: { displayName: 'season' },
        splits: [{ stat: { gamesPlayed: 5 } }],
      },
    ];
    expect(getLevelStat(legacy, 'hitting', 'season', 1)?.gamesPlayed).toBe(5);
  });
});

describe('getDefaultLevel', () => {
  const ids = (list: number[]) => list.map((id) => ({ id, abbreviation: String(id) }));

  it("starts on the level of the player's current club", () => {
    // Optioned to AAA after an MLB stint: land on the AAA line he is building now
    expect(getDefaultLevel(ids([1, 11]), 11)).toBe(11);
    // Called up from AAA: land on MLB
    expect(getDefaultLevel(ids([1, 11]), 1)).toBe(1);
  });

  it('falls back to MLB, then to the first level, when the current level has no stats', () => {
    expect(getDefaultLevel(ids([1, 11]), 12)).toBe(1);
    expect(getDefaultLevel(ids([11, 12]), undefined)).toBe(11);
    expect(getDefaultLevel([], 11)).toBe(1);
  });
});

describe('game logs across levels', () => {
  const logs = (r: unknown, group: 'hitting' | 'pitching') =>
    statsOf(r).find((s) => s.group?.displayName === group && s.type?.displayName === 'gameLog')?.splits ?? [];

  it('sorts a log that the API groups by level into newest-first date order', () => {
    // The demoted pitcher's last MLB game (08-29) sits before his AAA games in the response
    const sorted = sortGameLogsByDate(logs(demoted, 'pitching'));
    expect(sorted.map((s) => s.date)).toEqual([
      '2026-09-17',
      '2026-09-12',
      '2026-09-09',
      '2026-08-29',
      '2026-06-28',
      '2026-06-01',
    ]);
  });

  it('picks the most recent game regardless of level order', () => {
    // Serven's AAA games come last in the response but are months older
    expect(getLatestGameLog(logs(promoted, 'hitting'))?.date).toBe('2026-09-23');
    expect(getLatestGameLog(logs(demoted, 'pitching'))?.sport?.id).toBe(11);
    expect(getLatestGameLog([])).toBeUndefined();
  });
});
