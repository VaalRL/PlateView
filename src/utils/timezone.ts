import { format, parseISO, isToday, isTomorrow, isYesterday } from 'date-fns';

/**
 * Format UTC ISO string to local time string (e.g. "07:10 AM" or "19:10")
 */
export function formatGameTime(utcDateString?: string, formatStr: string = 'hh:mm a'): string {
  if (!utcDateString) return 'TBD';
  try {
    const date = parseISO(utcDateString);
    if (isNaN(date.getTime())) return 'TBD';
    return format(date, formatStr);
  } catch {
    return 'TBD';
  }
}

/**
 * Format date for MLB API query (YYYY-MM-DD)
 */
export function formatApiDate(date: Date = new Date()): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Get human-readable date label (e.g. "今天", "昨天", "明天", or "MM/dd (E)")
 */
export function getRelativeDateLabel(date: Date): string {
  if (isToday(date)) return '今天 (Today)';
  if (isYesterday(date)) return '昨天 (Yesterday)';
  if (isTomorrow(date)) return '明天 (Tomorrow)';
  return format(date, 'MM/dd (eee)');
}
