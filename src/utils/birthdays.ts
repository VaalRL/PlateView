/**
 * Birthdays from the API's `birthDate` (YYYY-MM-DD, a calendar date with no
 * time zone). "Today" is the viewer's own calendar date.
 */

const parts = (birthDate: string): [number, number, number] | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
};

const isLeapYear = (year: number) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

/** "1994 年 7 月 5 日" or "July 5, 1994" */
export function formatBirthDate(birthDate: string | undefined, lang: 'zh' | 'en'): string | null {
  const p = birthDate ? parts(birthDate) : null;
  if (!p) return null;
  const [y, m, d] = p;
  if (lang === 'zh') return `${y} 年 ${m} 月 ${d} 日`;
  const month = new Date(Date.UTC(2000, m - 1, 1)).toLocaleString('en-US', { month: 'long', timeZone: 'UTC' });
  return `${month} ${d}, ${y}`;
}

/** "11 月 4 日" or "Nov 4": a birthday without its year */
export function formatMonthDay(birthDate: string | null | undefined, lang: 'zh' | 'en'): string {
  const p = birthDate ? parts(birthDate) : null;
  if (!p) return '';
  const [, m, d] = p;
  if (lang === 'zh') return `${m} 月 ${d} 日`;
  return `${new Date(Date.UTC(2000, m - 1, 1)).toLocaleString('en-US', { month: 'short', timeZone: 'UTC' })} ${d}`;
}

/** This year's birthday as a calendar date; Feb 29 falls on Feb 28 outside leap years */
function birthdayIn(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, month === 2 && day === 29 && !isLeapYear(year) ? 28 : day);
}

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

/** Days until the next birthday: 0 today, up to 365 */
export function daysUntilBirthday(birthDate: string | undefined, today: Date = new Date()): number | null {
  const p = birthDate ? parts(birthDate) : null;
  if (!p) return null;
  const [, m, d] = p;
  const from = startOfDay(today);
  let next = birthdayIn(from.getFullYear(), m, d);
  if (next < from) next = birthdayIn(from.getFullYear() + 1, m, d);
  return Math.round((next.getTime() - from.getTime()) / 86_400_000);
}

/** The age a player turns on his next birthday (today's, if it is today) */
export function ageOnNextBirthday(birthDate: string | undefined, today: Date = new Date()): number | null {
  const p = birthDate ? parts(birthDate) : null;
  const until = daysUntilBirthday(birthDate, today);
  if (!p || until === null) return null;
  const next = new Date(startOfDay(today).getTime() + until * 86_400_000);
  return next.getFullYear() - p[0];
}

/** Within the coming week, today included */
export const isBirthdayThisWeek = (birthDate: string | undefined, today: Date = new Date()): boolean => {
  const until = daysUntilBirthday(birthDate, today);
  return until !== null && until <= 6;
};
