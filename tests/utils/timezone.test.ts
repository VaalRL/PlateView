import { describe, it, expect } from 'vitest';
import {
  formatGameTime,
  formatBilingualGameTime,
  formatApiDate,
  getEasternDateStr,
  getRelativeDateLabel,
} from '../../src/utils/timezone';

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

  it('formats US Eastern date string across the UTC date boundary', () => {
    // 2026-08-30T02:00:00Z is still 2026-08-29 22:00 in EDT (UTC-4)
    expect(getEasternDateStr(new Date('2026-08-30T02:00:00Z'))).toBe('2026-08-29');
    // Winter: EST (UTC-5)
    expect(getEasternDateStr(new Date('2026-01-15T04:59:00Z'))).toBe('2026-01-14');
    expect(getEasternDateStr(new Date('2026-01-15T05:00:00Z'))).toBe('2026-01-15');
  });

  it('formats bilingual game time for zh (Taipei Time) and en (Eastern Time)', () => {
    // 2026-08-27 23:15:00 UTC -> 2026-08-28 07:15:00 Taipei Time (UTC+8) -> 7:15 PM ET
    const utcDate = '2026-08-27T23:15:00Z';
    const zhTime = formatBilingualGameTime(utcDate, 'zh');
    const enTime = formatBilingualGameTime(utcDate, 'en');

    expect(zhTime).toContain('07:15');
    expect(zhTime).toContain('台北時間');
    expect(enTime).toContain('7:15 PM');
    expect(enTime).toContain('ET');
  });
});
