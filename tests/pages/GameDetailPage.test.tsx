import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from '../../src/hooks/useLanguage';
import { GameDetailPage } from '../../src/pages/GameDetailPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const globalFetch = globalThis.fetch;

const scheduleResponse = {
  dates: [
    {
      date: '2026-09-15',
      games: [
        {
          gamePk: 776633,
          gameDate: '2026-09-16T00:10:00Z',
          officialDate: '2026-09-15',
          status: { abstractGameState: 'Final', detailedState: 'Final', codedGameState: 'F' },
          teams: {
            away: { score: 5, team: { id: 140, name: 'Texas Rangers' }, leagueRecord: { wins: 80, losses: 70 } },
            home: { score: 3, team: { id: 119, name: 'Los Angeles Dodgers' }, leagueRecord: { wins: 95, losses: 55 } },
          },
          venue: { id: 22, name: 'Dodger Stadium' },
          decisions: { winner: { id: 90, fullName: 'Nathan Eovaldi' } },
          linescore: {
            innings: [{ num: 1, away: { runs: 2 }, home: { runs: 0 } }],
            teams: { away: { runs: 5, hits: 9, errors: 0 }, home: { runs: 3, hits: 6, errors: 1 } },
          },
        },
      ],
    },
  ],
};

const boxscoreResponse = {
  teams: {
    away: {
      team: { id: 140, name: 'Texas Rangers' },
      batters: [11],
      pitchers: [90],
      bench: [12],
      bullpen: [],
      // Team info is grouped: {title, fieldList[{label, value}]}, not flat label/value
      info: [{ title: 'BATTING', fieldList: [{ label: 'HR', value: 'Seager (30).' }] }],
      note: [{ label: 'a', value: 'Grounded out for Bench Bat in the 7th.' }],
      players: {
        ID11: {
          person: { id: 11, fullName: 'Corey Seager' },
          position: { abbreviation: 'SS' },
          allPositions: [{ abbreviation: 'SS' }],
          battingOrder: '100',
          stats: { batting: { atBats: 4, runs: 1, hits: 2, rbi: 2, baseOnBalls: 0, strikeOuts: 1 } },
          seasonStats: { batting: { avg: '.288' } },
        },
        ID12: {
          person: { id: 12, fullName: 'Bench Bat' },
          position: { abbreviation: 'C' },
        },
        ID90: {
          person: { id: 90, fullName: 'Nathan Eovaldi' },
          position: { abbreviation: 'P' },
          stats: { pitching: { inningsPitched: '7.0', hits: 4, runs: 3, earnedRuns: 3, baseOnBalls: 1, strikeOuts: 8 } },
          seasonStats: { pitching: { era: '3.12' } },
        },
      },
      teamStats: { batting: { hits: 9, homeRuns: 1, rbi: 5 }, pitching: { inningsPitched: '9.0', strikeOuts: 8, era: '3.12' } },
    },
    home: {
      team: { id: 119, name: 'Los Angeles Dodgers' },
      batters: [21],
      pitchers: [80],
      bench: [],
      bullpen: [],
      players: {
        ID21: {
          person: { id: 21, fullName: 'Shohei Ohtani' },
          position: { abbreviation: 'DH' },
          allPositions: [{ abbreviation: 'DH' }],
          battingOrder: '100',
          stats: { batting: { atBats: 4, runs: 1, hits: 1, rbi: 1, baseOnBalls: 1, strikeOuts: 2 } },
          seasonStats: { batting: { avg: '.301' } },
        },
        ID80: {
          person: { id: 80, fullName: 'Home Starter' },
          position: { abbreviation: 'P' },
          stats: { pitching: { inningsPitched: '6.0', hits: 7, runs: 5, earnedRuns: 5, baseOnBalls: 2, strikeOuts: 4 } },
          seasonStats: { pitching: { era: '4.01' } },
        },
      },
      teamStats: { batting: { hits: 6, homeRuns: 0, rbi: 3 }, pitching: { inningsPitched: '9.0', strikeOuts: 4, era: '4.01' } },
    },
  },
};

const renderPage = () =>
  render(
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <MemoryRouter initialEntries={['/games/776633']}>
          <Routes>
            <Route path="/games/:gamePk" element={<GameDetailPage />} />
          </Routes>
        </MemoryRouter>
      </LanguageProvider>
    </QueryClientProvider>
  );

describe('GameDetailPage', () => {
  beforeEach(() => {
    queryClient.clear();
    // Route each request by endpoint: the page needs schedule and boxscore
    globalThis.fetch = vi.fn(async (input: any) => {
      const url = String(input);
      const body = url.includes('/boxscore') ? boxscoreResponse : scheduleResponse;
      return { ok: true, status: 200, statusText: 'OK', json: async () => body } as any;
    }) as any;
  });

  afterEach(() => {
    globalThis.fetch = globalFetch;
    vi.restoreAllMocks();
  });

  it('renders the matchup header, score, venue and linescore', async () => {
    renderPage();

    expect(await screen.findByText('5 : 3')).toBeInTheDocument();
    expect(screen.getByText('Dodger Stadium')).toBeInTheDocument();
    expect(screen.getByText('Final')).toBeInTheDocument();
    // R/H/E row from the shared LinescoreTable
    expect(screen.getByText('TEX')).toBeInTheDocument();
    expect(screen.getByText('LAD')).toBeInTheDocument();
  });

  it('opens on the defensive alignment tab with both teams charted', async () => {
    renderPage();

    expect((await screen.findAllByText('Corey Seager')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Nathan Eovaldi').length).toBeGreaterThan(0);
    // The DH is listed but never placed on the field
    expect(screen.getAllByText('Shohei Ohtani').length).toBeGreaterThan(0);
  });

  it('switches to the lineup tab and shows bench players', async () => {
    renderPage();

    fireEvent.click(await screen.findByText('📋 打序與換人'));

    expect(screen.getByText('板凳待命 (Bench)')).toBeInTheDocument();
    expect(screen.getByText('Bench Bat')).toBeInTheDocument();
    // MLB's own substitution footnote for the slot that turned over
    expect(screen.getByText(/Grounded out for Bench Bat in the 7th/)).toBeInTheDocument();
  });

  it('switches to the full box tab and renders the untruncated tables plus official notes', async () => {
    renderPage();

    fireEvent.click(await screen.findByText('📊 完整 Box 數據'));

    expect(screen.getAllByText('AB').length).toBe(2);
    expect(screen.getAllByText('IP').length).toBe(2);
    expect(screen.getByText('官方註記 (Official Notes)')).toBeInTheDocument();
    // Grouped official remarks render their title and each field
    expect(screen.getByText('BATTING')).toBeInTheDocument();
    expect(screen.getByText('HR')).toBeInTheDocument();
    expect(screen.getByText(/Seager \(30\)/)).toBeInTheDocument();
  });

  it('shows a not-found message for an invalid gamePk', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ dates: [] }),
    })) as any;

    renderPage();

    expect(
      await screen.findByText('找不到這場比賽 (gamePk 無效或資料尚未產生)。')
    ).toBeInTheDocument();
  });
});
