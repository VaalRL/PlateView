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
 * Format game time according to user language:
 * - zh: Taipei Time (UTC+8, e.g. "07:15 (台北時間)" or "08/28 07:15 (台北時間)")
 * - en: Eastern Time (US ET, e.g. "7:15 PM ET" or "08/28 7:15 PM ET")
 */
export function formatBilingualGameTime(
  utcDateString?: string,
  lang: string = 'zh',
  includeDate: boolean = false
): string {
  if (!utcDateString) return 'TBD';
  try {
    const date = typeof utcDateString === 'string' ? parseISO(utcDateString) : utcDateString;
    if (isNaN(date.getTime())) return 'TBD';

    if (lang === 'zh') {
      const timeStr = new Intl.DateTimeFormat('zh-TW', {
        timeZone: 'Asia/Taipei',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(date);

      if (includeDate) {
        const dateStr = new Intl.DateTimeFormat('zh-TW', {
          timeZone: 'Asia/Taipei',
          month: '2-digit',
          day: '2-digit',
        }).format(date);
        return `${dateStr} ${timeStr} (台北時間)`;
      }
      return `${timeStr} (台北時間)`;
    } else {
      const timeStr = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(date);

      if (includeDate) {
        const dateStr = new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/New_York',
          month: '2-digit',
          day: '2-digit',
        }).format(date);
        return `${dateStr} ${timeStr} ET`;
      }
      return `${timeStr} ET`;
    }
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
 * Format a date as YYYY-MM-DD in US Eastern time. MLB gameLog `date` fields
 * use the official (US-based) game date, so "today" comparisons must use the
 * Eastern date, not the viewer's local date (e.g. Taiwan mornings are still
 * the previous game day in the US).
 */
export function getEasternDateStr(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
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
