/**
 * Levels of affiliated baseball, keyed by the statsapi `sportId`.
 * See docs/adr/0005-minor-league-support.md.
 */
export const MLB_SPORT_ID = 1;

/** `sport.id` of the all-minor-leagues aggregate row; not a level of its own */
export const MINORS_AGGREGATE_SPORT_ID = 21;

/** Stats requests use this list to return every level in one response */
export const MLB_MILB_LEAGUE_LIST = 'mlb_milb';

export interface BrowsableLevel {
  /** statsapi sportId */
  id: number;
  abbreviation: string;
  /** Leagues whose standings make up the level; /standings needs leagueId, sportId alone returns nothing */
  leagueIds: readonly number[];
}

/**
 * Levels offered for browsing scores and standings, top to bottom. League ids
 * come from /league?sportId=X (checked 2026-09-24); they last changed with the
 * 2021 minor league reorganisation.
 */
export const BROWSABLE_LEVELS: readonly BrowsableLevel[] = [
  { id: 1, abbreviation: 'MLB', leagueIds: [103, 104] },
  { id: 11, abbreviation: 'AAA', leagueIds: [117, 112] },
  { id: 12, abbreviation: 'AA', leagueIds: [113, 111, 109] },
  { id: 13, abbreviation: 'A+', leagueIds: [116, 118, 126] },
  { id: 14, abbreviation: 'A', leagueIds: [122, 123, 110] },
];

export const MLB_LEVEL = BROWSABLE_LEVELS[0];
