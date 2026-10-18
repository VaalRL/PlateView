import { describe, it, expect } from 'vitest';
import { calledOffReason, isCompletedGame, teamResult } from '../../src/utils/gameStatus';

const game = (status: object, away: object = {}, home: object = {}) => ({
  status,
  teams: {
    away: { team: { id: 119 }, ...away },
    home: { team: { id: 134 }, ...home },
  },
});

// As the API returns them (see tests/fixtures/postseason-2012.json, ALCS Game 4)
const postponed = game({ abstractGameState: 'Final', detailedState: 'Postponed' });
const cancelled = game({ abstractGameState: 'Final', codedGameState: 'C', detailedState: 'Cancelled' });
const suspended = game({ abstractGameState: 'Final', codedGameState: 'U', detailedState: 'Suspended: Rain' }, { score: 2 }, { score: 1 });
const won = game({ abstractGameState: 'Final', detailedState: 'Final' }, { score: 5, isWinner: true }, { score: 3, isWinner: false });

describe('calledOffReason', () => {
  it('names postponed, cancelled and suspended games by text or code', () => {
    expect(calledOffReason(postponed.status)).toBe('postponed');
    expect(calledOffReason({ codedGameState: 'D', detailedState: 'Postponed: Rain' })).toBe('postponed');
    expect(calledOffReason(cancelled.status)).toBe('cancelled');
    expect(calledOffReason({ detailedState: 'Canceled' })).toBe('cancelled');
    expect(calledOffReason(suspended.status)).toBe('suspended');
    expect(calledOffReason(won.status)).toBeNull();
    expect(calledOffReason(undefined)).toBeNull();
  });
});

describe('isCompletedGame', () => {
  it('counts a final game only when it was played', () => {
    expect(isCompletedGame(won)).toBe(true);
    expect(isCompletedGame(postponed)).toBe(false);
    expect(isCompletedGame(cancelled)).toBe(false);
    expect(isCompletedGame(suspended)).toBe(false);
    expect(isCompletedGame(game({ abstractGameState: 'Live' }))).toBe(false);
  });
});

describe('teamResult', () => {
  it('reads the result for either side', () => {
    expect(teamResult(won, 119)).toBe('W');
    expect(teamResult(won, 134)).toBe('L');
  });

  it('has no result for a game called off, even one with a score', () => {
    expect(teamResult(postponed, 119)).toBeNull();
    expect(teamResult(cancelled, 134)).toBeNull();
    expect(teamResult(suspended, 119)).toBeNull();
  });

  it('falls back to the score when isWinner is missing, and calls a tie no result', () => {
    const final = { abstractGameState: 'Final', detailedState: 'Final' };
    expect(teamResult(game(final, { score: 2 }, { score: 4 }), 119)).toBe('L');
    expect(teamResult(game(final, { score: 3 }, { score: 3 }), 119)).toBeNull();
  });
});
