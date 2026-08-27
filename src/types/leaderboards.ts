export interface LeaderItem {
  rank: number;
  value: string;
  season?: string;
  numTeams?: number;
  person: {
    id: number;
    fullName: string;
    firstName?: string;
    lastName?: string;
    primaryNumber?: string;
  };
  team: {
    id: number;
    name: string;
    link?: string;
  };
}

export interface LeaderCategoryGroup {
  leaderCategory: string;
  statGroup: string;
  season: string;
  gameType?: { id: string; description: string };
  leaders: LeaderItem[];
}

export interface LeaderboardsResponse {
  copyright: string;
  leagueLeaders: LeaderCategoryGroup[];
}
