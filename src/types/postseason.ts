/**
 * Minimal typings for `/schedule/postseason/series`, limited to the fields the
 * bracket requests via `fields=` (see getPostseasonSeries).
 */
export interface PostseasonGameTeam {
  team: { id: number; name: string };
  score?: number;
  /** Present only once the game is final */
  isWinner?: boolean;
}

export interface PostseasonGame {
  gamePk: number;
  gameType: string;
  gameDate: string;
  officialDate?: string;
  status: { abstractGameState: string; detailedState: string };
  teams: { away: PostseasonGameTeam; home: PostseasonGameTeam };
  /** e.g. "ALDS 'A' Game 1", "AL Wild Card Game", "World Series Game 7" */
  description?: string;
  gamesInSeries?: number;
  seriesGameNumber?: number;
  ifNecessary?: string;
}

export interface PostseasonSeriesEntry {
  /** id is "<round letter>_<n>": F = wild card, D = division, L = league championship, W = World Series */
  series: { id: string; gameType: string };
  games: PostseasonGame[];
}

export interface PostseasonSeriesResponse {
  series?: PostseasonSeriesEntry[];
}
