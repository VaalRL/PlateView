import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from '../../src/hooks/useLanguage';
import { LeaderboardsPage } from '../../src/pages/LeaderboardsPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

describe('LeaderboardsPage component', () => {
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
});
