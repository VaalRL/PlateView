import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from '../../src/hooks/useLanguage';
import { FavoritesBar } from '../../src/components/favorite/FavoritesBar';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

describe('FavoritesBar component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders favorite teams and players from local storage including Kai-Wei Teng (678906)', () => {
    localStorage.setItem('plateview_fav_teams', JSON.stringify([119, 147])); // LAD, NYY
    localStorage.setItem('plateview_fav_players', JSON.stringify([660271, 678906])); // Ohtani, Kai-Wei Teng

    render(
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <MemoryRouter>
            <FavoritesBar />
          </MemoryRouter>
        </LanguageProvider>
      </QueryClientProvider>
    );

    expect(screen.getByText('我的最愛')).toBeInTheDocument();
    expect(screen.getByText('洛杉磯道奇')).toBeInTheDocument();
    expect(screen.getByText('紐約洋基')).toBeInTheDocument();
    expect(screen.getByText(/大谷翔平/)).toBeInTheDocument();
    expect(screen.getByText(/鄧愷威/)).toBeInTheDocument();
    expect(screen.getByText('今日愛將戰報')).toBeInTheDocument();
    expect(screen.getByText('備份 / 匯入')).toBeInTheDocument();
  });

  it('toggles summary drawer and opens backup modal', () => {
    localStorage.setItem('plateview_fav_teams', JSON.stringify([119]));
    localStorage.setItem('plateview_fav_players', JSON.stringify([660271]));

    render(
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <MemoryRouter>
            <FavoritesBar />
          </MemoryRouter>
        </LanguageProvider>
      </QueryClientProvider>
    );

    // Toggle Summary Drawer
    const summaryBtn = screen.getByText('今日愛將戰報');
    fireEvent.click(summaryBtn);
    expect(screen.getByText('收合戰報')).toBeInTheDocument();

    // Open Backup Modal
    const backupBtn = screen.getByText('備份 / 匯入');
    fireEvent.click(backupBtn);
    expect(screen.getByText(/我的最愛管理與資料備份/i)).toBeInTheDocument();
  });

  it('renders unseeded favorite player with cached metadata gracefully', () => {
    localStorage.setItem('plateview_fav_players', JSON.stringify([999999]));
    localStorage.setItem(
      'plateview_fav_players_meta',
      JSON.stringify({ 999999: { nameZh: '自訂測試球星', nameEn: 'Custom Test Player' } })
    );

    render(
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <MemoryRouter>
            <FavoritesBar />
          </MemoryRouter>
        </LanguageProvider>
      </QueryClientProvider>
    );

    expect(screen.getByText(/自訂測試球星/)).toBeInTheDocument();
  });
});
