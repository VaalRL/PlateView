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

  it('shows the latest game even when the API lists the minor league games last', () => {
    // leagueListId responses group the log by level, so an optioned player's
    // older MLB games can be listed after his newer AAA games
    const optioned = {
      id: 694680,
      fullName: 'Trevor Martin',
      primaryPosition: { abbreviation: 'P' },
      currentTeam: { id: 561, name: 'Salt Lake Bees' },
      stats: [
        {
          group: { displayName: 'pitching' },
          type: { displayName: 'gameLog' },
          splits: [
            {
              date: '2026-09-17',
              sport: { id: 11, abbreviation: 'AAA' },
              stat: { summary: '2.0 IP, 0 ER, 3 K' },
            },
            {
              date: '2026-08-29',
              sport: { id: 1, abbreviation: 'MLB' },
              stat: { summary: '1.0 IP, 2 ER, 1 K' },
            },
          ],
        },
      ],
    };

    render(
      <LanguageProvider>
        <MemoryRouter>
          <FavoritePlayerSummaryCard person={optioned} todayDateStr="2026-09-17" />
        </MemoryRouter>
      </LanguageProvider>
    );

    expect(screen.getByText('2.0 IP, 0 ER, 3 K')).toBeInTheDocument();
    expect(screen.queryByText('1.0 IP, 2 ER, 1 K')).not.toBeInTheDocument();
    // The line is marked as a minor league game
    expect(screen.getByText('AAA')).toBeInTheDocument();
    expect(screen.getByText(/今日出賽/)).toBeInTheDocument();
  });

  it('shows a minor league club by the name the API gives', () => {
    render(
      <LanguageProvider>
        <MemoryRouter>
          <FavoritePlayerSummaryCard
            person={{ id: 1, fullName: 'Prospect', currentTeam: { id: 561, name: 'Salt Lake Bees' }, stats: [] }}
            todayDateStr="2026-09-17"
          />
        </MemoryRouter>
      </LanguageProvider>
    );

    expect(screen.getByText('Salt Lake Bees')).toBeInTheDocument();
  });
});
