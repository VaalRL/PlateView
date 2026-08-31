/**
 * Leader stat categories shown on the leaderboards page, in display order.
 * Shared by the page and the API default so the two can never drift.
 */
export const HITTING_LEADER_CATEGORIES: readonly string[] = [
  'battingAverage',
  'onBasePlusSlugging',
  'homeRuns',
  'runsBattedIn',
  'hits',
  'stolenBases',
  'onBasePercentage',
  'sluggingPercentage',
];

export const PITCHING_LEADER_CATEGORIES: readonly string[] = [
  'earnedRunAverage',
  'walksAndHitsPerInningPitched',
  'strikeouts',
  'wins',
  'saves',
  'holds',
  'strikeoutsPer9Inn',
  'inningsPitched',
];
