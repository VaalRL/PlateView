import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TeamDetailPage } from '../../src/pages/TeamDetailPage';
import rochester from '../fixtures/team-rochester.json';
import standingsAaa from '../fixtures/standings-aaa-2026.json';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const globalFetch = globalThis.fetch;

/** Roster payload shaped like the MLB 40-man response, mixing IL and non-IL statuses */
const fortyManRoster = {
  roster: [
    {
      person: { id: 1, fullName: 'Injured Ace' },
      jerseyNumber: '18',
      position: { abbreviation: 'P', type: 'Pitcher' },
      status: { code: 'D15', description: 'Injured 15-Day' },
    },
    {
      person: { id: 2, fullName: 'Longterm Reliever' },
      jerseyNumber: '46',
      position: { abbreviation: 'P', type: 'Pitcher' },
      status: { code: 'D60', description: 'Injured 60-Day' },
    },
    {
      person: { id: 3, fullName: 'Healthy Slugger' },
      jerseyNumber: '5',
      position: { abbreviation: '1B', type: 'Infielder' },
      status: { code: 'A', description: 'Active' },
    },
    {
      person: { id: 4, fullName: 'Waiver Candidate' },
      jerseyNumber: '61',
      position: { abbreviation: 'C', type: 'Catcher' },
      status: { code: 'DES', description: 'Designated for Assignment' },
    },
  ],
};

describe('TeamDetailPage component', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  afterEach(() => {
    vi.stubGlobal('fetch', globalFetch);
  });

  it('renders team header, schedule tab, and switches to roster tab', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/teams/119']}>
          <Routes>
            <Route path="/teams/:teamId" element={<TeamDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText('洛杉磯道奇')).toBeInTheDocument();
    expect(screen.getByText('LAD')).toBeInTheDocument();
    expect(screen.getByText(/國聯西區/)).toBeInTheDocument();
    expect(screen.getByText(/收藏球隊/)).toBeInTheDocument();

    // Verify recent games tab button is present
    expect(screen.getByText(/近期戰績與逐場賽事/)).toBeInTheDocument();
    expect(screen.getByText(/陣容名單/)).toBeInTheDocument();

    // Switch to roster tab
    fireEvent.click(screen.getByText(/陣容名單/));
    expect(screen.getByText(/26 人現役名單/)).toBeInTheDocument();
  });

  it('links to the official MLB team site in a new tab', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/teams/139']}>
          <Routes>
            <Route path="/teams/:teamId" element={<TeamDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    const officialLink = screen.getByRole('link', { name: /球隊官網/ });
    expect(officialLink).toHaveAttribute('href', 'https://www.mlb.com/rays');
    expect(officialLink).toHaveAttribute('target', '_blank');
    expect(officialLink).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('links to the official team injury/transaction feed in a new tab', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/teams/139']}>
          <Routes>
            <Route path="/teams/:teamId" element={<TeamDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    const injuryLink = screen.getByRole('link', { name: /傷兵異動消息/ });
    expect(injuryLink).toHaveAttribute('href', 'https://www.mlb.com/rays/transactions');
    expect(injuryLink).toHaveAttribute('target', '_blank');
    expect(injuryLink).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('lists only injured-list players in the IL tab, read from the 40-man roster', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => ({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => (String(url).includes('rosterType=40Man') ? fortyManRoster : {}),
      }))
    );

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/teams/139']}>
          <Routes>
            <Route path="/teams/:teamId" element={<TeamDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    fireEvent.click(screen.getByText(/陣容名單/));
    fireEvent.click(screen.getByText(/傷兵名單/));

    // Every injured-list status shows up
    expect(await screen.findByText('Injured Ace')).toBeInTheDocument();
    expect(screen.getByText('Longterm Reliever')).toBeInTheDocument();

    // Active players and DFA (which also starts with "D") must not leak in
    expect(screen.queryByText('Healthy Slugger')).not.toBeInTheDocument();
    expect(screen.queryByText('Waiver Candidate')).not.toBeInTheDocument();
  });

  it('badges injured players inside the 40-man roster tab', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => ({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => (String(url).includes('rosterType=40Man') ? fortyManRoster : {}),
      }))
    );

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/teams/139']}>
          <Routes>
            <Route path="/teams/:teamId" element={<TeamDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    fireEvent.click(screen.getByText(/陣容名單/));
    fireEvent.click(screen.getByText(/40 人名單/));

    expect(await screen.findByText('Healthy Slugger')).toBeInTheDocument();
    // Only the two injured-list players carry the IL badge
    expect(screen.getAllByText('IL')).toHaveLength(2);
  });

  it('opens the standalone game page when a schedule row is clicked', async () => {
    const scheduleResponse = {
      dates: [
        {
          date: '2026-09-15',
          games: [
            {
              gamePk: 776633,
              gameDate: '2026-09-16T00:10:00Z',
              officialDate: '2026-09-15',
              status: { abstractGameState: 'Final', detailedState: 'Final' },
              teams: {
                away: { score: 5, isWinner: true, team: { id: 119, name: 'Los Angeles Dodgers' } },
                home: { score: 3, isWinner: false, team: { id: 134, name: 'Pittsburgh Pirates' } },
              },
              linescore: { innings: [{ num: 1, away: { runs: 2 }, home: { runs: 0 } }] },
            },
          ],
        },
      ],
    };

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: unknown) => {
        const url = String(input);
        const body = url.includes('/schedule') ? scheduleResponse : {};
        return { ok: true, status: 200, statusText: 'OK', json: async () => body } as Response;
      })
    );

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/teams/119']}>
          <Routes>
            <Route path="/teams/:teamId" element={<TeamDetailPage />} />
            <Route path="/games/:gamePk" element={<div>GAME PAGE 776633</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    // The row no longer expands a box score in place
    const row = await screen.findByText(/匹茲堡海盜|Pittsburgh Pirates/);
    fireEvent.click(row);

    expect(await screen.findByText('GAME PAGE 776633')).toBeInTheDocument();
  });

  it('shows how far into the 162-game season the team is', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: unknown) => {
        const url = String(input);
        const body = url.includes('/standings')
          ? {
              records: [
                {
                  division: { id: 201, name: 'American League East', link: '' },
                  teamRecords: [
                    {
                      team: { id: 139, name: 'Tampa Bay Rays' },
                      divisionRank: '1',
                      gamesPlayed: 157,
                      wins: 96,
                      losses: 61,
                      winningPercentage: '.611',
                    },
                  ],
                },
              ],
            }
          : {};
        return { ok: true, status: 200, statusText: 'OK', json: async () => body } as Response;
      })
    );

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/teams/139']}>
          <Routes>
            <Route path="/teams/:teamId" element={<TeamDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByText('已賽 157/162')).toBeInTheDocument();
  });

  describe('a minor league club', () => {
    let requested: URL[];

    const renderRochester = () => {
      requested = [];
      vi.stubGlobal(
        'fetch',
        vi.fn(async (input: unknown) => {
          const url = new URL(String(input));
          requested.push(url);
          let body: unknown = {};
          if (url.pathname.endsWith('/teams/534')) body = rochester;
          else if (url.pathname.endsWith('/standings')) body = standingsAaa;
          return { ok: true, status: 200, statusText: 'OK', json: async () => body } as Response;
        })
      );
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/teams/534']}>
            <Routes>
              <Route path="/teams/:teamId" element={<TeamDetailPage />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      );
    };

    it('names the club, its level and its parent organization', async () => {
      renderRochester();

      expect(await screen.findByRole('heading', { name: 'Rochester Red Wings' })).toBeInTheDocument();
      expect(screen.getByText('ROC')).toBeInTheDocument();
      expect(screen.getByText('AAA')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /華盛頓國民/ })).toHaveAttribute('href', '/teams/120');
      expect(screen.getByText(/International League East/)).toBeInTheDocument();
    });

    it('reads its schedule and standings from its own level', async () => {
      renderRochester();

      expect(await screen.findByText(/90 勝 58 敗/)).toBeInTheDocument();
      const schedule = requested.find((u) => u.pathname.endsWith('/schedule'));
      expect(schedule?.searchParams.get('sportId')).toBe('11');
      const standings = requested.filter((u) => u.pathname.endsWith('/standings'));
      expect(standings.map((u) => u.searchParams.get('leagueId'))).toEqual(['117']);
    });

    it('leaves out what only applies to a big league club', async () => {
      renderRochester();
      await screen.findByText(/90 勝 58 敗/);

      // 162-game progress, favorites, and the 40-man / IL rosters are MLB concepts
      expect(screen.queryByText(/已賽/)).not.toBeInTheDocument();
      expect(screen.queryByText(/收藏此球隊/)).not.toBeInTheDocument();
      fireEvent.click(screen.getByText(/陣容名單/));
      expect(screen.queryByText(/40 人名單/)).not.toBeInTheDocument();
      expect(screen.queryByText(/傷兵名單/)).not.toBeInTheDocument();
    });
  });

  it('opens the next club on its active roster, not the tab left open on the last one', async () => {
    const requested: URL[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: unknown) => {
        const url = new URL(String(input));
        requested.push(url);
        const body = url.pathname.endsWith('/teams/534') ? rochester : {};
        return { ok: true, status: 200, statusText: 'OK', json: async () => body } as Response;
      })
    );

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/teams/139']}>
          <Link to="/teams/534">minor league club</Link>
          <Routes>
            <Route path="/teams/:teamId" element={<TeamDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    fireEvent.click(screen.getByText(/陣容名單/));
    fireEvent.click(screen.getByText(/傷兵名單/));
    fireEvent.click(screen.getByText('minor league club'));
    await screen.findByRole('heading', { name: 'Rochester Red Wings' });

    const rochesterRosters = requested.filter((u) => u.pathname.endsWith('/teams/534/roster'));
    expect(rochesterRosters.map((u) => u.searchParams.get('rosterType'))).toEqual(['active']);
  });

  it('says so when a minor league club cannot be looked up, instead of an empty schedule', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: unknown) =>
        String(input).includes('/teams/534?')
          ? ({ ok: false, status: 503, statusText: 'Unavailable', json: async () => ({}) } as Response)
          : ({ ok: true, status: 200, statusText: 'OK', json: async () => ({}) } as Response)
      )
    );

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/teams/534']}>
          <Routes>
            <Route path="/teams/:teamId" element={<TeamDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByText(/球隊資料載入失敗|載入失敗/)).toBeInTheDocument();
  });
});
