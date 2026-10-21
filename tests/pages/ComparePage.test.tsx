import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ComparePage } from '../../src/pages/ComparePage';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const hitter = (id: number, fullName: string, ops: string, homeRuns: number) => ({
  id,
  fullName,
  primaryPosition: { abbreviation: 'DH', type: 'Hitter' },
  currentTeam: { id: 119, name: 'Los Angeles Dodgers' },
  stats: [
    {
      group: { displayName: 'hitting' },
      type: { displayName: 'season' },
      splits: [{ stat: { gamesPlayed: 150, plateAppearances: 650, avg: '.290', obp: '.380', slg: '.600', ops, homeRuns } }],
    },
  ],
});

const people = [hitter(660271, 'Shohei Ohtani', '.990', 50), hitter(592450, 'Aaron Judge', '1.050', 48)];

/** Where the page put its list */
const UrlProbe = () => <div data-testid="url">{useLocation().search}</div>;

const renderAt = (path: string) => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, status: 200, statusText: 'OK', json: async () => ({ people }) }))
  );
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path="/compare"
            element={
              <>
                <ComparePage />
                <UrlProbe />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('ComparePage', () => {
  const globalFetch = globalThis.fetch;

  afterEach(() => {
    vi.stubGlobal('fetch', globalFetch);
    queryClient.clear();
    localStorage.clear();
  });

  it('puts the players side by side and marks the best value of each row', async () => {
    renderAt('/compare?players=660271,592450');

    expect(await screen.findByRole('link', { name: 'Shohei Ohtani' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Aaron Judge' })).toBeInTheDocument();
    // Names stay English; the dictionary's Chinese names are for search
    expect(screen.queryByText('大谷翔平')).not.toBeInTheDocument();

    const opsRow = screen.getByRole('row', { name: /OPS/ });
    const [ohtaniOps, judgeOps] = within(opsRow).getAllByRole('cell');
    expect(judgeOps).toHaveTextContent('1.050');
    expect(judgeOps.className).toMatch(/text-team-primary/);
    expect(ohtaniOps.className).not.toMatch(/text-team-primary/);

    const hrRow = screen.getByRole('row', { name: /全壘打/ });
    expect(within(hrRow).getAllByRole('cell')[0].className).toMatch(/text-team-primary/);
  });

  it('switches to pitching, where hitters have no line', async () => {
    renderAt('/compare?players=660271,592450');
    await screen.findByRole('link', { name: 'Shohei Ohtani' });
    fireEvent.click(screen.getByRole('button', { name: '投球' }));

    expect(screen.getByRole('button', { name: '投球' })).toHaveAttribute('aria-pressed', 'true');
    const eraRow = screen.getByRole('row', { name: /防禦率/ });
    within(eraRow).getAllByRole('cell').forEach((cell) => expect(cell).toHaveTextContent('—'));
    expect(screen.getByText(/本季沒有這一類成績/)).toBeInTheDocument();
  });

  it('removes a player from the page and the URL', async () => {
    renderAt('/compare?players=660271,592450');
    fireEvent.click(await screen.findByRole('button', { name: '移除 Aaron Judge' }));
    expect(screen.getByTestId('url')).toHaveTextContent('?players=660271');
    expect(screen.queryByRole('link', { name: 'Aaron Judge' })).not.toBeInTheDocument();
  });

  it('adds a player found by his Chinese name', async () => {
    renderAt('/compare?players=592450');
    await screen.findByRole('link', { name: 'Aaron Judge' });
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '大谷' } });
    fireEvent.click(screen.getByRole('button', { name: /Shohei Ohtani/ }));
    expect(screen.getByTestId('url')).toHaveTextContent('?players=592450%2C660271');
  });

  it('picks up the last list when opened without one', async () => {
    localStorage.setItem('plateview_compare', '660271');
    renderAt('/compare');
    expect(await screen.findByRole('link', { name: 'Shohei Ohtani' })).toBeInTheDocument();
    expect(screen.getByTestId('url')).toHaveTextContent('?players=660271');
  });

  it('shows how to start when nothing is chosen', () => {
    renderAt('/compare');
    expect(screen.getByText(/還沒有選擇球員/)).toBeInTheDocument();
  });
});
