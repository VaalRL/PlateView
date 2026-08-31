import { describe, it, expect } from 'vitest';
import { scheduleHasLiveGames } from '../../src/services/queries';
import { ScheduleResponse } from '../../src/types/mlb';

function makeSchedule(states: string[]): ScheduleResponse {
  return {
    dates: [
      {
        games: states.map((s) => ({ status: { abstractGameState: s } })),
      },
    ],
  } as unknown as ScheduleResponse;
}

describe('scheduleHasLiveGames', () => {
  it('returns false for missing or empty data', () => {
    expect(scheduleHasLiveGames(undefined)).toBe(false);
    expect(scheduleHasLiveGames({} as ScheduleResponse)).toBe(false);
    expect(scheduleHasLiveGames(makeSchedule([]))).toBe(false);
  });

  it('returns false when all games are finished or not started', () => {
    expect(scheduleHasLiveGames(makeSchedule(['Final', 'Preview', 'Final']))).toBe(false);
  });

  it('returns true when at least one game is live', () => {
    expect(scheduleHasLiveGames(makeSchedule(['Final', 'Live', 'Preview']))).toBe(true);
  });
});
