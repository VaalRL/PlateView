import { describe, it, expect } from 'vitest';
import { getCurrentMlbSeason, mayHavePostseasonGames } from '../../src/utils/season';

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

describe('mayHavePostseasonGames', () => {
  const on = (iso: string) => mayHavePostseasonGames(new Date(`${iso}T12:00:00`));

  it('is off from opening day to the last week of the regular season', () => {
    expect(on('2026-03-01')).toBe(false);
    expect(on('2026-07-15')).toBe(false);
    expect(on('2026-09-24')).toBe(false);
  });

  it('is on from the end of September through the off-season', () => {
    expect(on('2026-09-25')).toBe(true);
    expect(on('2026-10-16')).toBe(true);
    expect(on('2026-12-31')).toBe(true);
    expect(on('2027-02-28')).toBe(true);
  });
});
