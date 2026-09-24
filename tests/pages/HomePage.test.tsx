import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from '../../src/hooks/useLanguage';
import { HomePage } from '../../src/pages/HomePage';
import standingsAaa from '../fixtures/standings-aaa-2026.json';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const globalFetch = globalThis.fetch;

describe('HomePage level switcher', () => {
  let requested: URL[];

  beforeEach(() => {
    queryClient.clear();
    requested = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: unknown) => {
        const url = new URL(String(input));
        requested.push(url);
        const body = url.pathname.endsWith('/standings') && url.searchParams.get('leagueId') === '117,112'
          ? standingsAaa
          : {};
        return { ok: true, status: 200, statusText: 'OK', json: async () => body } as Response;
      })
    );
  });

  afterEach(() => {
    vi.stubGlobal('fetch', globalFetch);
  });

  const renderHome = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <MemoryRouter>
            <HomePage />
          </MemoryRouter>
        </LanguageProvider>
      </QueryClientProvider>
    );

  const scheduleSports = () =>
    requested.filter((u) => u.pathname.endsWith('/schedule')).map((u) => u.searchParams.get('sportId'));

  it('opens on MLB and asks for no minor league data', async () => {
    renderHome();

    const levels = screen.getByRole('group', { name: '聯盟層級' });
    expect(within(levels).getByRole('button', { name: 'MLB' })).toHaveAttribute('aria-pressed', 'true');
    await screen.findByText(/戰績與外卡爭霸榜/);
    expect(scheduleSports().every((s) => s === '1')).toBe(true);
  });

  it('loads only the chosen level when switching to AAA', async () => {
    renderHome();

    fireEvent.click(within(screen.getByRole('group', { name: '聯盟層級' })).getByRole('button', { name: 'AAA' }));

    expect(await screen.findByText('International League East')).toBeInTheDocument();
    expect(screen.getByText('Red Wings')).toBeInTheDocument();
    expect(scheduleSports()).toContain('11');
    // Nothing for the levels nobody asked for
    expect(scheduleSports().some((s) => ['12', '13', '14'].includes(s ?? ''))).toBe(false);
  });

  it('drops the MLB-only wild card view and 162-game progress for a minor league', async () => {
    renderHome();

    fireEvent.click(within(screen.getByRole('group', { name: '聯盟層級' })).getByRole('button', { name: 'AAA' }));
    await screen.findByText('International League East');

    expect(screen.queryByText(/外卡榜/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\/162/)).not.toBeInTheDocument();
  });
});
