/**
 * Current MLB season year. The regular season runs from late March through
 * October; during January and February the previous season is still the one
 * with meaningful stats, so it is returned instead of the calendar year.
 */
export function getCurrentMlbSeason(date: Date = new Date()): number {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-based: 0 = January
  return month < 2 ? year - 1 : year;
}
