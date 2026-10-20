/**
 * The awards on the awards page, by their `/awards/{id}` ids (each one
 * checked against the live API). AL and NL versions share a row.
 */
export interface AwardGroup {
  key: string;
  ids: readonly string[];
  /** Several winners a season, one per position: shown as a table */
  byPosition?: boolean;
}

export const SEASON_AWARDS: readonly AwardGroup[] = [
  { key: 'mvp', ids: ['ALMVP', 'NLMVP'] },
  { key: 'cy', ids: ['ALCY', 'NLCY'] },
  { key: 'roy', ids: ['ALROY', 'NLROY'] },
  { key: 'moy', ids: ['ALMOY', 'NLMOY'] },
  { key: 'cpoy', ids: ['ALCPOY', 'NLCPOY'] },
  { key: 'haa', ids: ['ALHAA', 'NLHAA'] },
];

export const POSTSEASON_AWARDS: readonly AwardGroup[] = [
  { key: 'wsmvp', ids: ['WSMVP'] },
  { key: 'lcsmvp', ids: ['ALCSMVP', 'NLCSMVP'] },
];

export const POSITION_AWARDS: readonly AwardGroup[] = [
  { key: 'gg', ids: ['ALGG', 'NLGG'], byPosition: true },
  { key: 'ss', ids: ['ALSS', 'NLSS'], byPosition: true },
];

export const HALL_OF_FAME: AwardGroup = { key: 'hof', ids: ['MLBHOF'] };

export const ALL_AWARD_IDS: readonly string[] = [
  ...SEASON_AWARDS,
  ...POSTSEASON_AWARDS,
  ...POSITION_AWARDS,
  HALL_OF_FAME,
].flatMap((g) => g.ids);

/** The group an award id belongs to, for its history page */
export const groupOf = (awardId: string): AwardGroup | undefined =>
  [...SEASON_AWARDS, ...POSTSEASON_AWARDS, ...POSITION_AWARDS, HALL_OF_FAME].find((g) => g.ids.includes(awardId));
