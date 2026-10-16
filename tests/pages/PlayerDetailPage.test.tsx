import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
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
      // One call for every level, plus one for the postseason game log
      const urls = fetchMock.mock.calls
        .map((c) => decodeURIComponent(String((c as unknown[])[0])))
        .filter((u) => u.includes('/people'));
      expect(urls.filter((u) => !u.includes('gameType=P'))).toHaveLength(1);
      urls.forEach((u) => expect(u).toContain('leagueListId=mlb_milb'));
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

  it('forgets the chosen level when moving on to another player', async () => {
    // The route keeps the page mounted when only :personId changes (e.g. via search)
    const mlbOnly = {
      people: [
        {
          id: 1,
          fullName: 'Big League Only',
          primaryPosition: { type: 'Catcher' },
          stats: [
            {
              group: { displayName: 'hitting' },
              type: { displayName: 'season' },
              splits: [{ sport: { id: 1, abbreviation: 'MLB' }, stat: { gamesPlayed: 140 } }],
            },
          ],
        },
      ],
    };
    const globalFetch = globalThis.fetch;
    queryClient.clear();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: unknown) => ({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => (String(input).includes('/people/661531') ? promoted : mlbOnly),
      }))
    );

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/players/661531']}>
          <Link to="/players/1">next player</Link>
          <Routes>
            <Route path="/players/:personId" element={<PlayerDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    fireEvent.click(
      within(await screen.findByRole('group', { name: '層級' })).getByRole('button', { name: 'AAA' })
    );
    fireEvent.click(screen.getByText('next player'));

    // Not "no stats": the AAA choice belonged to the previous player
    expect(await screen.findByText(/出賽 140 場/)).toBeInTheDocument();
    vi.stubGlobal('fetch', globalFetch);
  });

  describe('league-relative stats at a minor league level', () => {
    const globalFetch = globalThis.fetch;
    afterEach(() => vi.stubGlobal('fetch', globalFetch));

    const renderWith = (fixture: unknown, personId: number) => {
      queryClient.clear();
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => ({ ok: true, status: 200, statusText: 'OK', json: async () => fixture }))
      );
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={[`/players/${personId}`]}>
            <Routes>
              <Route path="/players/:personId" element={<PlayerDetailPage />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      );
    };

    it('hides FIP and FIP+ on a minor league pitching line, which would use MLB constants', async () => {
      renderWith(demoted, 694680); // opens on AAA
      await screen.findByText(/出賽 33 場/);

      expect(screen.queryByText(/\(FIP\)/)).not.toBeInTheDocument();
      expect(screen.queryByText(/\(FIP\+\)/)).not.toBeInTheDocument();
      expect(screen.queryByText('100 為聯盟平均基準')).not.toBeInTheDocument();

      // Back on his MLB line they return
      fireEvent.click(within(screen.getByRole('group', { name: '層級' })).getByRole('button', { name: 'MLB' }));
      expect(screen.getByText(/\(FIP\+\)/)).toBeInTheDocument();
    });

    it('hides wRC+ on a minor league hitting line', async () => {
      renderWith(promoted, 661531);
      await screen.findByText(/出賽 28 場/);
      expect(screen.getByText(/\(wRC\+\)/)).toBeInTheDocument();

      fireEvent.click(within(screen.getByRole('group', { name: '層級' })).getByRole('button', { name: 'AAA' }));
      expect(screen.queryByText(/\(wRC\+\)/)).not.toBeInTheDocument();
    });
  });
});

describe('PlayerDetailPage postseason games', () => {
  const globalFetch = globalThis.fetch;

  // The postseason request is only sent from late September on
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-16T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
    globalThis.fetch = globalFetch;
    queryClient.clear();
  });

  const hitter = (gameType: string, date: string, gamePk: number) => ({
    people: [
      {
        id: 999003,
        fullName: 'October Hitter',
        primaryPosition: { abbreviation: 'RF', type: 'Outfielder' },
        stats: [
          {
            group: { displayName: 'hitting' },
            type: { displayName: 'gameLog' },
            splits: [
              {
                date,
                gameType,
                team: { id: 119, name: 'Los Angeles Dodgers' },
                opponent: { id: 134, name: 'Pittsburgh Pirates' },
                isHome: true,
                game: { gamePk },
                stat: { atBats: 4, runs: 1, hits: 2, rbi: 1, homeRuns: 0, baseOnBalls: 0, strikeOuts: 1, avg: '.288' },
              },
            ],
          },
        ],
      },
    ],
  });

  it('lists postseason games in the game log with a postseason badge', async () => {
    globalThis.fetch = vi.fn(async (url: string) => ({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () =>
        decodeURIComponent(url).includes('gameType=P')
          ? hitter('D', '2026-10-08', 777001)
          : hitter('R', '2026-09-28', 776003),
    })) as unknown as typeof fetch;

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/players/999003']}>
          <Routes>
            <Route path="/players/:personId" element={<PlayerDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    const postseasonRow = (await screen.findByText('2026-10-08')).closest('tr')!;
    expect(within(postseasonRow).getByText('季後')).toBeInTheDocument();

    const regularRow = screen.getByText('2026-09-28').closest('tr')!;
    expect(within(regularRow).queryByText('季後')).not.toBeInTheDocument();
  });
});

describe('PlayerDetailPage game logs and transactions tabs', () => {
  const globalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = globalFetch;
    queryClient.clear();
  });

  const mockApi = () => {
    const fetchMock = vi.fn(async (url: string) => ({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () =>
        url.includes('/transactions')
          ? {
              transactions: [
                {
                  id: 1,
                  date: '2026-07-30',
                  typeCode: 'TR',
                  typeDesc: 'Trade',
                  fromTeam: { id: 140, name: 'Texas Rangers' },
                  toTeam: { id: 119, name: 'Los Angeles Dodgers' },
                },
              ],
            }
          : {
              people: [
                {
                  id: 999004,
                  fullName: 'Tab Tester',
                  primaryPosition: { abbreviation: 'LF', type: 'Outfielder' },
                  stats: [
                    {
                      group: { displayName: 'hitting' },
                      type: { displayName: 'gameLog' },
                      splits: [
                        {
                          date: '2026-08-02',
                          gameType: 'R',
                          team: { id: 119, name: 'Los Angeles Dodgers' },
                          opponent: { id: 134, name: 'Pittsburgh Pirates' },
                          stat: { atBats: 4, hits: 2 },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
    }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    return fetchMock;
  };

  it('opens on the game logs and loads transactions only when their tab is chosen', async () => {
    const fetchMock = mockApi();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/players/999004']}>
          <Routes>
            <Route path="/players/:personId" element={<PlayerDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    const logsTab = await screen.findByRole('tab', { name: /逐場比賽紀錄/ });
    const transactionsTab = screen.getByRole('tab', { name: /轉隊記錄/ });
    expect(logsTab).toHaveAttribute('aria-selected', 'true');
    expect(await screen.findByText('2026-08-02')).toBeVisible();
    expect(fetchMock.mock.calls.some(([u]) => String(u).includes('/transactions'))).toBe(false);

    fireEvent.click(transactionsTab);
    expect(transactionsTab).toHaveAttribute('aria-selected', 'true');
    expect(await screen.findByText('交易')).toBeInTheDocument();
    expect(screen.getByRole('tabpanel', { name: /轉隊記錄/ })).toBeInTheDocument();
    expect(screen.getByText('2026-08-02')).not.toBeVisible();

    fireEvent.click(logsTab);
    expect(screen.getByText('2026-08-02')).toBeVisible();
    expect(screen.queryByText('交易')).not.toBeInTheDocument();
  });

  it('switches tabs with the arrow keys', async () => {
    mockApi();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/players/999004']}>
          <Routes>
            <Route path="/players/:personId" element={<PlayerDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    const logsTab = await screen.findByRole('tab', { name: /逐場比賽紀錄/ });
    fireEvent.keyDown(logsTab, { key: 'ArrowRight' });
    const transactionsTab = screen.getByRole('tab', { name: /轉隊記錄/ });
    expect(transactionsTab).toHaveAttribute('aria-selected', 'true');
    expect(transactionsTab).toHaveFocus();
  });
});

describe('PlayerDetailPage game log filters', () => {
  const globalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = globalFetch;
    queryClient.clear();
  });

  const split = (date: string, opponentId: number, opponentName: string, isHome: boolean, hits: number) => ({
    date,
    gameType: 'R',
    team: { id: 119, name: 'Los Angeles Dodgers' },
    opponent: { id: opponentId, name: opponentName },
    isHome,
    stat: { atBats: 4, hits, runs: 0, rbi: 0, homeRuns: 0, baseOnBalls: 0, strikeOuts: 1, totalBases: hits, avg: '.300' },
  });

  // 12 games: 4 at home against the Giants, 8 on the road against the Padres
  const splits = [
    ...Array.from({ length: 4 }, (_, i) => split(`2026-09-${10 + i}`, 137, 'San Francisco Giants', true, 2)),
    ...Array.from({ length: 8 }, (_, i) => split(`2026-08-${10 + i}`, 135, 'San Diego Padres', false, 1)),
  ];

  const renderFiltered = () => {
    globalThis.fetch = vi.fn(async (url: string) => ({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () =>
        decodeURIComponent(url).includes('gameType=P')
          ? {}
          : {
              people: [
                {
                  id: 999006,
                  fullName: 'Filter Tester',
                  primaryPosition: { abbreviation: 'LF', type: 'Outfielder' },
                  stats: [{ group: { displayName: 'hitting' }, type: { displayName: 'gameLog' }, splits }],
                },
              ],
            },
    })) as unknown as typeof fetch;

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/players/999006']}>
          <Routes>
            <Route path="/players/:personId" element={<PlayerDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  const panel = () => screen.getByRole('tabpanel', { name: /逐場比賽紀錄/ });
  const gameRows = () => within(panel()).getAllByRole('row').filter((r) => /2026-\d\d-\d\d/.test(r.textContent ?? ''));

  it('shows ten games and the rest behind "show all"', async () => {
    renderFiltered();
    await screen.findByText('2026-09-13');
    expect(gameRows()).toHaveLength(10);

    fireEvent.click(screen.getByRole('button', { name: '顯示全部 12 場' }));
    expect(gameRows()).toHaveLength(12);
  });

  it('filters by opponent and venue and totals the games left', async () => {
    renderFiltered();
    await screen.findByText('2026-09-13');
    // No total until a filter is set
    expect(screen.queryByText(/篩選合計/)).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('combobox', { name: '對手' }), { target: { value: '137' } });
    expect(gameRows()).toHaveLength(4);
    const total = screen.getByText('篩選合計（4 場）').closest('tr')!;
    // 8 hits in 16 at bats
    expect(within(total).getByText('16')).toBeInTheDocument();
    expect(within(total).getByText('8')).toBeInTheDocument();
    expect(within(total).getByText('.500')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('combobox', { name: '主客場' }), { target: { value: 'away' } });
    expect(gameRows()).toHaveLength(0);
    expect(screen.getByText('沒有符合篩選條件的比賽')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '清除篩選' }));
    expect(gameRows()).toHaveLength(10);
    expect(screen.queryByText(/篩選合計/)).not.toBeInTheDocument();
  });

  it('offers no postseason or level filter when the log has nothing to choose', async () => {
    renderFiltered();
    await screen.findByText('2026-09-13');
    expect(screen.queryByRole('combobox', { name: '賽事' })).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: '層級' })).not.toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: '月份' })).toBeInTheDocument();
  });
});

describe('PlayerDetailPage history state per player and role', () => {
  const globalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = globalFetch;
    queryClient.clear();
  });

  const log = (group: string, date: string, opponentId: number, opponentName: string) => ({
    group,
    split: {
      date,
      gameType: 'R',
      team: { id: 119, name: 'Los Angeles Dodgers' },
      opponent: { id: opponentId, name: opponentName },
      isHome: true,
      stat: { atBats: 4, hits: 1, inningsPitched: '6.0', outs: 18, earnedRuns: 2 },
    },
  });

  // Ohtani's hitting and pitching logs face different clubs
  const logs = [
    log('hitting', '2026-09-20', 137, 'San Francisco Giants'),
    log('hitting', '2026-09-19', 135, 'San Diego Padres'),
    log('pitching', '2026-09-18', 113, 'Cincinnati Reds'),
    log('pitching', '2026-09-11', 115, 'Colorado Rockies'),
  ];

  const mockPlayers = () => {
    globalThis.fetch = vi.fn(async (url: string) => ({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => {
        const u = decodeURIComponent(url);
        if (u.includes('gameType=P') || u.includes('/transactions')) return {};
        const id = u.includes('/people/660271') ? 660271 : 999007;
        return {
          people: [
            {
              id,
              fullName: id === 660271 ? 'Shohei Ohtani' : 'Other Player',
              primaryPosition: { abbreviation: 'TWP', type: 'Two-Way Player', name: 'Two-Way Player' },
              stats: (['hitting', 'pitching'] as const).map((group) => ({
                group: { displayName: group },
                type: { displayName: 'gameLog' },
                splits: logs.filter((l) => l.group === group).map((l) => l.split),
              })),
            },
          ],
        };
      },
    })) as unknown as typeof fetch;
  };

  const renderAt = (path: string) =>
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[path]}>
          <Link to="/players/999007">next player</Link>
          <Routes>
            <Route path="/players/:personId" element={<PlayerDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

  it('does not carry a hitting filter over to the pitching log', async () => {
    mockPlayers();
    renderAt('/players/660271');
    await screen.findByText('2026-09-20');

    fireEvent.change(screen.getByRole('combobox', { name: '對手' }), { target: { value: '137' } });
    expect(screen.queryByText('2026-09-19')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /投球成績/ }));
    // Both pitching games, and the opponent filter reads "all" again
    expect(screen.getByText('2026-09-18')).toBeInTheDocument();
    expect(screen.getByText('2026-09-11')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: '對手' })).toHaveValue('all');
    expect(screen.queryByText('沒有符合篩選條件的比賽')).not.toBeInTheDocument();
  });

  it('opens the next player on his game logs, not on the tab left open', async () => {
    mockPlayers();
    renderAt('/players/660271');
    await screen.findByText('2026-09-20');

    fireEvent.click(screen.getByRole('tab', { name: /轉隊記錄/ }));
    expect(screen.getByRole('tab', { name: /轉隊記錄/ })).toHaveAttribute('aria-selected', 'true');

    fireEvent.click(screen.getByRole('link', { name: 'next player' }));
    await screen.findByRole('heading', { name: /Other Player/ });
    expect(screen.getByRole('tab', { name: /逐場比賽紀錄/ })).toHaveAttribute('aria-selected', 'true');
  });
});
