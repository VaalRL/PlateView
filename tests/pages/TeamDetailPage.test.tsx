import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TeamDetailPage } from '../../src/pages/TeamDetailPage';

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
});
