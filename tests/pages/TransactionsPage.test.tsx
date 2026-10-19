import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TransactionsPage } from '../../src/pages/TransactionsPage';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const transactions = [
  {
    id: 1,
    typeDesc: 'Trade',
    date: '2026-11-03',
    person: { id: 500001, fullName: 'Traded Guy' },
    fromTeam: { id: 119, name: 'Los Angeles Dodgers' },
    toTeam: { id: 147, name: 'New York Yankees' },
    description: 'Los Angeles Dodgers traded Traded Guy to New York Yankees.',
  },
  {
    id: 2,
    typeDesc: 'Optioned',
    date: '2026-11-03',
    person: { id: 500002, fullName: 'Optioned Guy' },
    fromTeam: { id: 116, name: 'Detroit Tigers' },
    toTeam: { id: 512, name: 'Toledo Mud Hens' },
  },
  {
    // Hao-Yu Lee, born in Taiwan
    id: 3,
    typeDesc: 'Status Change',
    date: '2026-11-02',
    person: { id: 701678, fullName: 'Hao-Yu Lee' },
    toTeam: { id: 116, name: 'Detroit Tigers' },
  },
];

describe('TransactionsPage', () => {
  const globalFetch = globalThis.fetch;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-03T18:00:00Z'));
    fetchMock = vi.fn(async () => ({ ok: true, status: 200, statusText: 'OK', json: async () => ({ transactions }) }));
    vi.stubGlobal('fetch', fetchMock);
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <TransactionsPage />
        </MemoryRouter>
      </QueryClientProvider>
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.stubGlobal('fetch', globalFetch);
    queryClient.clear();
  });

  it('asks for the last two weeks and lists the key moves', async () => {
    expect(await screen.findByRole('link', { name: 'Traded Guy' })).toBeInTheDocument();
    expect(decodeURIComponent(fetchMock.mock.calls[0][0])).toMatch(/startDate=2026-10-21&endDate=2026-11-03/);

    const all = screen.getByRole('region', { name: /共 1 筆/ });
    expect(within(all).getByText('交易')).toBeInTheDocument();
    expect(within(all).queryByText('Optioned Guy')).not.toBeInTheDocument();
  });

  it('puts players from Taiwan first, every type of move, with the Chinese name', async () => {
    const taiwan = await screen.findByRole('region', { name: /台灣球員（1）/ });
    expect(within(taiwan).getByRole('link', { name: '李灝宇 Hao-Yu Lee' })).toBeInTheDocument();
    expect(within(taiwan).getByText('名單狀態變更')).toBeInTheDocument();
  });

  it('shows every move under "all" and one club’s under its name', async () => {
    await screen.findByRole('link', { name: 'Traded Guy' });
    fireEvent.click(screen.getByRole('button', { name: '全部' }));
    expect(screen.getByRole('link', { name: 'Optioned Guy' })).toBeInTheDocument();

    fireEvent.change(screen.getByRole('combobox', { name: '球隊' }), { target: { value: '147' } });
    expect(screen.getByRole('region', { name: /共 1 筆/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Optioned Guy' })).not.toBeInTheDocument();
  });

  it('asks for a month when chosen', async () => {
    await screen.findByRole('link', { name: 'Traded Guy' });
    fireEvent.click(screen.getByRole('button', { name: '30 天' }));
    expect(fetchMock.mock.calls.some(([u]) => decodeURIComponent(u).includes('startDate=2026-10-05'))).toBe(true);
  });
});
