export interface Team {
  id: number;
  name: string;
  link: string;
  season?: number;
  venue?: {
    id: number;
    name: string;
    link: string;
  };
  teamCode?: string;
  fileCode?: string;
  abbreviation?: string;
  teamName?: string;
  locationName?: string;
  firstYearOfPlay?: string;
  league?: {
    id: number;
    name: string;
    link: string;
  };
  division?: {
    id: number;
    name: string;
    link: string;
  };
  shortName?: string;
  nameZh?: string;
  divisionZh?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface Player {
  id: number;
  fullName: string;
  link: string;
  firstName?: string;
  lastName?: string;
  primaryNumber?: string;
  birthDate?: string;
  currentAge?: number;
  birthCity?: string;
  birthCountry?: string;
  height?: string;
  weight?: number;
  active?: boolean;
  primaryPosition?: {
    code: string;
    name: string;
    type: string;
    abbreviation: string;
  };
  useName?: string;
  boxscoreName?: string;
  nameZh?: string;
  nameZhNickname?: string[];
  batSide?: {
    code: string;
    description: string;
  };
  pitchHand?: {
    code: string;
    description: string;
  };
  currentTeam?: {
    id: number;
    name: string;
    link: string;
  };
}

export interface GameStatus {
  abstractGameState: 'Preview' | 'Live' | 'Final';
  codedGameState: string;
  detailedState: string;
  statusCode: string;
  startTimeTBD?: boolean;
  abstractGameCode: string;
}

export interface GameTeam {
  leagueRecord: {
    wins: number;
    losses: number;
    pct: string;
  };
  score?: number;
  team: Team;
  isWinner?: boolean;
  splitSquad?: boolean;
  seriesNumber?: number;
  probablePitcher?: {
    id: number;
    fullName: string;
    link: string;
  };
}

export interface LinescoreInning {
  num: number;
  ordinalNum: string;
  home: {
    runs?: number;
    hits?: number;
    errors?: number;
    leftOnBase?: number;
  };
  away: {
    runs?: number;
    hits?: number;
    errors?: number;
    leftOnBase?: number;
  };
}

export interface Linescore {
  currentInning?: number;
  currentInningOrdinal?: string;
  inningState?: string;
  inningHalf?: 'Top' | 'Bottom';
  isTopInning?: boolean;
  scheduledInnings?: number;
  innings?: LinescoreInning[];
  teams?: {
    home: {
      runs?: number;
      hits?: number;
      errors?: number;
      leftOnBase?: number;
    };
    away: {
      runs?: number;
      hits?: number;
      errors?: number;
      leftOnBase?: number;
    };
  };
  /**
   * The nine fielders currently on the field. Unlike `offense`, where
   * first/second/third are the runners on base, here they are the basemen.
   */
  defense?: {
    pitcher?: Player;
    catcher?: Player;
    first?: Player;
    second?: Player;
    third?: Player;
    shortstop?: Player;
    left?: Player;
    center?: Player;
    right?: Player;
    batter?: Player;
    onDeck?: Player;
    inHole?: Player;
    team?: Team;
  };
  offense?: {
    batter?: Player;
    onDeck?: Player;
    inHole?: Player;
    first?: Player;
    second?: Player;
    third?: Player;
    pitcher?: Player;
  };
  balls?: number;
  strikes?: number;
  outs?: number;
}

export interface GameSchedule {
  gamePk: number;
  gameGuid?: string;
  link: string;
  gameType: string;
  season: string;
  gameDate: string;
  officialDate: string;
  status: GameStatus;
  teams: {
    away: GameTeam;
    home: GameTeam;
  };
  linescore?: Linescore;
  venue: {
    id: number;
    name: string;
    link: string;
  };
  decisions?: {
    winner?: { id: number; fullName: string; link: string };
    loser?: { id: number; fullName: string; link: string };
    save?: { id: number; fullName: string; link: string };
  };
}

export interface ScheduleResponse {
  totalItems: number;
  totalEvents: number;
  totalGames: number;
  totalGamesInProgress: number;
  dates: Array<{
    date: string;
    totalItems: number;
    totalEvents: number;
    totalGames: number;
    totalGamesInProgress: number;
    games: GameSchedule[];
  }>;
}

export interface StandingRecord {
  team: Team;
  season: string;
  streak?: {
    streakCode: string;
  };
  divisionRank: string;
  leagueRank: string;
  wildCardRank?: string;
  gamesPlayed: number;
  gamesBack: string;
  wildCardGamesBack: string;
  eliminationNumber?: string;
  wildCardEliminationNumber?: string;
  wins: number;
  losses: number;
  winningPercentage: string;
  runDifferential: number;
}

export interface StandingsDivision {
  division: {
    id: number;
    name: string;
    link: string;
  };
  teamRecords: StandingRecord[];
}

export interface StandingsResponse {
  records: StandingsDivision[];
}

/* --- /game/{gamePk}/boxscore --- */

/** Box score stat blocks mix counting numbers with pre-formatted rate strings */
export type BoxscoreStatValue = number | string | undefined;

export interface BoxscoreBattingStats {
  atBats?: number;
  runs?: number;
  hits?: number;
  rbi?: number;
  homeRuns?: number;
  baseOnBalls?: number;
  strikeOuts?: number;
  avg?: string;
  ops?: string;
  /** Substitution marker (a, b, c...) tying the row to `note` */
  note?: string;
  [key: string]: BoxscoreStatValue;
}

export interface BoxscorePitchingStats {
  inningsPitched?: string;
  hits?: number;
  runs?: number;
  earnedRuns?: number;
  baseOnBalls?: number;
  strikeOuts?: number;
  era?: string;
  [key: string]: BoxscoreStatValue;
}

export interface BoxscorePosition {
  code?: string;
  name?: string;
  type?: string;
  abbreviation?: string;
}

export interface BoxscorePlayerEntry {
  person?: { id?: number; fullName?: string; link?: string };
  jerseyNumber?: string;
  /** Position held at the end of the game (or right now, while it is live) */
  position?: BoxscorePosition;
  /** Every position the player covered in this game */
  allPositions?: BoxscorePosition[];
  /** Hundreds digit is the lineup slot, last two digits the substitution order */
  battingOrder?: string | number;
  status?: { code?: string; description?: string };
  stats?: { batting?: BoxscoreBattingStats; pitching?: BoxscorePitchingStats };
  seasonStats?: { batting?: BoxscoreBattingStats; pitching?: BoxscorePitchingStats };
  gameStatus?: {
    isCurrentBatter?: boolean;
    isCurrentPitcher?: boolean;
    isOnBench?: boolean;
    isSubstitute?: boolean;
  };
}

/** Grouped official remarks, e.g. title "BATTING" with a list of HR / 2B lines */
export interface BoxscoreInfoGroup {
  title?: string;
  fieldList?: Array<{ label?: string; value?: string }>;
}

export interface BoxscoreTeamSide {
  team?: Team;
  teamStats?: { batting?: BoxscoreBattingStats; pitching?: BoxscorePitchingStats };
  players?: Record<string, BoxscorePlayerEntry>;
  /** Person IDs in the order they came to the plate */
  batters?: number[];
  /** Person IDs in the order they took the mound; the tail is the current pitcher */
  pitchers?: number[];
  bench?: number[];
  bullpen?: number[];
  /** The nine starters' person IDs */
  battingOrder?: number[];
  info?: BoxscoreInfoGroup[];
  /** Substitution footnotes: "a-Grounded out for X in the 7th." */
  note?: Array<{ label?: string; value?: string }>;
}

export interface BoxscoreResponse {
  teams?: {
    away: BoxscoreTeamSide;
    home: BoxscoreTeamSide;
  };
  officials?: Array<{ official?: Player; officialType?: string }>;
}

/* --- /venues/{venueId}?hydrate=fieldInfo --- */

/**
 * Home run fence distances in feet at up to seven named angles, plus surface
 * details. Not an outline: there is no wall height and no corner geometry.
 */
export interface VenueFieldInfo {
  capacity?: number;
  turfType?: string;
  roofType?: string;
  leftLine?: number;
  left?: number;
  leftCenter?: number;
  center?: number;
  rightCenter?: number;
  right?: number;
  rightLine?: number;
}

export interface VenueDetail {
  id: number;
  name: string;
  link?: string;
  active?: boolean;
  fieldInfo?: VenueFieldInfo;
  location?: {
    city?: string;
    stateAbbrev?: string;
    country?: string;
  };
}

export interface VenuesResponse {
  venues?: VenueDetail[];
}
