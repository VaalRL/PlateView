import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PlayerTransactions } from '../../src/components/player/PlayerTransactions';
import type { Transaction } from '../../src/types/transactions';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const trade: Transaction = {
  id: 1,
  date: '2026-07-30',
  typeCode: 'TR',
  typeDesc: 'Trade',
  fromTeam: { id: 140, name: 'Texas Rangers' },
  toTeam: { id: 119, name: 'Los Angeles Dodgers' },
  description: 'Texas Rangers traded LHP Test Pitcher to Los Angeles Dodgers.',
};

const option: Transaction = {
  id: 2,
  date: '2026-08-10',
  typeCode: 'OPT',
  typeDesc: 'Optioned',
  fromTeam: { id: 119, name: 'Los Angeles Dodgers' },
  toTeam: { id: 238, name: 'Oklahoma City Comets' },
};

const ilMove: Transaction = {
  id: 3,
  date: '2026-05-01',
  typeCode: 'SC',
  typeDesc: 'Status Change',
  toTeam: { id: 140, name: 'Texas Rangers' },
};

function renderWith(body: unknown, ok = true) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok, status: ok ? 200 : 500, statusText: ok ? 'OK' : 'Error', json: async () => body }))
  );
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <PlayerTransactions personId={999010} />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('PlayerTransactions', () => {
  const globalFetch = globalThis.fetch;

  afterEach(() => {
    vi.stubGlobal('fetch', globalFetch);
    queryClient.clear();
  });

  it('lists moves newest first with both clubs of a trade', async () => {
    renderWith({ transactions: [ilMove, trade, option] });

    await screen.findByText('交易');
    const rows = screen.getAllByRole('listitem');
    expect(rows.map((r) => within(r).getByText(/^\d{4}-\d{2}-\d{2}$/).textContent)).toEqual([
      '2026-08-10',
      '2026-07-30',
      '2026-05-01',
    ]);

    const tradeRow = rows[1];
    expect(within(tradeRow).getByRole('link', { name: '德州遊騎兵' })).toHaveAttribute('href', '/teams/140');
    expect(within(tradeRow).getByRole('link', { name: '洛杉磯道奇' })).toHaveAttribute('href', '/teams/119');
    expect(within(tradeRow).getByText(/traded LHP Test Pitcher/)).toBeInTheDocument();

    // A minor league club keeps its own name
    expect(within(rows[0]).getByRole('link', { name: 'Oklahoma City Comets' })).toBeInTheDocument();
    // A move within one club shows that club once
    expect(within(rows[2]).getAllByRole('link')).toHaveLength(1);
  });

  it('collapses a long record behind "show all"', async () => {
    const many = Array.from({ length: 12 }, (_, i) => ({
      ...ilMove,
      id: 100 + i,
      date: `2026-01-${String(i + 1).padStart(2, '0')}`,
    }));
    renderWith({ transactions: many });

    await screen.findAllByText('名單狀態變更');
    expect(screen.getAllByRole('listitem')).toHaveLength(10);

    fireEvent.click(screen.getByRole('button', { name: '顯示全部 12 筆' }));
    expect(screen.getAllByRole('listitem')).toHaveLength(12);

    fireEvent.click(screen.getByRole('button', { name: '收合' }));
    expect(screen.getAllByRole('listitem')).toHaveLength(10);
  });

  it('says so when there is nothing on record', async () => {
    renderWith({ transactions: [] });
    expect(await screen.findByText('沒有轉隊記錄')).toBeInTheDocument();
  });

  it('shows an error when the request fails', async () => {
    renderWith({}, false);
    expect(await screen.findByText('轉隊記錄載入失敗')).toBeInTheDocument();
  });
});
