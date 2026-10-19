import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from '../../src/hooks/useLanguage';
import { LeaderboardsPage } from '../../src/pages/LeaderboardsPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

describe('LeaderboardsPage component', () => {
  beforeEach(() => {
    queryClient.clear(); // avoid cache leaking between tests
  });
  it('renders page header, hitting/pitching tabs and league filter buttons', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <MemoryRouter>
            <LeaderboardsPage />
          </MemoryRouter>
        </LanguageProvider>
      </QueryClientProvider>
    );

    expect(screen.getByText(/MLB 數據領先榜/i)).toBeInTheDocument();
    expect(screen.getByText(/🏏 打擊排行/i)).toBeInTheDocument();
    expect(screen.getByText(/⚾ 投球排行/i)).toBeInTheDocument();
    expect(screen.getByText(/全大聯盟/i)).toBeInTheDocument();
    expect(screen.getByText(/美國聯盟/i)).toBeInTheDocument();
    expect(screen.getByText(/國家聯盟/i)).toBeInTheDocument();
  });

  it('switches between hitting and pitching tabs', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <MemoryRouter>
            <LeaderboardsPage />
          </MemoryRouter>
        </LanguageProvider>
      </QueryClientProvider>
    );

    const pitchingTab = screen.getByText(/⚾ 投球排行/i);
    fireEvent.click(pitchingTab);

    expect(pitchingTab.className).toContain('bg-team-primary');
  });

  it('renders per-category empty states when the API returns no leaders', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <MemoryRouter>
            <LeaderboardsPage />
          </MemoryRouter>
        </LanguageProvider>
      </QueryClientProvider>
    );

    // The global fetch stub resolves {}, so every category falls back to its empty card
    const placeholders = await screen.findAllByText('目前暫無該項目的排行榜數據。');
    expect(placeholders.length).toBe(8);
  });

  describe('postseason', () => {
    const globalFetch = globalThis.fetch;
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date('2026-10-19T12:00:00'));
    });
    afterEach(() => {
      vi.useRealTimers();
      vi.stubGlobal('fetch', globalFetch);
    });

    const split = (id: number, fullName: string, team: number, homeRuns: number) => ({
      player: { id, fullName },
      team: { id: team, name: 'Club' },
      stat: { gamesPlayed: 10, plateAppearances: 40, avg: '.300', homeRuns },
    });

    it('ranks this postseason from every player’s line', async () => {
      const fetchMock = vi.fn(async (url: string) => ({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () =>
          url.includes('/stats?')
            ? { stats: [{ splits: [split(1, 'Shohei Ohtani', 119, 8), split(2, 'Vladimir Guerrero Jr.', 141, 6)] }] }
            : {},
      }));
      vi.stubGlobal('fetch', fetchMock);
      render(
        <QueryClientProvider client={queryClient}>
          <LanguageProvider>
            <MemoryRouter>
              <LeaderboardsPage />
            </MemoryRouter>
          </LanguageProvider>
        </QueryClientProvider>
      );

      fireEvent.click(screen.getByRole('button', { name: '季後賽' }));
      expect(screen.getByRole('button', { name: '季後賽' })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByText(/2026 季後賽大聯盟打擊與投球數據排行/)).toBeInTheDocument();
      expect((await screen.findAllByText('Shohei Ohtani')).length).toBeGreaterThan(0);

      const postseasonCall = fetchMock.mock.calls.map(([u]) => decodeURIComponent(u)).find((u) => u.includes('/stats?'));
      expect(postseasonCall).toContain('gameType=P');
      expect(postseasonCall).toContain('season=2026');

      // NL only: the Blue Jays' hitter drops out
      fireEvent.click(screen.getByText(/國家聯盟/i));
      expect(screen.queryByText('Vladimir Guerrero Jr.')).not.toBeInTheDocument();
    });
  });
});
