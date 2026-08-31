/**
 * Minimal typings for MLB `/people` responses hydrated with gameLog stats,
 * as consumed by the favorite players daily summary.
 */
export interface GameLogStat {
  summary?: string;
  avg?: string;
  ops?: string;
  hits?: number;
  atBats?: number;
  homeRuns?: number;
  rbi?: number;
  era?: string;
  whip?: string;
  strikeOuts?: number;
  baseOnBalls?: number;
  inningsPitched?: string;
  earnedRuns?: number;
}

export interface GameLogSplit {
  date: string;
  stat: GameLogStat;
}

export interface GameLogStatGroup {
  group?: { displayName?: string };
  type?: { displayName?: string };
  splits?: GameLogSplit[];
}

export interface GameLogPerson {
  id: number;
  fullName: string;
  primaryPosition?: { abbreviation?: string };
  currentTeam?: { id?: number; name?: string };
  stats?: GameLogStatGroup[];
}

export interface PeopleResponse {
  people: GameLogPerson[];
}
