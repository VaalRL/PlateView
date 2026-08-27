import { describe, it, expect } from 'vitest';
import { formatGameTime, formatApiDate, getRelativeDateLabel } from '../../src/utils/timezone';

describe('timezone utility tests', () => {
  it('formats API date string to yyyy-MM-dd', () => {
    const date = new Date(2026, 7, 27); // August 27, 2026
    expect(formatApiDate(date)).toBe('2026-08-27');
  });

  it('handles invalid UTC string gracefully in formatGameTime', () => {
    expect(formatGameTime(undefined)).toBe('TBD');
    expect(formatGameTime('invalid-date')).toBe('TBD');
  });

  it('correctly labels today date', () => {
    const today = new Date();
    expect(getRelativeDateLabel(today)).toBe('今天 (Today)');
  });
});
