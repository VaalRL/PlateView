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

/**
 * Whether a player's game log can hold postseason games yet: from the last
 * week of September, when the regular season ends, through the off-season
 * until the next season opens in March. Outside that window the postseason
 * request would always come back empty, so it is skipped.
 */
export function mayHavePostseasonGames(date: Date = new Date()): boolean {
  const month = date.getMonth(); // 0-based: 2 = March, 8 = September
  if (month < 2 || month > 8) return true;
  return month === 8 && date.getDate() >= 25;
}
