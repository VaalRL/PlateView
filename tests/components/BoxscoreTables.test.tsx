import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../../src/hooks/useLanguage';
import { BattingTable, PitchingTable } from '../../src/components/game/BoxscoreTables';

// Mirrors the real /game/{gamePk}/boxscore shape: per-game `stats` blocks carry
// counting stats ONLY — rate stats (avg, era) exist solely under `seasonStats`.
// The tables take the display name as a prop, so the fixture needs no `team`
const teamBox = {
  batters: [682928, 682929, 682930],
  pitchers: [694363],
  players: {
    ID682928: {
      person: { id: 682928, fullName: 'CJ Abrams' },
      position: { abbreviation: 'SS' },
      stats: { batting: { atBats: 4, runs: 1, hits: 2, rbi: 1, baseOnBalls: 0, strikeOuts: 1 } },
      seasonStats: { batting: { avg: '.267' } },
    },
    ID682929: {
      person: { id: 682929, fullName: 'Second Batter' },
      position: { abbreviation: 'LF' },
      stats: { batting: { atBats: 3, runs: 0, hits: 1, rbi: 0, baseOnBalls: 1, strikeOuts: 0 } },
      seasonStats: { batting: { avg: '.245' } },
    },
    ID682930: {
      person: { id: 682930, fullName: 'Third Batter' },
      position: { abbreviation: 'CF' },
      stats: { batting: { atBats: 2, runs: 0, hits: 0, rbi: 0, baseOnBalls: 0, strikeOuts: 2 } },
      seasonStats: { batting: { avg: '.198' } },
    },
    ID694363: {
      person: { id: 694363, fullName: 'Andrew Alvarez' },
      stats: {
        pitching: {
          inningsPitched: '6.0',
          hits: 5,
          runs: 2,
          earnedRuns: 2,
          baseOnBalls: 1,
          strikeOuts: 7,
        },
      },
      seasonStats: { pitching: { era: '3.47' } },
    },
  },
  teamStats: {
    batting: { hits: 8, homeRuns: 1, rbi: 4 },
    pitching: { inningsPitched: '9.0', strikeOuts: 7, era: '4.67' },
  },
};

const renderWith = (ui: React.ReactElement) =>
  render(
    <MemoryRouter>
      <LanguageProvider>{ui}</LanguageProvider>
    </MemoryRouter>
  );

describe('BoxscoreTables', () => {
  it('shows the batter season AVG from seasonStats (game stats carry no avg)', () => {
    renderWith(<BattingTable teamBox={teamBox} title="Washington Nationals" />);

    expect(screen.getByText('.267')).toBeInTheDocument();
  });

  it('shows the pitcher season ERA from seasonStats (game stats carry no era)', () => {
    renderWith(<PitchingTable teamBox={teamBox} title="Washington Nationals" />);

    expect(screen.getByText('3.47')).toBeInTheDocument();
  });

  it('renders every batter when no limit is given', () => {
    renderWith(<BattingTable teamBox={teamBox} title="Washington Nationals" />);

    expect(screen.getByText('CJ Abrams')).toBeInTheDocument();
    expect(screen.getByText('Second Batter')).toBeInTheDocument();
    expect(screen.getByText('Third Batter')).toBeInTheDocument();
  });

  it('caps the rows when a limit is given', () => {
    renderWith(<BattingTable teamBox={teamBox} title="Washington Nationals" limit={2} />);

    expect(screen.getByText('CJ Abrams')).toBeInTheDocument();
    expect(screen.queryByText('Third Batter')).not.toBeInTheDocument();
  });

  it('links each player through to their detail page', () => {
    renderWith(<BattingTable teamBox={teamBox} title="Washington Nationals" />);

    expect(screen.getByRole('link', { name: /CJ Abrams/ })).toHaveAttribute(
      'href',
      '/players/682928'
    );
  });
});
