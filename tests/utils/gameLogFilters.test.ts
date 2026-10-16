import { describe, it, expect } from 'vitest';
import {
  DEFAULT_GAME_LOG_FILTER,
  filterGameLogs,
  getGameLogFilterOptions,
  isFilterActive,
  outsOf,
  sumHitting,
  sumPitching,
} from '../../src/utils/gameLogFilters';
import type { GameLogSplit } from '../../src/types/favorites';

const game = (over: Partial<GameLogSplit>): GameLogSplit => ({
  date: '2026-08-01',
  gameType: 'R',
  isHome: true,
  opponent: { id: 137, name: 'San Francisco Giants' },
  sport: { id: 1, abbreviation: 'MLB' },
  stat: {},
  ...over,
});

const logs: GameLogSplit[] = [
  game({ date: '2026-10-08', gameType: 'D', isHome: false, opponent: { id: 135, name: 'San Diego Padres' } }),
  game({ date: '2026-09-20', isHome: true }),
  game({ date: '2026-08-15', isHome: false }),
  game({ date: '2026-05-02', sport: { id: 11, abbreviation: 'AAA' }, opponent: { id: 238, name: 'Oklahoma City Comets' } }),
];

const dates = (l: GameLogSplit[]) => l.map((g) => g.date);

describe('filterGameLogs', () => {
  it('keeps everything with the default filter', () => {
    expect(filterGameLogs(logs, DEFAULT_GAME_LOG_FILTER)).toHaveLength(4);
    expect(isFilterActive(DEFAULT_GAME_LOG_FILTER)).toBe(false);
  });

  it('splits the regular season from the postseason', () => {
    expect(dates(filterGameLogs(logs, { ...DEFAULT_GAME_LOG_FILTER, gameType: 'postseason' }))).toEqual(['2026-10-08']);
    expect(filterGameLogs(logs, { ...DEFAULT_GAME_LOG_FILTER, gameType: 'regular' })).toHaveLength(3);
  });

  it('filters by level, venue, opponent and month, combined', () => {
    expect(dates(filterGameLogs(logs, { ...DEFAULT_GAME_LOG_FILTER, level: 11 }))).toEqual(['2026-05-02']);
    expect(dates(filterGameLogs(logs, { ...DEFAULT_GAME_LOG_FILTER, venue: 'away' }))).toEqual(['2026-10-08', '2026-08-15']);
    const giantsAway = { ...DEFAULT_GAME_LOG_FILTER, opponentId: 137, venue: 'away' as const };
    expect(isFilterActive(giantsAway)).toBe(true);
    expect(dates(filterGameLogs(logs, giantsAway))).toEqual(['2026-08-15']);
    expect(dates(filterGameLogs(logs, { ...DEFAULT_GAME_LOG_FILTER, month: '2026-09' }))).toEqual(['2026-09-20']);
  });

  it('leaves a game with no home/away flag out of both venue filters', () => {
    const unknown = [game({ isHome: undefined })];
    expect(filterGameLogs(unknown, { ...DEFAULT_GAME_LOG_FILTER, venue: 'home' })).toHaveLength(0);
    expect(filterGameLogs(unknown, { ...DEFAULT_GAME_LOG_FILTER, venue: 'away' })).toHaveLength(0);
  });
});

describe('getGameLogFilterOptions', () => {
  it('offers only what occurs in the log', () => {
    const options = getGameLogFilterOptions(logs);
    expect(options.hasPostseason).toBe(true);
    expect(options.levels).toEqual([
      { id: 1, abbreviation: 'MLB' },
      { id: 11, abbreviation: 'AAA' },
    ]);
    expect(options.opponents.map((o) => o.id)).toEqual([238, 135, 137]);
    expect(options.months).toEqual(['2026-10', '2026-09', '2026-08', '2026-05']);
    expect(getGameLogFilterOptions(logs.slice(1, 3)).hasPostseason).toBe(false);
  });
});

describe('sumHitting', () => {
  it('adds counting stats and works rates out from them', () => {
    const totals = sumHitting([
      game({ stat: { atBats: 4, hits: 2, homeRuns: 1, rbi: 3, runs: 1, baseOnBalls: 1, strikeOuts: 1, totalBases: 5 } }),
      game({ stat: { atBats: 4, hits: 1, homeRuns: 0, rbi: 0, runs: 0, baseOnBalls: 0, strikeOuts: 2, totalBases: 1, hitByPitch: 1 } }),
    ]);
    expect(totals).toMatchObject({ atBats: 8, hits: 3, homeRuns: 1, rbi: 3, baseOnBalls: 1, strikeOuts: 3 });
    expect(totals.avg).toBe('.375');
    // OBP (3+1+1)/(8+1+1) = .500, SLG 6/8 = .750
    expect(totals.ops).toBe('1.250');
  });

  it('has no rates without at bats', () => {
    expect(sumHitting([]).avg).toBe('---');
    expect(sumHitting([]).ops).toBe('---');
  });
});

describe('sumPitching', () => {
  it('counts innings in outs so thirds add up', () => {
    const totals = sumPitching([
      game({ stat: { inningsPitched: '1.2', outs: 5, earnedRuns: 1, hits: 2, baseOnBalls: 1, strikeOuts: 2, wins: 1, losses: 0 } }),
      game({ stat: { inningsPitched: '0.2', earnedRuns: 0, hits: 0, baseOnBalls: 0, strikeOuts: 1, wins: 0, losses: 1 } }),
    ]);
    expect(totals.inningsPitched).toBe('2.1');
    expect(totals.record).toBe('1-1');
    // 1 ER over 7 outs: 1 * 27 / 7
    expect(totals.era).toBe('3.86');
    // 3 baserunners over 7/3 innings
    expect(totals.whip).toBe('1.29');
  });

  it('has no ERA without an out recorded', () => {
    expect(sumPitching([game({ stat: { inningsPitched: '0.0', earnedRuns: 2 } })]).era).toBe('-.--');
  });

  it('reads innings pitched as thirds when outs are missing', () => {
    expect(outsOf({ inningsPitched: '5.2' })).toBe(17);
    expect(outsOf({ inningsPitched: '6' })).toBe(18);
    expect(outsOf(undefined)).toBe(0);
  });
});
