import { describe, it, expect, afterEach } from 'vitest';
import {
  addTeamToComparison,
  lastCompletedGame,
  lineupOps,
  loadTeamComparison,
  parseCompareTeamIds,
  saveTeamComparison,
  startingDefense,
  startingLineup,
  teamSide,
} from '../../src/utils/teamComparison';
import { bestIndexes } from '../../src/utils/comparison';
import type { BoxscoreTeamSide, ScheduleResponse } from '../../src/types/mlb';

const game = (gamePk: number, gameDate: string, state: string, extra: Record<string, unknown> = {}) => ({
  gamePk,
  gameType: 'R',
  gameDate,
  officialDate: gameDate.slice(0, 10),
  status: { abstractGameState: state, detailedState: state, codedGameState: state === 'Final' ? 'F' : 'S' },
  teams: { away: { team: { id: 147 } }, home: { team: { id: 119 } } },
  ...extra,
});

const schedule = (...games: ReturnType<typeof game>[]) =>
  ({ dates: games.map((g) => ({ date: g.officialDate, games: [g] })) }) as unknown as ScheduleResponse;

describe('lastCompletedGame', () => {
  it('takes the latest game played to the end', () => {
    const last = lastCompletedGame(
      schedule(
        game(1, '2026-09-26T23:10:00Z', 'Final'),
        game(2, '2026-09-27T20:10:00Z', 'Final'),
        game(3, '2026-09-28T20:10:00Z', 'Preview')
      ),
      119
    );
    expect(last?.gamePk).toBe(2);
  });

  it('skips a rainout filed as Final and spring training', () => {
    const last = lastCompletedGame(
      schedule(
        game(1, '2026-09-26T23:10:00Z', 'Final'),
        game(2, '2026-09-27T20:10:00Z', 'Final', {
          status: { abstractGameState: 'Final', detailedState: 'Postponed', codedGameState: 'D' },
        }),
        game(3, '2026-09-28T20:10:00Z', 'Final', { gameType: 'S' })
      ),
      119
    );
    expect(last?.gamePk).toBe(1);
  });

  it('takes the second game of a doubleheader by start time', () => {
    const last = lastCompletedGame(
      schedule(game(2, '2026-09-27T23:40:00Z', 'Final'), game(1, '2026-09-27T17:05:00Z', 'Final')),
      119
    );
    expect(last?.gamePk).toBe(2);
  });

  it('ignores games the club was not in, and returns null without any', () => {
    expect(lastCompletedGame(schedule(game(1, '2026-09-26T23:10:00Z', 'Final')), 116)).toBeNull();
    expect(lastCompletedGame(undefined, 119)).toBeNull();
  });
});

/**
 * Mirrors a boxscore side: the left fielder moved to first base mid-game, the
 * cleanup hitter was pinch-hit for, and the starting pitcher also hit at DH
 * under the two-way rule.
 */
const side = {
  team: { id: 119 },
  pitchers: [10, 20],
  players: {
    ID10: {
      person: { id: 10, fullName: 'Two Way' },
      position: { abbreviation: 'DH' },
      allPositions: [{ abbreviation: 'P' }, { abbreviation: 'DH' }],
      battingOrder: '100',
      seasonStats: { batting: { avg: '.280', ops: '.950', homeRuns: 40 }, pitching: { era: '3.00', wins: 10, losses: 5 } },
    },
    ID20: {
      person: { id: 20, fullName: 'Reliever' },
      position: { abbreviation: 'P' },
      allPositions: [{ abbreviation: 'P' }],
    },
    ID2: {
      person: { id: 2, fullName: 'Moved Over' },
      position: { abbreviation: '1B' },
      allPositions: [{ abbreviation: 'LF' }, { abbreviation: '1B' }],
      battingOrder: '200',
      seasonStats: { batting: { ops: '.750' }, fielding: { fielding: '.990', errors: 2 } },
    },
    ID3: {
      person: { id: 3, fullName: 'Cleanup' },
      position: { abbreviation: 'C' },
      allPositions: [{ abbreviation: 'C' }],
      battingOrder: '400',
      seasonStats: { batting: { ops: '.850' } },
    },
    ID4: {
      person: { id: 4, fullName: 'Pinch Hitter' },
      position: { abbreviation: 'PH' },
      allPositions: [{ abbreviation: 'PH' }],
      battingOrder: '401',
    },
  },
} as unknown as BoxscoreTeamSide;

describe('startingLineup', () => {
  it('lists each slot’s starter at the position he started at', () => {
    const lineup = startingLineup(side);
    expect(lineup.map((s) => [s.slot, s.fullName, s.position])).toEqual([
      [1, 'Two Way', 'P'],
      [2, 'Moved Over', 'LF'],
      [4, 'Cleanup', 'C'],
    ]);
    expect(lineup[0]).toMatchObject({ avg: '.280', ops: '.950', homeRuns: 40 });
  });
});

describe('startingDefense', () => {
  it('places starters at their first position and the first pitcher on the mound', () => {
    const defense = startingDefense(side);
    expect(defense.LF?.fullName).toBe('Moved Over');
    expect(defense.LF).toMatchObject({ fieldingPct: '.990', errors: 2 });
    expect(defense['1B']).toBeUndefined();
    expect(defense.C?.fullName).toBe('Cleanup');
    expect(defense.P).toMatchObject({ fullName: 'Two Way', era: '3.00', wins: 10, losses: 5, slot: 1 });
  });

  it('fills DH with a pitcher who also batted there', () => {
    expect(startingDefense(side).DH).toMatchObject({ personId: 10, position: 'DH' });
  });

  it('is empty without a boxscore', () => {
    expect(startingDefense(null)).toEqual({});
  });
});

describe('teamSide', () => {
  it('matches the side by team id', () => {
    const away = { team: { id: 147 } } as BoxscoreTeamSide;
    const box = { teams: { away, home: side } };
    expect(teamSide(box, 119)).toBe(side);
    expect(teamSide(box, 147)).toBe(away);
    expect(teamSide(box, 116)).toBeNull();
  });
});

describe('lineupOps', () => {
  it('averages the starters with an OPS', () => {
    expect(lineupOps(startingLineup(side))).toBeCloseTo((0.95 + 0.75 + 0.85) / 3);
    expect(lineupOps([])).toBeNull();
  });
});

describe('bestIndexes', () => {
  it('marks every column tied for best', () => {
    expect([...bestIndexes([0.8, 0.9, 0.9], 'high')]).toEqual([1, 2]);
    expect([...bestIndexes([3.1, null, 2.5], 'low')]).toEqual([2]);
  });

  it('marks nothing with fewer than two values', () => {
    expect(bestIndexes([0.8, null], 'high').size).toBe(0);
  });
});

describe('team comparison list', () => {
  afterEach(() => localStorage.clear());

  it('keeps big league clubs only, once each, at most four', () => {
    expect(parseCompareTeamIds('119,147,119,534,abc,116,121,108')).toEqual([119, 147, 116, 121]);
    expect(parseCompareTeamIds(null)).toEqual([]);
  });

  it('drops the oldest club when full', () => {
    expect(addTeamToComparison([119, 147, 116, 121], 108)).toEqual([147, 116, 121, 108]);
    expect(addTeamToComparison([119], 119)).toEqual([119]);
  });

  it('round-trips through storage', () => {
    saveTeamComparison([119, 147]);
    expect(loadTeamComparison()).toEqual([119, 147]);
  });
});
