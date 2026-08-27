import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
        <MemoryRouter>
          <FavoritesBar />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText('我的最愛')).toBeInTheDocument();
    expect(screen.getByText('洛杉磯道奇')).toBeInTheDocument();
    expect(screen.getByText('紐約洋基')).toBeInTheDocument();
    expect(screen.getByText(/大谷翔平/)).toBeInTheDocument();
    expect(screen.getByText(/鄧愷威/)).toBeInTheDocument();
  });

  it('renders unseeded favorite player with cached metadata gracefully', () => {
    localStorage.setItem('plateview_fav_players', JSON.stringify([999999]));
    localStorage.setItem(
      'plateview_fav_players_meta',
      JSON.stringify({ 999999: { nameZh: '自訂測試球星', nameEn: 'Custom Test Player' } })
    );

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <FavoritesBar />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText(/自訂測試球星/)).toBeInTheDocument();
  });
});
