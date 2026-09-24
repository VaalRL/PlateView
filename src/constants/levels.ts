/**
 * Levels of affiliated baseball, keyed by the statsapi `sportId`.
 * See docs/adr/0005-minor-league-support.md.
 */
export const MLB_SPORT_ID = 1;

/** `sport.id` of the all-minor-leagues aggregate row; not a level of its own */
export const MINORS_AGGREGATE_SPORT_ID = 21;

/** Stats requests use this list to return every level in one response */
export const MLB_MILB_LEAGUE_LIST = 'mlb_milb';

/** Levels offered for browsing scores and standings, top to bottom */
export const BROWSABLE_LEVELS: readonly { id: number; abbreviation: string }[] = [
  { id: 1, abbreviation: 'MLB' },
  { id: 11, abbreviation: 'AAA' },
  { id: 12, abbreviation: 'AA' },
  { id: 13, abbreviation: 'A+' },
  { id: 14, abbreviation: 'A' },
];
