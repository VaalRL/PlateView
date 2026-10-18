import type { LeaderCategoryGroup } from '../types/leaderboards';
import type { StandingRecord, StandingsResponse } from '../types/mlb';
import { BROWSABLE_LEVELS } from '../constants/levels';
import { teamsById } from './teams';

export interface LeaderRank {
  category: string;
  rank: number;
  value: string;
}

/**
 * Leaderboard categories a player appears in, best rank first; ties keep the
 * leaderboard page's category order.
 */
export function findLeaderRanks(personId: number, groups: LeaderCategoryGroup[]): LeaderRank[] {
  const ranks: LeaderRank[] = [];
  groups.forEach((group) => {
    const entry = group.leaders?.find((leader) => leader.person?.id === personId);
    if (entry) ranks.push({ category: group.leaderCategory, rank: entry.rank, value: entry.value });
  });
  return ranks.sort((a, b) => a.rank - b.rank);
}

export function findTeamStanding(standings: StandingsResponse | undefined, teamId: number): StandingRecord | undefined {
  for (const division of standings?.records ?? []) {
    const record = division.teamRecords?.find((r) => r.team?.id === teamId);
    if (record) return record;
  }
  return undefined;
}

/** 1st, 2nd, 3rd, 4th ... 11th, 12th, 13th, 21st */
export function ordinal(n: number): string {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`;
}

/** AAA, AA ... for a minor league sport id; undefined for anything else */
export function levelAbbreviation(sportId?: number): string | undefined {
  return BROWSABLE_LEVELS.find((level) => level.id === sportId)?.abbreviation;
}

/**
 * A club below the majors: anything but the 30 big league clubs. Decided by
 * id because the `currentTeam` hydrated on /people/{id} has no `sport` for
 * a big league club (checked against the live API, tests/contract).
 */
export function isMinorLeagueClub(teamId?: number): boolean {
  return teamId !== undefined && !teamsById.has(teamId);
}
