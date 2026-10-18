import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TaiwanPlayersPage } from '../../src/pages/TaiwanPlayersPage';
import taiwanPlayers from '../../src/data/taiwan-players.json';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const renderPage = () =>
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <TaiwanPlayersPage />
      </MemoryRouter>
    </QueryClientProvider>
  );

describe('TaiwanPlayersPage', () => {
  const globalFetch = globalThis.fetch;

  afterEach(() => {
    vi.stubGlobal('fetch', globalFetch);
    queryClient.clear();
  });

  it('groups every player in the list by level, top level first', () => {
    renderPage();
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(headings[0]).toMatch(/^大聯盟/);
    const levels = new Set(taiwanPlayers.players.map((p) => p.level));
    expect(headings).toHaveLength(levels.size);
  });

  it('shows each player’s latest game, with his Chinese name under the English one', async () => {
    // Hao-Yu Lee is in the list and the dictionary
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => ({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () =>
          decodeURIComponent(url).includes('gameType=P')
            ? {}
            : {
                people: [
                  {
                    id: 701678,
                    fullName: 'Hao-Yu Lee',
                    currentTeam: { id: 116, name: 'Detroit Tigers' },
                    stats: [
                      {
                        group: { displayName: 'hitting' },
                        type: { displayName: 'gameLog' },
                        splits: [{ date: '2026-09-27', stat: { summary: '2-4 | HR', hits: 2, atBats: 4, homeRuns: 1 } }],
                      },
                    ],
                  },
                ],
              },
      }))
    );
    renderPage();

    expect(await screen.findByText('2-4 | HR')).toBeInTheDocument();
    const mlb = screen.getByRole('region', { name: /大聯盟/ });
    expect(within(mlb).getByText('Hao-Yu Lee')).toBeInTheDocument();
    expect(within(mlb).getByText('李灝宇')).toBeInTheDocument();
  });

  it('still lists a player the batch request did not return', async () => {
    renderPage();
    // The default test fetch answers {}: no one comes back, every row falls back to the list
    const anyMinorLeaguer = taiwanPlayers.players.find((p) => p.level !== 'MLB')!;
    expect(await screen.findByText(anyMinorLeaguer.fullName)).toBeInTheDocument();
  });
});
