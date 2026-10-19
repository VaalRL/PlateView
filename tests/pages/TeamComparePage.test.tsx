import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TeamComparePage } from '../../src/pages/TeamComparePage';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const DODGERS = 119;
const YANKEES = 147;

/** This year, so the page shows the date without one */
const YEAR = new Date().getFullYear();

/** Dodgers 5, Yankees 3, the last game either played */
const lastGame = {
  gamePk: 777,
  gameType: 'R',
  gameDate: `${YEAR}-09-27T20:10:00Z`,
  officialDate: `${YEAR}-09-27`,
  status: { abstractGameState: 'Final', detailedState: 'Final', codedGameState: 'F' },
  teams: {
    away: { team: { id: YANKEES, name: 'New York Yankees' }, score: 3, isWinner: false },
    home: { team: { id: DODGERS, name: 'Los Angeles Dodgers' }, score: 5, isWinner: true },
  },
};

const position = (abbreviation: string) => ({ abbreviation });
const FIELD = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];

/** Nine starters plus a starting pitcher; ids from `base`, OPS from `ops` */
const side = (teamId: number, base: number, names: string[], ops: string[], era: string) => ({
  team: { id: teamId },
  pitchers: [base + 99],
  players: Object.fromEntries([
    ...names.map((name, i) => [
      `ID${base + i}`,
      {
        person: { id: base + i, fullName: name },
        position: position(FIELD[i]),
        allPositions: [position(FIELD[i])],
        battingOrder: `${i + 1}00`,
        seasonStats: { batting: { avg: '.270', ops: ops[i], homeRuns: 10 }, fielding: { fielding: '.985', errors: 3 } },
      },
    ]),
    [
      `ID${base + 99}`,
      {
        person: { id: base + 99, fullName: `${names[0]} Starter` },
        position: position('P'),
        allPositions: [position('P')],
        seasonStats: { pitching: { era, wins: 12, losses: 6 } },
      },
    ],
  ]),
});

const nine = (prefix: string) => Array.from({ length: 9 }, (_, i) => `${prefix} ${i + 1}`);
const boxscore = {
  teams: {
    away: side(YANKEES, 2000, nine('Yankee'), ['.700', '.900', '.800', '.800', '.800', '.800', '.800', '.800', '.800'], '2.50'),
    home: side(DODGERS, 1000, nine('Dodger'), ['.850', '.800', '.800', '.800', '.800', '.800', '.800', '.800', '.800'], '3.40'),
  },
};

const UrlProbe = () => <div data-testid="url">{useLocation().search}</div>;

const renderAt = (path: string) => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const body = String(url).includes('/boxscore') ? boxscore : { dates: [{ date: lastGame.officialDate, games: [lastGame] }] };
      return { ok: true, status: 200, statusText: 'OK', json: async () => body };
    })
  );
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path="/compare/teams"
            element={
              <>
                <TeamComparePage />
                <UrlProbe />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('TeamComparePage', () => {
  const globalFetch = globalThis.fetch;

  afterEach(() => {
    vi.stubGlobal('fetch', globalFetch);
    queryClient.clear();
    localStorage.clear();
  });

  it('lines up each club’s last starting nine and marks the better OPS per slot', async () => {
    renderAt('/compare/teams?teams=119,147');

    expect(await screen.findByRole('link', { name: 'Dodger 1' })).toBeInTheDocument();
    // The game each column comes from, with the result from that club's side
    expect(screen.getAllByRole('link', { name: /前一場 9\/27/ }).map((a) => a.textContent)).toEqual([
      expect.stringMatching(/vs NYY W 5-3/),
      expect.stringMatching(/@ LAD L 3-5/),
    ]);

    const first = screen.getByRole('row', { name: /第 1 棒/ });
    const [dodger, yankee] = within(first).getAllByRole('cell');
    expect(dodger).toHaveTextContent('OPS .850');
    expect(dodger.className).toMatch(/text-team-primary/);
    expect(yankee.className).not.toMatch(/text-team-primary/);
    expect(within(screen.getByRole('row', { name: /第 2 棒/ })).getAllByRole('cell')[1].className).toMatch(
      /text-team-primary/
    );

    const mean = within(screen.getByRole('row', { name: /先發平均 OPS/ })).getAllByRole('cell');
    expect(mean.map((c) => c.textContent)).toEqual(['.806', '.800']);
  });

  it('switches to defense, with the starting pitcher of lower ERA marked', async () => {
    renderAt('/compare/teams?teams=119,147');
    await screen.findByRole('link', { name: 'Dodger 1' });
    fireEvent.click(screen.getByRole('button', { name: '守備' }));

    const pitchers = within(screen.getByRole('row', { name: /先發投手/ })).getAllByRole('cell');
    expect(pitchers[0]).toHaveTextContent('Dodger 1 Starter');
    expect(pitchers[1]).toHaveTextContent('ERA 2.50');
    expect(pitchers[1].className).toMatch(/text-team-primary/);

    const catchers = within(screen.getByRole('row', { name: /捕手/ })).getAllByRole('cell');
    expect(catchers[0]).toHaveTextContent('Dodger 1');
    expect(catchers[0]).toHaveTextContent('守備率 .985 · 失誤 3');
    expect(within(screen.getByRole('row', { name: /指定打擊/ })).getAllByRole('cell')[1]).toHaveTextContent('Yankee 9');
  });

  it('adds a club from the menu and removes one', async () => {
    renderAt('/compare/teams?teams=119');
    await screen.findByRole('link', { name: 'Dodger 1' });
    fireEvent.change(screen.getByRole('combobox', { name: '加入球隊' }), { target: { value: String(YANKEES) } });
    expect(screen.getByTestId('url')).toHaveTextContent('?teams=119%2C147');

    fireEvent.click(screen.getByRole('button', { name: '移除 洛杉磯道奇' }));
    expect(screen.getByTestId('url')).toHaveTextContent('?teams=147');
  });

  it('picks up the last list when opened without one', async () => {
    localStorage.setItem('plateview_compare_teams', '147');
    renderAt('/compare/teams');
    expect(await screen.findByRole('link', { name: 'Yankee 1' })).toBeInTheDocument();
    expect(screen.getByTestId('url')).toHaveTextContent('?teams=147');
  });

  it('shows how to start when nothing is chosen', () => {
    renderAt('/compare/teams');
    expect(screen.getByText(/還沒有選擇球隊/)).toBeInTheDocument();
  });
});
