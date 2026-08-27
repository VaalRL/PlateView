import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ScoreboardCard } from '../../src/components/scoreboard/ScoreboardCard';
import { GameSchedule } from '../../src/types/mlb';

const mockLiveGame: GameSchedule = {
  gamePk: 123456,
  link: '/api/v1/game/123456/feed/live',
  gameType: 'R',
  season: '2026',
  gameDate: '2026-08-27T19:10:00Z',
  officialDate: '2026-08-27',
  status: {
    abstractGameState: 'Live',
    codedGameState: 'I',
    detailedState: 'In Progress',
    statusCode: 'I',
    abstractGameCode: 'L',
  },
  teams: {
    away: {
      team: { id: 119, name: 'Los Angeles Dodgers', link: '' },
      score: 5,
      leagueRecord: { wins: 78, losses: 54, pct: '.591' },
    },
    home: {
      team: { id: 134, name: 'Pittsburgh Pirates', link: '' },
      score: 3,
      leagueRecord: { wins: 62, losses: 70, pct: '.470' },
    },
  },
  linescore: {
    currentInning: 7,
    currentInningOrdinal: '7th',
    inningState: 'Top',
    inningHalf: 'Top',
    isTopInning: true,
    balls: 2,
    strikes: 1,
    outs: 1,
    offense: {
      first: { id: 1, fullName: 'Runner One', link: '' },
      second: { id: 2, fullName: 'Runner Two', link: '' },
    },
    teams: {
      away: { runs: 5, hits: 8, errors: 0 },
      home: { runs: 3, hits: 5, errors: 1 },
    },
  },
  venue: { id: 1, name: 'PNC Park', link: '' },
};

describe('ScoreboardCard component', () => {
  it('renders live game state with scores, teams, count and inning', () => {
    render(
      <MemoryRouter>
        <ScoreboardCard game={mockLiveGame} />
      </MemoryRouter>
    );

    // Verify team names (Chinese translated)
    expect(screen.getByText('洛杉磯道奇')).toBeInTheDocument();
    expect(screen.getByText('匹茲堡海盜')).toBeInTheDocument();

    // Verify scores
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();

    // Verify count 2-1
    expect(screen.getByText('2-1')).toBeInTheDocument();

    // Verify 7th inning
    expect(screen.getByText(/7th/)).toBeInTheDocument();
  });

  it('renders postponed game status tag', () => {
    const postponedGame: GameSchedule = {
      ...mockLiveGame,
      status: {
        abstractGameState: 'Preview',
        codedGameState: 'D',
        detailedState: 'Postponed: Rain',
        statusCode: 'DO',
        abstractGameCode: 'P',
      },
    };

    render(
      <MemoryRouter>
        <ScoreboardCard game={postponedGame} />
      </MemoryRouter>
    );

    expect(screen.getByText(/Postponed/)).toBeInTheDocument();
  });
});
