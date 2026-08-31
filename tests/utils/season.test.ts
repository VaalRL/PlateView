import { describe, it, expect } from 'vitest';
import { getCurrentMlbSeason } from '../../src/utils/season';

describe('getCurrentMlbSeason', () => {
  it('returns the calendar year during the regular season', () => {
    expect(getCurrentMlbSeason(new Date(2026, 7, 30))).toBe(2026); // August
    expect(getCurrentMlbSeason(new Date(2026, 9, 15))).toBe(2026); // October
  });

  it('returns the previous year during the January/February offseason', () => {
    expect(getCurrentMlbSeason(new Date(2027, 0, 10))).toBe(2026); // January
    expect(getCurrentMlbSeason(new Date(2027, 1, 28))).toBe(2026); // February
  });

  it('returns the calendar year from March (spring training / opening day)', () => {
    expect(getCurrentMlbSeason(new Date(2027, 2, 1))).toBe(2027); // March
  });
});
