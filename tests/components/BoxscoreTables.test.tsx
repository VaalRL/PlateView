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
  pitchers: [694363, 694364],
  players: {
    ID682928: {
      person: { id: 682928, fullName: 'CJ Abrams' },
      position: { abbreviation: 'SS' },
      stats: {
        batting: {
          atBats: 4,
          runs: 1,
          hits: 2,
          doubles: 1,
          homeRuns: 1,
          rbi: 1,
          baseOnBalls: 0,
          strikeOuts: 1,
          stolenBases: 2,
          leftOnBase: 3,
        },
      },
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
          homeRuns: 1,
          baseOnBalls: 1,
          strikeOuts: 7,
          numberOfPitches: 94,
          strikes: 61,
          battersFaced: 24,
          wins: 1,
        },
      },
      seasonStats: { pitching: { era: '3.47', wins: 12, losses: 6 } },
    },
    ID694364: {
      person: { id: 694364, fullName: 'Vulture Reliever' },
      stats: {
        pitching: {
          inningsPitched: '1.0',
          hits: 2,
          runs: 1,
          earnedRuns: 1,
          baseOnBalls: 0,
          strikeOuts: 1,
          numberOfPitches: 18,
          strikes: 12,
          battersFaced: 5,
          inheritedRunners: 2,
          inheritedRunnersScored: 1,
          wins: 1,
          blownSaves: 1,
        },
      },
      seasonStats: { pitching: { era: '4.10', wins: 5, losses: 2, blownSaves: 3 } },
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

  it('marks the pitcher who took the decision, with his season record', () => {
    renderWith(<PitchingTable teamBox={teamBox} title="Washington Nationals" />);

    expect(screen.getByText('W (12-6)')).toBeInTheDocument();
  });

  it('keeps the blown save on an outing that also earned the win', () => {
    renderWith(<PitchingTable teamBox={teamBox} title="Washington Nationals" />);

    // Both badges: collapsing to one would hide that he coughed up the lead
    expect(screen.getByText('W (5-2)')).toBeInTheDocument();
    expect(screen.getByText('BS (3)')).toBeInTheDocument();
  });

  it('shows the runners a reliever inherited and how many scored', () => {
    renderWith(<PitchingTable teamBox={teamBox} title="Washington Nationals" />);

    expect(screen.getByText('IR 2-1')).toBeInTheDocument();
  });

  it('carries the pitch count and batters faced the API already provided', () => {
    renderWith(<PitchingTable teamBox={teamBox} title="Washington Nationals" />);

    expect(screen.getByText('94-61')).toBeInTheDocument();
    expect(screen.getByText('24')).toBeInTheDocument();
  });

  it('flags a home run and steals beside the name, but never a double', () => {
    renderWith(<BattingTable teamBox={teamBox} title="Washington Nationals" />);

    // "2B" beside a second baseman would read as his position, so doubles are
    // left to MLB's own notes; HR and SB collide with nothing
    expect(screen.getByText('HR SBx2')).toBeInTheDocument();
    expect(screen.queryByText(/HR 2B/)).not.toBeInTheDocument();
  });

  it('shows how many runners a batter stranded', () => {
    const { container } = renderWith(
      <BattingTable teamBox={teamBox} title="Washington Nationals" />
    );

    const headers = [...container.querySelectorAll('th')].map((th) => th.textContent);
    const lobIndex = headers.indexOf('LOB');
    expect(lobIndex).toBeGreaterThan(-1);

    // Read the LOB cell by column, since a bare "3" appears elsewhere too
    const firstRow = container.querySelector('tbody tr')!;
    expect(firstRow.children[lobIndex].textContent).toBe('3');
  });
});
