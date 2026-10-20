import { describe, it, expect } from 'vitest';
import { ageOnNextBirthday, daysUntilBirthday, formatBirthDate, isBirthdayThisWeek } from '../../src/utils/birthdays';

describe('formatBirthDate', () => {
  it('writes the date for each language', () => {
    expect(formatBirthDate('1994-07-05', 'zh')).toBe('1994 年 7 月 5 日');
    expect(formatBirthDate('1994-07-05', 'en')).toBe('July 5, 1994');
    expect(formatBirthDate(undefined, 'zh')).toBeNull();
    expect(formatBirthDate('7/5/1994', 'en')).toBeNull();
  });
});

describe('daysUntilBirthday', () => {
  const today = new Date(2026, 9, 20); // October 20, 2026

  it('counts today as 0 and wraps into next year', () => {
    expect(daysUntilBirthday('1995-10-20', today)).toBe(0);
    expect(daysUntilBirthday('1995-10-21', today)).toBe(1);
    expect(daysUntilBirthday('1995-10-19', today)).toBe(364);
  });

  it('puts a Feb 29 birthday on Feb 28 outside leap years', () => {
    expect(daysUntilBirthday('2000-02-29', new Date(2027, 1, 28))).toBe(0);
    expect(daysUntilBirthday('2000-02-29', new Date(2028, 1, 28))).toBe(1);
  });

  it('is null without a date', () => {
    expect(daysUntilBirthday(undefined, today)).toBeNull();
  });
});

describe('ageOnNextBirthday', () => {
  it('is the age turned today, or at the next birthday', () => {
    const today = new Date(2026, 9, 20);
    expect(ageOnNextBirthday('1994-10-20', today)).toBe(32);
    expect(ageOnNextBirthday('1994-10-19', today)).toBe(33); // next October
    expect(ageOnNextBirthday('1994-12-31', new Date(2026, 11, 31))).toBe(32);
  });
});

describe('isBirthdayThisWeek', () => {
  it('covers today and the six days after', () => {
    const today = new Date(2026, 11, 28);
    expect(isBirthdayThisWeek('2001-12-28', today)).toBe(true);
    expect(isBirthdayThisWeek('2001-01-03', today)).toBe(true); // across New Year
    expect(isBirthdayThisWeek('2001-01-04', today)).toBe(false);
  });
});
