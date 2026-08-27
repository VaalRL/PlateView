import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFavorites } from '../../src/hooks/useFavorites';

describe('useFavorites hook', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes with default favorite Dodgers and Ohtani', () => {
    const { result } = renderHook(() => useFavorites());
    expect(result.current.isFavoriteTeam(119)).toBe(true);
    expect(result.current.isFavoritePlayer(660271)).toBe(true);
  });

  it('toggles favorite team state', () => {
    const { result } = renderHook(() => useFavorites());

    // Add NY Yankees (147)
    act(() => {
      result.current.toggleFavoriteTeam(147);
    });
    expect(result.current.isFavoriteTeam(147)).toBe(true);

    // Remove Dodgers (119)
    act(() => {
      result.current.toggleFavoriteTeam(119);
    });
    expect(result.current.isFavoriteTeam(119)).toBe(false);
  });

  it('toggles favorite player state', () => {
    const { result } = renderHook(() => useFavorites());

    // Add Aaron Judge (592450)
    act(() => {
      result.current.toggleFavoritePlayer(592450);
    });
    expect(result.current.isFavoritePlayer(592450)).toBe(true);

    // Remove Aaron Judge
    act(() => {
      result.current.toggleFavoritePlayer(592450);
    });
    expect(result.current.isFavoritePlayer(592450)).toBe(false);
  });
});
