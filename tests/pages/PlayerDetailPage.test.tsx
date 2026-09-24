import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PlayerDetailPage } from '../../src/pages/PlayerDetailPage';
// Real /people responses hydrated with leagueListId=mlb_milb (game logs trimmed)
import promoted from '../fixtures/player-promoted-serven.json';
import demoted from '../fixtures/player-demoted.json';
import traded from '../fixtures/player-traded-halvorsen.json';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

describe('PlayerDetailPage component', () => {
  it('renders Shohei Ohtani profile with English primary name and Chinese secondary', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/players/660271']}>
          <Routes>
            <Route path="/players/:personId" element={<PlayerDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Primary heading is always the English name
    expect(screen.getByRole('heading', { name: /Shohei Ohtani/ })).toBeInTheDocument();
    // Chinese name from the dictionary stays visible as a secondary line
    expect(screen.getByText(/大谷翔平/)).toBeInTheDocument();
    expect(screen.getByText('已收藏球星')).toBeInTheDocument();
  });

  it('renders Hao-Yu Lee profile correctly with ID 701678', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/players/701678']}>
          <Routes>
            <Route path="/players/:personId" element={<PlayerDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByRole('heading', { name: /Hao-Yu Lee/ })).toBeInTheDocument();
    expect(screen.getByText(/李灝宇/)).toBeInTheDocument();
    expect(screen.getByText('收藏此球星')).toBeInTheDocument();
  });

  it('renders unknown or unseeded player page gracefully', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/players/694380']}>
          <Routes>
            <Route path="/players/:personId" element={<PlayerDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText('收藏此球星')).toBeInTheDocument();
  });
});

describe('PlayerDetailPage game logs', () => {
  const globalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = globalFetch;
    queryClient.clear();
  });

  /** A hitter traded from the Rangers (140) to the Dodgers (119) mid-season */
  const tradedHitter = {
    people: [
      {
        id: 999001,
        fullName: 'Traded Slugger',
        primaryPosition: { abbreviation: 'LF', type: 'Outfielder' },
        stats: [
          {
            group: { displayName: 'hitting' },
            type: { displayName: 'gameLog' },
            splits: [
              {
                date: '2026-08-02',
                team: { id: 119, name: 'Los Angeles Dodgers' },
                opponent: { id: 134, name: 'Pittsburgh Pirates' },
                isHome: true,
                game: { gamePk: 776001 },
                stat: { atBats: 4, runs: 1, hits: 2, rbi: 1, homeRuns: 0, baseOnBalls: 0, strikeOuts: 1, avg: '.288' },
              },
              {
                date: '2026-07-20',
                team: { id: 140, name: 'Texas Rangers' },
                opponent: { id: 134, name: 'Pittsburgh Pirates' },
                isHome: false,
                game: { gamePk: 776002 },
                stat: { atBats: 3, runs: 0, hits: 1, rbi: 0, homeRuns: 0, baseOnBalls: 1, strikeOuts: 0, avg: '.281' },
              },
            ],
          },
        ],
      },
    ],
  };

  const renderTraded = () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => tradedHitter,
    })) as unknown as typeof fetch;

    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/players/999001']}>
          <Routes>
            <Route path="/players/:personId" element={<PlayerDetailPage />} />
            <Route path="/games/:gamePk" element={<div>GAME PAGE</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  it('shows which team the player suited up for, so a trade is readable', async () => {
    renderTraded();

    await screen.findByText('2026-08-02');

    // Text, not a crest: an image that fails to load must not take the answer
    // with it, and the opponent's own crest already fills the cell
    expect(screen.getByText('LAD')).toBeInTheDocument();
    expect(screen.getByText('TEX')).toBeInTheDocument();
  });

  it('separates a home game from a road game', async () => {
    renderTraded();

    await screen.findByText('2026-08-02');

    expect(screen.getByText('vs')).toBeInTheDocument();
    expect(screen.getByText('@')).toBeInTheDocument();
  });

  it('links each dated row through to that game', async () => {
    renderTraded();

    const dateLink = await screen.findByRole('link', { name: '2026-08-02' });
    expect(dateLink).toHaveAttribute('href', '/games/776001');
  });

  it('leaves the date unlinked when the log carries no gamePk', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({
        people: [
          {
            id: 999002,
            fullName: 'No Pk',
            primaryPosition: { abbreviation: 'LF', type: 'Outfielder' },
            stats: [
              {
                group: { displayName: 'hitting' },
                type: { displayName: 'gameLog' },
                splits: [
                  {
                    date: '2026-08-02',
                    team: { id: 119, name: 'Los Angeles Dodgers' },
                    opponent: { id: 134, name: 'Pittsburgh Pirates' },
                    stat: { atBats: 4, runs: 1, hits: 2, rbi: 1, homeRuns: 0, baseOnBalls: 0, strikeOuts: 1, avg: '.288' },
                  },
                ],
              },
            ],
          },
        ],
      }),
    })) as unknown as typeof fetch;

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/players/999002']}>
          <Routes>
            <Route path="/players/:personId" element={<PlayerDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    await screen.findByText('2026-08-02');
    expect(screen.queryByRole('link', { name: '2026-08-02' })).not.toBeInTheDocument();
    // Neither home nor away is known, so the matchup stays neutral
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  describe('players who move between the majors and the minors', () => {
    const globalFetch = globalThis.fetch;

    function renderPlayer(fixture: unknown, personId: number) {
      queryClient.clear();
      const fetchMock = vi.fn(async () => ({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => fixture,
      }));
      vi.stubGlobal('fetch', fetchMock);
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={[`/players/${personId}`]}>
            <Routes>
              <Route path="/players/:personId" element={<PlayerDetailPage />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      );
      return fetchMock;
    }

    afterEach(() => {
      vi.stubGlobal('fetch', globalFetch);
    });

    it('requests every level in one call', async () => {
      const fetchMock = renderPlayer(promoted, 661531);
      await screen.findByText('出賽 28 場', { exact: false });
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(String((fetchMock.mock.calls[0] as unknown[])[0])).toContain('leagueListId%3Dmlb_milb');
    });

    it('keeps minor league stats reachable after a call-up', async () => {
      renderPlayer(promoted, 661531);

      // Now with the Athletics: opens on his MLB line
      expect(await screen.findByText(/出賽 28 場/)).toBeInTheDocument();

      // His 61 AAA games this season are one tap away
      const levels = screen.getByRole('group', { name: '層級' });
      fireEvent.click(within(levels).getByRole('button', { name: 'AAA' }));
      expect(screen.getByText(/出賽 61 場/)).toBeInTheDocument();
    });

    it('opens on the minor league line after being optioned down', async () => {
      renderPlayer(demoted, 694680);

      // Currently with AAA Salt Lake: 33 AAA games, not his 7 MLB games
      expect(await screen.findByText(/出賽 33 場/)).toBeInTheDocument();
      const levels = screen.getByRole('group', { name: '層級' });
      expect(within(levels).getByRole('button', { name: 'AAA' })).toHaveAttribute('aria-pressed', 'true');

      fireEvent.click(within(levels).getByRole('button', { name: 'MLB' }));
      expect(screen.getByText(/出賽 7 場/)).toBeInTheDocument();
    });

    it('never labels big league stats with the current minor league club', async () => {
      renderPlayer(demoted, 694680);
      await screen.findByText(/出賽 33 場/);

      fireEvent.click(within(screen.getByRole('group', { name: '層級' })).getByRole('button', { name: 'MLB' }));
      // The old badge beside the stats title read "Triple-A" off the current
      // club even while MLB stats were shown. The header may still say where
      // he plays now.
      const statsTitleRow = screen.getByText(/核心數據面板/).parentElement!;
      expect(statsTitleRow).not.toHaveTextContent('Triple-A');
      expect(statsTitleRow).not.toHaveTextContent('AAA');
    });

    it('combines both clubs when a player was traded within a level', async () => {
      renderPlayer(traded, 678020);

      fireEvent.click(
        within(await screen.findByRole('group', { name: '層級' })).getByRole('button', { name: 'MLB' })
      );
      // Rockies 21 + Dodgers 11
      expect(screen.getByText(/出賽 32 場/)).toBeInTheDocument();
    });

    it('lists games from every level newest first and marks the minor league ones', async () => {
      renderPlayer(demoted, 694680);
      await screen.findByText(/出賽 33 場/);

      const rows = screen.getAllByRole('row').slice(1);
      expect(within(rows[0]).getByText('2026-09-17')).toBeInTheDocument();
      expect(within(rows[0]).getByText('AAA')).toBeInTheDocument();
      // His last MLB outing (08-29, Angels) follows his three AAA games
      expect(within(rows[3]).getByText('2026-08-29')).toBeInTheDocument();
      expect(within(rows[3]).queryByText('AAA')).not.toBeInTheDocument();
    });
  });
});
