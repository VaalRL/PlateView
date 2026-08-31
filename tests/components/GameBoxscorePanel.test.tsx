import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from '../../src/hooks/useLanguage';
import { GameBoxscorePanel } from '../../src/components/team/GameBoxscorePanel';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

// Mirrors the real /game/{gamePk}/boxscore shape: per-game `stats` blocks carry
// counting stats ONLY — rate stats (avg, era) exist solely under `seasonStats`.
const mockBoxscore = {
  teams: {
    away: {
      team: { name: 'Washington Nationals' },
      batters: [682928],
      pitchers: [694363],
      players: {
        ID682928: {
          person: { id: 682928, fullName: 'CJ Abrams' },
          position: { abbreviation: 'SS' },
          stats: {
            batting: { atBats: 4, runs: 1, hits: 2, rbi: 1, baseOnBalls: 0, strikeOuts: 1 },
          },
          seasonStats: { batting: { avg: '.267' } },
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
    },
    home: {
      team: { name: 'New York Mets' },
      batters: [],
      pitchers: [],
      players: {},
      teamStats: {},
    },
  },
};

describe('GameBoxscorePanel component', () => {
  beforeEach(() => {
    queryClient.clear();
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => mockBoxscore,
    } as Response);
  });

  it('shows the batter season AVG from seasonStats (game stats carry no avg)', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <MemoryRouter>
            <GameBoxscorePanel gamePk={822688} />
          </MemoryRouter>
        </LanguageProvider>
      </QueryClientProvider>
    );

    expect(await screen.findByText('.267')).toBeInTheDocument();
  });

  it('shows the pitcher season ERA from seasonStats (game stats carry no era)', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <MemoryRouter>
            <GameBoxscorePanel gamePk={822688} />
          </MemoryRouter>
        </LanguageProvider>
      </QueryClientProvider>
    );

    expect(await screen.findByText('3.47')).toBeInTheDocument();
  });
});
