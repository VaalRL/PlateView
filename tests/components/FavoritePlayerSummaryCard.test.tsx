import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../../src/hooks/useLanguage';
import { FavoritePlayerSummaryCard } from '../../src/components/favorite/FavoritePlayerSummaryCard';

describe('FavoritePlayerSummaryCard component', () => {
  const mockPerson = {
    id: 660271,
    fullName: 'Shohei Ohtani',
    primaryPosition: { abbreviation: 'DH' },
    currentTeam: { id: 119, name: 'Los Angeles Dodgers' },
    stats: [
      {
        group: { displayName: 'hitting' },
        type: { displayName: 'gameLog' },
        splits: [
          {
            date: '2026-08-27',
            stat: {
              summary: '2-4 | HR, 3 RBI, BB',
              avg: '.295',
              ops: '.950',
              homeRuns: 1,
              rbi: 3,
            },
          },
        ],
      },
    ],
  };

  it('renders player name, position, stats summary and stat breakdown', () => {
    render(
      <LanguageProvider>
        <MemoryRouter>
          <FavoritePlayerSummaryCard
            person={mockPerson}
            zhMeta={{ nameZh: '大谷翔平', nameEn: 'Shohei Ohtani' }}
            todayDateStr="2026-08-27"
          />
        </MemoryRouter>
      </LanguageProvider>
    );

    // Player name displays in English regardless of UI language
    expect(screen.getByText('Shohei Ohtani')).toBeInTheDocument();
    expect(screen.getByText('DH')).toBeInTheDocument();
    expect(screen.getByText('2-4 | HR, 3 RBI, BB')).toBeInTheDocument();
    expect(screen.getByText('.295')).toBeInTheDocument();
    expect(screen.getByText('.950')).toBeInTheDocument();
    expect(screen.getByText(/今日出賽/)).toBeInTheDocument();
  });
});
