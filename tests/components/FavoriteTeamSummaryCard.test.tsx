import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../../src/hooks/useLanguage';
import { FavoriteTeamSummaryCard } from '../../src/components/favorite/FavoriteTeamSummaryCard';
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
    inningHalf: 'Top',
    teams: {
      away: { runs: 5, hits: 8, errors: 0 },
      home: { runs: 3, hits: 5, errors: 1 },
    },
  },
  venue: { id: 1, name: 'PNC Park', link: '' },
};

const mockFinalGame: GameSchedule = {
  ...mockLiveGame,
  status: {
    abstractGameState: 'Final',
    codedGameState: 'F',
    detailedState: 'Final',
    statusCode: 'F',
    abstractGameCode: 'F',
  },
  teams: {
    away: { ...mockLiveGame.teams.away, isWinner: true },
    home: { ...mockLiveGame.teams.home, isWinner: false },
  },
};

const mockPreviewGame: GameSchedule = {
  ...mockLiveGame,
  status: {
    abstractGameState: 'Preview',
    codedGameState: 'S',
    detailedState: 'Scheduled',
    statusCode: 'S',
    abstractGameCode: 'P',
  },
  teams: {
    // The schedule API returns score: 0 for games that have not started yet
    away: {
      ...mockLiveGame.teams.away,
      score: 0,
      probablePitcher: { id: 605483, fullName: 'Blake Snell', link: '' },
    },
    home: {
      ...mockLiveGame.teams.home,
      score: 0,
      probablePitcher: { id: 694973, fullName: 'Paul Skenes', link: '' },
    },
  },
  linescore: undefined,
};

/** Yesterday: the Dodgers lost 2-7 away at San Diego */
const mockPreviousGame: GameSchedule = {
  ...mockLiveGame,
  gamePk: 654321,
  gameDate: '2026-08-26T19:10:00Z',
  officialDate: '2026-08-26',
  status: {
    abstractGameState: 'Final',
    codedGameState: 'F',
    detailedState: 'Final',
    statusCode: 'F',
    abstractGameCode: 'F',
  },
  teams: {
    away: {
      team: { id: 119, name: 'Los Angeles Dodgers', link: '' },
      score: 2,
      isWinner: false,
      leagueRecord: { wins: 77, losses: 54, pct: '.588' },
    },
    home: {
      team: { id: 135, name: 'San Diego Padres', link: '' },
      score: 7,
      isWinner: true,
      leagueRecord: { wins: 75, losses: 56, pct: '.573' },
    },
  },
};

const renderCard = (teamId: number, game?: GameSchedule, previousGame?: GameSchedule) =>
  render(
    <LanguageProvider>
      <MemoryRouter>
        <FavoriteTeamSummaryCard teamId={teamId} game={game} previousGame={previousGame} />
      </MemoryRouter>
    </LanguageProvider>
  );

describe('FavoriteTeamSummaryCard component', () => {
  it('renders live game score, opponent, inning, record and R/H/E breakdown', () => {
    renderCard(119, mockLiveGame);

    expect(screen.getByText('洛杉磯道奇')).toBeInTheDocument();
    expect(screen.getByText('(78-54)')).toBeInTheDocument();
    // Away favorite team: "my score - opponent score @ opponent"
    expect(screen.getByText('5 - 3 @ PIT')).toBeInTheDocument();
    expect(screen.getByText(/7th/)).toBeInTheDocument();
    // R / H / E of the favorite team plus the opponent's runs
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('PIT:')).toBeInTheDocument();
  });

  it('renders final game from the home team perspective with a loss badge', () => {
    renderCard(134, mockFinalGame);

    expect(screen.getByText('匹茲堡海盜')).toBeInTheDocument();
    expect(screen.getByText('3 - 5 vs LAD')).toBeInTheDocument();
    expect(screen.getByText('敗 (L)')).toBeInTheDocument();
    expect(screen.getByText(/已結束/)).toBeInTheDocument();
  });

  it('renders scheduled game with both probable starting pitchers', () => {
    renderCard(119, mockPreviewGame);

    expect(screen.getByText('@ PIT')).toBeInTheDocument();
    // A not-yet-started game must not be reported as a 0 - 0 scoreline
    expect(screen.queryByText(/0 - 0/)).not.toBeInTheDocument();
    expect(screen.getByText('Blake Snell')).toBeInTheDocument();
    expect(screen.getByText('Paul Skenes')).toBeInTheDocument();
  });

  it('renders an empty state and the division when the team has no game today', () => {
    renderCard(119);

    expect(screen.getByText('洛杉磯道奇')).toBeInTheDocument();
    expect(screen.getByText('國聯西區')).toBeInTheDocument();
    // Both day rows report the empty state
    expect(screen.getAllByText('無賽程')).toHaveLength(2);
  });

  it('shows today and yesterday results in the same card', () => {
    renderCard(119, mockLiveGame, mockPreviousGame);

    expect(screen.getByText('今日')).toBeInTheDocument();
    expect(screen.getByText('昨日')).toBeInTheDocument();

    // Today: live at Pittsburgh, leading 5-3
    expect(screen.getByText('5 - 3 @ PIT')).toBeInTheDocument();
    // Yesterday: lost 2-7 at San Diego
    expect(screen.getByText('2 - 7 @ SD')).toBeInTheDocument();
    expect(screen.getByText('敗 (L)')).toBeInTheDocument();
  });

  it('marks yesterday as no game when only today has a matchup', () => {
    renderCard(119, mockLiveGame);

    expect(screen.getByText('5 - 3 @ PIT')).toBeInTheDocument();
    expect(screen.getAllByText('無賽程')).toHaveLength(1);
  });
});
