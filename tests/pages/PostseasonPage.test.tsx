import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from '../../src/hooks/useLanguage';
import { PostseasonPage } from '../../src/pages/PostseasonPage';
import ps2025 from '../fixtures/postseason-2025.json';
import ps2026 from '../fixtures/postseason-2026.json';
import st2025 from '../fixtures/standings-2025.json';
import st2026 from '../fixtures/standings-2026.json';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const globalFetch = globalThis.fetch;

/** Serve the postseason and standings fixtures for whichever season is requested */
function stubApi(bySeason: Record<string, { series: unknown; standings: unknown }>) {
  const fetchMock = vi.fn(async (input: unknown) => {
    const url = new URL(String(input));
    const fixtures = bySeason[url.searchParams.get('season') ?? ''];
    let body: unknown = {};
    if (url.pathname.endsWith('/schedule/postseason/series')) body = fixtures?.series ?? { series: [] };
    else if (url.pathname.endsWith('/standings')) body = fixtures?.standings ?? {};
    return { ok: true, status: 200, statusText: 'OK', json: async () => body } as Response;
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function renderAt(path: string) {
  return render(
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/postseason/:season?" element={<PostseasonPage />} />
          </Routes>
        </MemoryRouter>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

describe('PostseasonPage', () => {
  beforeEach(() => {
    queryClient.clear();
    stubApi({
      '2025': { series: ps2025, standings: st2025 },
      '2026': { series: ps2026, standings: st2026 },
    });
  });

  afterEach(() => {
    vi.stubGlobal('fetch', globalFetch);
  });

  it('draws every round of a finished postseason and names the champion', async () => {
    renderAt('/postseason/2025');

    expect(await screen.findByTestId('champion')).toHaveTextContent('洛杉磯道奇');
    // One score tag per series
    expect(screen.getAllByTestId(/^series-/)).toHaveLength(11);
    expect(screen.getByText('美聯外卡賽')).toBeInTheDocument();
    expect(screen.getByText('國聯分區賽')).toBeInTheDocument();
    expect(screen.getByText('美聯冠軍賽')).toBeInTheDocument();
  });

  it('shows each team as a tile with its seed, linked to the team page', async () => {
    const { container } = renderAt('/postseason/2025');
    await screen.findByTestId('champion');

    // Dodgers were the NL #3 seed and reached the World Series
    const dodgersInWs = container.querySelector('[data-series="W_1"][data-team="119"]');
    expect(dodgersInWs).toHaveAttribute('data-seed', '3');
    expect(dodgersInWs?.closest('a')).toHaveAttribute('href', '/teams/119');
    // Knocked-out teams are dimmed
    expect(container.querySelector('[data-series="W_1"][data-team="141"]')).toHaveAttribute('data-eliminated', 'true');
    expect(container.querySelector('[data-series="W_1"][data-team="119"]')).toHaveAttribute('data-eliminated', 'false');
  });

  it('shows the series score on the bracket and lists its games when selected', async () => {
    renderAt('/postseason/2025');

    const wsTag = await screen.findByTestId('series-W_1');
    expect(wsTag).toHaveTextContent('4-3');
    fireEvent.click(wsTag);

    const detail = screen.getByTestId('selected-series');
    expect(detail).toHaveTextContent('洛杉磯道奇');
    expect(detail).toHaveTextContent('多倫多藍鳥');
    expect(detail.querySelectorAll('a[href^="/games/"]')).toHaveLength(7);
  });

  it('opens on the series played most recently', async () => {
    renderAt('/postseason/2025');

    expect(await screen.findByTestId('series-W_1')).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows undecided slots as TBD before the postseason starts', async () => {
    const { container } = renderAt('/postseason/2026');

    await screen.findByTestId('series-W_1');
    expect(screen.getByTestId('champion')).toHaveTextContent('待定');
    // Placeholders are grey tiles, not clubs: no team page link
    const wsTiles = container.querySelectorAll('[data-series="W_1"]');
    expect(wsTiles).toHaveLength(2);
    wsTiles.forEach((tile) => {
      expect(tile.getAttribute('aria-label')).toMatch(/^待定/);
      expect(tile.closest('a')).toBeNull();
    });
    expect(screen.getByTestId('series-F_1')).toHaveTextContent('vs');
  });

  it('switches seasons from the selector, back to 2012', async () => {
    renderAt('/postseason/2026');

    const select = await screen.findByLabelText('賽季');
    const options = Array.from((select as HTMLSelectElement).options).map((o) => o.value);
    expect(options.at(-1)).toBe('2012');

    fireEvent.change(select, { target: { value: '2025' } });
    expect(await screen.findByTestId('champion')).toHaveTextContent('洛杉磯道奇');
  });

  it('says so when a season has no postseason', async () => {
    renderAt('/postseason/2013');

    expect(await screen.findByText(/2013 年沒有季後賽資料/)).toBeInTheDocument();
  });
});
