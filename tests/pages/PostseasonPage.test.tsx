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

    expect(await screen.findByText(/世界大賽冠軍/)).toBeInTheDocument();
    expect(screen.getByTestId('champion')).toHaveTextContent('洛杉磯道奇');
    expect(screen.getAllByTestId(/^series-/)).toHaveLength(11);
    expect(screen.getAllByText('外卡系列賽').length).toBeGreaterThan(0);
    expect(screen.getAllByText('分區系列賽').length).toBeGreaterThan(0);
  });

  it('shows seeds and series scores', async () => {
    renderAt('/postseason/2025');

    const ws = await screen.findByTestId('series-W_1');
    expect(ws).toHaveTextContent('洛杉磯道奇');
    expect(ws).toHaveTextContent('多倫多藍鳥');
    expect(ws).toHaveTextContent('4');
    expect(ws).toHaveTextContent('3');
    // Dodgers were the NL #3 seed
    expect(ws.querySelector('[data-seed="3"]')).not.toBeNull();
  });

  it('links each played game to its box score page', async () => {
    renderAt('/postseason/2025');

    const ws = await screen.findByTestId('series-W_1');
    const gameLinks = ws.querySelectorAll('a[href^="/games/"]');
    expect(gameLinks).toHaveLength(7);
  });

  it('shows undecided slots as TBD before the postseason starts', async () => {
    renderAt('/postseason/2026');

    const ws = await screen.findByTestId('series-W_1');
    expect(ws).toHaveTextContent('待定');
    // A placeholder is not a club: no team page link
    expect(ws.querySelector('a[href^="/teams/"]')).toBeNull();
    expect(screen.queryByText(/世界大賽冠軍/)).not.toBeInTheDocument();
  });

  it('switches seasons from the selector, back to 2012', async () => {
    renderAt('/postseason/2026');

    const select = await screen.findByLabelText('賽季');
    const options = Array.from((select as HTMLSelectElement).options).map((o) => o.value);
    expect(options.at(-1)).toBe('2012');

    fireEvent.change(select, { target: { value: '2025' } });
    expect(await screen.findByText(/世界大賽冠軍/)).toBeInTheDocument();
  });

  it('says so when a season has no postseason', async () => {
    renderAt('/postseason/2013');

    expect(await screen.findByText(/2013 年沒有季後賽資料/)).toBeInTheDocument();
  });
});
