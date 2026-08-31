import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from '../../src/hooks/useLanguage';
import { LeaderboardsPage } from '../../src/pages/LeaderboardsPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

describe('LeaderboardsPage component', () => {
  beforeEach(() => {
    queryClient.clear(); // avoid cache leaking between tests
  });
  it('renders page header, hitting/pitching tabs and league filter buttons', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <MemoryRouter>
            <LeaderboardsPage />
          </MemoryRouter>
        </LanguageProvider>
      </QueryClientProvider>
    );

    expect(screen.getByText(/MLB 數據領先榜/i)).toBeInTheDocument();
    expect(screen.getByText(/🏏 打擊排行/i)).toBeInTheDocument();
    expect(screen.getByText(/⚾ 投球排行/i)).toBeInTheDocument();
    expect(screen.getByText(/全大聯盟/i)).toBeInTheDocument();
    expect(screen.getByText(/美國聯盟/i)).toBeInTheDocument();
    expect(screen.getByText(/國家聯盟/i)).toBeInTheDocument();
  });

  it('switches between hitting and pitching tabs', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <MemoryRouter>
            <LeaderboardsPage />
          </MemoryRouter>
        </LanguageProvider>
      </QueryClientProvider>
    );

    const pitchingTab = screen.getByText(/⚾ 投球排行/i);
    fireEvent.click(pitchingTab);

    expect(pitchingTab.className).toContain('bg-team-primary');
  });

  it('renders per-category empty states when the API returns no leaders', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <MemoryRouter>
            <LeaderboardsPage />
          </MemoryRouter>
        </LanguageProvider>
      </QueryClientProvider>
    );

    // The global fetch stub resolves {}, so every category falls back to its empty card
    const placeholders = await screen.findAllByText('目前暫無該項目的排行榜數據。');
    expect(placeholders.length).toBe(8);
  });
});
