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
  runs?: number;
  homeRuns?: number;
  rbi?: number;
  era?: string;
  whip?: string;
  strikeOuts?: number;
  baseOnBalls?: number;
  inningsPitched?: string;
  earnedRuns?: number;
  /**
   * Per-game decision counters. The API reports no decision field, so exactly
   * one of these is set on a decided appearance (see getPitchingDecision).
   */
  wins?: number | null;
  losses?: number | null;
  saves?: number | null;
  holds?: number | null;
  blownSaves?: number | null;
}

/** Minimal team shape carried by a game log split */
export interface GameLogTeam {
  id?: number;
  name?: string;
  link?: string;
}

/**
 * One game in a player's log.
 *
 * `team` is who he played *for* that day, which is the only way to read a log
 * that spans a mid-season trade; `opponent` is who he played against. Both are
 * present on hitting and pitching logs alike.
 */
export interface GameLogSplit {
  date: string;
  stat: GameLogStat;
  team?: GameLogTeam;
  opponent?: GameLogTeam;
  /** True when the player's team was at home */
  isHome?: boolean;
  /** The team's result that day, not the pitcher's decision (see Phase 9) */
  isWin?: boolean;
  game?: { gamePk?: number; link?: string; gameNumber?: number };
  /** Positions the player covered that game; hitting logs only */
  positionsPlayed?: Array<{ code?: string; abbreviation?: string; name?: string }>;
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
