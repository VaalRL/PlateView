/**
 * `/awards/{awardId}/recipients`: one entry per winner. Without a season it
 * lists every season, newest first; a Gold Glove or Silver Slugger season
 * has one entry per position.
 */
export interface AwardRecipient {
  id: string;
  name: string;
  /** Announced, YYYY-MM-DD */
  date?: string;
  season: string;
  team?: { id: number; name?: string };
  player?: {
    id: number;
    nameFirstLast?: string;
    primaryPosition?: { abbreviation?: string; type?: string };
  };
  /** First-place votes, for the voted awards of old seasons */
  votes?: number;
  /** e.g. "Classic Era Ballot Selection" for the Hall of Fame */
  notes?: string;
}

export interface AwardRecipientsResponse {
  awards?: AwardRecipient[];
}
