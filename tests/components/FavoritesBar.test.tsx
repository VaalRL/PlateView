import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { FavoritesBar } from '../../src/components/favorite/FavoritesBar';

describe('FavoritesBar component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders favorite teams and players from local storage', () => {
    localStorage.setItem('plateview_fav_teams', JSON.stringify([119, 147])); // LAD, NYY
    localStorage.setItem('plateview_fav_players', JSON.stringify([660271])); // Ohtani

    render(
      <MemoryRouter>
        <FavoritesBar />
      </MemoryRouter>
    );

    expect(screen.getByText('我的最愛')).toBeInTheDocument();
    expect(screen.getByText('洛杉磯道奇')).toBeInTheDocument();
    expect(screen.getByText('紐約洋基')).toBeInTheDocument();
    expect(screen.getByText(/大谷翔平/)).toBeInTheDocument();
  });
});
