import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ScoreboardCard } from '../../src/components/scoreboard/ScoreboardCard';
import { GameSchedule } from '../../src/types/mlb';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

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
    innings: [
      { num: 1, ordinalNum: '1st', away: { runs: 1 }, home: { runs: 0 } },
      { num: 2, ordinalNum: '2nd', away: { runs: 0 }, home: { runs: 2 } },
    ],
  },
  venue: { id: 1, name: 'PNC Park', link: '' },
};

const mockFinalGame: GameSchedule = {
  ...mockLiveGame,
  gamePk: 789101,
  status: {
    abstractGameState: 'Final',
    codedGameState: 'F',
    detailedState: 'Final',
    statusCode: 'F',
    abstractGameCode: 'F',
  },
  decisions: {
    winner: { id: 605483, fullName: 'Blake Snell', link: '' },
    loser: { id: 694973, fullName: 'Paul Skenes', link: '' },
  },
};

describe('ScoreboardCard component', () => {
  it('renders live game state with MLB.com R/H/E columns, scores, teams, count and inning', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ScoreboardCard game={mockLiveGame} />
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Verify team names (Chinese translated)
    expect(screen.getByText('洛杉磯道奇')).toBeInTheDocument();
    expect(screen.getByText('匹茲堡海盜')).toBeInTheDocument();

    // Verify MLB.com R/H/E table headers
    expect(screen.getAllByText('R').length).toBeGreaterThan(0);
    expect(screen.getAllByText('H').length).toBeGreaterThan(0);
    expect(screen.getAllByText('E').length).toBeGreaterThan(0);

    // Verify scores (5 and 3)
    expect(screen.getAllByText('5').length).toBeGreaterThan(0);
    expect(screen.getAllByText('3').length).toBeGreaterThan(0);

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
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ScoreboardCard game={postponedGame} />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText(/Postponed/)).toBeInTheDocument();
  });

  it('navigates to the standalone game page when the card is clicked', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<ScoreboardCard game={mockFinalGame} />} />
            <Route path="/games/:gamePk" element={<div>GAME PAGE</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    // No inline expansion any more; the card is a doorway to the page
    expect(screen.queryByText('展開比賽 Box')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText(/已結束/i));

    expect(screen.getByText('GAME PAGE')).toBeInTheDocument();
  });

  it('offers an explicit link to the game page for a live game', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ScoreboardCard game={mockLiveGame} />
        </MemoryRouter>
      </QueryClientProvider>
    );

    const entry = screen.getByRole('link', { name: /完整 Box 專頁/ });
    expect(entry).toHaveAttribute('href', `/games/${mockLiveGame.gamePk}`);
    // Reads as a button labelled "Box"; the full phrase is for assistive tech
    expect(entry.textContent).toBe('Box');
  });

  it('offers no game page before first pitch, since there is nothing in it yet', () => {
    const mockPreviewGame: GameSchedule = {
      ...mockLiveGame,
      gamePk: 111213,
      status: {
        abstractGameState: 'Preview',
        codedGameState: 'S',
        detailedState: 'Scheduled',
        statusCode: 'S',
        abstractGameCode: 'P',
      },
      linescore: undefined,
    };

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<ScoreboardCard game={mockPreviewGame} />} />
            <Route path="/games/:gamePk" element={<div>GAME PAGE</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.queryByRole('link', { name: /完整 Box 專頁/ })).not.toBeInTheDocument();

    // Clicking the card is inert too, rather than a hidden affordance
    fireEvent.click(screen.getByText(/匹茲堡海盜/));
    expect(screen.queryByText('GAME PAGE')).not.toBeInTheDocument();
  });
});
