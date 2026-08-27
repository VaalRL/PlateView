import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../../src/hooks/useLanguage';
import { LeaderCard } from '../../src/components/leaders/LeaderCard';
import { LeaderCategoryGroup } from '../../src/types/leaderboards';

describe('LeaderCard component', () => {
  const mockGroup: LeaderCategoryGroup = {
    leaderCategory: 'homeRuns',
    statGroup: 'hitting',
    season: '2026',
    leaders: [
      {
        rank: 1,
        value: '40',
        person: { id: 660271, fullName: 'Shohei Ohtani' },
        team: { id: 119, name: 'Los Angeles Dodgers' },
      },
      {
        rank: 2,
        value: '38',
        person: { id: 592450, fullName: 'Aaron Judge' },
        team: { id: 147, name: 'New York Yankees' },
      },
      {
        rank: 3,
        value: '35',
        person: { id: 665742, fullName: 'Juan Soto' },
        team: { id: 147, name: 'New York Yankees' },
      },
    ],
  };

  it('renders category title, medal ranks, player names and stat values', () => {
    render(
      <LanguageProvider>
        <MemoryRouter>
          <LeaderCard categoryGroup={mockGroup} title="全壘打 (HR)" />
        </MemoryRouter>
      </LanguageProvider>
    );

    expect(screen.getByText('全壘打 (HR)')).toBeInTheDocument();
    expect(screen.getByText('🥇')).toBeInTheDocument();
    expect(screen.getByText('🥈')).toBeInTheDocument();
    expect(screen.getByText('🥉')).toBeInTheDocument();
    expect(screen.getByText('大谷翔平')).toBeInTheDocument();
    expect(screen.getByText('亞倫·賈吉')).toBeInTheDocument();
    expect(screen.getByText('胡安·索托')).toBeInTheDocument();
    expect(screen.getByText('40')).toBeInTheDocument();
    expect(screen.getByText('38')).toBeInTheDocument();
    expect(screen.getByText('35')).toBeInTheDocument();
  });
});
