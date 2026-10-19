import { describe, it, expect, afterEach } from 'vitest';
import {
  COMPARE_ROWS,
  addToComparison,
  bestColumns,
  compareValue,
  defaultCompareGroup,
  loadComparison,
  parseCompareIds,
  saveComparison,
} from '../../src/utils/comparison';
import type { PlayerStatGroup } from '../../src/utils/playerLevels';

const rowOf = (group: 'hitting' | 'pitching', key: string) => COMPARE_ROWS[group].find((r) => r.key === key)!;

describe('parseCompareIds', () => {
  it('keeps valid ids once each, at most four', () => {
    expect(parseCompareIds('660271,592450,660271,abc,-3,0,694973,1,2')).toEqual([660271, 592450, 694973, 1]);
    expect(parseCompareIds(null)).toEqual([]);
    expect(parseCompareIds('')).toEqual([]);
  });
});

describe('addToComparison', () => {
  it('appends a new player, leaves a known one, and drops the oldest when full', () => {
    expect(addToComparison([1, 2], 3)).toEqual([1, 2, 3]);
    expect(addToComparison([1, 2], 2)).toEqual([1, 2]);
    expect(addToComparison([1, 2, 3, 4], 5)).toEqual([2, 3, 4, 5]);
  });
});

describe('bestColumns', () => {
  it('marks the highest where higher is better and the lowest where lower is', () => {
    expect([...bestColumns(['.850', '.912', '.700'], rowOf('hitting', 'ops'))]).toEqual([1]);
    expect([...bestColumns(['3.10', '2.45', '4.00'], rowOf('pitching', 'era'))]).toEqual([1]);
    expect([...bestColumns(['0.90', '1.40'], rowOf('pitching', 'homeRunsPer9'))]).toEqual([0]);
  });

  it('leaves counts where fewer is better unmarked, so a small sample does not win them', () => {
    // 30 strikeouts in 120 PA is not better than 160 in 679
    expect(bestColumns([160, 30], rowOf('hitting', 'strikeOuts')).size).toBe(0);
    expect(bestColumns([3, 9], rowOf('pitching', 'losses')).size).toBe(0);
  });

  it('marks every tied column', () => {
    expect([...bestColumns([30, 41, 41], rowOf('hitting', 'homeRuns'))].sort()).toEqual([1, 2]);
  });

  it('marks nothing on sample size rows or with fewer than two values', () => {
    expect(bestColumns([600, 500], rowOf('hitting', 'plateAppearances')).size).toBe(0);
    expect(bestColumns(['.300', undefined], rowOf('hitting', 'avg')).size).toBe(0);
  });
});

describe('compareValue', () => {
  it('reads the combined line of a player who changed clubs', () => {
    const stats: PlayerStatGroup[] = [
      {
        group: { displayName: 'hitting' },
        type: { displayName: 'season' },
        splits: [
          { team: { id: 140 }, stat: { homeRuns: 12 } },
          { team: { id: 119 }, stat: { homeRuns: 9 } },
          { stat: { homeRuns: 21 } },
        ],
      },
      { group: { displayName: 'hitting' }, type: { displayName: 'sabermetrics' }, splits: [{ stat: { war: 3.4 } }] },
    ];
    expect(compareValue(stats, 'hitting', rowOf('hitting', 'homeRuns'))).toBe(21);
    expect(compareValue(stats, 'hitting', rowOf('hitting', 'war'))).toBe(3.4);
  });
});

describe('defaultCompareGroup', () => {
  it('opens on pitching only when everyone is a pitcher', () => {
    expect(defaultCompareGroup(['Pitcher', 'Pitcher'])).toBe('pitching');
    expect(defaultCompareGroup(['Pitcher', 'Outfielder'])).toBe('hitting');
    expect(defaultCompareGroup([])).toBe('hitting');
  });
});

describe('loadComparison / saveComparison', () => {
  afterEach(() => localStorage.clear());

  it('round-trips the list through storage', () => {
    saveComparison([660271, 592450]);
    expect(loadComparison()).toEqual([660271, 592450]);
  });
});
