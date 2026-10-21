import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AwardHistoryPage, AwardsPage } from '../../src/pages/AwardsPage';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const award = (id: string, season: string, playerId: number, name: string, teamId: number, position = 'OF') => ({
  id,
  name: id,
  season,
  team: { id: teamId },
  player: { id: playerId, nameFirstLast: name, primaryPosition: { abbreviation: position } },
});

/** 2025's winners, per award id; Hao-Yu Lee stands in as a Silver Slugger from Taiwan */
const WINNERS: Record<string, ReturnType<typeof award>[]> = {
  ALMVP: [award('ALMVP', '2025', 592450, 'Aaron Judge', 147)],
  NLMVP: [award('NLMVP', '2025', 660271, 'Shohei Ohtani', 119, 'TWP')],
  NLCY: [award('NLCY', '2025', 694973, 'Paul Skenes', 134, 'P')],
  ALSS: [award('ALSS', '2025', 701678, 'Hao-Yu Lee', 116, '2B'), award('ALSS', '2025', 592450, 'Aaron Judge', 147)],
};

const UrlProbe = () => <div data-testid="url">{useLocation().pathname + useLocation().search}</div>;

const renderAt = (path: string) => {
  const fetchMock = vi.fn(async (url: string) => {
    const u = new URL(url);
    const id = u.pathname.split('/')[4];
    const season = u.searchParams.get('season');
    const awards = season === '2025' || !season ? WINNERS[id] ?? [] : [];
    return { ok: true, status: 200, statusText: 'OK', json: async () => ({ awards }) };
  });
  vi.stubGlobal('fetch', fetchMock);
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/awards" element={<AwardsPage />} />
          <Route path="/awards/:awardId" element={<AwardHistoryPage />} />
        </Routes>
        <UrlProbe />
      </MemoryRouter>
    </QueryClientProvider>
  );
  return fetchMock;
};

describe('AwardsPage', () => {
  const globalFetch = globalThis.fetch;
  afterEach(() => {
    vi.stubGlobal('fetch', globalFetch);
    queryClient.clear();
  });

  it('shows each award’s winners for the season, in English', async () => {
    renderAt('/awards?season=2025');
    const mvp = (await screen.findByRole('link', { name: '最有價值球員 (MVP)' })).closest('section')!;
    expect(within(mvp).getByRole('link', { name: 'Shohei Ohtani' })).toBeInTheDocument();
    expect(within(mvp).getByText('Aaron Judge')).toBeInTheDocument();
    expect(within(mvp).queryByText('大谷翔平')).not.toBeInTheDocument();
    // Not announced yet for the AL Cy Young in this data
    const cy = screen.getByRole('link', { name: '賽揚獎' }).closest('section')!;
    expect(within(cy).getByText('尚未公布')).toBeInTheDocument();
  });

  it('lines up Silver Sluggers by position and marks players from Taiwan', async () => {
    renderAt('/awards?season=2025');
    const table = (await screen.findByRole('link', { name: '銀棒獎' })).closest('section')!;
    const secondBase = within(table).getByRole('row', { name: /2B/ });
    expect(within(secondBase).getByRole('link', { name: 'Hao-Yu Lee' })).toBeInTheDocument();
    expect(within(secondBase).getByText('台灣')).toBeInTheDocument();
  });

  it('asks for another season from the menu', async () => {
    const fetchMock = renderAt('/awards?season=2025');
    await screen.findByRole('link', { name: 'Shohei Ohtani' });
    fireEvent.change(screen.getByRole('combobox', { name: '賽季' }), { target: { value: '2024' } });
    expect(screen.getByTestId('url')).toHaveTextContent('/awards?season=2024');
    expect(fetchMock.mock.calls.some(([u]) => String(u).includes('season=2024'))).toBe(true);
  });

  it('opens an award’s history, with a switch to the other league', async () => {
    renderAt('/awards/NLMVP');
    expect(await screen.findByRole('link', { name: 'Shohei Ohtani' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '2025' })).toHaveAttribute('href', '/awards?season=2025');
    fireEvent.click(screen.getByRole('link', { name: '美國聯盟' }));
    expect(await screen.findByText('Aaron Judge')).toBeInTheDocument();
    expect(screen.getByTestId('url')).toHaveTextContent('/awards/ALMVP');
  });

  it('says so for an award it does not know', () => {
    renderAt('/awards/NOPE');
    expect(screen.getByText('找不到這個獎項。')).toBeInTheDocument();
  });
});
