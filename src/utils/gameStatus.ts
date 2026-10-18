import type { TranslationKey } from '../i18n/translations';

interface StatusLike {
  abstractGameState?: string;
  codedGameState?: string;
  detailedState?: string;
}

interface GameTeamLike {
  team: { id: number };
  score?: number;
  isWinner?: boolean;
}

interface GameLike {
  status?: StatusLike;
  teams: { away: GameTeamLike; home: GameTeamLike };
}

type CalledOff = 'postponed' | 'cancelled' | 'suspended';

/**
 * Why a game ended without a result, if it did. The API files postponed and
 * cancelled games under abstractGameState "Final" with no score and no
 * winner, so "Final" alone does not mean the game was played.
 * codedGameState: D = postponed, C = cancelled, T/U = suspended.
 */
export function calledOffReason(status?: StatusLike): CalledOff | null {
  const detailed = status?.detailedState?.toLowerCase() ?? '';
  const coded = status?.codedGameState;
  if (detailed.includes('postponed') || coded === 'D') return 'postponed';
  if (detailed.includes('cancelled') || detailed.includes('canceled') || coded === 'C') return 'cancelled';
  if (detailed.includes('suspended') || coded === 'T' || coded === 'U') return 'suspended';
  return null;
}

export const CALLED_OFF_LABEL: Record<CalledOff, TranslationKey> = {
  postponed: 'sb.postponed',
  cancelled: 'sb.cancelled',
  suspended: 'sb.suspended',
};

/** Played to the end: "Final" and not postponed, cancelled or suspended */
export function isCompletedGame(game: { status?: StatusLike }): boolean {
  return game.status?.abstractGameState === 'Final' && calledOffReason(game.status) === null;
}

/**
 * A team's result in a game: W, L, or null while there is none (not yet
 * played, called off, or a tie). The API's isWinner decides; the score is
 * the fallback when it is missing.
 */
export function teamResult(game: GameLike, teamId: number): 'W' | 'L' | null {
  if (!isCompletedGame(game)) return null;
  const isHome = game.teams.home.team.id === teamId;
  const mine = isHome ? game.teams.home : game.teams.away;
  const theirs = isHome ? game.teams.away : game.teams.home;
  if (mine.isWinner === true) return 'W';
  if (theirs.isWinner === true) return 'L';
  if (mine.score === undefined || theirs.score === undefined || mine.score === theirs.score) return null;
  return mine.score > theirs.score ? 'W' : 'L';
}
