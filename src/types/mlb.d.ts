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
  defense?: {
    pitcher?: Player;
    batter?: Player;
    onDeck?: Player;
    inHole?: Player;
    first?: Player;
    second?: Player;
    third?: Player;
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
