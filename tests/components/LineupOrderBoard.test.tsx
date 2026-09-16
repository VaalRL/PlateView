import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../../src/hooks/useLanguage';
import { LineupOrderBoard } from '../../src/components/game/LineupOrderBoard';

const teamBox = {
  players: {
    ID11: {
      person: { id: 11, fullName: 'Shohei Ohtani' },
      position: { abbreviation: 'DH' },
      allPositions: [{ abbreviation: 'DH' }],
      battingOrder: '100',
    },
    ID12: {
      person: { id: 12, fullName: 'Mookie Betts' },
      position: { abbreviation: 'SS' },
      allPositions: [{ abbreviation: 'SS' }, { abbreviation: '2B' }],
      battingOrder: '200',
    },
    ID13: {
      person: { id: 13, fullName: 'Starting Catcher' },
      position: { abbreviation: 'C' },
      allPositions: [{ abbreviation: 'C' }],
      battingOrder: '900',
    },
    ID14: {
      person: { id: 14, fullName: 'Pinch Runner' },
      position: { abbreviation: 'C' },
      allPositions: [{ abbreviation: 'PR' }, { abbreviation: 'C' }],
      battingOrder: '901',
    },
  },
};

describe('LineupOrderBoard component', () => {
  it('lists slots in batting order with the player links', () => {
    render(
      <MemoryRouter>
        <LanguageProvider>
          <LineupOrderBoard teamBox={teamBox} teamName="Los Angeles Dodgers" />
        </LanguageProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Los Angeles Dodgers')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Shohei Ohtani' })).toHaveAttribute(
      'href',
      '/players/11'
    );
    // A player who moved positions shows the full chain
    expect(screen.getByText('SS-2B')).toBeInTheDocument();
  });

  it('shows the substitute chain and badge for a slot that turned over', () => {
    render(
      <MemoryRouter>
        <LanguageProvider>
          <LineupOrderBoard teamBox={teamBox} teamName="Los Angeles Dodgers" />
        </LanguageProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Starting Catcher')).toBeInTheDocument();
    expect(screen.getByText('Pinch Runner')).toBeInTheDocument();
    expect(screen.getByText('替補')).toBeInTheDocument();
  });

  it('shows an empty state before the lineup is posted', () => {
    render(
      <MemoryRouter>
        <LanguageProvider>
          <LineupOrderBoard teamBox={{ players: {} }} teamName="Los Angeles Dodgers" />
        </LanguageProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('本場尚未公布打線。')).toBeInTheDocument();
  });
});
